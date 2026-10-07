export const SOURCE_URL = 'https://10rm.eb.mil.br/index.php/processos-seletivos/todos-processos-seletivos/av003-26-ott';
export const RECIPIENT = 'antuninosantos@gmail.com';
import type { ActivityEntry } from '../../shared/monitor-status.js';
export interface Snapshot { hash: string; text: string; links: string[]; }
export interface PendingNotification { id: string; createdAt: string; snapshot: Snapshot; }
export interface MonitorState {
  snapshot: Snapshot | null; pending: PendingNotification | null;
  lease: { owner: string; until: number } | null;
  lastCheckedAt: string | null; lastChangedAt: string | null; lastEmailAt: string | null;
  lastError: string | null; checks: number; notifications: number;
  history: ActivityEntry[];
  changeHistory?: ActivityEntry[];
}
export const emptyState = (): MonitorState => ({ snapshot: null, pending: null, lease: null, lastCheckedAt: null, lastChangedAt: null, lastEmailAt: null, lastError: null, checks: 0, notifications: 0, history: [] });
export interface VersionedState { state: MonitorState; version: string | null; }
export interface StateRepository { read(): Promise<VersionedState>; write(state: MonitorState, expectedVersion: string | null): Promise<string>; }
export interface PageSource { fetch(): Promise<Snapshot>; }
export interface Notifier { send(pending: PendingNotification): Promise<void>; }
export class ConcurrentWriteError extends Error {}
