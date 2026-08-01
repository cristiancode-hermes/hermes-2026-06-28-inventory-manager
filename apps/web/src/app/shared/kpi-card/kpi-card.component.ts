import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<div class="flex items-center gap-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
@if (icon()) {
<span [innerHTML]="icon()"></span>
}
{{ label() }}
</div>
<div class="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
@if (loading()) {
<div class="h-9 w-24 skeleton"></div>
} @else {
{{ value() }}
}
</div>
@if (subtext()) {
<p class="mt-1 text-sm text-text-secondary-dark">{{ subtext() }}</p>
}
</div>
`
})
export class KpiCardComponent {
  readonly label = input('');
  readonly value = input('');
  readonly icon = input('');
  readonly subtext = input('');
  readonly loading = input(false);
}
