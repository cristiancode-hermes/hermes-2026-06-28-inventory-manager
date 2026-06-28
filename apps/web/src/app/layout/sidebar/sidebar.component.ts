import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-white dark:bg-gray-900 border-r border-neutral-200 dark:border-gray-700 flex flex-col h-full">
      <div class="p-4 border-b border-neutral-200 dark:border-gray-700">
        <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">Inventory</h1>
      </div>
      <nav class="flex-1 py-4 overflow-y-auto">
        <ul class="space-y-1 px-3">
          <li>
            <a routerLink="/dashboard" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/products" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              Products
            </a>
          </li>
          <li>
            <a routerLink="/warehouses" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              Warehouses
            </a>
          </li>
          <li>
            <a routerLink="/suppliers" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Suppliers
            </a>
          </li>
          <li>
            <a routerLink="/orders" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
              Orders
              <span class="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full" [class.hidden]="alertsCount === 0">{{ alertsCount }}</span>
            </a>
          </li>
          <li>
            <a routerLink="/transactions" routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              Transactions
            </a>
          </li>
        </ul>
      </nav>
      <div class="p-4 border-t border-neutral-200 dark:border-gray-700">
        <a routerLink="/settings" routerLinkActive="text-primary-600"
           class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Settings
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  alertsCount = 0;
}
