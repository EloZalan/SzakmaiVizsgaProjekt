import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth';
import { TableInfo, TableOrderItem } from '../../models/table-info.model';
import { PaymentMethod } from '../../models/payment-method.model';
import {
  WaiterService,
  MenuCategoryDto,
  MenuItemDto,
  TableOrderDetailsDto,
} from '../../services/waiter.service';

@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [],
  templateUrl: './waiter-page.html',
  styleUrl: './waiter-page.css',
})
export class WaiterPageComponent implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
    private waiterService: WaiterService,
    private cdr: ChangeDetectorRef
  ) {}

  mode: 'details' | 'payment' = 'details';
  paymentMethod: PaymentMethod = 'CARD';
  tipPreset: 0 | 10 | 12 | 15 = 10;
  readonly tipPresets: ReadonlyArray<0 | 10 | 12 | 15> = [0, 10, 12, 15];
  private readonly ftFormatter = new Intl.NumberFormat('hu-HU', {
    maximumFractionDigits: 0,
  });

  tables: TableInfo[] = [];
  selected: TableInfo | null = null;

  menuCategories: MenuCategoryDto[] = [];
  menuItems: MenuItemDto[] = [];

  loading = false;
  errorMessage = '';
  detailsLoading = false;

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
      .subscribe({
        next: ({ tables, menuData }) => {
          this.loading = false;
          this.tables = tables;
          this.menuCategories = menuData.categories;
          this.menuItems = menuData.items;

          const targetId = selectedTableId ?? this.selected?.id ?? null;

          if (targetId !== null) {
            this.selected = this.tables.find((t) => t.id === targetId) ?? null;
          } else {
            this.selected = null;
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Nem sikerült betölteni a pincér felület adatait.';
          console.error('WAITER PAGE LOAD ERROR:', err);
          this.cdr.markForCheck();
        },
      });
  }

  selectTable(t: TableInfo): void {
    if (t.status === 'FREE') {
      return;
    }

    if (t.status === 'RESERVED') {
      this.mode = 'details';
      this.detailsLoading = false;
      this.selected = t;
      this.cdr.markForCheck();
      return;
    }

    this.mode = 'details';
    this.detailsLoading = true;
    this.selected = t;

    this.waiterService.getTableOrder(t.id).subscribe({
      next: (order: TableOrderDetailsDto) => {
        const items: TableOrderItem[] = (order.items || []).map((it) => ({
          menuItemId: it.menu_item_id,
          name: it.name ?? 'Tétel',
          qty: it.quantity,
          price: it.price ?? 0,
        }));

        const hasOrder = typeof order.order_id === 'number' && !!order.status;

        const status: TableInfo['status'] = hasOrder
          ? this.mapOrderStatus(order.status)
          : 'OCCUPIED';

        this.tables = this.tables.map((tbl) =>
          tbl.id !== t.id
            ? tbl
            : {
                ...tbl,
                status,
                items,
                orderId: hasOrder ? order.order_id : null,
                updatedAt: hasOrder ? this.formatOpenedAt(order.opened_at) : '-',
              }
        );

        this.selected = this.tables.find((tbl) => tbl.id === t.id) ?? null;
        this.detailsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const status = this.getHttpStatus(err);
        const message = this.getErrorMessage(err);

        if (status === 400 && message?.includes('Nincs érvényes foglalás')) {
          this.tables = this.tables.map((tbl) =>
            tbl.id !== t.id
              ? tbl
              : {
                  ...tbl,
                  status: 'FREE',
                  guests: 0,
                  items: [],
                  note: undefined,
                  orderId: null,
                  updatedAt: '-',
                }
          );
          this.selected = null;
        } else if (message) {
          alert(message);
        }

        this.detailsLoading = false;
        console.error('GET TABLE ORDER ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  clearSelection(): void {
    this.selected = null;
    this.mode = 'details';
  }

  // ... (calcTotal, tipAmount, grandTotal, perGuest marad változatlan)

  calcTotal(t: TableInfo): number {
    return (t.items || []).reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  formatFt(value: number): string {
    return `${this.ftFormatter.format(value)} Ft`;
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
    if (!table || table.status !== 'NEEDS_PAYMENT' || !table.orderId) return;

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
    if (!table?.orderId || table.status !== 'NEEDS_PAYMENT') {
      alert('Csak fizetésre kész rendelést lehet lezárni.');
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
                updatedAt: '-',
              }
        );

        this.selected = this.tables.find((t) => t.id === tableId) ?? null;
        this.mode = 'details';
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (this.getHttpStatus(err) === 404) {
          this.clearOrderReference(tableId);
        }

        console.error('CONFIRM PAYMENT ERROR:', err);
        alert(this.getErrorMessage(err) ?? 'Nem sikerült a fizetést véglegesíteni.');
        this.cdr.markForCheck();
      },
    });
  }

  setClosedTableToFree(tableId: number): void {
    this.tables = this.tables.map((table) =>
      table.id !== tableId
        ? table
        : {
            ...table,
            status: 'FREE',
            guests: 0,
            items: [],
            note: undefined,
            orderId: null,
            updatedAt: '-',
          }
    );

    this.selected = null;
    this.mode = 'details';
    this.cdr.markForCheck();
  }

  async addItem(tableId: number): Promise<void> {
    void tableId;
    alert('A rendelésfelvétel mobil appban történik. Ezen a felületen csak fizettetés lehetséges.');
  }

  markReady(tableId: number): void {
    void tableId;
    alert('A rendelés státuszát mobil app kezeli. Ezen a felületen csak kész fizetések zárhatók.');
  }

  // ... (a többi privát metódus változatlan)

  printReceipt(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    const lines = [
      `${table.name}`,
      `Állapot: ${table.status}`,
      '',
      ...table.items.map((it) => `${it.name} x${it.qty} = ${this.formatFt(it.qty * it.price)}`),
      '',
      `Összesen: ${this.formatFt(this.calcTotal(table))}`,
    ];

    alert(lines.join('\n'));
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }



  private mergeOrderItem(items: TableOrderItem[], incoming: TableOrderItem): TableOrderItem[] {
    const existing = items.find((i) => i.menuItemId === incoming.menuItemId);
    if (!existing) return [...items, incoming];
    return items.map((i) =>
      i.menuItemId !== incoming.menuItemId ? i : { ...i, qty: i.qty + incoming.qty }
    );
  }

  private nowTime(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private formatOpenedAt(openedAt?: string | null): string {
    if (!openedAt) {
      return '-';
    }

    const date = new Date(openedAt);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private mapOrderStatus(status?: 'in_progress' | 'ready_to_pay' | 'done'): TableInfo['status'] {
    if (status === 'ready_to_pay') {
      return 'NEEDS_PAYMENT';
    }

    if (status === 'done') {
      return 'CLOSED';
    }

    return 'OCCUPIED';
  }

  private async openOrResolveOrderId(tableId: number): Promise<number> {
    try {
      const order = await firstValueFrom(this.waiterService.openOrder(tableId));
      return order.id;
    } catch (err) {
      const existingOrderId = this.getExistingOrderId(err);

      if (existingOrderId !== null) {
        return existingOrderId;
      }

      throw err;
    }
  }

  private clearOrderReference(tableId: number): void {
    this.tables = this.tables.map((table) =>
      table.id !== tableId
        ? table
        : {
            ...table,
            orderId: null,
            items: [],
            status: table.status === 'CLOSED' ? 'CLOSED' : 'OCCUPIED',
            updatedAt: '-',
          }
    );

    this.selected = this.tables.find((table) => table.id === tableId) ?? this.selected;
  }

  private getHttpStatus(error: unknown): number | null {
    const status = (error as { status?: unknown })?.status;
    return typeof status === 'number' ? status : null;
  }

  private getErrorMessage(error: unknown): string | null {
    const errorObj = (error as { error?: unknown })?.error;

    if (!errorObj || typeof errorObj !== 'object') {
      return null;
    }

    const message = (errorObj as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }

  private getExistingOrderId(error: unknown): number | null {
    const errorObj = (error as { error?: unknown })?.error;

    if (!errorObj || typeof errorObj !== 'object') {
      return null;
    }

    const orderId = (errorObj as { order_id?: unknown }).order_id;

    if (typeof orderId === 'number') {
      return orderId;
    }

    if (typeof orderId === 'string') {
      const parsed = Number(orderId);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
  }
}
