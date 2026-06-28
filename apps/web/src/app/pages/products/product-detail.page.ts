import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Product, StockEntry } from '../../models';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <button (click)="router.navigate(['/products'])" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1">&larr; Back to Products</button>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ product()?.name || 'Loading...' }}</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="h-8 skeleton w-48"></div>
          <div class="h-8 skeleton w-96"></div>
          <div class="h-8 skeleton w-64"></div>
        </div>
      } @else if (product(); as p) {
        <!-- Product Details -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-secondary-500 mb-1">SKU</label>
              <p class="text-neutral-900 dark:text-neutral-100">{{ p.sku }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-500 mb-1">Category</label>
              <p class="text-neutral-900 dark:text-neutral-100">{{ p.category }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-500 mb-1">Unit Price</label>
              <p class="text-neutral-900 dark:text-neutral-100">\${{ p.unitPrice.toFixed(2) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-500 mb-1">Reorder Point</label>
              <p class="text-neutral-900 dark:text-neutral-100">{{ p.reorderPoint }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-500 mb-1">Description</label>
              <p class="text-neutral-900 dark:text-neutral-100">{{ p.description || 'No description' }}</p>
            </div>
          </div>
        </div>

        <!-- Stock by Warehouse -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
          <div class="px-6 py-4 border-b border-neutral-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Stock by Warehouse</h2>
            <button (click)="openAdjustModal()" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Adjust Stock</button>
          </div>
          <div class="p-4">
            @if (stockLoading()) {
              <div class="space-y-3">
                @for (i of [1,2]; track i) {
                  <div class="h-12 skeleton"></div>
                }
              </div>
            } @else if (stockEntries().length === 0) {
              <p class="text-sm text-secondary-500 text-center py-8">No stock records</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="bg-secondary-50 dark:bg-gray-800">
                      <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Warehouse</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
                    @for (entry of stockEntries(); track entry.id) {
                      <tr>
                        <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ entry.warehouseName }}</td>
                        <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ entry.quantity }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }

      <!-- Adjust Stock Modal -->
      <app-modal [isOpen]="showAdjustModal()" title="Adjust Stock" (close)="showAdjustModal.set(false)">
        @if (adjustError()) {
          <div class="mb-4 p-3 bg-danger-50 dark:bg-danger-900/20 text-danger-600 text-sm rounded-lg">{{ adjustError() }}</div>
        }
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Type</label>
            <select [(ngModel)]="adjustType" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100">
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Quantity</label>
            <input type="number" [(ngModel)]="adjustQuantity" min="1" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100" />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reason</label>
            <textarea [(ngModel)]="adjustReason" rows="2" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Warehouse</label>
            <select [(ngModel)]="adjustWarehouseId" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100">
              @for (wh of warehouses(); track wh.id) {
                <option [value]="wh.id">{{ wh.name }}</option>
              }
            </select>
          </div>
          <button (click)="submitAdjust()" [disabled]="adjustSubmitting()" class="w-full px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50">
            {{ adjustSubmitting() ? 'Submitting...' : 'Submit Adjustment' }}
          </button>
        </div>
      </app-modal>
    </div>
  `
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  readonly router = inject(Router);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly stockEntries = signal<StockEntry[]>([]);
  readonly stockLoading = signal(true);
  readonly warehouses = signal<Array<{ id: string; name: string }>>([]);

  // Adjust modal
  readonly showAdjustModal = signal(false);
  readonly adjustType = signal<'in' | 'out'>('in');
  readonly adjustQuantity = signal<number>(1);
  readonly adjustReason = signal('');
  readonly adjustWarehouseId = signal('');
  readonly adjustSubmitting = signal(false);
  readonly adjustError = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
      this.loadStock(id);
      this.loadWarehouses();
    }
  }

  private loadProduct(id: string): void {
    this.http.get<Product>(`${this.apiService.baseUrl}/products/${id}`).subscribe({
      next: (res) => {
        this.product.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadStock(productId: string): void {
    this.http.get<StockEntry[]>(`${this.apiService.baseUrl}/stock/product/${productId}`).subscribe({
      next: (res) => {
        this.stockEntries.set(res);
        this.stockLoading.set(false);
      },
      error: () => this.stockLoading.set(false)
    });
  }

  private loadWarehouses(): void {
    this.http.get<Array<{ id: string; name: string }>>(`${this.apiService.baseUrl}/warehouses`).subscribe({
      next: (res) => this.warehouses.set(res)
    });
  }

  openAdjustModal(): void {
    this.showAdjustModal.set(true);
    this.adjustType.set('in');
    this.adjustQuantity.set(1);
    this.adjustReason.set('');
    this.adjustError.set('');
    if (this.warehouses().length > 0) {
      this.adjustWarehouseId.set(this.warehouses()[0].id);
    }
  }

  submitAdjust(): void {
    if (!this.adjustQuantity() || this.adjustQuantity() < 1) {
      this.adjustError.set('Quantity must be at least 1');
      return;
    }
    if (!this.adjustReason()) {
      this.adjustError.set('Please provide a reason');
      return;
    }
    if (!this.adjustWarehouseId()) {
      this.adjustError.set('Please select a warehouse');
      return;
    }
    this.adjustSubmitting.set(true);
    this.adjustError.set('');

    const productId = this.route.snapshot.paramMap.get('id')!;
    this.http.post(`${this.apiService.baseUrl}/stock/adjust`, {
      productId,
      warehouseId: this.adjustWarehouseId(),
      type: this.adjustType(),
      quantity: this.adjustQuantity(),
      reason: this.adjustReason()
    }).subscribe({
      next: () => {
        this.showAdjustModal.set(false);
        this.loadStock(productId);
        this.adjustSubmitting.set(false);
      },
      error: (err) => {
        this.adjustError.set(err.error?.message || 'Failed to adjust stock');
        this.adjustSubmitting.set(false);
      }
    });
  }
}
