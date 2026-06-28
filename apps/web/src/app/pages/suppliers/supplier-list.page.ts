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
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Suppliers</h1>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-16 skeleton rounded-lg"></div>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-secondary-50 dark:bg-gray-800">
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Email</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-gray-700">
              @for (s of suppliers(); track s.id) {
                <tr class="hover:bg-secondary-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ s.name }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ s.contactName }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ s.email }}</td>
                  <td class="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">{{ s.phone }}</td>
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
