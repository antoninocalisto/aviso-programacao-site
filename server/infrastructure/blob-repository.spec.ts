import { describe, it, expect, vi } from 'vitest';
import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob';
import { BlobStateRepository } from './blob-repository.js';
import { ConcurrentWriteError, emptyState } from '../domain/monitor.js';
vi.mock('@vercel/blob', () => ({ get: vi.fn(), head: vi.fn(), put: vi.fn(), BlobNotFoundError: class extends Error {}, BlobPreconditionFailedError: class extends Error {} }));
describe('persistent state adapter', () => {
  it('uses the storage metadata ETag instead of the HTTP representation ETag', async () => {
    vi.mocked(head).mockResolvedValue({ etag: 'storage-version' } as Awaited<ReturnType<typeof head>>);
    vi.mocked(get).mockResolvedValue({ statusCode: 200, stream: new Response(JSON.stringify(emptyState())).body, blob: { etag: '"http-version"' } } as Awaited<ReturnType<typeof get>>);
    const result = await new BlobStateRepository().read();
    expect(result.version).toBe('storage-version');
    expect(result.state).toEqual(emptyState());
  });
  it('returns empty baseline for a missing document', async () => {
    vi.mocked(head).mockRejectedValue(new BlobNotFoundError());
    expect(await new BlobStateRepository().read()).toEqual({ state: emptyState(), version: null });
    expect(head).toHaveBeenCalledWith('monitor/state.json');
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
