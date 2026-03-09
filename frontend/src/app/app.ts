import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { EscClosableDirective } from './shared/directives/esc-closable.directive';
import { AuthModalService } from './core/services/auth-modal.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, LoginComponent, RegisterComponent, EscClosableDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public authModal: AuthModalService) {}

  onLoginClick(): void {
    this.authModal.openLogin();
  }

  openRegister(): void {
    this.authModal.openRegister();
  }

  closeOverlay(): void {
    this.authModal.close();
  }
}
