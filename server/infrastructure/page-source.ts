import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { SOURCE_URL, type PageSource, type Snapshot } from '../domain/monitor.js';

export function extractSnapshot(html: string): Snapshot {
  const $ = load(html);
  const article = $('.com-content-article__body').first();
  if (!article.length) throw new Error('Área do processo não encontrada. Leitura descartada para evitar falso alerta.');
  article.find('script, style, noscript').remove();
  article.find('br').replaceWith('\n');
  article.find('p, tr, h1, h2, h3, li').append('\n');
  const text = article.text().replace(/\u00a0/g, ' ').split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  if (text.length < 100 || !/003|OTT|Temporário/i.test(text)) throw new Error('Conteúdo do processo inválido ou incompleto.');
  const links = [...new Set(article.find('a[href]').map((_, el) => {
    const url = new URL($(el).attr('href')!, SOURCE_URL);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  }).get().filter(Boolean))].sort();
  return { text, links, hash: createHash('sha256').update(JSON.stringify({ text, links })).digest('hex') };
}
export class MilitaryPageSource implements PageSource {
  constructor(private readonly fetcher: typeof fetch = fetch) {}
  async fetch(): Promise<Snapshot> {
    const response = await this.fetcher(SOURCE_URL, { signal: AbortSignal.timeout(25_000), headers: { 'User-Agent': 'AvisoProgramacaoSite/1.0 (personal selection-page monitor)', Accept: 'text/html' } });
    if (!response.ok) throw new Error(`Página oficial indisponível (HTTP ${response.status}).`);
    if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('A página oficial retornou um formato inesperado.');
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('Página excedeu o limite de leitura.');
    return extractSnapshot(html);
  }
}
