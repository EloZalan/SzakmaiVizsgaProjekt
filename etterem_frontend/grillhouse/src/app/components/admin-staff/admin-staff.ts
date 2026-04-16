import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import type { AdminWaiterDto } from '../../models/admin-waiter-dto.model';
import { StaffMember } from '../../models/staff-member.model';

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
  };
  private hasLoadedOnce = false;
  private isRequestInFlight = false;
  private pollSubscription: Subscription | null = null;

  constructor(
    private adminDashboardService: AdminDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStaff();

    this.pollSubscription = interval(10000).subscribe(() => {
      if (this.isRequestInFlight) {
        return;
      }

      this.adminDashboardService.invalidateWaitersCache();
      this.loadStaff(true);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  loadStaff(silent = false): void {
    if (this.isRequestInFlight) {
      return;
    }

    this.isRequestInFlight = true;

    if (!silent || !this.hasLoadedOnce) {
      this.loading = true;
    }

    if (!silent) {
      this.error = '';
    }

    this.adminDashboardService.getWaiters().subscribe({
      next: (waiters) => {
        this.isRequestInFlight = false;
        this.loading = false;
        this.hasLoadedOnce = true;
        this.staffMembers = waiters.map((w) => this.mapWaiterToStaffMember(w));

        if (this.selectedStaff) {
          this.selectedStaff = this.staffMembers.find((staff) => staff.id === this.selectedStaff?.id) ?? null;
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isRequestInFlight = false;
        this.loading = false;
        if (!silent || !this.hasLoadedOnce) {
          this.error = 'Nem sikerült betölteni a pincéreket.';
        }
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

    this.addingWaiter = true;
    this.addWaiterError = '';

    this.adminDashboardService
      .createWaiter({
        name,
        email,
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
          this.addWaiterError = err?.error?.message ?? 'Nem sikerült elküldeni a meghívót.';
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
    const invitePending = !!waiter.invite_pending;

    return {
      id: waiter.id,
      name: waiter.name,
      email: waiter.email,
      role: waiter.role === 'admin' ? 'ADMIN' : 'PINCER',
      status: invitePending ? 'INVITED' : waiter.on_shift === false ? 'INACTIVE' : 'ACTIVE',
      shift: invitePending ? 'Meghívó elküldve' : waiter.on_shift === false ? 'Szabadnap' : 'Műszakban',
      invitePending,
      inviteExpiresAt: waiter.invite_expires_at ?? null,
    };
  }
}
