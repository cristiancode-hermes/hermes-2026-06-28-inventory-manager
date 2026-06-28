import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginPayload, RegisterPayload } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem('token'));
  private readonly userSignal = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly currentUser = computed(() => this.userSignal());

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {
    if (this.tokenSignal()) {
      this.getMe().subscribe();
    }
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api.baseUrl}/auth/login`, payload).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.tokenSignal.set(res.token);
        this.userSignal.set(res.user);
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api.baseUrl}/auth/register`, payload).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.tokenSignal.set(res.token);
        this.userSignal.set(res.user);
      })
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.api.baseUrl}/auth/me`).pipe(
      tap(user => this.userSignal.set(user)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}
