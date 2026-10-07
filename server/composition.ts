import { Resend } from 'resend';
import { CheckMonitor } from './application/check-monitor.js';
import { BlobStateRepository } from './infrastructure/blob-repository.js';
import { MilitaryPageSource } from './infrastructure/page-source.js';
import { ResendNotifier } from './infrastructure/resend-notifier.js';
export const storageConfigured = () => !!(process.env['BLOB_READ_WRITE_TOKEN'] || (process.env['BLOB_STORE_ID'] && process.env['VERCEL_OIDC_TOKEN']));
export const isConfigured = () => storageConfigured() && !!process.env['RESEND_API_KEY'] && !!process.env['CRON_SECRET'];
export function createMonitor() {
  if (!isConfigured()) throw new Error('Configuração de monitoramento incompleta.');
  return new CheckMonitor(new BlobStateRepository(), new MilitaryPageSource(), new ResendNotifier(new Resend(process.env['RESEND_API_KEY'])));
}
