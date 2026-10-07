import { describe, it, expect, vi } from 'vitest';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { BlobStateRepository } from './blob-repository.js';
import { ConcurrentWriteError, emptyState } from '../domain/monitor.js';
vi.mock('@vercel/blob', () => ({ get: vi.fn(), put: vi.fn(), BlobPreconditionFailedError: class extends Error {} }));
describe('persistent state adapter', () => {
  it('returns empty baseline for a missing document', async () => {
    vi.mocked(get).mockResolvedValue(null);
    expect(await new BlobStateRepository().read()).toEqual({ state: emptyState(), version: null });
    expect(get).toHaveBeenCalledWith('monitor/state.json', { access: 'private', useCache: false });
  });
  it('requires conditional writes for existing state and forbids initial overwrite', async () => {
    vi.mocked(put).mockResolvedValue({ etag: 'next' } as Awaited<ReturnType<typeof put>>);
    const repo = new BlobStateRepository();
    expect(await repo.write(emptyState(), 'previous')).toBe('next');
    expect(put).toHaveBeenLastCalledWith('monitor/state.json', expect.any(String), expect.objectContaining({ access: 'private', allowOverwrite: true, ifMatch: 'previous' }));
    await repo.write(emptyState(), null);
    expect(put).toHaveBeenLastCalledWith('monitor/state.json', expect.any(String), expect.objectContaining({ allowOverwrite: false }));
  });
  it('translates an optimistic concurrency failure into a domain conflict', async () => {
    vi.mocked(put).mockRejectedValue(new BlobPreconditionFailedError());
    await expect(new BlobStateRepository().write(emptyState(), 'old')).rejects.toBeInstanceOf(ConcurrentWriteError);
  });
});
