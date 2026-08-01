import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
@if (isOpen()) {
<div class="fixed inset-0 z-50 flex items-center justify-center">
<div class="fixed inset-0 bg-black/40" (click)="close.emit()"></div>
<div class="relative bg-surface-card dark:bg-surface-card-dark rounded-card border border-border dark:border-border-dark w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
@if (title()) {
<div class="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark">
<h3 class="heading-2 text-text-primary dark:text-text-primary-dark">{{ title() }}</h3>
<button (click)="close.emit()" class="p-1 rounded-btn text-text-secondary-dark hover:bg-accent-light dark:hover:bg-surface-card-dark">
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
