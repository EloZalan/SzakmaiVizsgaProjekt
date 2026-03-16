import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-waiter-user-data',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './waiter-user-data.html',
  styleUrl: '../../../style.css',
})
export class WaiterUserDataComponent {
  email = '';
  name = '';
  password = '';
  passwordConfirmation = '';
  isEditMode = false;
  loading = false;
  message = '';

  constructor(public auth: AuthService, private router: Router) {
    this.syncFromAuth();
  }

  private syncFromAuth(): void {
    if (this.auth.user) {
      this.email = this.auth.user.email;
      this.name = this.auth.user.name;
    }
  }

  enterEditMode(): void {
    this.message = '';
    this.password = '';
    this.passwordConfirmation = '';
    this.isEditMode = true;
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.message = '';
    this.password = '';
    this.passwordConfirmation = '';
    this.syncFromAuth();
  }

  save(form: NgForm): void {
    if (!this.isEditMode || this.loading) {
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.password && this.password !== this.passwordConfirmation) {
      this.message = 'A két jelszó nem egyezik.';
      return;
    }

    this.loading = true;
    this.message = '';
    const payload: { email?: string; password?: string; password_confirmation?: string } = {};
    if (this.email && this.email !== this.auth.user?.email) payload.email = this.email;
    if (this.password) {
      payload.password = this.password;
      payload.password_confirmation = this.passwordConfirmation;
    }

    if (Object.keys(payload).length === 0) {
      this.loading = false;
      this.message = 'Nincs módosítás.';
      this.isEditMode = false;
      return;
    }

    this.auth.updateUser(payload).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Sikeres mentés.';
        this.isEditMode = false;
        this.password = '';
        this.passwordConfirmation = '';
        this.syncFromAuth();
      },
      error: (err) => {
        this.loading = false;
        this.message = 'Mentés sikertelen.';
        console.error('UPDATE USER ERROR', err);
      }
    });
  }

  startShift(): void {
    if (this.loading || this.auth.isOnShift) {
      return;
    }

    this.loading = true;
    this.message = '';

    this.auth.takeShift().subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/waiter');
      },
      error: (err) => {
        this.loading = false;
        this.message = 'Műszak felvétele sikertelen.';
        console.error('TAKE SHIFT ERROR', err);
      }
    });
  }

  goToWaiterPage(): void {
    this.router.navigateByUrl('/waiter');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
