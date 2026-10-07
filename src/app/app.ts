import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MonitorStore } from './features/monitor/data-access/monitor-store';
import { StatCard } from './features/monitor/ui/stat-card';
import { ActivityList } from './features/monitor/ui/activity-list';
@Component({ selector: 'app-root', imports: [DatePipe, StatCard, ActivityList], templateUrl: './app.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class App implements OnInit {
  readonly store = inject(MonitorStore);
  readonly sourceUrl = 'https://10rm.eb.mil.br/index.php/processos-seletivos/todos-processos-seletivos/av003-26-ott';
  readonly label = computed(() => {
    const state = this.store.status();
    if (!state) return 'Consultando status';
    if (!state.configured) return 'Configuração pendente';
    if (state.lastError) return 'Verificação precisa de atenção';
    if (!state.initialized) return 'Aguardando primeira leitura';
    if (!state.lastCheckedAt || Date.now() - Date.parse(state.lastCheckedAt) > 48 * 60 * 60 * 1000) return 'Verificação atrasada';
    return 'Monitoramento ativo';
  });
  ngOnInit(): void { this.store.refresh(); }
}
