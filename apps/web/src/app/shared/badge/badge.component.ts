import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [ngClass]="classMap()"
    >
      <ng-content />
    </span>
  `
})
export class BadgeComponent {
  readonly variant = input<'default' | 'success' | 'warning' | 'danger' | 'info'>('default');

  classMap(): Record<string, boolean> {
    const variants: Record<string, Record<string, boolean>> = {
      default: {
        'bg-secondary-100 dark:bg-gray-700 text-secondary-700 dark:text-secondary-300': true
      },
      success: {
        'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400': true
      },
      warning: {
        'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400': true
      },
      danger: {
        'bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400': true
      },
      info: {
        'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400': true
      }
    };
    return variants[this.variant()] || variants['default'];
  }
}
