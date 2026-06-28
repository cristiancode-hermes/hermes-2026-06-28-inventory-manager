import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { Warehouse } from '../../models';

@Component({
  selector: 'app-warehouse-list-page',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Warehouses</h1>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="h-40 skeleton rounded-lg"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (wh of warehouses(); track wh.id) {
            <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ wh.name }}</h3>
                  <p class="text-sm text-secondary-500">{{ wh.location }}</p>
                </div>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary-500">Capacity</span>
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ wh.currentLoad }} / {{ wh.capacity }}</span>
                </div>
                <div class="w-full bg-neutral-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    [class.bg-success-500]="usagePercent(wh) < 70"
                    [class.bg-warning-500]="usagePercent(wh) >= 70 && usagePercent(wh) < 90"
                    [class.bg-danger-500]="usagePercent(wh) >= 90"
                    [style.width.%]="usagePercent(wh)"
                  ></div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class WarehouseListPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  readonly warehouses = signal<Warehouse[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.http.get<Warehouse[]>(`${this.api.baseUrl}/warehouses`).subscribe({
      next: (res) => {
        this.warehouses.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  usagePercent(wh: Warehouse): number {
    if (wh.capacity === 0) return 0;
    return Math.round((wh.currentLoad / wh.capacity) * 100);
  }
}
