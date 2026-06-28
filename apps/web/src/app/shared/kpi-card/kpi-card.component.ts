import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
      <div class="flex items-center gap-2 text-sm font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        @if (icon()) {
          <span [innerHTML]="icon()"></span>
        }
        {{ label() }}
      </div>
      <div class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        @if (loading()) {
          <div class="h-9 w-24 skeleton"></div>
        } @else {
          {{ value() }}
        }
      </div>
      @if (subtext()) {
        <p class="mt-1 text-sm text-secondary-400">{{ subtext() }}</p>
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
