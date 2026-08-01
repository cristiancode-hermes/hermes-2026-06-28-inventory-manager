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
<h1 class="heading-1 text-text-primary dark:text-text-primary-dark">Settings</h1>

<div class="bg-surface-card dark:bg-surface-card-dark rounded-btn border border-border dark:border-border-dark p-6">
<h2 class="heading-2 text-text-primary dark:text-text-primary-dark mb-4">Profile</h2>

@if (loading()) {
<div class="space-y-3">
<div class="h-10 skeleton w-64"></div>
<div class="h-10 skeleton w-64"></div>
</div>
} @else {
<div class="space-y-4 max-w-md">
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Name</label>
<input
type="text"
[(ngModel)]="userName"
class="w-full border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent outline-none"
/>
</div>
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Email</label>
<input
type="email"
[(ngModel)]="userEmail"
class="w-full border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent outline-none"
/>
</div>
<div class="pt-4">
<button (click)="saveProfile()" class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent rounded-btn transition-colors">Save Changes</button>
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
