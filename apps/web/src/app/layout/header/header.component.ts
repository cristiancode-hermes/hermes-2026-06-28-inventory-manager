import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent],
  template: `
<header class="h-16 bg-surface-card dark:bg-surface-card-dark border-b border-border dark:border-border-dark flex items-center justify-between px-6">
<div class="flex items-center gap-4">
<button (click)="onToggleSidebar()" class="lg:hidden p-2 rounded-btn text-text-secondary hover:bg-accent-light dark:hover:bg-surface-card-dark">
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
</svg>
</button>
<button (click)="onOpenSearch()" class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary-dark bg-accent-light dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark hover:border-accent transition-colors">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
</svg>
<span class="hidden sm:inline">Search...</span>
<kbd class="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-surface-card dark:bg-surface-card-dark rounded border border-border dark:border-border-dark">⌘K</kbd>
</button>
</div>
<div class="flex items-center gap-3">
<app-theme-toggle />
<div class="relative" #menu>
<button (click)="isMenuOpen = !isMenuOpen" class="flex items-center gap-2 px-3 py-1.5 rounded-btn hover:bg-accent-light dark:hover:bg-surface-card-dark transition-colors">
<div class="w-8 h-8 rounded-badge bg-accent flex items-center justify-center text-white text-sm font-medium">
{{ userInitials }}
</div>
<span class="hidden md:block text-sm font-medium text-text-primary dark:text-text-primary-dark">{{ userName }}</span>
<svg class="w-4 h-4 text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
</svg>
</button>
@if (isMenuOpen) {
<div class="absolute right-0 mt-2 w-48 bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark py-1 z-50">
<a routerLink="/settings" class="block px-4 py-2 text-sm text-text-primary dark:text-text-primary-dark hover:bg-accent-light dark:hover:bg-surface-card-dark">Settings</a>
<hr class="border-border dark:border-border-dark">
<button (click)="onLogout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">Sign out</button>
</div>
}
</div>
</div>
</header>
`
})
export class HeaderComponent {
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get userName(): string {
    return this.authService.currentUser()?.name || 'User';
  }

  get userInitials(): string {
    const name = this.authService.currentUser()?.name || 'User';
    const parts = name.split(' ').filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  onToggleSidebar(): void {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }

  onOpenSearch(): void {
    window.dispatchEvent(new CustomEvent('open-global-search'));
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
