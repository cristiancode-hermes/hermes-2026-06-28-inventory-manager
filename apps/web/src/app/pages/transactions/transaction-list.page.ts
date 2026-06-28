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
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Transactions</h1>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 flex-wrap">
        <input
          [(ngModel)]="productFilter"
          (input)="applyFilters()"
          placeholder="Filter by product ID..."
          class="border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none"
        />
        <select
          [(ngModel)]="typeFilter"
          (change)="applyFilters()"
          class="border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100"
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
            <div class="h-16 skeleton rounded-lg"></div>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-secondary-50 dark:bg-gray-800">
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Product</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Warehouse</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Quantity</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
              @for (t of transactions(); track t.id) {
                <tr class="hover:bg-secondary-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{{ t.createdAt | date:'short' }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ t.productName }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ t.warehouseName }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-success-100]="t.type === 'in'"
                      [class.text-success-700]="t.type === 'in'"
                      [class.bg-danger-100]="t.type === 'out'"
                      [class.text-danger-700]="t.type === 'out'"
                      [class.bg-warning-100]="t.type === 'adjustment'"
                      [class.text-warning-700]="t.type === 'adjustment'"
                    >
                      {{ t.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ t.quantity }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px] truncate">{{ t.reason }}</td>
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }
}
