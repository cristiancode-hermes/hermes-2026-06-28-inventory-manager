import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
      @if (loading()) {
        <div class="p-6 space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-6 skeleton w-full"></div>
          }
        </div>
      } @else if (error()) {
        <div class="p-12 text-center">
          <svg class="w-12 h-12 mx-auto text-danger-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <p class="text-sm text-secondary-500 mb-3">{{ error() }}</p>
          <button (click)="retry.emit()" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Retry</button>
        </div>
      } @else if (rows().length === 0) {
        <div class="p-12 text-center">
          <svg class="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="text-sm text-secondary-500">{{ emptyMessage() }}</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-secondary-50 dark:bg-gray-800">
                @for (col of columns(); track col.key) {
                  <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                    {{ col.label }}
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
              @for (row of rows(); track row[trackBy()]) {
                <tr
                  class="hover:bg-secondary-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  (click)="rowClick.emit(row)"
                >
                  @for (col of columns(); track col.key) {
                    <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
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
