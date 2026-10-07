import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MonitorStatus } from '../../../../../shared/monitor-status';
@Component({ selector: 'app-activity-list', imports: [DatePipe], changeDetection: ChangeDetectionStrategy.OnPush, template: `
  @if (entries().length) {
    <ol class="activity-list">
    @for (entry of entries(); track $index) {
      <li><span class="activity-dot" [class.error-dot]="entry.kind === 'error'" aria-hidden="true"></span><div><p>{{ entry.message }}</p><time class="muted small" [attr.datetime]="entry.at">{{ entry.at | date:'dd/MM/yyyy, HH:mm':'-0300' }} · Brasília</time></div></li>
    }
    </ol>
  } @else {
    <div class="empty-state"><span class="empty-symbol" aria-hidden="true">◷</span><h3>O acompanhamento começa aqui</h3><p class="muted">Após a primeira verificação, você verá o histórico das leituras e dos avisos enviados.</p></div>
  }
` })
export class ActivityList { readonly entries = input.required<MonitorStatus['history']>(); }
