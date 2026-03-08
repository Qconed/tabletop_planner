import { Component, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string>('');
  
  switchToLogin = output<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      const { confirmPassword, ...registerData } = this.registerForm.value;
      const userData: RegisterRequest = registerData;
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          console.log('Registration successful:', response.message);
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message);
        }
      });
    }
  }
}