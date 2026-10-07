import { timingSafeEqual } from 'node:crypto';
import type { ApiRequest, ApiResponse } from '../server/http/contracts.js';
import { createMonitor, isConfigured } from '../server/composition.js';
export function authorized(header: string | string[] | undefined, secret: string | undefined): boolean {
  if (!secret || typeof header !== 'string') return false;
  const expected = Buffer.from(`Bearer ${secret}`), actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Método não permitido.' });
  if (!authorized(req.headers.authorization, process.env['CRON_SECRET'])) return res.status(401).json({ error: 'Não autorizado.' });
  if (!isConfigured()) return res.status(503).json({ error: 'Configuração incompleta.' });
  try { return res.status(200).json({ result: await createMonitor().execute() }); }
  catch { return res.status(502).json({ error: 'Verificação falhou. Consulte o status do monitor.' }); }
}
