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
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Warehouses</h1>
</div>

@if (loading()) {
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
@for (i of [1,2,3]; track i) {
<div class="h-40 skeleton rounded-btn"></div>
}
</div>
} @else {
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
@for (wh of warehouses(); track wh.id) {
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6 hover:transition-">
<div class="flex items-start justify-between mb-4">
<div>
<h3 class="heading-2 text-text-primary dark:text-text-primary-dark">{{ wh.name }}</h3>
<p class="text-sm text-text-secondary">{{ wh.location }}</p>
</div>
</div>
<div class="space-y-3">
<div class="flex justify-between text-sm">
<span class="text-text-secondary">Capacity</span>
<span class="font-medium text-text-primary dark:text-text-primary-dark">{{ wh.currentLoad }} / {{ wh.capacity }}</span>
</div>
<div class="w-full bg-border dark:bg-surface-card-dark rounded-badge h-2">
<div
class="h-2 rounded-badge transition-all"
[class.bg-green-600]="usagePercent(wh) < 70"
[class.bg-amber-500]="usagePercent(wh) >= 70 && usagePercent(wh) < 90"
[class.bg-red-600]="usagePercent(wh) >= 90"
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
