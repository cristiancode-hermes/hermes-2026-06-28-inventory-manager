import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AuthGuard } from './auth.guard';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [DummyComponent],
      providers: [
        AuthGuard,
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent },
        ]),
      ],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('should allow activation when token exists', () => {
    localStorage.setItem('token', 'valid-token');

    const result = guard.canActivate();

    expect(result).toBe(true);
  });

  it('should redirect to /login when no token', () => {
    const result = guard.canActivate();

    expect(result).not.toBe(true);
    expect(router.parseUrl('/login')).toBeTruthy();
  });
});
