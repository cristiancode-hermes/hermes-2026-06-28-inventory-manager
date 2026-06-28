import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;

  const createMockAuth = () => ({
    login: vi.fn(),
    isAuthenticated: vi.fn(),
  });

  let authService: ReturnType<typeof createMockAuth>;

  beforeEach(async () => {
    authService = createMockAuth();

    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([
          { path: 'dashboard', component: LoginPage },
        ]),
        provideHttpClient(),
        { provide: AuthService, useValue: authService },
      ],
    });

    await TestBed.compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should show error when submitting with empty fields', () => {
    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;

    component.onSubmit();

    expect(component.error()).toBe('Please fill in all fields');
    expect(component.loading()).toBe(false);
  });

  it('should call authService.login on valid submission', () => {
    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;

    component.email.set('test@test.com');
    component.password.set('password123');
    authService.login.mockReturnValue(of({ token: 'jwt', user: { id: 1, email: 'test@test.com', name: 'Test' } } as any));

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });

  it('should set error on login failure', () => {
    const fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;

    component.email.set('test@test.com');
    component.password.set('wrong');
    authService.login.mockReturnValue(throwError(() => ({
      error: { message: 'Invalid credentials' },
    })));

    component.onSubmit();

    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });
});
