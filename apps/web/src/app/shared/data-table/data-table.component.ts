import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark overflow-hidden">
@if (loading()) {
<div class="p-6 space-y-3">
@for (i of [1,2,3,4,5]; track i) {
<div class="h-6 skeleton w-full"></div>
}
</div>
} @else if (error()) {
<div class="p-12 text-center">
<svg class="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
</svg>
<p class="text-sm text-text-secondary mb-3">{{ error() }}</p>
<button (click)="retry.emit()" class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent rounded-btn transition-colors">Retry</button>
</div>
} @else if (rows().length === 0) {
<div class="p-12 text-center">
<svg class="w-12 h-12 mx-auto text-text-secondary-dark dark:text-text-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
</svg>
<p class="text-sm text-text-secondary">{{ emptyMessage() }}</p>
</div>
} @else {
<div class="overflow-x-auto">
<table class="w-full">
<thead>
<tr class="bg-accent-light dark:bg-surface-card-dark">
@for (col of columns(); track col.key) {
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
{{ col.label }}
</th>
}
</tr>
</thead>
<tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
@for (row of rows(); track row[trackBy()]) {
<tr
class="hover:bg-accent-light dark:hover:bg-surface-card-dark/50 transition-colors cursor-pointer"
(click)="rowClick.emit(row)"
>
@for (col of columns(); track col.key) {
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark whitespace-nowrap">
{{ row[col.key] }}
</td>
}
</tr>
}
</tbody>
</table>
</div>
}
</div>
`
})
export class DataTableComponent {
  readonly columns = input<Array<{ key: string; label: string }>>([]);
  readonly rows = input<Array<Record<string, unknown>>>([]);
  readonly loading = input(false);
  readonly error = input('');
  readonly emptyMessage = input('No data available');
  readonly trackBy = input('id');
  readonly rowClick = output<Record<string, unknown>>();
  readonly retry = output<void>();
}
