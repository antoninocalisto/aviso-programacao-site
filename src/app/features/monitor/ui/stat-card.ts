import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({ selector: 'app-stat-card', changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <article class="stat"><p class="eyebrow">{{ label() }}</p><p class="stat-value">{{ value() }}</p><p class="muted small">{{ detail() }}</p></article>
` })
export class StatCard { readonly label = input.required<string>(); readonly value = input.required<string>(); readonly detail = input.required<string>(); }
