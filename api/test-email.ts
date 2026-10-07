import { Resend } from 'resend';
import type { ApiRequest, ApiResponse } from '../server/http/contracts.js';
import { authorized } from './monitor.js';
import { RECIPIENT } from '../server/domain/monitor.js';
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: 'Método não permitido.' });
  if (!authorized(req.headers.authorization, process.env['CRON_SECRET'])) return res.status(401).json({ error: 'Não autorizado.' });
  const requestId = req.headers['idempotency-key'];
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return res.status(400).json({ error: 'Informe uma chave de idempotência válida.' });
  if (!process.env['RESEND_API_KEY']) return res.status(503).json({ error: 'Resend não configurado.' });
  try {
    const result = await new Resend(process.env['RESEND_API_KEY']).emails.send({ from: 'onboarding@resend.dev', to: RECIPIENT,
      subject: 'Teste pela Vercel — Aviso programação site · 10ª RM',
      text: 'Este email de teste foi enviado pela aplicação hospedada na Vercel, usando o Resend.\n\nSite: https://aviso-programacao-site.vercel.app\n\nO monitor envia avisos automaticamente ao detectar alterações no texto ou nos links do processo seletivo. Este teste não representa uma nova publicação.'
    }, { idempotencyKey: `vercel-test-${requestId}` });
    if (result.error || !result.data?.id) return res.status(502).json({ error: 'O Resend não confirmou o envio.' });
    return res.status(200).json({ accepted: true, emailId: result.data.id, executedOn: 'Vercel' });
  } catch { return res.status(502).json({ error: 'Falha ao enviar email de teste.' }); }
}
