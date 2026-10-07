export interface ChangeDetails { addedText: string[]; removedText: string[]; addedLinks: string[]; removedLinks: string[]; }
export interface ActivityEntry { at: string; kind: 'baseline' | 'unchanged' | 'change' | 'notification' | 'error'; message: string; changes?: ChangeDetails; }
export interface MonitorStatus {
  configured: boolean;
  initialized: boolean;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  lastEmailAt: string | null;
  lastError: string | null;
  checks: number;
  notifications: number;
  history: ActivityEntry[];
}
