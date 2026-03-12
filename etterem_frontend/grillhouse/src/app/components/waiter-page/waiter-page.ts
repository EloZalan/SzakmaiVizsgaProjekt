import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom, finalize } from 'rxjs';

import { AuthService } from '../../services/auth';
import { TableInfo, TableOrderItem } from '../../models/table-info.model';
import { PaymentMethod } from '../../models/payment-method.model';
import {
  WaiterService,
  MenuCategoryDto,
  MenuItemDto,
} from '../../services/waiter.service';

@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './waiter-page.html',
  styleUrl: './waiter-page.css',
})
export class WaiterPageComponent implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
    private waiterService: WaiterService
  ) {}

  mode: 'details' | 'payment' = 'details';
  paymentMethod: PaymentMethod = 'CARD';
  tipPreset: 0 | 10 | 12 | 15 = 10;

  tables: TableInfo[] = [];
  selected: TableInfo | null = null;

  menuCategories: MenuCategoryDto[] = [];
  menuItems: MenuItemDto[] = [];

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadWaiterPage();
  }

  get occupiedCount(): number {
    return this.tables.filter(
      (t) => t.status === 'OCCUPIED' || t.status === 'NEEDS_PAYMENT'
    ).length;
  }

  get freeCount(): number {
    return this.tables.filter((t) => t.status === 'FREE').length;
  }

  get needsPaymentCount(): number {
    return this.tables.filter((t) => t.status === 'NEEDS_PAYMENT').length;
  }

  get guestsTotal(): number {
    return this.tables.reduce((sum, t) => sum + (t.guests || 0), 0);
  }

  loadWaiterPage(selectedTableId?: number | null): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      tables: this.waiterService.getTables(),
      menuData: this.waiterService.getMenuData(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('FINAL loading:', this.loading, 'tables:', this.tables.length);
        })
      )
      .subscribe({
        next: ({ tables, menuData }) => {
          this.tables = this.restoreLocalState(tables);
          this.menuCategories = menuData.categories;
          this.menuItems = menuData.items;

          const targetId = selectedTableId ?? this.selected?.id ?? null;

          if (targetId !== null) {
            this.selected = this.tables.find((t) => t.id === targetId) ?? null;
          } else {
            this.selected = null;
          }

          console.log('WAITER PAGE LOADED:', {
            loading: this.loading,
            tables: this.tables,
            categories: this.menuCategories,
            items: this.menuItems,
          });
        },
        error: (err) => {
          this.errorMessage = 'Nem sikerült betölteni a pincér felület adatait.';
          console.error('WAITER PAGE LOAD ERROR:', err);
        },
      });
  }

  selectTable(t: TableInfo): void {
    this.selected = t;
    this.mode = 'details';
  }

  clearSelection(): void {
    this.selected = null;
    this.mode = 'details';
  }

  calcTotal(t: TableInfo): number {
    return (t.items || []).reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  tipAmount(t: TableInfo): number {
    return this.calcTotal(t) * (this.tipPreset / 100);
  }

  grandTotal(t: TableInfo): number {
    return this.calcTotal(t) + this.tipAmount(t);
  }

  perGuest(t: TableInfo): number {
    const g = Math.max(1, t.guests || 1);
    return this.grandTotal(t) / g;
  }

  openPayment(tableId: number): void {
    const table = this.tables.find((x) => x.id === tableId);
    if (!table || table.status === 'CLOSED' || !table.orderId) return;

    this.selected = table;
    this.mode = 'payment';
  }

  backToDetails(): void {
    this.mode = 'details';
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod = method;
  }

  setTipPreset(value: 0 | 10 | 12 | 15): void {
    this.tipPreset = value;
  }

  cancelPayment(): void {
    this.mode = 'details';
  }

  confirmPayment(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table?.orderId) {
      alert('Ehhez az asztalhoz nincs aktív rendelés.');
      return;
    }

    const backendMethod = this.paymentMethod === 'CARD' ? 'card' : 'cash';

    this.waiterService.payOrder(table.orderId, backendMethod).subscribe({
      next: () => {
        this.tables = this.tables.map((t) =>
          t.id !== tableId
            ? t
            : {
                ...t,
                status: 'CLOSED',
                guests: 0,
                items: [],
                note: undefined,
                orderId: null,
                updatedAt: this.nowTime(),
              }
        );

        this.persistLocalState();
        this.selected = this.tables.find((t) => t.id === tableId) ?? null;
        this.mode = 'details';
      },
      error: (err) => {
        console.error('CONFIRM PAYMENT ERROR:', err);
        alert('Nem sikerült a fizetést véglegesíteni.');
      },
    });
  }

  async addItem(tableId: number): Promise<void> {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    const categoryText = this.menuCategories.map((c) => `${c.id}: ${c.name}`).join('\n');
    const itemText = this.menuItems.map((m) => `${m.id}: ${m.name} - $${m.price}`).join('\n');

    alert(`Kategóriák:\n${categoryText}\n\nTételek:\n${itemText}`);

    const menuItemIdInput = prompt('Add meg a menü tétel ID-ját:');
    if (menuItemIdInput === null) return;

    const quantityInput = prompt('Mennyiség:', '1');
    if (quantityInput === null) return;

    const menuItemId = Number(menuItemIdInput);
    const quantity = Number(quantityInput);

    if (!Number.isInteger(menuItemId) || !Number.isInteger(quantity) || quantity <= 0) {
      alert('Érvénytelen tétel vagy mennyiség.');
      return;
    }

    const menuItem = this.menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) {
      alert('Nincs ilyen menü tétel.');
      return;
    }

    try {
      let orderId = table.orderId ?? null;

      if (!orderId) {
        const order = await firstValueFrom(this.waiterService.openOrder(table.id));
        orderId = order.id;
      }

      await firstValueFrom(this.waiterService.addOrderItem(orderId, menuItemId, quantity));

      const updatedItems = this.mergeOrderItem(table.items, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        qty: quantity,
        price: menuItem.price,
      });

      this.tables = this.tables.map((t) =>
        t.id !== tableId
          ? t
          : {
              ...t,
              orderId,
              items: updatedItems,
              status: 'OCCUPIED',
              guests: Math.max(1, t.guests || 1),
              server: this.auth.user?.name ?? '-',
              updatedAt: this.nowTime(),
            }
      );

      this.persistLocalState();
      this.selected = this.tables.find((t) => t.id === tableId) ?? null;
      this.mode = 'details';
    } catch (err) {
      console.error('ADD ITEM ERROR:', err);
      alert('Nem sikerült hozzáadni a tételt a rendeléshez.');
    }
  }

  markReady(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table?.orderId) {
      alert('Ehhez az asztalhoz nincs aktív rendelés.');
      return;
    }

    this.waiterService.markReadyToPay(table.orderId).subscribe({
      next: () => {
        this.tables = this.tables.map((t) =>
          t.id !== tableId
            ? t
            : {
                ...t,
                status: 'NEEDS_PAYMENT',
                updatedAt: this.nowTime(),
              }
        );

        this.persistLocalState();
        this.selected = this.tables.find((t) => t.id === tableId) ?? null;
      },
      error: (err) => {
        console.error('MARK READY ERROR:', err);
        alert('Nem sikerült fizetésre kész állapotba tenni a rendelést.');
      },
    });
  }

  printReceipt(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    const lines = [
      `${table.name}`,
      `Állapot: ${table.status}`,
      '',
      ...table.items.map((it) => `${it.name} x${it.qty} = $${it.qty * it.price}`),
      '',
      `Összesen: $${this.calcTotal(table)}`,
    ];

    alert(lines.join('\n'));
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  private mergeOrderItem(items: TableOrderItem[], incoming: TableOrderItem): TableOrderItem[] {
    const existing = items.find((i) => i.menuItemId === incoming.menuItemId);

    if (!existing) {
      return [...items, incoming];
    }

    return items.map((i) =>
      i.menuItemId !== incoming.menuItemId
        ? i
        : {
            ...i,
            qty: i.qty + incoming.qty,
          }
    );
  }

  private nowTime(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private persistLocalState(): void {
    const sessionState = this.tables.map((t) => ({
      id: t.id,
      guests: t.guests,
      server: t.server,
      updatedAt: t.updatedAt,
      items: t.items,
      note: t.note,
      orderId: t.orderId,
      status: t.status,
    }));

    localStorage.setItem('waiter_table_state', JSON.stringify(sessionState));
  }

  private restoreLocalState(baseTables: TableInfo[]): TableInfo[] {
    const raw = localStorage.getItem('waiter_table_state');
    if (!raw) {
      return baseTables;
    }

    try {
      const saved: Array<Partial<TableInfo> & { id: number }> = JSON.parse(raw);

      return baseTables.map((table) => {
        const local = saved.find((x) => x.id === table.id);
        if (!local) return table;

        return {
          ...table,
          guests: local.guests ?? table.guests,
          server: local.server ?? table.server,
          updatedAt: local.updatedAt ?? table.updatedAt,
          items: local.items ?? table.items,
          note: local.note ?? table.note,
          orderId: local.orderId ?? table.orderId,
          status: (local.status as TableInfo['status']) ?? table.status,
        };
      });
    } catch {
      return baseTables;
    }
  }
}
