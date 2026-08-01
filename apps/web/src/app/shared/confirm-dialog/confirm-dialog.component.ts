import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  template: `
<app-modal [isOpen]="isOpen()" [title]="title()" (close)="cancel.emit()">
<p class="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">{{ message() }}</p>
<div class="flex justify-end gap-3">
<button (click)="cancel.emit()" class="px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-secondary-dark bg-surface-card dark:bg-surface-card-dark border border-border dark:border-border-dark rounded-btn hover:bg-accent-light dark:hover:bg-surface-card-dark transition-colors">
Cancel
</button>
<button (click)="confirm.emit()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-btn transition-colors">
{{ confirmText() }}
</button>
</div>
</app-modal>
`
})
export class ConfirmDialogComponent {
  readonly isOpen = input(false);
  readonly title = input('Confirm');
  readonly message = input('Are you sure?');
  readonly confirmText = input('Delete');
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
