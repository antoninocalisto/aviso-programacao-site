export interface MonitorStatus {
  configured: boolean;
  initialized: boolean;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  lastEmailAt: string | null;
  lastError: string | null;
  checks: number;
  notifications: number;
  history: { at: string; kind: 'baseline' | 'unchanged' | 'notification' | 'error'; message: string }[];
}
