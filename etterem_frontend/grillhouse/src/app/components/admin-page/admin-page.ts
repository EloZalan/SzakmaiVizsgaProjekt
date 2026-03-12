import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { StaffMember } from '../../models/staff-member.model';
import { RestaurantTable } from '../../models/restaurant-table.model';
import { AdminTablesService } from '../../services/admin-tables.service';

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
    private adminTablesService: AdminTablesService
  ) {}

  dailyRevenue = 4280;
  todayGuests = 136;

  staffMembers: StaffMember[] = [
    { id: 1, name: 'Alex Kovács', role: 'PINCER', status: 'ACTIVE', shift: 'Délelőtt' },
    { id: 2, name: 'Sam Nagy', role: 'PINCER', status: 'ACTIVE', shift: 'Este' },
    { id: 3, name: 'Bence Tóth', role: 'ADMIN', status: 'ACTIVE', shift: 'Egész nap' },
    { id: 4, name: 'Lili Kiss', role: 'PINCER', status: 'INACTIVE', shift: 'Szabadnap' },
  ];

  tables: RestaurantTable[] = [];

  selectedStaff: StaffMember | null = null;
  selectedTable: RestaurantTable | null = null;

  tablesLoading = false;
  tablesError = '';

  ngOnInit(): void {
    this.loadTables();
  }

  get activeWaiters(): number {
    return this.staffMembers.filter((s) => s.role === 'PINCER' && s.status === 'ACTIVE').length;
  }

  selectStaff(staff: StaffMember): void {
    this.selectedStaff = staff;
    this.selectedTable = null;
  }

  selectTable(table: RestaurantTable): void {
    this.selectedTable = table;
    this.selectedStaff = null;
  }

  loadTables(selectedTableId?: number | null): void {
    this.tablesLoading = true;
    this.tablesError = '';

    this.adminTablesService.getTables().subscribe({
      next: (tables) => {
        this.tables = this.withDisplayNames(tables);
        this.tablesLoading = false;

        const targetId = selectedTableId ?? this.selectedTable?.id ?? null;

        if (targetId !== null) {
          this.selectedTable = this.tables.find((t) => t.id === targetId) ?? null;
        } else {
          this.selectedTable = null;
        }
      },
      error: (err) => {
        this.tablesLoading = false;
        this.tablesError = 'Nem sikerült betölteni az asztalokat.';
        console.error('Tables loading error:', err);
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
        this.loadTables(createdTableId);
      },
      error: (err) => {
        console.error('Create table error:', err);
        alert('Nem sikerült létrehozni az asztalt.');
      },
    });
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
        this.loadTables(tableId);
      },
      error: (err) => {
        console.error('Update table error:', err);
        alert('Nem sikerült módosítani a férőhelyeket.');
      },
    });
  }

  editTable(table: RestaurantTable): void {
    this.changeSeats(table.id);
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
        this.loadTables(null);
      },
      error: (err) => {
        console.error('Delete table error:', err);
        alert('Nem sikerült törölni az asztalt.');
      },
    });
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  private withDisplayNames(tables: RestaurantTable[]): RestaurantTable[] {
    const sorted = [...tables].sort((a, b) => a.id - b.id);

    return sorted.map((table, index) => ({
      ...table,
      name: `Asztal ${index + 1}`,
    }));
  }

  addWaiter(): void {
    const name = prompt('Új dolgozó neve:');
    if (!name || !name.trim()) return;

    const roleInput = prompt('Szerepkör (PINCER / ADMIN):', 'PINCER');
    const role = roleInput?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'PINCER';

    const shift = prompt('Műszak:', 'Délelőtt') || 'Délelőtt';

    const newStaff: StaffMember = {
      id: this.getNextStaffId(),
      name: name.trim(),
      role,
      status: 'ACTIVE',
      shift: shift.trim(),
    };

    this.staffMembers = [...this.staffMembers, newStaff];
    this.selectedStaff = newStaff;
    this.selectedTable = null;
  }

  removeStaff(staffId: number): void {
    const staff = this.staffMembers.find((s) => s.id === staffId);
    if (!staff) return;

    const confirmed = confirm(`Biztosan eltávolítod őt: ${staff.name}?`);
    if (!confirmed) return;

    this.staffMembers = this.staffMembers.filter((s) => s.id !== staffId);

    if (this.selectedStaff?.id === staffId) {
      this.selectedStaff = null;
    }
  }

  toggleRole(staffId: number): void {
    this.staffMembers = this.staffMembers.map((staff) => {
      if (staff.id !== staffId) return staff;

      return {
        ...staff,
        role: staff.role === 'PINCER' ? 'ADMIN' : 'PINCER',
      };
    });

    if (this.selectedStaff?.id === staffId) {
      this.selectedStaff = this.staffMembers.find((s) => s.id === staffId) ?? null;
    }
  }

  private getNextStaffId(): number {
    if (this.staffMembers.length === 0) return 1;
    return Math.max(...this.staffMembers.map((s) => s.id)) + 1;
  }
}