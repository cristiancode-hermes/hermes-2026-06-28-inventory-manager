import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Product, Supplier } from '../../models';

@Component({
  selector: 'app-order-create-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <button (click)="router.navigate(['/orders'])" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1">&larr; Back to Orders</button>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">New Order</h1>
        </div>
      </div>

      <!-- Stepper -->
      <div class="flex items-center gap-0">
        @for (step of steps; track step.index) {
          <div class="flex-1 flex items-center">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                [class.bg-primary-500]="currentStep() >= step.index"
                [class.text-white]="currentStep() >= step.index"
                [class.bg-secondary-200]="currentStep() < step.index"
                [class.text-secondary-500]="currentStep() < step.index"
              >
                @if (currentStep() > step.index) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                } @else {
                  {{ step.index + 1 }}
                }
              </div>
              <span
                class="text-sm font-medium"
                [class.text-primary-600]="currentStep() >= step.index"
                [class.text-secondary-400]="currentStep() < step.index"
              >
                {{ step.label }}
              </span>
            </div>
            @if (step.index < steps.length - 1) {
              <div class="flex-1 h-px mx-4"
                [class.bg-primary-500]="currentStep() > step.index"
                [class.bg-secondary-200]="currentStep() <= step.index"
              ></div>
            }
          </div>
        }
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
        <!-- Step 1: Select Supplier -->
        @if (currentStep() === 0) {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Select Supplier</h2>
            <div class="space-y-2">
              @for (supplier of suppliers(); track supplier.id) {
                <label
                  class="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
                  [class.border-primary-500]="selectedSupplierId() === supplier.id"
                  [class.bg-primary-50]="selectedSupplierId() === supplier.id"
                  [class.dark:bg-primary-900/10]="selectedSupplierId() === supplier.id"
                  [class.border-neutral-200]="selectedSupplierId() !== supplier.id"
                  [class.dark:border-gray-600]="selectedSupplierId() !== supplier.id"
                >
                  <input type="radio" name="supplier" [value]="supplier.id" [(ngModel)]="selectedSupplierId" class="text-primary-500" />
                  <div>
                    <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ supplier.name }}</p>
                    <p class="text-xs text-secondary-500">{{ supplier.contactName }} · {{ supplier.email }}</p>
                  </div>
                </label>
              }
            </div>
          </div>
        }

        <!-- Step 2: Add Items -->
        @if (currentStep() === 1) {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Add Items</h2>
            @for (item of orderItems(); track item.productId; let i = $index) {
              <div class="flex items-center gap-3 p-3 bg-secondary-50 dark:bg-gray-800 rounded-lg">
                <span class="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{{ item.productName }}</span>
                <input type="number" [(ngModel)]="item.quantity" min="1" class="w-24 border border-neutral-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100" />
                <button (click)="removeItem(i)" class="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            }
            <div class="flex items-center gap-3">
              <select [(ngModel)]="newItemProductId" class="flex-1 border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100">
                <option value="">Select a product...</option>
                @for (p of products(); track p.id) {
                  <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                }
              </select>
              <input type="number" [(ngModel)]="newItemQuantity" min="1" placeholder="Qty" class="w-24 border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100" />
              <button (click)="addItem()" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        }

        <!-- Step 3: Order Details -->
        @if (currentStep() === 2) {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Order Details</h2>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Expected Date</label>
              <input type="date" [(ngModel)]="expectedDate" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100" />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes</label>
              <textarea [(ngModel)]="notes" rows="3" class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100" placeholder="Optional notes..."></textarea>
            </div>
          </div>
        }

        <!-- Summary -->
        @if (currentStep() === 2) {
          <div class="mt-6 p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Summary</h3>
            <p class="text-sm text-secondary-600">Supplier: {{ selectedSupplierName }}</p>
            <p class="text-sm text-secondary-600">Items: {{ orderItems().length }}</p>
            <p class="text-sm text-secondary-600">Total quantity: {{ totalQuantity }}</p>
          </div>
        }
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <button
          (click)="prevStep()"
          [disabled]="currentStep() === 0"
          class="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 border border-neutral-200 dark:border-gray-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div class="flex gap-2">
          @if (currentStep() < 2) {
            <button
              (click)="nextStep()"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg"
            >
              Next
            </button>
          } @else {
            <button
              (click)="submitOrder()"
              [disabled]="submitting()"
              class="px-4 py-2 text-sm font-medium text-white bg-success-500 hover:bg-success-600 rounded-lg disabled:opacity-50"
            >
              {{ submitting() ? 'Creating...' : 'Create Order' }}
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="p-3 bg-danger-50 dark:bg-danger-900/20 text-danger-600 text-sm rounded-lg">{{ error() }}</div>
      }
    </div>
  `
})
export class OrderCreatePage implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  readonly router = inject(Router);

  readonly currentStep = signal(0);
  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<Product[]>([]);
  readonly selectedSupplierId = signal('');
  readonly orderItems = signal<Array<{ productId: string; productName: string; quantity: number }>>([]);
  readonly newItemProductId = signal('');
  readonly newItemQuantity = signal<number>(1);
  readonly expectedDate = signal('');
  readonly notes = signal('');
  readonly submitting = signal(false);
  readonly error = signal('');

  readonly steps = [
    { index: 0, label: 'Supplier' },
    { index: 1, label: 'Items' },
    { index: 2, label: 'Details' }
  ];

  ngOnInit(): void {
    this.http.get<Supplier[]>(`${this.apiService.baseUrl}/suppliers`).subscribe({
      next: (res) => this.suppliers.set(res)
    });
    this.http.get<Product[]>(`${this.apiService.baseUrl}/products`).subscribe({
      next: (res) => this.products.set(res)
    });
  }

  get selectedSupplierName(): string {
    const s = this.suppliers().find(s => s.id === this.selectedSupplierId());
    return s?.name || '';
  }

  get totalQuantity(): number {
    return this.orderItems().reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  nextStep(): void {
    if (this.currentStep() === 0 && !this.selectedSupplierId()) {
      this.error.set('Please select a supplier');
      return;
    }
    if (this.currentStep() === 1 && this.orderItems().length === 0) {
      this.error.set('Please add at least one item');
      return;
    }
    this.error.set('');
    if (this.currentStep() < 2) {
      this.currentStep.update(v => v + 1);
    }
  }

  prevStep(): void {
    this.error.set('');
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
  }

  addItem(): void {
    if (!this.newItemProductId()) return;
    const product = this.products().find(p => p.id === this.newItemProductId());
    if (!product) return;
    const existing = this.orderItems().find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += this.newItemQuantity() || 1;
    } else {
      this.orderItems.update(items => [...items, {
        productId: product.id,
        productName: product.name,
        quantity: this.newItemQuantity() || 1
      }]);
    }
    this.newItemProductId.set('');
    this.newItemQuantity.set(1);
  }

  removeItem(index: number): void {
    this.orderItems.update(items => items.filter((_, i) => i !== index));
  }

  submitOrder(): void {
    if (!this.expectedDate()) {
      this.error.set('Please set an expected date');
      return;
    }
    this.submitting.set(true);
    this.error.set('');

    this.http.post(`${this.apiService.baseUrl}/orders`, {
      supplierId: this.selectedSupplierId(),
      expectedDate: this.expectedDate(),
      notes: this.notes(),
      items: this.orderItems().map(item => ({
        productId: item.productId,
        quantityOrdered: item.quantity
      }))
    }).subscribe({
      next: (res: unknown) => {
        const order = res as { id: string };
        this.router.navigate(['/orders', order.id]);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create order');
        this.submitting.set(false);
      }
    });
  }
}
