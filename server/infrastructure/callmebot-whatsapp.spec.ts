import { describe, expect, it, vi } from 'vitest';
import { CallMeBotWhatsapp } from './callmebot-whatsapp.js';

describe('CallMeBot adapter', () => {
  it('encodes the destination and message and recognizes queue acceptance', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('Message queued. You will receive it in seconds.'));
    await new CallMeBotWhatsapp('+5500000000000', 'test-secret', request).sendText('10ª RM & atualização');
    const url = new URL(String(request.mock.calls[0][0]));
    expect(url.origin).toBe('https://api.callmebot.com');
    expect(url.searchParams.get('phone')).toBe('+5500000000000');
    expect(url.searchParams.get('text')).toBe('10ª RM & atualização');
    expect(request.mock.calls[0][1]?.redirect).toBe('error');
  });
  it.each([new Response('ERROR: invalid key test-secret'), new Response('unavailable', { status: 503 }), new Response('unexpected response')])('rejects failures without exposing credentials', async response => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(response);
    await expect(new CallMeBotWhatsapp('+5500000000000', 'test-secret', request).sendText('test')).rejects.toThrow('O CallMeBot não confirmou');
  });
  it('sanitizes network failures containing the request URL', async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('apikey=test-secret'));
    await expect(new CallMeBotWhatsapp('+5500000000000', 'test-secret', request).sendText('test')).rejects.not.toThrow('test-secret');
  });
});
