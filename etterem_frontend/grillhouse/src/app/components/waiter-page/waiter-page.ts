import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
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
  imports: [CurrencyPipe],
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
          this.tables = this.restoreLocalState(tables);
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
    // A pincér felület nem indíthat új rendelést; csak meglévő rendeléshez lehet váltani.
    if (t.status === 'FREE') {
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

        const status: TableInfo['status'] =
          order.status === 'ready_to_pay'
            ? 'NEEDS_PAYMENT'
            : order.status === 'done'
            ? 'CLOSED'
            : 'OCCUPIED';

        this.tables = this.tables.map((tbl) =>
          tbl.id !== t.id
            ? tbl
            : {
                ...tbl,
                status,
                items,
                orderId: order.order_id,
                updatedAt: this.nowTime(),
              }
        );

        this.selected = this.tables.find((tbl) => tbl.id === t.id) ?? null;
        this.detailsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Ha nincs aktív rendelés (400), akkor az asztal szabad marad, üres tételekkel
        if (err?.status === 400) {
          this.tables = this.tables.map((tbl) =>
            tbl.id !== t.id
              ? tbl
              : {
                  ...tbl,
                  status: 'FREE',
                  items: [],
                  orderId: null,
                  updatedAt: this.nowTime(),
                }
          );
          this.selected = this.tables.find((tbl) => tbl.id === t.id) ?? null;
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('CONFIRM PAYMENT ERROR:', err);
        alert('Nem sikerült a fizetést véglegesíteni.');
        this.cdr.markForCheck();
      },
    });
  }

  async addItem(tableId: number): Promise<void> {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    // ... (promptok és validációk változatlanul)
    const menuItemIdInput = prompt('Add meg a menü tétel ID-ját:');
    if (menuItemIdInput === null) return;
    const quantityInput = prompt('Mennyiség:', '1');
    if (quantityInput === null) return;
    const menuItemId = Number(menuItemIdInput);
    const quantity = Number(quantityInput);

    const menuItem = this.menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) return;

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
      this.cdr.markForCheck();
    } catch (err) {
      console.error('ADD ITEM ERROR:', err);
      this.cdr.markForCheck();
    }
  }

  markReady(tableId: number): void {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table?.orderId) return;

    this.waiterService.markReadyToPay(table.orderId).subscribe({
      next: () => {
        this.tables = this.tables.map((t) =>
          t.id !== tableId
            ? t
            : { ...t, status: 'NEEDS_PAYMENT', updatedAt: this.nowTime() }
        );
        this.persistLocalState();
        this.selected = this.tables.find((t) => t.id === tableId) ?? null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('MARK READY ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  // ... (a többi privát metódus változatlan)

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
    if (!existing) return [...items, incoming];
    return items.map((i) =>
      i.menuItemId !== incoming.menuItemId ? i : { ...i, qty: i.qty + incoming.qty }
    );
  }

  private nowTime(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private persistLocalState(): void {
    localStorage.setItem('waiter_table_state', JSON.stringify(this.tables));
  }

  private restoreLocalState(baseTables: TableInfo[]): TableInfo[] {
    const raw = localStorage.getItem('waiter_table_state');
    if (!raw) return baseTables;
    try {
      const saved: any[] = JSON.parse(raw);
      return baseTables.map(table => {
        const local = saved.find(x => x.id === table.id);
        return local ? { ...table, ...local } : table;
      });
    } catch { return baseTables; }
  }
}
