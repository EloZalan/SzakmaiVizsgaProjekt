import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AdminTablesService } from '../../services/admin-tables.service';
import type { AdminLiveTable } from '../../models/admin-live-table.model';

type EditorMode = 'create' | 'edit' | 'delete' | 'reset' | null;

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tables.html',
  styleUrl: './admin-tables.css',
})
export class AdminTablesComponent implements OnInit, OnDestroy {
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
  private hasLoadedOnce = false;
  private isRequestInFlight = false;
  private pollSubscription: Subscription | null = null;

  constructor(
    private adminTablesService: AdminTablesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTables();

    this.pollSubscription = interval(10000).subscribe(() => {
      if (this.isRequestInFlight || this.saving) {
        return;
      }

      this.adminTablesService.invalidateTablesCache();
      const tableToKeepSelected = this.selectedTable?.id ?? null;
      this.loadTables(tableToKeepSelected, true);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  loadTables(selectedTableId: number | null = this.selectedTable?.id ?? null, silent = false): void {
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

    this.adminTablesService.getTableOverview().subscribe({
      next: (tables) => {
        this.isRequestInFlight = false;
        this.tables = tables;
        this.loading = false;
        this.hasLoadedOnce = true;

        if (selectedTableId !== null) {
          this.selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
        }

        if (this.selectedTable && this.editorMode === 'edit') {
          this.form.seats = this.selectedTable.seats;
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isRequestInFlight = false;
        this.loading = false;
        if (!silent || !this.hasLoadedOnce) {
          this.error = 'Nem sikerült betölteni az asztalokat.';
        }
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

  startDelete(table: AdminLiveTable): void {
    if (!this.isEditable(table)) {
      this.formError = 'Csak a szabad asztalok torolhetok.';
      this.selectedTable = table;
      this.cdr.markForCheck();
      return;
    }

    this.selectedTable = table;
    this.editorMode = 'delete';
    this.formError = '';
    this.cdr.markForCheck();
  }

  startResetToFree(table: AdminLiveTable): void {
    if (!this.canResetToFree(table)) {
      this.formError = 'Csak foglalt asztal allithato vissza szabadra.';
      this.selectedTable = table;
      this.cdr.markForCheck();
      return;
    }

    this.selectedTable = table;
    this.editorMode = 'reset';
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

  resetSelectedTableToFree(): void {
    if (!this.selectedTable) {
      return;
    }

    if (!this.canResetToFree(this.selectedTable)) {
      this.formError = 'Csak foglalt asztal allithato vissza szabadra.';
      this.cdr.markForCheck();
      return;
    }

    const selectedId = this.selectedTable.id;
    this.saving = true;
    this.formError = '';

    this.adminTablesService.resetTableToFree(selectedId).subscribe({
      next: () => {
        this.saving = false;
        this.editorMode = null;
        this.loadTables(selectedId);
      },
      error: (err) => {
        this.saving = false;
        this.formError = this.extractError(err, 'Nem sikerült visszaállítani az asztalt szabadra.');
        console.error('ADMIN TABLE RESET TO FREE ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  isEditable(table: AdminLiveTable): boolean {
    return table.status === 'Szabad';
  }

  canResetToFree(table: AdminLiveTable): boolean {
    return table.status === 'Foglalt';
  }

  get freeCount(): number {
    return this.tables.filter((table) => table.status === 'Szabad').length;
  }

  get reservedCount(): number {
    return this.tables.filter((table) => table.status === 'Foglalt').length;
  }

  get occupiedCount(): number {
    return this.tables.filter((table) => table.status === 'Asztalnál').length;
  }

  get paymentCount(): number {
    return this.tables.filter((table) => table.status === 'Fizetésre vár').length;
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
