import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  private _showLogin = signal(false);
  private _showRegister = signal(false);

  showLogin = this._showLogin.asReadonly();
  showRegister = this._showRegister.asReadonly();

  openLogin(): void {
    this._showRegister.set(false);
    this._showLogin.set(true);
  }

  openRegister(): void {
    this._showLogin.set(false);
    this._showRegister.set(true);
  }

  close(): void {
    this._showLogin.set(false);
    this._showRegister.set(false);
  }
}
