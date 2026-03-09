import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {PublicUser,RegisterRequest,AuthResponse,LoginRequest} from '../models/auth.model';
import { ApiConfigService } from './api-config.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use signal for current user state
  private readonly _currentUser = signal<PublicUser | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);
  
  // Public read-only signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    // Check if user is already authenticated (cookie-based)
    this.getCurrentUser().subscribe({
      next: (response) => {
        this._currentUser.set(response.user);
        this._isAuthenticated.set(true);
      },
      error: () => {
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
      }
    });
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiConfig.getApiUrl('/auth/register'), userData, {
      withCredentials: true // Important for cookies
    }).pipe(
      tap(response => {
        this._currentUser.set(response.user);
        this._isAuthenticated.set(true);
      }),
      catchError(this.handleError)
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiConfig.getApiUrl('/auth/login'), credentials, {
      withCredentials: true // Important for cookies
    }).pipe(
      tap(response => {
        this._currentUser.set(response.user);
        this._isAuthenticated.set(true);
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiConfig.getApiUrl('/auth/logout'), {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this._currentUser.set(null);
        this._isAuthenticated.set(false);
      }),
      catchError(this.handleError)
    );
  }

  private getCurrentUser(): Observable<{ user: PublicUser }> {
    return this.http.get<{ user: PublicUser }>(this.apiConfig.getApiUrl('/auth/me'), {
      withCredentials: true
    });
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}