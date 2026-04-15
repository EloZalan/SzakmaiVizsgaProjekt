import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, firstValueFrom, interval, Subscription } from 'rxjs';

import { TableInfo, TableOrderItem } from '../../models/table-info.model';
import { PaymentMethod } from '../../models/payment-method.model';
import {
  WaiterService,
  MenuCategoryDto,
  MenuItemDto,
  TableOrderDetailsDto,
} from '../../services/waiter.service';

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './waiter-dashboard.html',
  styleUrl: './waiter-dashboard.css',
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  constructor(
    private waiterService: WaiterService,
    private cdr: ChangeDetectorRef
  ) {}

  mode: 'details' | 'payment' = 'details';
  showCardModal = false;
  showCashModal = false;
  pendingPaymentTableId: number | null = null;
  pendingPaymentOrderId: number | null = null;
  processingPayment = false;
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
  private hasLoadedOnce = false;
  private isRequestInFlight = false;
  private pollSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.loadWaiterPage();

    this.pollSubscription = interval(10000).subscribe(() => {
      if (this.isRequestInFlight) {
        return;
      }

      this.waiterService.invalidateTablesCache();
      this.waiterService.invalidateMenuDataCache();
      this.waiterService.invalidateTodayReservationsCache();
      const hasSelectedTable = this.selected !== null;
      const tableToKeepSelected = this.selected?.id ?? null;
      this.loadWaiterPage(tableToKeepSelected, hasSelectedTable, true);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  get occupiedCount(): number {
    return this.tables.filter((t) => t.status === 'Foglalt').length;
  }

  get freeCount(): number {
    return this.tables.filter((t) => t.status === 'Szabad').length;
  }

  get needsPaymentCount(): number {
    return this.tables.filter((t) => t.status === 'Fizetésre vár').length;
  }

  get guestsTotal(): number {
    return this.tables.reduce((sum, t) => sum + (t.guests || 0), 0);
  }

  loadWaiterPage(selectedTableId?: number | null, reloadSelectedOrder = false, silent = false): void {
    if (this.isRequestInFlight) {
      return;
    }

    this.isRequestInFlight = true;

    if (!silent || !this.hasLoadedOnce) {
      this.loading = true;
    }

    if (!silent) {
      this.errorMessage = '';
    }

    forkJoin({
      tables: this.waiterService.getTables(),
      menuData: this.waiterService.getMenuData(),
    })
      .subscribe({
        next: ({ tables, menuData }) => {
          this.isRequestInFlight = false;
          this.loading = false;
          this.hasLoadedOnce = true;
          this.tables = tables;
          this.menuCategories = menuData.categories;
          this.menuItems = menuData.items;

          const targetId = selectedTableId ?? this.selected?.id ?? null;

          if (targetId !== null) {
            this.selected = this.tables.find((t) => t.id === targetId) ?? null;
          } else {
            this.selected = null;
          }

          if (
            reloadSelectedOrder &&
            this.selected &&
            this.selected.status !== 'Szabad' &&
            this.selected.status !== 'Foglalt'
          ) {
            this.refreshSelectedOrder(this.selected.id);
            return;
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isRequestInFlight = false;
          this.loading = false;
          if (!silent || !this.hasLoadedOnce) {
            this.errorMessage = 'Nem sikerült betölteni a pincér felület adatait.';
          }
          console.error('WAITER PAGE LOAD ERROR:', err);
          this.cdr.markForCheck();
        },
      });
  }

  selectTable(t: TableInfo): void {
    if (t.status === 'Szabad') {
      return;
    }

    if (t.status === 'Foglalt') {
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
        this.applyOrderDetailsToTable(t.id, order);
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
                  status: 'Szabad',
                  guests: 0,
                  items: [],
                  note: undefined,
                  reservationName: undefined,
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

  calcTotal(t: TableInfo): number {
    return (t.items || []).reduce((sum, it) => sum + it.qty * it.price, 0);
  }

  formatFt(value: number): string {
    return `${this.ftFormatter.format(value)} Ft`;
  }

  getStatusLabel(status: TableInfo['status']): string {
    return status;
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

  canOpenPayment(table: TableInfo): boolean {
    return table.status === 'Fizetésre vár' && !!table.orderId;
  }

  canPrintReceipt(table: TableInfo): boolean {
    return table.status === 'Szabad' && !!table.items?.length;
  }

  openPayment(tableId: number): void {
    const table = this.tables.find((x) => x.id === tableId);
    if (!table || !this.canOpenPayment(table)) return;

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
    if (!table?.orderId || table.status !== 'Fizetésre vár') {
      alert('Csak fizetésre kész rendelést lehet lezárni.');
      return;
    }

    const backendMethod = this.paymentMethod === 'CARD' ? 'card' : 'cash';

    this.pendingPaymentTableId = tableId;
    this.pendingPaymentOrderId = table.orderId;

    if (backendMethod === 'card') {
      this.showCardModal = true;
      this.processCardPayment();
    } else {
      this.showCashModal = true;
      this.processCashPayment();
    }
  }

  private processCardPayment(): void {
    if (!this.pendingPaymentOrderId || !this.pendingPaymentTableId) return;
    this.processingPayment = true;
    const tip = this.tipAmount(this.tables.find((t) => t.id === this.pendingPaymentTableId) ?? ({} as TableInfo));

    const delayMs = 3500;
    setTimeout(() => {
      this.waiterService.payOrderWithTip(this.pendingPaymentOrderId!, 'card', tip).subscribe({
        next: () => {
          this.finalizePayment(this.pendingPaymentTableId!);
        },
        error: (err) => {
          console.error('CARD PAYMENT ERROR:', err);
          alert(this.getErrorMessage(err) ?? 'Nem sikerült a banki fizetést.');
          this.showCardModal = false;
        },
        complete: () => {
          this.processingPayment = false;
          this.showCardModal = false;
        }
      });
    }, delayMs);
  }

  private processCashPayment(): void {
    if (!this.pendingPaymentOrderId || !this.pendingPaymentTableId) return;
    this.processingPayment = true;
    const tip = this.tipAmount(this.tables.find((t) => t.id === this.pendingPaymentTableId) ?? ({} as TableInfo));

    const delayMs = 3500;
    setTimeout(() => {
      this.waiterService.payOrderWithTip(this.pendingPaymentOrderId!, 'cash', tip).subscribe({
        next: () => {
          this.finalizePayment(this.pendingPaymentTableId!);
        },
        error: (err) => {
          console.error('CASH PAYMENT ERROR:', err);
          alert(this.getErrorMessage(err) ?? 'Nem sikerült a készpénzes fizetést.');
          this.showCashModal = false;
        },
        complete: () => {
          this.processingPayment = false;
          this.showCashModal = false;
        }
      });
    }, delayMs);
  }

  private finalizePayment(tableId: number): void {
    this.waiterService.invalidateTablesCache();
    this.waiterService.invalidateTodayReservationsCache();

    this.tables = this.tables.map((t) =>
      t.id !== tableId
        ? t
        : {
            ...t,
            status: 'Szabad',
            guests: 0,
            items: [],
            note: undefined,
            reservationName: undefined,
            orderId: null,
            updatedAt: '-',
          }
    );

    this.selected = null;
    this.mode = 'details';
    this.pendingPaymentOrderId = null;
    this.pendingPaymentTableId = null;
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

  async printReceipt(tableId: number): Promise<void> {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    if (!this.canPrintReceipt(table)) {
      return;
    }

    if (!table.items?.length) {
      alert('Ehhez az asztalhoz nincs nyomtathato tetel.');
      return;
    }

    try {
      const { default: JsPDF } = await import('jspdf');

      const doc = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 220],
      });

      const left = 6;
      const right = 74;
      const center = 40;
      let y = 10;

      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.text('GRILLHOUSE', center, y, { align: 'center' });
      y += 5;
      doc.setFontSize(10);
      doc.text('ETTERMI NYUGTA', center, y, { align: 'center' });
      y += 5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`Asztal: ${table.name}`, left, y);
      y += 4;
      doc.text(`Statusz: ${table.status}`, left, y);
      y += 4;
      doc.text(`Pincer: ${table.server || '-'}`, left, y);
      y += 4;
      doc.text(`Datum: ${new Date().toLocaleString('hu-HU')}`, left, y);
      y += 3;

      doc.line(left, y, right, y);
      y += 4;

      table.items.forEach((item) => {
        const lineTotal = item.qty * item.price;
        const nameLines = doc.splitTextToSize(item.name, 44) as string[];

        doc.setFont('courier', 'bold');
        doc.text(nameLines, left, y);
        y += nameLines.length * 3.7;

        doc.setFont('courier', 'normal');
        doc.text(`${item.qty} x ${this.formatFt(item.price)}`, left, y);
        doc.text(this.formatFt(lineTotal), right, y, { align: 'right' });
        y += 4.5;
      });

      y += 1;
      doc.line(left, y, right, y);
      y += 4;

      doc.setFont('courier', 'bold');
      doc.text('Fizetendo vegosszeg:', left, y);
      doc.text(this.formatFt(this.calcTotal(table)), right, y, { align: 'right' });
      y += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('Koszonjuk, hogy a Grillhouse-t valasztotta!', center, y, { align: 'center' });

      doc.save(`nyugta-${table.id}-${this.getReceiptTimestamp(new Date())}.pdf`);
    } catch (err) {
      console.error('RECEIPT PDF ERROR:', err);
      alert('Nem sikerült letölteni a nyugtát PDF-ként.');
    }
  }

  private getReceiptTimestamp(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const sec = String(date.getSeconds()).padStart(2, '0');

    return `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
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
      return 'Fizetésre vár';
    }

    if (status === 'done') {
      return 'Szabad';
    }

    return 'Asztalnál';
  }

  private refreshSelectedOrder(tableId: number): void {
    this.waiterService.getTableOrder(tableId).subscribe({
      next: (order: TableOrderDetailsDto) => {
        this.applyOrderDetailsToTable(tableId, order);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('REALTIME ORDER REFRESH ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  private applyOrderDetailsToTable(tableId: number, order: TableOrderDetailsDto): void {
    const items: TableOrderItem[] = (order.items || []).map((it) => ({
      menuItemId: it.menu_item_id,
      name: it.name ?? 'Tétel',
      qty: it.quantity,
      price: it.price ?? 0,
    }));

    const hasOrder = typeof order.order_id === 'number' && !!order.status;

    const status: TableInfo['status'] = hasOrder
      ? this.mapOrderStatus(order.status)
      : 'Asztalnál';

    this.tables = this.tables.map((tbl) =>
      tbl.id !== tableId
        ? tbl
        : {
            ...tbl,
            status,
            items,
            orderId: hasOrder ? order.order_id : null,
            updatedAt: hasOrder ? this.formatOpenedAt(order.opened_at) : '-',
          }
    );

    this.selected = this.tables.find((tbl) => tbl.id === tableId) ?? null;
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
            status: 'Asztalnál',
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
