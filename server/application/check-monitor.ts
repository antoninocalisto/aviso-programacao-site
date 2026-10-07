import { randomUUID } from 'node:crypto';
import { compareSnapshots } from '../domain/compare-snapshots.js';
import { SOURCE_URL, ConcurrentWriteError, type WhatsappNotifier, type MonitorState, type Notifier, type PageSource, type StateRepository } from '../domain/monitor.js';

/** Dependencies are ports; the use case knows nothing about HTTP, Blob or Resend. */
export class CheckMonitor {
  constructor(private readonly repository: StateRepository, private readonly source: PageSource, private readonly notifier: Notifier, private readonly now = () => new Date(), private readonly whatsapp?: WhatsappNotifier) {}

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
          state.history = [{ at: state.lastChangedAt, kind: 'change' as const, message: 'Nova alteração detectada na página oficial.', changes: compareSnapshots(state.snapshot, snapshot) }, ...state.history].slice(0, 100);
          state.changeHistory = [state.history[0], ...(state.changeHistory || [])].slice(0, 20);
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
        // Commit email acceptance before the secondary channel: its failure must never resend email.
        await save();
        if (this.whatsapp) {
          try {
            await this.whatsapp.sendText(`10ª RM — Nova atualização no processo OTT.\n\n${SOURCE_URL}\n\nConfira as mudanças: https://aviso-programacao-site.vercel.app\n\nO aviso também foi enviado por email.`);
            record('notification', 'Aviso de WhatsApp aceito pelo CallMeBot.');
          } catch {
            record('error', 'Email aceito pelo Resend, mas o aviso de WhatsApp falhou. Não haverá reenvio automático deste aviso.');
          }
        }
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
