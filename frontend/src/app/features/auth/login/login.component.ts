import { Component, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService} from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  switchToRegister = output<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const loginData: LoginRequest = this.loginForm.value;
      
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          console.log('Login successful:', response.message);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message);
        }
      });
    }
  }
}