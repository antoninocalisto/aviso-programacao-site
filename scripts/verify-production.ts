import { chromium } from '@playwright/test';
const url = process.argv[2] || 'https://aviso-programacao-site.vercel.app';
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]] as const) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Atualizar painel' }).waitFor();
    const layout = await page.evaluate(() => ({ styled: getComputedStyle(document.querySelector('.topbar')!).display === 'flex', overflow: document.documentElement.scrollWidth > innerWidth }));
    if (!layout.styled || layout.overflow || errors.length) throw new Error(`${name}: verificação visual/runtime falhou: ${JSON.stringify({ layout, errors })}`);
    const status = await page.request.get(`${url}/api/status`);
    if (status.status() !== 200) throw new Error(`Status HTTP ${status.status()}`);
    const data = await status.json();
    await page.getByRole('button', { name: 'Atualizar painel' }).click();
    await page.getByRole('button', { name: 'Atualizar painel' }).waitFor();
    const monitor = await page.request.get(`${url}/api/monitor`);
    if (monitor.status() !== 401) throw new Error('Monitor precisa rejeitar acesso público sem segredo.');
    await page.screenshot({ path: `docs/dashboard-${name}.png`, fullPage: true });
    console.log(JSON.stringify({ viewport: name, status: status.status(), configured: data.configured, styled: layout.styled, horizontalOverflow: layout.overflow, unauthorizedMonitor: monitor.status(), consoleErrors: errors.length }));
    await page.close();
  }
} finally { await browser.close(); }
