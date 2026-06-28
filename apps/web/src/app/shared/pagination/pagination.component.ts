import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-neutral-200 dark:border-gray-700">
        <div class="text-sm text-secondary-500">
          Page {{ currentPage() }} of {{ totalPages() }}
        </div>
        <div class="flex items-center gap-1">
          <button
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() <= 1"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-gray-600 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() >= totalPages()"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-gray-600 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    }
  `
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly pageChange = output<number>();

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
