import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { User } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated when no token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  describe('login', () => {
    it('should store token and user on successful login', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
      };

      const responsePromise = firstValueFrom(
        service.login({ email: 'test@test.com', password: 'password123' }),
      );

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      const result = await responsePromise;
      expect(result.token).toBe('jwt-token-123');
      expect(result.user.name).toBe('Test User');
      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('register', () => {
    it('should store token and user on successful registration', async () => {
      const mockResponse = {
        token: 'jwt-token-456',
        user: { id: 2, email: 'new@test.com', name: 'New User' },
      };

      const responsePromise = firstValueFrom(
        service.register({
          email: 'new@test.com',
          name: 'New User',
          password: 'password123',
        }),
      );

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      const result = await responsePromise;
      expect(result.token).toBe('jwt-token-456');
      expect(localStorage.getItem('token')).toBe('jwt-token-456');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear token and user', () => {
      localStorage.setItem('token', 'some-token');
      (service as any).tokenSignal.set('some-token');
      (service as any).userSignal.set({ id: '1', email: 'test@test.com', name: 'Test User', createdAt: '' } as User);

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('getMe', () => {
    it('should fetch user profile and update currentUser', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: 'Test User' };

      const responsePromise = firstValueFrom(service.getMe());

      const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      const result = await responsePromise;
      expect(result.email).toBe('test@test.com');
      expect(service.currentUser()?.name).toBe('Test User');
    });

    it('should logout on 401 error', async () => {
      localStorage.setItem('token', 'expired-token');

      const responsePromise = firstValueFrom(service.getMe());

      const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      await expect(responsePromise).rejects.toThrow();
      expect(localStorage.getItem('token')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
