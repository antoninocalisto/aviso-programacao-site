import { get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob';
import { ConcurrentWriteError, emptyState, type MonitorState, type StateRepository, type VersionedState } from '../domain/monitor.js';
const PATH = 'monitor/state.json';
export class BlobStateRepository implements StateRepository {
  async read(): Promise<VersionedState> {
    // Conditional writes require the storage ETag, not a CDN representation ETag.
    // Read metadata first: any intervening write makes the subsequent CAS fail safely.
    let version: string;
    try { version = (await head(PATH)).etag; }
    catch (error) { if (error instanceof BlobNotFoundError) return { state: emptyState(), version: null }; throw error; }
    const result = await get(PATH, { access: 'private', useCache: false });
    if (!result) throw new ConcurrentWriteError('Estado removido durante a leitura.');
    if (result.statusCode !== 200 || !result.stream) throw new Error('Falha na leitura do estado persistente.');
    const state = await new Response(result.stream).json() as MonitorState;
    return { state, version };
  }
  async write(state: MonitorState, expectedVersion: string | null): Promise<string> {
    try {
      const result = await put(PATH, JSON.stringify(state), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json',
        allowOverwrite: expectedVersion !== null, ...(expectedVersion ? { ifMatch: expectedVersion } : {}),
      });
      return result.etag;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new ConcurrentWriteError('Estado alterado por outra execução.');
      throw error;
    }
  }
}
