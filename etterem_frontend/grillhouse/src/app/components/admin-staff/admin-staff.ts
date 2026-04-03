import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService, AdminWaiterDto } from '../../services/admin-dashboard.service';
import { StaffMember } from '../../models/staff-member.model';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-staff.html',
  styleUrl: './admin-staff.css',
})
export class AdminStaffComponent implements OnInit, OnDestroy {
  staffMembers: StaffMember[] = [];
  selectedStaff: StaffMember | null = null;
  pendingRemovalStaffId: number | null = null;
  removingStaffId: number | null = null;
  removeError = '';

  loading = false;
  error = '';
  showAddWaiterModal = false;
  addingWaiter = false;
  addWaiterError = '';
  newWaiter = {
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  };
  private stopWaiterStatusListening: (() => void) | null = null;

  constructor(
    private adminDashboardService: AdminDashboardService,
    private realtimeService: RealtimeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStaff();

    this.stopWaiterStatusListening = this.realtimeService.listenToWaiterStatusChanges(() => {
      this.loadStaff();
    });
  }

  ngOnDestroy(): void {
    this.stopWaiterStatusListening?.();
    this.stopWaiterStatusListening = null;
  }

  loadStaff(): void {
    this.loading = true;
    this.error = '';

    this.adminDashboardService.getWaiters().subscribe({
      next: (waiters) => {
        this.loading = false;
        this.staffMembers = waiters.map((w) => this.mapWaiterToStaffMember(w));

        if (this.selectedStaff) {
          this.selectedStaff = this.staffMembers.find((staff) => staff.id === this.selectedStaff?.id) ?? null;
        }

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
    this.removeError = '';
    this.cdr.markForCheck();
  }

  startRemoveStaff(staffId: number): void {
    this.pendingRemovalStaffId = staffId;
    this.removeError = '';
    this.cdr.markForCheck();
  }

  cancelRemoveStaff(): void {
    this.pendingRemovalStaffId = null;
    this.removingStaffId = null;
    this.removeError = '';
    this.cdr.markForCheck();
  }

  openAddWaiterModal(): void {
    this.showAddWaiterModal = true;
    this.addWaiterError = '';
    this.newWaiter = {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    };
    this.cdr.markForCheck();
  }

  closeAddWaiterModal(): void {
    if (this.addingWaiter) return;

    this.showAddWaiterModal = false;
    this.addWaiterError = '';
    this.cdr.markForCheck();
  }

  addWaiter(): void {
    const name = this.newWaiter.name.trim();
    const email = this.newWaiter.email.trim();
    const password = this.newWaiter.password;
    const passwordConfirmation = this.newWaiter.passwordConfirmation;

    if (!name) {
      this.addWaiterError = 'A név megadása kötelező.';
      this.cdr.markForCheck();
      return;
    }

    if (!email) {
      this.addWaiterError = 'Email megadása kötelező.';
      this.cdr.markForCheck();
      return;
    }

    if (!password || password.length < 6) {
      this.addWaiterError = 'A jelszó legalább 6 karakter legyen.';
      this.cdr.markForCheck();
      return;
    }

    if (passwordConfirmation !== password) {
      this.addWaiterError = 'A két jelszó nem egyezik.';
      this.cdr.markForCheck();
      return;
    }

    this.addingWaiter = true;
    this.addWaiterError = '';

    this.adminDashboardService
      .createWaiter({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      .subscribe({
        next: () => {
          this.addingWaiter = false;
          this.showAddWaiterModal = false;
          this.loadStaff();
        },
        error: (err) => {
          this.addingWaiter = false;
          console.error('CREATE WAITER ERROR:', err);
          this.addWaiterError = 'Nem sikerült létrehozni a pincért.';
          this.cdr.markForCheck();
        },
      });
  }

  removeStaff(staffId: number): void {
    const staff = this.staffMembers.find((s) => s.id === staffId);
    if (!staff) return;

    this.removingStaffId = staffId;
    this.removeError = '';

    this.adminDashboardService.deleteWaiter(staffId).subscribe({
      next: () => {
        this.removingStaffId = null;
        this.pendingRemovalStaffId = null;
        if (this.selectedStaff?.id === staffId) {
          this.selectedStaff = null;
        }
        this.loadStaff();
      },
      error: (err) => {
        this.removingStaffId = null;
        console.error('DELETE WAITER ERROR:', err);
        this.removeError = `Nem sikerült törölni a pincért: ${staff.name}.`;
        this.cdr.markForCheck();
      },
    });
  }

  getRoleLabel(role: StaffMember['role']): string {
    return role === 'ADMIN' ? 'Adminisztrátor' : 'Pincér';
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
