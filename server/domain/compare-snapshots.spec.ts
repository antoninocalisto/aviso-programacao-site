import { it, expect } from 'vitest';
import { compareSnapshots } from './compare-snapshots.js';
it('identifies added and removed lines and links', () => {
  expect(compareSnapshots({hash:'old',text:'Mantido\nAntigo',links:['https://example.com/old']}, {hash:'new',text:'Mantido\nNovo',links:['https://example.com/new']})).toEqual({ addedText:['Novo'],removedText:['Antigo'],addedLinks:['https://example.com/new'],removedLinks:['https://example.com/old'] });
});
