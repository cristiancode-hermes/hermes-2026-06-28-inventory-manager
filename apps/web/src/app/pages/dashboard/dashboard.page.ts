import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardData, StockAlert, Order } from '../../models';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../shared/badge/badge.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [KpiCardComponent, BadgeComponent],
  template: `
<div class="space-y-6">
<div class="flex items-center justify-between">
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Dashboard</h1>
</div>

<!-- KPI Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<app-kpi-card
label="Total Products"
[value]="data()?.totalProducts?.toString() ?? '0'"
[loading]="loading()"
/>
<app-kpi-card
label="Warehouses"
[value]="data()?.totalWarehouses?.toString() ?? '0'"
[loading]="loading()"
/>
<app-kpi-card
label="Suppliers"
[value]="data()?.totalSuppliers?.toString() ?? '0'"
[loading]="loading()"
/>
<app-kpi-card
label="Orders"
[value]="data()?.totalOrders?.toString() ?? '0'"
[loading]="loading()"
/>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
<!-- Low Stock Alerts -->
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark ">
<div class="px-6 py-4 border-b border-border dark:border-border-dark">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark">Low Stock Alerts</h2>
</div>
<div class="p-4">
@if (loading()) {
<div class="space-y-3">
@for (i of [1,2,3]; track i) {
<div class="h-12 skeleton"></div>
}
</div>
} @else if (alerts().length === 0) {
<p class="text-sm text-text-secondary text-center py-8">No low stock alerts</p>
} @else {
<div class="space-y-2">
@for (alert of alerts(); track alert.productId + '-' + alert.warehouseId) {
<div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-btn">
<div>
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ alert.productName }}</p>
<p class="text-xs text-text-secondary">{{ alert.warehouseName }}</p>
</div>
<div class="text-right">
<p class="text-sm font-semibold text-red-600">{{ alert.currentStock }} / {{ alert.reorderPoint }}</p>
<p class="text-xs text-text-secondary">Stock / Min</p>
</div>
</div>
}
</div>
}
</div>
</div>

<!-- Recent Orders -->
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark ">
<div class="px-6 py-4 border-b border-border dark:border-border-dark">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark">Recent Orders</h2>
</div>
<div class="p-4">
@if (loading()) {
<div class="space-y-3">
@for (i of [1,2,3]; track i) {
<div class="h-12 skeleton"></div>
}
</div>
} @else if (recentOrders().length === 0) {
<p class="text-sm text-text-secondary text-center py-8">No recent orders</p>
} @else {
<div class="space-y-2">
@for (order of recentOrders(); track order.id) {
<div class="flex items-center justify-between p-3 hover:bg-accent-light dark:hover:bg-surface-card-dark rounded-btn cursor-pointer transition-colors" (click)="goToOrder(order.id)">
<div>
<p class="text-sm font-medium text-text-primary dark:text-text-primary-dark">Order #{{ order.id.substring(0, 8) }}</p>
<p class="text-xs text-text-secondary">{{ order.supplierName }}</p>
</div>
<app-badge [variant]="orderStatusVariant(order.status)">{{ order.status }}</app-badge>
</div>
}
</div>
}
</div>
</div>
</div>
</div>
`
})
export class DashboardPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private router = inject(Router);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly alerts = signal<StockAlert[]>([]);
  readonly recentOrders = signal<Order[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.http.get<DashboardData>(`${this.api.baseUrl}/stock/dashboard`).subscribe({
      next: (res) => {
        this.data.set(res);
        this.alerts.set(res.lowStockAlerts || []);
        this.recentOrders.set(res.recentOrders || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load dashboard data');
      }
    });
  }

  orderStatusVariant(status: string): 'warning' | 'success' | 'info' | 'danger' | 'default' {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'shipped': return 'info';
      case 'received': return 'success';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  }

  goToOrder(id: string): void {
    this.router.navigate(['/orders', id]);
  }
}
