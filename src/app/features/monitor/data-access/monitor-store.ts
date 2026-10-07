import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { MonitorStatus } from '../../../../../shared/monitor-status';
@Injectable({ providedIn: 'root' })
export class MonitorStore {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly status = signal<MonitorStatus | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  refresh(): void {
    if (this.loading()) return;
    this.loading.set(true); this.error.set(null);
    this.http.get<MonitorStatus>('/api/status').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: status => { this.status.set(status); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível atualizar o painel. Tente novamente em alguns instantes.'); this.loading.set(false); },
    });
  }
}
