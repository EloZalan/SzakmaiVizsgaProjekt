import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html'
})
export class LoginPageComponent {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onLogin(form: NgForm): void {
    this.errorMessage = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.auth.getHomeRouteByRole());
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 422) {
          this.errorMessage = 'Hibás vagy hiányzó adatok.';
        } else if (err.status === 401) {
          this.errorMessage = 'Hibás email vagy jelszó.';
        } else {
          this.errorMessage = 'Sikertelen bejelentkezés.';
        }
      }
    });
  }
}