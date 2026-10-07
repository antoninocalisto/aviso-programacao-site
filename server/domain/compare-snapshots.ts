import type { ChangeDetails } from '../../shared/monitor-status.js';
import type { Snapshot } from './monitor.js';
export function compareSnapshots(previous: Snapshot, current: Snapshot): ChangeDetails {
  const difference = (a: string[], b: string[]) => { const known = new Set(b); return [...new Set(a)].filter(value => !known.has(value)); };
  return { addedText: difference(current.text.split('\n'), previous.text.split('\n')), removedText: difference(previous.text.split('\n'), current.text.split('\n')), addedLinks: difference(current.links, previous.links), removedLinks: difference(previous.links, current.links) };
}
