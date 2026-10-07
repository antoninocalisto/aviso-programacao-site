import { Resend } from 'resend';
import { RECIPIENT, SOURCE_URL, type Notifier, type PendingNotification } from '../domain/monitor.js';
export class ResendNotifier implements Notifier {
  constructor(private readonly client: Resend) {}
  async send(pending: PendingNotification): Promise<void> {
    const result = await this.client.emails.send({
      from: 'onboarding@resend.dev', to: RECIPIENT,
      subject: '10ª RM · Atualização no processo seletivo OTT — Aviso 003/2026',
      text: `Uma alteração foi identificada na página do processo seletivo da 10ª Região Militar.\n\nConfira a publicação oficial:\n${SOURCE_URL}\n\nConteúdo atual (resumo):\n${pending.snapshot.text.slice(0, 12000)}\n\nEste aviso é automático e não substitui a consulta ao edital.`,
    }, { idempotencyKey: `ott-${pending.id}` });
    if (result.error) throw new Error(`Resend recusou o envio (${result.error.name}). Consulte o painel do Resend.`);
    if (!result.data?.id) throw new Error('Resend não confirmou o recebimento do email.');
  }
}
