import type { WhatsappNotifier } from '../domain/monitor.js';

/** Personal-use channel; credentials and destination stay exclusively on the server. */
export class CallMeBotWhatsapp implements WhatsappNotifier {
  constructor(private readonly phone: string, private readonly apiKey: string, private readonly request: typeof fetch = fetch) {}

  async sendText(text: string): Promise<void> {
    const url = new URL('https://api.callmebot.com/whatsapp.php');
    url.search = new URLSearchParams({ phone: this.phone, apikey: this.apiKey, text }).toString();
    try {
      const response = await this.request(url, { signal: AbortSignal.timeout(10_000), redirect: 'error' });
      const body = await response.text();
      if (!response.ok || /error|failed|invalid/i.test(body) || !/queued|sent|success/i.test(body)) throw new Error();
    } catch {
      // Provider errors and request URLs can contain the key: never propagate their details.
      throw new Error('O CallMeBot não confirmou o aviso de WhatsApp.');
    }
  }
}
