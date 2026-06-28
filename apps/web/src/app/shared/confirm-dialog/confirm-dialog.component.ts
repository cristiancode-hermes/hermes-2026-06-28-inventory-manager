import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="title()" (close)="cancel.emit()">
      <p class="text-sm text-secondary-600 dark:text-secondary-400 mb-6">{{ message() }}</p>
      <div class="flex justify-end gap-3">
        <button (click)="cancel.emit()" class="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-white dark:bg-gray-800 border border-neutral-300 dark:border-gray-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button (click)="confirm.emit()" class="px-4 py-2 text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors">
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
