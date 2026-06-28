import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = 'http://localhost:3000/api';

  get headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('token');
    if (token) {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }
}
