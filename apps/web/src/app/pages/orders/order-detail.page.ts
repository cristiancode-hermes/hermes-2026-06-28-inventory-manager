import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Order } from '../../models';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [FormsModule, DatePipe, BadgeComponent, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <button (click)="router.navigate(['/orders'])" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1">&larr; Back to Orders</button>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Order #{{ order()?.id?.substring(0, 8) || 'Loading...' }}</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="h-8 skeleton w-48"></div>
          <div class="h-8 skeleton w-96"></div>
        </div>
      } @else if (order(); as o) {
        <!-- Order Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
            <label class="block text-sm font-medium text-secondary-500 mb-1">Supplier</label>
            <p class="text-neutral-900 dark:text-neutral-100">{{ o.supplierName }}</p>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
            <label class="block text-sm font-medium text-secondary-500 mb-1">Status</label>
            <app-badge [variant]="statusVariant(o.status)">{{ o.status }}</app-badge>
          </div>
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
            <label class="block text-sm font-medium text-secondary-500 mb-1">Expected Date</label>
            <p class="text-neutral-900 dark:text-neutral-100">{{ o.expectedDate | date:'mediumDate' }}</p>
          </div>
        </div>

        @if (o.notes) {
          <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
            <label class="block text-sm font-medium text-secondary-500 mb-1">Notes</label>
            <p class="text-neutral-900 dark:text-neutral-100">{{ o.notes }}</p>
          </div>
        }

        <!-- Items -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
          <div class="px-6 py-4 border-b border-neutral-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Items</h2>
          </div>
          <div class="p-4">
            <table class="w-full">
              <thead>
                <tr class="bg-secondary-50 dark:bg-gray-800">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Product</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Ordered</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
                @for (item of o.items; track item.id) {
                  <tr>
                    <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ item.productName }}</td>
                    <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ item.quantityOrdered }}</td>
                    <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ item.quantityReceived }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Status Actions -->
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Update Status</h2>
          <div class="flex items-center gap-2 flex-wrap">
            @if (o.status === 'pending') {
              <button (click)="updateStatus('approved')" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Approve</button>
              <button (click)="confirmCancel()" class="px-4 py-2 text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors">Cancel</button>
            }
            @if (o.status === 'approved') {
              <button (click)="updateStatus('shipped')" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Mark as Shipped</button>
            }
            @if (o.status === 'shipped') {
              <button (click)="updateStatus('received')" class="px-4 py-2 text-sm font-medium text-white bg-success-500 hover:bg-success-600 rounded-lg transition-colors">Mark as Received</button>
            }
          </div>
        </div>
      }

      <!-- Cancel confirmation -->
      <app-confirm-dialog
        [isOpen]="showCancelConfirm()"
        title="Cancel Order"
        [message]="'Are you sure you want to cancel this order?'"
        confirmText="Cancel Order"
        (confirm)="updateStatus('cancelled')"
        (cancel)="showCancelConfirm.set(false)"
      />
    </div>
  `
})
export class OrderDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  readonly router = inject(Router);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly showCancelConfirm = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  private loadOrder(id: string): void {
    this.http.get<Order>(`${this.apiService.baseUrl}/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusVariant(status: string): 'warning' | 'success' | 'info' | 'danger' | 'default' {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'shipped': return 'info';
      case 'received': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  }

  updateStatus(newStatus: string): void {
    this.showCancelConfirm.set(false);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.patch<Order>(`${this.apiService.baseUrl}/orders/${id}/status`, { status: newStatus }).subscribe({
      next: (res) => {
        this.order.set(res);
      }
    });
  }

  confirmCancel(): void {
    this.showCancelConfirm.set(true);
  }
}
