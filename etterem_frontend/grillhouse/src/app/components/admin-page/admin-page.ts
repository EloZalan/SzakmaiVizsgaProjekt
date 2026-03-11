import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { StaffMember } from '../../models/staff-member.model';
import { RestaurantTable } from '../../models/restaurant-table.model';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './admin-page.html',
})
export class AdminPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  dailyRevenue = 4280;
  todayGuests = 136;

  staffMembers: StaffMember[] = [
    { id: 1, name: 'Alex Kovács', role: 'PINCER', status: 'ACTIVE', shift: 'Délelőtt' },
    { id: 2, name: 'Sam Nagy', role: 'PINCER', status: 'ACTIVE', shift: 'Este' },
    { id: 3, name: 'Bence Tóth', role: 'ADMIN', status: 'ACTIVE', shift: 'Egész nap' },
    { id: 4, name: 'Lili Kiss', role: 'PINCER', status: 'INACTIVE', shift: 'Szabadnap' },
  ];

  tables: RestaurantTable[] = [
    { id: 1, name: 'Asztal 1', seats: 2, status: 'ACTIVE' },
    { id: 2, name: 'Asztal 2', seats: 4, status: 'ACTIVE' },
    { id: 3, name: 'Asztal 3', seats: 6, status: 'ACTIVE' },
    { id: 4, name: 'Asztal 4', seats: 4, status: 'ACTIVE' },
    { id: 5, name: 'Asztal 5', seats: 8, status: 'DISABLED' },
    { id: 6, name: 'Asztal 6', seats: 2, status: 'ACTIVE' },
  ];

  selectedStaff: StaffMember | null = null;
  selectedTable: RestaurantTable | null = null;

  get activeWaiters(): number {
    return this.staffMembers.filter(s => s.role === 'PINCER' && s.status === 'ACTIVE').length;
  }

  selectStaff(staff: StaffMember): void {
    this.selectedStaff = staff;
    this.selectedTable = null;
  }

  selectTable(table: RestaurantTable): void {
    this.selectedTable = table;
    this.selectedStaff = null;
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
    const staff = this.staffMembers.find(s => s.id === staffId);
    if (!staff) return;

    const confirmed = confirm(`Biztosan eltávolítod őt: ${staff.name}?`);
    if (!confirmed) return;

    this.staffMembers = this.staffMembers.filter(s => s.id !== staffId);

    if (this.selectedStaff?.id === staffId) {
      this.selectedStaff = null;
    }
  }

  toggleRole(staffId: number): void {
    this.staffMembers = this.staffMembers.map(staff => {
      if (staff.id !== staffId) return staff;

      return {
        ...staff,
        role: staff.role === 'PINCER' ? 'ADMIN' : 'PINCER',
      };
    });

    if (this.selectedStaff?.id === staffId) {
      this.selectedStaff = this.staffMembers.find(s => s.id === staffId) ?? null;
    }
  }

  addTable(): void {
    const tableName = prompt('Új asztal neve:', `Asztal ${this.getNextTableId()}`);
    if (!tableName || !tableName.trim()) return;

    const seatsInput = prompt('Férőhelyek száma:', '4');
    const seats = Number(seatsInput);

    if (!Number.isFinite(seats) || seats <= 0) {
      alert('Adj meg érvényes férőhely számot.');
      return;
    }

    const newTable: RestaurantTable = {
      id: this.getNextTableId(),
      name: tableName.trim(),
      seats,
      status: 'ACTIVE',
    };

    this.tables = [...this.tables, newTable];
    this.selectedTable = newTable;
    this.selectedStaff = null;
  }

  changeSeats(tableId: number): void {
    const table = this.tables.find(t => t.id === tableId);
    if (!table) return;

    const seatsInput = prompt(`${table.name} új férőhely száma:`, String(table.seats));
    if (seatsInput === null) return;

    const seats = Number(seatsInput);

    if (!Number.isFinite(seats) || seats <= 0) {
      alert('Adj meg érvényes férőhely számot.');
      return;
    }

    this.tables = this.tables.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, seats };
    });

    if (this.selectedTable?.id === tableId) {
      this.selectedTable = this.tables.find(t => t.id === tableId) ?? null;
    }
  }

  deleteTable(tableId: number): void {
    const table = this.tables.find(t => t.id === tableId);
    if (!table) return;

    const confirmed = confirm(`Biztosan törlöd ezt az asztalt: ${table.name}?`);
    if (!confirmed) return;

    this.tables = this.tables.filter(t => t.id !== tableId);

    if (this.selectedTable?.id === tableId) {
      this.selectedTable = null;
    }
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  private getNextStaffId(): number {
    if (this.staffMembers.length === 0) return 1;
    return Math.max(...this.staffMembers.map(s => s.id)) + 1;
  }

  private getNextTableId(): number {
    if (this.tables.length === 0) return 1;
    return Math.max(...this.tables.map(t => t.id)) + 1;
  }
}