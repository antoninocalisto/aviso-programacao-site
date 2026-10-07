import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { ConcurrentWriteError, emptyState, type MonitorState, type StateRepository, type VersionedState } from '../domain/monitor.js';
const PATH = 'monitor/state.json';
export class BlobStateRepository implements StateRepository {
  async read(): Promise<VersionedState> {
    const result = await get(PATH, { access: 'private', useCache: false });
    if (!result) return { state: emptyState(), version: null };
    if (result.statusCode !== 200 || !result.stream) throw new Error('Falha na leitura do estado persistente.');
    const state = await new Response(result.stream).json() as MonitorState;
    return { state, version: result.blob.etag };
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
