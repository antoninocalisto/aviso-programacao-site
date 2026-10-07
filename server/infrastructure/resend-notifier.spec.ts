import { it, expect, vi } from 'vitest';
import type { Resend } from 'resend';
import { ResendNotifier } from './resend-notifier.js';
const pending = { id: 'change-1', createdAt: '2026-10-07T12:00:00Z', snapshot: { hash: 'hash', text: 'Nova convocação', links: [] } };
it('sends the fixed sender/recipient with a stable idempotency key', async () => {
  const send = vi.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
  await new ResendNotifier({ emails: { send } } as unknown as Resend).send(pending);
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: 'onboarding@resend.dev', to: 'antuninosantos@gmail.com', text: expect.stringContaining('Nova convocação') }), { idempotencyKey: 'ott-change-1' });
});
it('treats provider rejection as failure without exposing the key', async () => {
  const send = vi.fn().mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'private provider detail' } });
  await expect(new ResendNotifier({ emails: { send } } as unknown as Resend).send(pending)).rejects.toThrow('Resend recusou');
});
