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
<div class="bg-surface-card dark:bg-surface-card-dark w-full max-w-xl rounded-card border border-border dark:border-border-dark overflow-hidden">
<div class="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-border-dark">
<svg class="w-5 h-5 text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
</svg>
<input
[(ngModel)]="query"
(input)="onSearch()"
placeholder="Search products, orders, warehouses..."
class="flex-1 bg-transparent border-none outline-none text-sm text-text-primary dark:text-text-primary-dark placeholder:text-text-secondary-dark"
autofocus
/>
<kbd class="hidden sm:inline-flex items-center px-2 py-1 text-xs text-text-secondary-dark bg-accent-light dark:bg-surface-card-dark rounded">ESC</kbd>
</div>
<div class="max-h-96 overflow-y-auto p-2">
@if (loading) {
<div class="p-4 text-center text-sm text-text-secondary-dark">Searching...</div>
} @else if (results.length === 0 && query.length > 0) {
<div class="p-4 text-center text-sm text-text-secondary-dark">No results found</div>
} @else {
@for (group of groupedResults; track group.label) {
<div class="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">{{ group.label }}</div>
@for (item of group.items; track item.id) {
<button
(click)="navigateTo(item)"
class="w-full text-left px-3 py-2 rounded-btn text-sm text-text-primary dark:text-text-primary-dark hover:bg-accent-light dark:hover:bg-surface-card-dark transition-colors flex items-center gap-3"
>
<span class="flex-1">{{ item.name }}</span>
<span class="text-xs text-text-secondary-dark">{{ item.type }}</span>
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
