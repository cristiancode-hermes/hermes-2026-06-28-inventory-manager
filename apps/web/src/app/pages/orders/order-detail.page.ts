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
<button (click)="router.navigate(['/orders'])" class="text-sm text-accent dark:text-accent hover:underline mb-1">&larr; Back to Orders</button>
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Order #{{ order()?.id?.substring(0, 8) || 'Loading...' }}</h1>
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
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<label class="block text-sm font-medium text-text-secondary mb-1">Supplier</label>
<p class="text-text-primary dark:text-text-primary-dark">{{ o.supplierName }}</p>
</div>
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<label class="block text-sm font-medium text-text-secondary mb-1">Status</label>
<app-badge [variant]="statusVariant(o.status)">{{ o.status }}</app-badge>
</div>
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<label class="block text-sm font-medium text-text-secondary mb-1">Expected Date</label>
<p class="text-text-primary dark:text-text-primary-dark">{{ o.expectedDate | date:'mediumDate' }}</p>
</div>
</div>

@if (o.notes) {
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<label class="block text-sm font-medium text-text-secondary mb-1">Notes</label>
<p class="text-text-primary dark:text-text-primary-dark">{{ o.notes }}</p>
</div>
}

<!-- Items -->
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark ">
<div class="px-6 py-4 border-b border-border dark:border-border-dark">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark">Items</h2>
</div>
<div class="p-4">
<table class="w-full">
<thead>
<tr class="bg-accent-light dark:bg-surface-card-dark">
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Ordered</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Received</th>
</tr>
</thead>
<tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
@for (item of o.items; track item.id) {
<tr>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ item.productName }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ item.quantityOrdered }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ item.quantityReceived }}</td>
</tr>
}
</tbody>
</table>
</div>
</div>

<!-- Status Actions -->
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark mb-4">Update Status</h2>
<div class="flex items-center gap-2 flex-wrap">
@if (o.status === 'pending') {
<button (click)="updateStatus('approved')" class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent rounded-btn transition-colors">Approve</button>
<button (click)="confirmCancel()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-btn transition-colors">Cancel</button>
}
@if (o.status === 'approved') {
<button (click)="updateStatus('shipped')" class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent rounded-btn transition-colors">Mark as Shipped</button>
}
@if (o.status === 'shipped') {
<button (click)="updateStatus('received')" class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-btn transition-colors">Mark as Received</button>
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
