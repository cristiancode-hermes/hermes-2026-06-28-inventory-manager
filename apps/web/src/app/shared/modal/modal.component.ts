import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/40" (click)="close.emit()"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          @if (title()) {
            <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ title() }}</h3>
              <button (click)="close.emit()" class="p-1 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-gray-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }
          <div class="px-6 py-4">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  readonly isOpen = input(false);
  readonly title = input('');
  readonly close = output<void>();
}
