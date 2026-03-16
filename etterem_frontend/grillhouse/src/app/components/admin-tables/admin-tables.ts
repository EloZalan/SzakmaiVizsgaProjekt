import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminLiveTable, AdminTablesService } from '../../services/admin-tables.service';

type EditorMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tables.html',
  styleUrl: './admin-tables.css',
})
export class AdminTablesComponent implements OnInit {
  tables: AdminLiveTable[] = [];
  selectedTable: AdminLiveTable | null = null;

  loading = false;
  saving = false;
  error = '';
  formError = '';
  editorMode: EditorMode = null;
  form = {
    seats: 4,
  };

  constructor(
    private adminTablesService: AdminTablesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(selectedTableId: number | null = this.selectedTable?.id ?? null): void {
    this.loading = true;
    this.error = '';

    this.adminTablesService.getTableOverview().subscribe({
      next: (tables) => {
        this.tables = tables;
        this.loading = false;

        if (selectedTableId !== null) {
          this.selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
        }

        if (this.selectedTable && this.editorMode === 'edit') {
          this.form.seats = this.selectedTable.seats;
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Nem sikerült betölteni az asztalokat.';
        console.error('ADMIN TABLES LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  selectTable(table: AdminLiveTable): void {
    this.selectedTable = table;
    this.editorMode = null;
    this.formError = '';
    this.cdr.markForCheck();
  }

  startCreate(): void {
    this.editorMode = 'create';
    this.form = { seats: 4 };
    this.formError = '';
    this.cdr.markForCheck();
  }

  startEdit(table: AdminLiveTable): void {
    if (!this.isEditable(table)) {
      this.formError = 'Csak a szabad asztalok modositasa engedelyezett.';
      this.selectedTable = table;
      this.cdr.markForCheck();
      return;
    }

    this.selectedTable = table;
    this.editorMode = 'edit';
    this.form = { seats: table.seats };
    this.formError = '';
    this.cdr.markForCheck();
  }

  cancelEditor(): void {
    this.editorMode = null;
    this.formError = '';

    if (this.selectedTable) {
      this.form.seats = this.selectedTable.seats;
    }

    this.cdr.markForCheck();
  }

  saveTable(): void {
    const seats = Number(this.form.seats);

    if (!Number.isInteger(seats) || seats < 1) {
      this.formError = 'Adj meg legalabb 1 ferohelyet.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.formError = '';

    if (this.editorMode === 'create') {
      this.adminTablesService.createTable(seats).subscribe({
        next: (createdId) => {
          this.saving = false;
          this.editorMode = null;
          this.loadTables(createdId);
        },
        error: (err) => {
          this.saving = false;
          this.formError = this.extractError(err, 'Nem sikerült létrehozni az asztalt.');
          console.error('ADMIN TABLE CREATE ERROR:', err);
          this.cdr.markForCheck();
        },
      });

      return;
    }

    if (!this.selectedTable) {
      this.saving = false;
      this.formError = 'Nincs kiválasztott asztal.';
      this.cdr.markForCheck();
      return;
    }

    this.adminTablesService.updateTable(this.selectedTable.id, seats).subscribe({
      next: () => {
        const selectedId = this.selectedTable?.id ?? null;
        this.saving = false;
        this.editorMode = null;
        this.loadTables(selectedId);
      },
      error: (err) => {
        this.saving = false;
        this.formError = this.extractError(err, 'Nem sikerült módosítani az asztalt.');
        console.error('ADMIN TABLE UPDATE ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  deleteSelectedTable(): void {
    if (!this.selectedTable) {
      return;
    }

    if (!this.isEditable(this.selectedTable)) {
      this.formError = 'Csak a szabad asztalok torolhetok.';
      this.cdr.markForCheck();
      return;
    }

    const confirmed = confirm(`Biztosan torlod ezt az asztalt: ${this.selectedTable.name}?`);
    if (!confirmed) {
      return;
    }

    const deletingId = this.selectedTable.id;
    this.saving = true;
    this.formError = '';

    this.adminTablesService.deleteTable(deletingId).subscribe({
      next: () => {
        this.saving = false;
        this.selectedTable = null;
        this.editorMode = null;
        this.loadTables();
      },
      error: (err) => {
        this.saving = false;
        this.formError = this.extractError(err, 'Nem sikerült törölni az asztalt.');
        console.error('ADMIN TABLE DELETE ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  isEditable(table: AdminLiveTable): boolean {
    return table.status === 'FREE';
  }

  get freeCount(): number {
    return this.tables.filter((table) => table.status === 'FREE').length;
  }

  get reservedCount(): number {
    return this.tables.filter((table) => table.status === 'RESERVED').length;
  }

  get occupiedCount(): number {
    return this.tables.filter((table) => table.status === 'OCCUPIED').length;
  }

  get paymentCount(): number {
    return this.tables.filter((table) => table.status === 'NEEDS_PAYMENT').length;
  }

  get closedCount(): number {
    return this.tables.filter((table) => table.status === 'CLOSED').length;
  }

  private extractError(err: unknown, fallback: string): string {
    if (typeof err === 'object' && err && 'error' in err) {
      const payload = (err as { error?: { message?: string } }).error;
      if (payload?.message) {
        return payload.message;
      }
    }

    return fallback;
  }
}
