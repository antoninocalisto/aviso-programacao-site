import { test, expect } from '@playwright/test';
test('real dashboard and local API work without credentials and without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu próximo passo');
  await expect(page.getByRole('status').first()).toContainText('Configuração pendente');
  await expect(page.getByRole('link', { name: 'Consultar processo' })).toHaveAttribute('href', /10rm\.eb\.mil\.br/);
  await page.getByRole('button', { name: 'Atualizar painel' }).click();
  await expect(page.getByRole('button', { name: 'Atualizar painel' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const response = await page.request.get('/api/monitor'); expect(response.status()).toBe(401);
});
test('shows actual API activity and handles an outage', async ({ page }) => {
  await page.route('**/api/status', route => route.fulfill({ json: { configured: true, initialized: true, lastCheckedAt: new Date().toISOString(), notifications: 1, history: [{ at: new Date().toISOString(), kind: 'notification', message: 'Alteração identificada. Email aceito pelo Resend.' }], lastError: null } }));
  await page.goto('/'); await expect(page.getByRole('status').first()).toContainText('Monitoramento ativo');
  await expect(page.getByText('Alteração identificada. Email aceito pelo Resend.')).toBeVisible();
  await page.route('**/api/status', route => route.fulfill({ status: 503, json: { error: 'Indisponível' } }));
  await page.getByRole('button', { name: 'Atualizar painel' }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar');
});
