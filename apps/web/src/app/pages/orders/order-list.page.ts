import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { OrderListResponse, Order } from '../../models';
import { BadgeComponent } from '../../shared/badge/badge.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-order-list-page',
  standalone: true,
  imports: [FormsModule, BadgeComponent, PaginationComponent, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Orders</h1>
        <a routerLink="/orders/new" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">New Order</a>
      </div>

      <!-- Status filter -->
      <div class="flex items-center gap-2">
        @for (status of statuses; track status.value) {
          <button
            (click)="filterByStatus(status.value)"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
            [class.bg-primary-500]="selectedStatus() === status.value"
            [class.text-white]="selectedStatus() === status.value"
            [class.border-primary-500]="selectedStatus() === status.value"
            [class.bg-white]="selectedStatus() !== status.value"
            [class.dark:bg-gray-800]="selectedStatus() !== status.value"
            [class.border-neutral-300]="selectedStatus() !== status.value"
            [class.dark:border-gray-600]="selectedStatus() !== status.value"
            [class.text-secondary-600]="selectedStatus() !== status.value"
            [class.dark:text-secondary-400]="selectedStatus() !== status.value"
          >
            {{ status.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-16 skeleton rounded-lg"></div>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-secondary-50 dark:bg-gray-800">
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Order</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Supplier</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Expected</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Items</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-secondary-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" (click)="goToOrder(order.id)">
                  <td class="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">#{{ order.id.substring(0, 8) }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ order.supplierName }}</td>
                  <td class="px-4 py-3">
                    <app-badge [variant]="statusVariant(order.status)">{{ order.status }}</app-badge>
                  </td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ order.expectedDate | date:'mediumDate' }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ order.items?.length || 0 }}</td>
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
export class OrderListPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private router = inject(Router);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly selectedStatus = signal('');

  readonly statuses = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    let url = `${this.api.baseUrl}/orders?page=${this.currentPage()}&limit=10`;
    if (this.selectedStatus()) {
      url += `&status=${this.selectedStatus()}`;
    }
    this.http.get<OrderListResponse>(url).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
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

  goToOrder(id: string): void {
    this.router.navigate(['/orders', id]);
  }
}
