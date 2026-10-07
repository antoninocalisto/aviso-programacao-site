import { describe, it, expect, vi } from 'vitest';
import { CheckMonitor } from './check-monitor.js';
import { ConcurrentWriteError, emptyState, type MonitorState, type StateRepository, type Snapshot } from '../domain/monitor.js';
const first: Snapshot = { hash: 'first', text: 'Processo OTT original', links: [] };
const changed: Snapshot = { ...first, hash: 'changed', text: 'Nova convocação' };
class MemoryRepository implements StateRepository {
  state = emptyState(); revision = 0;
  async read() { return { state: structuredClone(this.state), version: this.revision ? String(this.revision) : null }; }
  async write(state: MonitorState, expected: string | null) {
    if (expected !== (this.revision ? String(this.revision) : null)) throw new ConcurrentWriteError();
    this.state = structuredClone(state); return String(++this.revision);
  }
}
function setup() {
  const repository = new MemoryRepository();
  const source = { fetch: vi.fn().mockResolvedValue(first) };
  const notifier = { send: vi.fn().mockResolvedValue(undefined) };
  let date = new Date('2026-10-07T12:00:00Z');
  const monitor = new CheckMonitor(repository, source, notifier, () => date);
  return { repository, source, notifier, monitor, advance: (ms: number) => { date = new Date(date.getTime() + ms); } };
}
describe('monitor use case + persistence integration', () => {
  it('sends WhatsApp after persisting email acceptance and never for baseline or unchanged pages', async () => {
    const s = setup();
    const whatsapp = { sendText: vi.fn().mockImplementation(async () => {
      expect(s.repository.state.pending).toBeNull();
      expect(s.repository.state.notifications).toBe(1);
    }) };
    const monitor = new CheckMonitor(s.repository, s.source, s.notifier, undefined, whatsapp);
    await monitor.execute(); expect(whatsapp.sendText).not.toHaveBeenCalled();
    s.source.fetch.mockResolvedValue(changed); await monitor.execute(); await monitor.execute();
    expect(whatsapp.sendText).toHaveBeenCalledTimes(1);
  });
  it('records WhatsApp failure without retrying a successful email', async () => {
    const s = setup();
    const whatsapp = { sendText: vi.fn().mockRejectedValue(new Error('unavailable')) };
    const monitor = new CheckMonitor(s.repository, s.source, s.notifier, undefined, whatsapp);
    await monitor.execute(); s.source.fetch.mockResolvedValue(changed);
    expect(await monitor.execute()).toBe('notification');
    expect(s.repository.state.history[0].message).toContain('WhatsApp falhou');
    await monitor.execute();
    expect(s.notifier.send).toHaveBeenCalledTimes(1); expect(whatsapp.sendText).toHaveBeenCalledTimes(1);
  });
  it('does not send WhatsApp when Resend fails', async () => {
    const s = setup(); const whatsapp = { sendText: vi.fn() };
    const monitor = new CheckMonitor(s.repository, s.source, s.notifier, undefined, whatsapp);
    await monitor.execute(); s.source.fetch.mockResolvedValue(changed);
    s.notifier.send.mockRejectedValue(new Error('Resend unavailable'));
    await expect(monitor.execute()).rejects.toThrow(); expect(whatsapp.sendText).not.toHaveBeenCalled();
  });
  it('records baseline without emailing existing publications', async () => {
    const s = setup(); expect(await s.monitor.execute()).toBe('baseline');
    expect(s.repository.state.snapshot).toEqual(first); expect(s.notifier.send).not.toHaveBeenCalled();
  });
  it('does not email unchanged content', async () => {
    const s = setup(); await s.monitor.execute(); expect(await s.monitor.execute()).toBe('unchanged');
    expect(s.repository.state.checks).toBe(2); expect(s.notifier.send).not.toHaveBeenCalled();
  });
  it('persists outbox before email and commits only after success', async () => {
    const s = setup(); await s.monitor.execute(); s.source.fetch.mockResolvedValue(changed);
    s.notifier.send.mockImplementation(async () => {
      expect(s.repository.state.pending?.snapshot.hash).toBe('changed');
      expect(s.repository.state.snapshot?.hash).toBe('first');
    });
    expect(await s.monitor.execute()).toBe('notification');
    expect(s.repository.state.notifications).toBe(1); expect(s.repository.state.pending).toBeNull();
    await s.monitor.execute(); expect(s.notifier.send).toHaveBeenCalledTimes(1);
  });
  it('preserves baseline and notification identity when email fails', async () => {
    const s = setup(); await s.monitor.execute(); s.source.fetch.mockResolvedValue(changed);
    s.notifier.send.mockRejectedValueOnce(new Error('Resend indisponível'));
    await expect(s.monitor.execute()).rejects.toThrow('Resend indisponível');
    const id = s.repository.state.pending?.id;
    expect(s.repository.state.snapshot?.hash).toBe('first'); expect(s.repository.state.lease).toBeNull();
    expect(await s.monitor.execute()).toBe('notification');
    expect(s.notifier.send.mock.calls[1][0].id).toBe(id);
  });
  it('does not automatically resend after the idempotency window', async () => {
    const s = setup(); await s.monitor.execute(); s.source.fetch.mockResolvedValue(changed);
    s.notifier.send.mockRejectedValueOnce(new Error('Timeout')); await expect(s.monitor.execute()).rejects.toThrow();
    s.advance(24 * 60 * 60 * 1000); await expect(s.monitor.execute()).rejects.toThrow('pendente antigo');
    expect(s.notifier.send).toHaveBeenCalledTimes(1);
  });
  it('keeps previous snapshot on source failure and records error', async () => {
    const s = setup(); await s.monitor.execute(); s.source.fetch.mockRejectedValue(new Error('Fonte indisponível'));
    await expect(s.monitor.execute()).rejects.toThrow('Fonte indisponível');
    expect(s.repository.state.snapshot).toEqual(first); expect(s.repository.state.history[0].kind).toBe('error');
  });
  it('only one concurrent worker reads the source', async () => {
    const s = setup(); const results = await Promise.all([s.monitor.execute(), s.monitor.execute()]);
    expect(results.sort()).toEqual(['baseline', 'busy']); expect(s.source.fetch).toHaveBeenCalledTimes(1);
  });
  it('skips a live lease and recovers an expired one', async () => {
    const s = setup(); s.repository.state.lease = { owner: 'other', until: Date.parse('2026-10-07T12:01:00Z') };
    expect(await s.monitor.execute()).toBe('busy'); s.advance(121000); expect(await s.monitor.execute()).toBe('baseline');
  });
});
