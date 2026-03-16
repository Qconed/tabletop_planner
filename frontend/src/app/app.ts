import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
  isWorkspaceRoute = signal(false);

  constructor(public authModal: AuthModalService, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const isWorkspace = event.urlAfterRedirects.startsWith('/festivals/') && event.urlAfterRedirects !== '/festivals';
      this.isWorkspaceRoute.set(isWorkspace);
    });
  }

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
