import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Overlay -->
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/40 z-50" (click)="close()"></div>
      <!-- Modal -->
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-24">
        <div class="bg-white dark:bg-gray-900 w-full max-w-xl rounded-xl shadow-2xl border border-neutral-200 dark:border-gray-700 overflow-hidden">
          <div class="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-gray-700">
            <svg class="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              [(ngModel)]="query"
              (input)="onSearch()"
              placeholder="Search products, orders, warehouses..."
              class="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-secondary-400"
              autofocus
            />
            <kbd class="hidden sm:inline-flex items-center px-2 py-1 text-xs text-secondary-400 bg-secondary-100 dark:bg-gray-800 rounded">ESC</kbd>
          </div>
          <div class="max-h-96 overflow-y-auto p-2">
            @if (loading) {
              <div class="p-4 text-center text-sm text-secondary-400">Searching...</div>
            } @else if (results.length === 0 && query.length > 0) {
              <div class="p-4 text-center text-sm text-secondary-400">No results found</div>
            } @else {
              @for (group of groupedResults; track group.label) {
                <div class="px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">{{ group.label }}</div>
                @for (item of group.items; track item.id) {
                  <button
                    (click)="navigateTo(item)"
                    class="w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-900 dark:text-neutral-100 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <span class="flex-1">{{ item.name }}</span>
                    <span class="text-xs text-secondary-400">{{ item.type }}</span>
                  </button>
                }
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class GlobalSearchComponent {
  isOpen = false;
  query = '';
  loading = false;
  results: Array<{ id: string; name: string; type: string }> = [];
  groupedResults: Array<{ label: string; items: Array<{ id: string; name: string; type: string }> }> = [];

  constructor(private router: Router) {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(): void {
    this.isOpen = true;
    this.query = '';
    this.results = [];
    this.groupedResults = [];
  }

  close(): void {
    this.isOpen = false;
  }

  onSearch(): void {
    // Placeholder - actual search would hit /api/search
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.results = [];
      this.groupedResults = [];
    }, 300);
  }

  navigateTo(item: { id: string; name: string; type: string }): void {
    this.close();
    const routeMap: Record<string, string> = {
      product: '/products',
      order: '/orders',
      warehouse: '/warehouses',
      supplier: '/suppliers'
    };
    const base = routeMap[item.type] || '/dashboard';
    this.router.navigate([base, item.id]);
  }
}
