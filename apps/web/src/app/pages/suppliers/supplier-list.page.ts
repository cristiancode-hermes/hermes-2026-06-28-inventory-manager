import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/api.service';
import { Supplier } from '../../models';
import { BadgeComponent } from '../../shared/badge/badge.component';

@Component({
  selector: 'app-supplier-list-page',
  standalone: true,
  imports: [BadgeComponent],
  template: `
<div class="space-y-6">
<div class="flex items-center justify-between">
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Suppliers</h1>
</div>

@if (loading()) {
<div class="space-y-3">
@for (i of [1,2,3,4]; track i) {
<div class="h-16 skeleton rounded-btn"></div>
}
</div>
} @else {
<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark overflow-hidden">
<table class="w-full">
<thead>
<tr class="bg-accent-light dark:bg-surface-card-dark">
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</th>
<th class="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
</tr>
</thead>
<tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
@for (s of suppliers(); track s.id) {
<tr class="hover:bg-accent-light dark:hover:bg-surface-card-dark/50 transition-colors">
<td class="px-4 py-3 text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ s.name }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ s.contactName }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ s.email }}</td>
<td class="px-4 py-3 text-sm text-text-primary dark:text-text-primary-dark">{{ s.phone }}</td>
<td class="px-4 py-3">
<app-badge [variant]="s.status === 'active' ? 'success' : 'danger'">{{ s.status }}</app-badge>
</td>
</tr>
}
</tbody>
</table>
</div>
}
</div>
`
})
export class SupplierListPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.http.get<Supplier[]>(`${this.api.baseUrl}/suppliers`).subscribe({
      next: (res) => {
        this.suppliers.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
