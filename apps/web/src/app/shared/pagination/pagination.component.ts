import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
@if (totalPages() > 1) {
<div class="flex items-center justify-between px-4 py-3 bg-surface-card dark:bg-surface-card-dark border-t border-border dark:border-border-dark">
<div class="text-sm text-text-secondary">
Page {{ currentPage() }} of {{ totalPages() }}
</div>
<div class="flex items-center gap-1">
<button
(click)="goToPage(currentPage() - 1)"
[disabled]="currentPage() <= 1"
class="px-3 py-1.5 text-sm font-medium rounded-btn border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:bg-accent-light dark:hover:bg-surface-card-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
Previous
</button>
<button
(click)="goToPage(currentPage() + 1)"
[disabled]="currentPage() >= totalPages()"
class="px-3 py-1.5 text-sm font-medium rounded-btn border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:bg-accent-light dark:hover:bg-surface-card-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
