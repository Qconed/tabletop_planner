import { Component, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  loginClick = output<void>();
  
  constructor(public authService: AuthService) {}

  onLoginClick(): void {
    this.loginClick.emit();
  }

  onLogoutClick(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (err) => {
        console.error('Logout error:', err);
      }
    });
  }
}
