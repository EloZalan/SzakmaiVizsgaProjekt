import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminDashboardService, WaiterInviteDto } from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invite-accept.html',
  styleUrl: './invite-accept.css',
})
export class InviteAcceptComponent implements OnInit {
  token = '';
  invite: WaiterInviteDto | null = null;
  loading = true;
  submitting = false;
  successMessage = '';
  errorMessage = '';
  password = '';
  passwordConfirmation = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminDashboardService: AdminDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    if (!this.token) {
      this.loading = false;
      this.errorMessage = 'Hiányzó meghívó token.';
      this.cdr.markForCheck();
      return;
    }

    this.adminDashboardService.getWaiterInvite(this.token).subscribe({
      next: (invite) => {
        this.invite = invite;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'A meghívó nem található vagy lejárt.';
        this.cdr.markForCheck();
      },
    });
  }

  acceptInvite(): void {
    if (!this.invite || this.submitting) {
      return;
    }

    if (!this.password || this.password.length < 8) {
      this.errorMessage = 'A jelszó legalább 8 karakter legyen.';
      this.cdr.markForCheck();
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errorMessage = 'A két jelszó nem egyezik.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.adminDashboardService.acceptWaiterInvite({
      token: this.token,
      password: this.password,
      password_confirmation: this.passwordConfirmation,
    }).subscribe({
      next: (response) => {
        this.submitting = false;
        this.successMessage = response.message;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1200);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message ?? 'A meghívó aktiválása sikertelen.';
        this.cdr.markForCheck();
      },
    });
  }
}