import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ThemeToggleComponent],
  template: `
    <header class="h-16 bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div class="flex items-center gap-4">
        <button (click)="onToggleSidebar()" class="lg:hidden p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-gray-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <button (click)="onOpenSearch()" class="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary-400 bg-secondary-50 dark:bg-gray-800 rounded-lg border border-neutral-200 dark:border-gray-700 hover:border-secondary-300 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span class="hidden sm:inline">Search...</span>
          <kbd class="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 rounded border border-neutral-200 dark:border-gray-600">⌘K</kbd>
        </button>
      </div>
      <div class="flex items-center gap-3">
        <app-theme-toggle />
        <div class="relative" #menu>
          <button (click)="isMenuOpen = !isMenuOpen" class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
            <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              {{ userInitials }}
            </div>
            <span class="hidden md:block text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ userName }}</span>
            <svg class="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          @if (isMenuOpen) {
            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-neutral-200 dark:border-gray-700 py-1 z-50">
              <a routerLink="/settings" class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-secondary-50 dark:hover:bg-gray-800">Settings</a>
              <hr class="border-neutral-200 dark:border-gray-700">
              <button (click)="onLogout()" class="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20">Sign out</button>
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
