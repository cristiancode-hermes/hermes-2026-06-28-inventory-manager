import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ProductListResponse, Product } from '../../models';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [FormsModule, DataTableComponent, PaginationComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Products</h1>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <input
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search products..."
            class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      @if (error()) {
        <div class="p-4 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 text-sm rounded-lg">{{ error() }}</div>
      }

      <app-data-table
        [columns]="columns"
        [rows]="rows"
        [loading]="loading()"
        [error]="tableError()"
        emptyMessage="No products found"
        (rowClick)="onRowClick($event)"
        (retry)="loadProducts()"
      />

      <app-pagination
        [currentPage]="currentPage()"
        [totalPages]="totalPages()"
        (pageChange)="onPageChange($event)"
      />
    </div>
  `
})
export class ProductListPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private router = inject(Router);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tableError = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly searchQuery = signal('');

  columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'unitPrice', label: 'Price' }
  ];

  get rows(): Array<Record<string, unknown>> {
    return this.products().map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: '$' + p.unitPrice.toFixed(2)
    }));
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.tableError.set('');
    const params: Record<string, string> = {
      page: this.currentPage().toString(),
      limit: '10'
    };
    if (this.searchQuery()) {
      params['q'] = this.searchQuery();
    }
    const queryStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    this.http.get<ProductListResponse>(`${this.api.baseUrl}/products?${queryStr}`).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.tableError.set(err.error?.message || 'Failed to load products');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProducts();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/products', row['id'] as string]);
  }
}
