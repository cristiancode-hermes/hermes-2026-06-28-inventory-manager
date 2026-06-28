import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>

      <div class="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm p-6">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Profile</h2>
        
        @if (loading()) {
          <div class="space-y-3">
            <div class="h-10 skeleton w-64"></div>
            <div class="h-10 skeleton w-64"></div>
          </div>
        } @else {
          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Name</label>
              <input
                type="text"
                [(ngModel)]="userName"
                class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                [(ngModel)]="userEmail"
                class="w-full border border-neutral-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div class="pt-4">
              <button (click)="saveProfile()" class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">Save Changes</button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SettingsPage implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  readonly loading = signal(true);
  readonly userName = signal('');
  readonly userEmail = signal('');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.userName.set(user.name);
      this.userEmail.set(user.email);
      this.loading.set(false);
    } else {
      this.http.get<User>(`${this.api.baseUrl}/auth/me`).subscribe({
        next: (res) => {
          this.userName.set(res.name);
          this.userEmail.set(res.email);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  saveProfile(): void {
    alert('Profile saved (placeholder)');
  }
}
