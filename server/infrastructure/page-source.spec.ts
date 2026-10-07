import { describe, it, expect, vi } from 'vitest';
import { extractSnapshot, MilitaryPageSource } from './page-source.js';
const article = `<div class="com-content-article__body"><p>Aviso 003/2026 OTT Seleção Oficial Técnico Temporário. Calendário e publicações oficiais para os candidatos do Ceará e Piauí.</p><a href="/ata.pdf">Baixar ata</a></div>`;
describe('official page extraction', () => {
  it('ignores navigation, scripts, cosmetic styles and whitespace', () => {
    const original = extractSnapshot(`<nav>Menu velho</nav>${article}`);
    const cosmetic = extractSnapshot(`<nav>Menu novo</nav>${article.replace('<p>', '<p style="color:red">\n ').replace('</p>', ' </p><script>random()</script>')}`);
    expect(original.hash).toBe(cosmetic.hash);
  });
  it('detects changed text and link targets', () => {
    expect(extractSnapshot(article.replace('Calendário', 'Novo calendário')).hash).not.toBe(extractSnapshot(article).hash);
    expect(extractSnapshot(article.replace('/ata.pdf', '/ata-2.pdf')).hash).not.toBe(extractSnapshot(article).hash);
    expect(extractSnapshot(article).links[0]).toBe('https://10rm.eb.mil.br/ata.pdf');
  });
  it('rejects missing article, login page and incomplete content', () => {
    expect(() => extractSnapshot('<html>Login</html>')).toThrow('não encontrada');
    expect(() => extractSnapshot('<div class="com-content-article__body">Erro</div>')).toThrow('incompleto');
  });
  it('rejects source error without producing a snapshot', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('Error', { status: 503 }));
    await expect(new MilitaryPageSource(fetcher).fetch()).rejects.toThrow('503');
  });
  it('integrates HTTP response with article extraction', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(article, { headers: { 'content-type': 'text/html' } }));
    expect(await new MilitaryPageSource(fetcher).fetch()).toEqual(extractSnapshot(article));
  });
});
