import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { GlobalSearchComponent } from '../global-search/global-search.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, GlobalSearchComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-[var(--color-bg-page)]">
      <!-- Sidebar - hidden on mobile by default -->
      <div
        class="fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:relative lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen"
        [class.translate-x-0]="sidebarOpen"
      >
        <app-sidebar />
      </div>
      <!-- Mobile overlay -->
      @if (sidebarOpen) {
        <div class="fixed inset-0 bg-black/40 z-30 lg:hidden" (click)="sidebarOpen = false"></div>
      }
      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <app-header />
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
      <!-- Global search overlay -->
      <app-global-search #globalSearch />
    </div>
  `
})
export class MainLayoutComponent {
  sidebarOpen = false;

  constructor() {
    window.addEventListener('toggle-sidebar', () => {
      this.sidebarOpen = !this.sidebarOpen;
    });
    window.addEventListener('open-global-search', () => {
      // Dispatch a custom event that global-search listens to
      window.dispatchEvent(new CustomEvent('open-search'));
    });
  }
}
