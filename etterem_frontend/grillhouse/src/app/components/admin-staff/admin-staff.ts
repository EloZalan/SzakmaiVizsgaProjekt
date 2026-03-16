import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDashboardService, AdminWaiterDto } from '../../services/admin-dashboard.service';
import { StaffMember } from '../../models/staff-member.model';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-staff.html',
  styleUrl: './admin-staff.css',
})
export class AdminStaffComponent implements OnInit {
  staffMembers: StaffMember[] = [];
  selectedStaff: StaffMember | null = null;

  loading = false;
  error = '';

  constructor(
    private adminDashboardService: AdminDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;
    this.error = '';

    this.adminDashboardService.getWaiters().subscribe({
      next: (waiters) => {
        this.loading = false;
        this.staffMembers = waiters.map((w) => this.mapWaiterToStaffMember(w));
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Nem sikerült betölteni a pincéreket.';
        console.error('STAFF LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  selectStaff(staff: StaffMember): void {
    this.selectedStaff = staff;
    this.cdr.markForCheck();
  }

  addWaiter(): void {
    const name = prompt('Új pincér neve:');
    if (!name || !name.trim()) return;

    const email = prompt('Email cím:');
    if (!email || !email.trim()) {
      alert('Email megadása kötelező.');
      return;
    }

    const password = prompt('Jelszó:');
    if (!password || password.length < 6) {
      alert('A jelszó legalább 6 karakter legyen.');
      return;
    }

    const passwordConfirmation = prompt('Jelszó megerősítése:');
    if (passwordConfirmation !== password) {
      alert('A két jelszó nem egyezik.');
      return;
    }

    this.adminDashboardService
      .createWaiter({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      .subscribe({
        next: (created) => {
          this.loadStaff();
        },
        error: (err) => {
          console.error('CREATE WAITER ERROR:', err);
          alert('Nem sikerült létrehozni a pincért.');
          this.cdr.markForCheck();
        },
      });
  }

  removeStaff(staffId: number): void {
    const staff = this.staffMembers.find((s) => s.id === staffId);
    if (!staff) return;

    const confirmed = confirm(`Biztosan eltávolítod őt: ${staff.name}?`);
    if (!confirmed) return;

    this.adminDashboardService.deleteWaiter(staffId).subscribe({
      next: () => {
        if (this.selectedStaff?.id === staffId) {
          this.selectedStaff = null;
        }
        this.loadStaff();
      },
      error: (err) => {
        console.error('DELETE WAITER ERROR:', err);
        alert('Nem sikerült törölni a pincért.');
        this.cdr.markForCheck();
      },
    });
  }

  private mapWaiterToStaffMember(waiter: AdminWaiterDto): StaffMember {
    return {
      id: waiter.id,
      name: waiter.name,
      role: waiter.role === 'admin' ? 'ADMIN' : 'PINCER',
      status: waiter.on_shift === false ? 'INACTIVE' : 'ACTIVE',
      shift: waiter.on_shift === false ? 'Szabadnap' : 'Műszakban',
    };
  }
}
