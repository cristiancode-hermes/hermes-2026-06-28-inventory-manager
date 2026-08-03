import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TransactionListResponse, Transaction } from '../../models';
import { DatePipe } from '@angular/common';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-transaction-list-page',
  standalone: true,
  imports: [FormsModule, PaginationComponent, DatePipe],
  template: `
<div class="space-y-6">
<div class="flex items-center justify-between">
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Transactions</h1>
<button (click)="exportCsv()" class="inline-flex items-center gap-2 rounded-lg border border-border-primary dark:border-border-primary-dark px-4 py-2 text-sm font-medium text-text-primary dark:text-text-primary-dark hover:border-primary-500 hover:text-primary-600 transition-colors">
  ⬇️ Export CSV
</button>
</div>

<!-- Filters -->
<div class="flex items-center gap-3 flex-wrap">
<input
[(ngModel)]="productFilter"
(input)="applyFilters()"
placeholder="Filter by product ID..."
class="border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent outline-none"
/>
<select
[(ngModel)]="typeFilter"
(change)="applyFilters()"
class="border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark"
>
<option value="">All Types</option>
<option value="in">Stock In</option>
<option value="out">Stock Out</option>
<option value="adjustment">Adjustment</option>
</select>
</div>

@if (loading()) {
<div class="space-y-3">
@for (i of [1,2,3,4]; track i) {
<div class="h-16 skeleton rounded-btn"></div>
}
</div>
} @else {
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark overflow-hidden">
<table class="w-full">
<thead>
<tr class="bg-accent-light dark:bg-surface-card-dark">
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Warehouse</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantity</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Reason</th>
</tr>
</thead>
<tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
@for (t of transactions(); track t.id) {
<tr class="hover:bg-accent-light dark:hover:bg-surface-card-dark/50 transition-colors">
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark whitespace-nowrap">{{ t.createdAt | date:'short' }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ t.productName }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ t.warehouseName }}</td>
<td class="px-4 py-3">
<span class="inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium"
[class.bg-green-100]="t.type === 'in'"
[class.text-green-700]="t.type === 'in'"
[class.bg-red-100]="t.type === 'out'"
[class.text-red-700]="t.type === 'out'"
[class.bg-amber-100]="t.type === 'adjustment'"
[class.text-amber-700]="t.type === 'adjustment'"
>
{{ t.type }}
</span>
</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ t.quantity }}</td>
<td class="px-4 py-3 text-sm text-text-secondary dark:text-text-secondary-dark max-w-[200px] truncate">{{ t.reason }}</td>
</tr>
}
</tbody>
</table>
</div>

<app-pagination
[currentPage]="currentPage()"
[totalPages]="totalPages()"
(pageChange)="onPageChange($event)"
/>
}
</div>
`
})
export class TransactionListPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly productFilter = signal('');
  readonly typeFilter = signal('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    let url = `${this.api.baseUrl}/transactions?page=${this.currentPage()}&limit=20`;
    if (this.productFilter()) {
      url += `&productId=${encodeURIComponent(this.productFilter())}`;
    }
    if (this.typeFilter()) {
      url += `&type=${this.typeFilter()}`;
    }
    this.http.get<TransactionListResponse>(url).subscribe({
      next: (res) => {
        this.transactions.set(res.data);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.loadTransactions();
    }, 300);
  }

  exportCsv(): void {
    let url = `${this.api.baseUrl}/transactions/export`;
    const params: string[] = [];
    if (this.productFilter()) {
      params.push(`productId=${encodeURIComponent(this.productFilter())}`);
    }
    if (this.typeFilter()) {
      params.push(`type=${this.typeFilter()}`);
    }
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    this.http
      .get(url, { headers: this.api.headers, responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const urlObj = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = urlObj;
          a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          window.URL.revokeObjectURL(urlObj);
        },
        error: () => {
          // ignore download errors silently
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }
}
