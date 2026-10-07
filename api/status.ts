import type { ApiRequest, ApiResponse } from '../server/http/contracts.js';
import { isConfigured, storageConfigured } from '../server/composition.js';
import { emptyState } from '../server/domain/monitor.js';
import { BlobStateRepository } from '../server/infrastructure/blob-repository.js';
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Método não permitido.' });
  try {
    const state = storageConfigured() ? (await new BlobStateRepository().read()).state : emptyState();
    return res.status(200).json({ configured: isConfigured(), initialized: !!state.snapshot,
      lastCheckedAt: state.lastCheckedAt, lastChangedAt: state.lastChangedAt, lastEmailAt: state.lastEmailAt,
      lastError: state.lastError, checks: state.checks, notifications: state.notifications, history: state.history });
  } catch { return res.status(503).json({ error: 'Não foi possível consultar o armazenamento do monitor.' }); }
}
