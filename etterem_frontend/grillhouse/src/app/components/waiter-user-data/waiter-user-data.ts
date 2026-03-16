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

  save(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload: any = { };
    if (this.email && this.email !== this.auth.user?.email) payload.email = this.email;
    if (this.password) {
      payload.password = this.password;
      payload.password_confirmation = this.passwordConfirmation;
    }

    if (Object.keys(payload).length === 0) {
      this.loading = false;
      this.message = 'Nincs módosítás.';
      return;
    }

    this.auth.updateUser(payload).subscribe({
      next: (user) => {
        this.loading = false;
        this.message = 'Sikeres mentés.';
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
    // Optimistic UX: set on_shift locally and navigate immediately to dashboard.
    const prevOnShift = this.auth.user?.on_shift ?? false;

    if (this.auth.user) {
      this.auth.user.on_shift = true;
      try {
        localStorage.setItem('user', JSON.stringify(this.auth.user));
      } catch (e) {
        // ignore storage errors
      }
    }

    // Navigate right away so the user sees the dashboard instantly.
    this.router.navigateByUrl('/waiter').then((ok) => {
      if (!ok) {
        console.error('Navigation to /waiter was prevented by the router.');
        // revert optimistic change
        if (this.auth.user) {
          this.auth.user.on_shift = prevOnShift;
          try { localStorage.setItem('user', JSON.stringify(this.auth.user)); } catch (e) {}
        }
        alert('Nem sikerült átirányítani a dashboardra.');
      }
    }).catch((navErr) => {
      console.error('Navigation error:', navErr);
      if (this.auth.user) {
        this.auth.user.on_shift = prevOnShift;
        try { localStorage.setItem('user', JSON.stringify(this.auth.user)); } catch (e) {}
      }
      alert('Hiba történt az átirányítás során.');
    });

    // Fire the API call in background to persist the shift. If it fails,
    // revert the optimistic change and navigate back to the user page.
    this.auth.takeShift().subscribe({
      next: () => {
        // success - nothing further required here; dashboard will load normally
      },
      error: (err) => {
        console.error('TAKE SHIFT ERROR', err);
        // revert
        if (this.auth.user) {
          this.auth.user.on_shift = prevOnShift;
          try {
            localStorage.setItem('user', JSON.stringify(this.auth.user));
          } catch (e) {}
        }
        // Inform the user and navigate back so they can retry
        alert('Műszak felvétele sikertelen.');
        this.router.navigateByUrl('/waiter/user');
      }
    });
  }
}
