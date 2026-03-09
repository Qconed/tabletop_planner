import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-dashboard.component.html' ,
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent {
  isLoggingOut = signal(false);
  errorMessage = signal<string>('');

  constructor(public authService: AuthService) {}

  logout(): void {
    this.isLoggingOut.set(true);
    this.errorMessage.set('');
    
    this.authService.logout().subscribe({
      next: (response) => {
        this.isLoggingOut.set(false);
        console.log('Logout successful:', response.message);
      },
      error: (error) => {
        this.isLoggingOut.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }

  formatDate(dateString: Date | string | undefined): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}