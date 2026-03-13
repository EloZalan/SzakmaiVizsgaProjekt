import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../services/auth';
import { AdminTablesService } from '../../services/admin-tables.service';
import {
  AdminDashboardService,
  AdminWaiterDto,
} from '../../services/admin-dashboard.service';
import { StaffMember } from '../../models/staff-member.model';
import { RestaurantTable } from '../../models/restaurant-table.model';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPageComponent implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
    private adminTablesService: AdminTablesService,
    private adminDashboardService: AdminDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  dailyRevenue = 0;
  todayGuests = 0;

  staffMembers: StaffMember[] = [];
  tables: RestaurantTable[] = [];

  selectedStaff: StaffMember | null = null;
  selectedTable: RestaurantTable | null = null;

  loading = false;
  tablesLoading = false;
  staffLoading = false;

  dashboardError = '';
  tablesError = '';
  staffError = '';

  ngOnInit(): void {
    this.loadAdminPage();
  }

  get activeWaiters(): number {
    return this.staffMembers.filter(
      (s) => s.role === 'PINCER' && s.status === 'ACTIVE'
    ).length;
  }

  loadAdminPage(selectedTableId?: number | null, selectedStaffId?: number | null): void {
    this.loading = true;
    this.dashboardError = '';
    this.tablesError = '';
    this.staffError = '';

    forkJoin({
      tables: this.adminTablesService.getTables(),
      waiters: this.adminDashboardService.getWaiters(),
      todayGuests: this.adminDashboardService.getTodayGuestCount(),
    }).subscribe({
      next: ({ tables, waiters, todayGuests }) => {
        this.loading = false;

        this.tables = this.restoreLocalTables(tables);
        this.staffMembers = waiters.map((w) => this.mapWaiterToStaffMember(w));
        this.todayGuests = todayGuests;

        // Swagger alapján nincs olyan listázó endpoint, amiből timestamp alapján
        // pontos napi revenue számolható lenne, ezért ez itt 0 marad,
        // amíg a backend nem ad pl. payments/orders history végpontot timestamp-pel.
        this.dailyRevenue = 0;

        const targetTableId = selectedTableId ?? this.selectedTable?.id ?? null;
        const targetStaffId = selectedStaffId ?? this.selectedStaff?.id ?? null;

        this.selectedTable =
          targetTableId !== null
            ? this.tables.find((t) => t.id === targetTableId) ?? null
            : null;

        this.selectedStaff =
          targetStaffId !== null
            ? this.staffMembers.find((s) => s.id === targetStaffId) ?? null
            : null;

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.dashboardError = 'Nem sikerült betölteni az admin felület adatait.';
        console.error('ADMIN PAGE LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  selectStaff(staff: StaffMember): void {
    this.selectedStaff = staff;
    this.selectedTable = null;
    this.cdr.markForCheck();
  }

  selectTable(table: RestaurantTable): void {
    this.selectedTable = table;
    this.selectedStaff = null;
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
          this.loadAdminPage(
            this.selectedTable?.id ?? null,
            created?.id ?? null
          );
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

        this.loadAdminPage(this.selectedTable?.id ?? null, null);
      },
      error: (err) => {
        console.error('DELETE WAITER ERROR:', err);
        alert('Nem sikerült törölni a pincért.');
        this.cdr.markForCheck();
      },
    });
  }



  addTable(): void {
    const seatsInput = prompt('Férőhelyek száma:', '4');
    if (seatsInput === null) return;

    const seats = Number(seatsInput);

    if (!Number.isInteger(seats) || seats <= 0) {
      alert('Adj meg érvényes férőhely számot.');
      return;
    }

    this.adminTablesService.createTable(seats).subscribe({
      next: (createdTableId) => {
          this.selectedStaff = null;
          this.loadAdminPage(createdTableId, null);
      },
      error: (err) => {
        console.error('CREATE TABLE ERROR:', err);
        alert('Nem sikerült létrehozni az asztalt.');
        this.cdr.markForCheck();
      },
    });
  }

  editTable(table: RestaurantTable): void {
    this.changeSeats(table.id);
  }

  changeSeats(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    const seatsInput = prompt(`${table.name} új férőhely száma:`, String(table.seats));
    if (seatsInput === null) return;

    const seats = Number(seatsInput);

    if (!Number.isInteger(seats) || seats <= 0) {
      alert('Adj meg érvényes férőhely számot.');
      return;
    }

    this.adminTablesService.updateTable(tableId, seats).subscribe({
      next: () => {
        this.loadAdminPage(tableId, this.selectedStaff?.id ?? null);
      },
      error: (err) => {
        console.error('UPDATE TABLE ERROR:', err);
        alert('Nem sikerült módosítani a férőhelyeket.');
        this.cdr.markForCheck();
      },
    });
  }

  deleteTable(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    const confirmed = confirm(`Biztosan törlöd ezt az asztalt: ${table.name}?`);
    if (!confirmed) return;

    this.adminTablesService.deleteTable(tableId).subscribe({
      next: () => {
        if (this.selectedTable?.id === tableId) {
          this.selectedTable = null;
        }

        this.loadAdminPage(null, this.selectedStaff?.id ?? null);
      },
      error: (err) => {
        console.error('DELETE TABLE ERROR:', err);
        alert('Nem sikerült törölni az asztalt.');
        this.cdr.markForCheck();
      },
    });
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
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

  private restoreLocalTables(baseTables: RestaurantTable[]): RestaurantTable[] {
    const raw = localStorage.getItem('admin_table_state');
    if (!raw) return baseTables;

    try {
      const saved: Array<Partial<RestaurantTable> & { id: number }> = JSON.parse(raw);

      return baseTables.map((table) => {
        const local = saved.find((x) => x.id === table.id);
        return local ? { ...table, ...local, name: table.name } : table;
      });
    } catch {
      return baseTables;
    }
  }
}
