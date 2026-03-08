import { Component, signal } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';
import { EscClosableDirective } from '../../shared/directives/esc-closable.directive';

@Component({
  selector: 'app-landing',
  imports: [NavbarComponent, LoginComponent, RegisterComponent,EscClosableDirective],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  showLogin = signal(false);
  showRegister = signal(false);

  openLogin(): void {
    this.showRegister.set(false);
    this.showLogin.set(true);
  }

  openRegister(): void {
    this.showLogin.set(false);
    this.showRegister.set(true);
  }

  closeOverlay(): void {
    this.showLogin.set(false);
    this.showRegister.set(false);
  }
}
