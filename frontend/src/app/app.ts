import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { UserDashboardComponent } from './features/user-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LoginComponent, RegisterComponent, UserDashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Tabletop Planner');
  protected readonly showRegister = signal(false);

  constructor(public authService: AuthService) {}

  switchToRegister(): void {
    this.showRegister.set(true);
  }

  switchToLogin(): void {
    this.showRegister.set(false);
  }
}
