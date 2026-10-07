import { randomUUID } from 'node:crypto';
import { ConcurrentWriteError, type MonitorState, type Notifier, type PageSource, type StateRepository } from '../domain/monitor.js';

/** Dependencies are ports; the use case knows nothing about HTTP, Blob or Resend. */
export class CheckMonitor {
  constructor(private readonly repository: StateRepository, private readonly source: PageSource, private readonly notifier: Notifier, private readonly now = () => new Date()) {}

  async execute(): Promise<'baseline' | 'unchanged' | 'notification' | 'busy'> {
    const owner = randomUUID();
    const loaded = await this.repository.read();
    const state = loaded.state;
    if (state.lease && state.lease.until > this.now().getTime()) return 'busy';
    state.lease = { owner, until: this.now().getTime() + 120_000 };
    let version: string;
    try { version = await this.repository.write(state, loaded.version); }
    catch (error) { if (error instanceof ConcurrentWriteError) return 'busy'; throw error; }
    const save = async () => { version = await this.repository.write(state, version); };
    const record = (kind: MonitorState['history'][number]['kind'], message: string) => {
      state.history = [{ at: this.now().toISOString(), kind, message }, ...state.history].slice(0, 20);
    };
    let result: 'baseline' | 'unchanged' | 'notification' = 'unchanged';
    try {
      // Persist the outbox before sending. Stable id allows safe retries within Resend's 24h window.
      if (!state.pending) {
        const snapshot = await this.source.fetch();
        state.lastCheckedAt = this.now().toISOString();
        state.checks++;
        if (!state.snapshot) {
          state.snapshot = snapshot; result = 'baseline';
          record(result, 'Primeira leitura registrada. Acompanhando as próximas alterações.');
        } else if (state.snapshot.hash !== snapshot.hash) {
          state.pending = { id: randomUUID(), createdAt: this.now().toISOString(), snapshot };
          state.lastChangedAt = this.now().toISOString();
          await save();
        } else record('unchanged', 'Página verificada. Nenhuma alteração no processo.');
      }
      if (state.pending) {
        if (this.now().getTime() - Date.parse(state.pending.createdAt) >= 23 * 60 * 60 * 1000) {
          throw new Error('Envio pendente antigo: conferir no Resend antes de tentar novamente para evitar duplicidade.');
        }
        await this.notifier.send(state.pending);
        state.snapshot = state.pending.snapshot; state.pending = null;
        state.lastEmailAt = this.now().toISOString(); state.notifications++;
        result = 'notification'; record(result, 'Alteração identificada. Email aceito pelo Resend.');
      }
      state.lastError = null;
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : 'Falha desconhecida';
      record('error', state.lastError);
      state.lease = null;
      await save();
      throw error;
    }
    state.lease = null;
    await save();
    return result;
  }
}
