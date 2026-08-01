import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)] px-4">
<div class="w-full max-w-md">
<div class="text-center mb-8">
<h1 class="text-3xl font-bold text-accent dark:text-accent">Inventory Manager</h1>
<p class="mt-2 text-text-secondary">Create your account</p>
</div>
<div class="bg-surface-card dark:bg-surface-card-dark rounded-card border border-border dark:border-border-dark p-8">
@if (error()) {
<div class="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-btn">{{ error() }}</div>
}
<form (ngSubmit)="onSubmit()" class="space-y-4">
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Name</label>
<input
type="text"
[(ngModel)]="name"
name="name"
required
class="w-full border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent focus:border-accent outline-none"
/>
</div>
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Email</label>
<input
type="email"
[(ngModel)]="email"
name="email"
required
class="w-full border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent focus:border-accent outline-none"
placeholder="you@company.com"
/>
</div>
<div>
<label class="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">Password</label>
<input
type="password"
[(ngModel)]="password"
name="password"
required
class="w-full border border-border dark:border-border-dark rounded-btn px-3 py-2 text-sm bg-surface-card dark:bg-surface-card-dark text-text-primary dark:text-text-primary-dark focus:ring-2 focus:ring-accent focus:border-accent outline-none"
/>
</div>
<button
type="submit"
[disabled]="loading()"
class="w-full px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
{{ loading() ? 'Creating account...' : 'Create account' }}
</button>
</form>
<p class="mt-4 text-center text-sm text-text-secondary">
Already have an account?
<a routerLink="/login" class="text-accent dark:text-accent hover:underline">Sign in</a>
</p>
</div>
</div>
</div>
`
})
export class RegisterPage {
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.name() || !this.email() || !this.password()) {
      this.error.set('Please fill in all fields');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.register({ name: this.name(), email: this.email(), password: this.password() }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      }
    });
  }
}
