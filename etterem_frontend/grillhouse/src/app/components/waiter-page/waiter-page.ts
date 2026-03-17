import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, firstValueFrom } from 'rxjs';
import type { jsPDF as JsPdfType } from 'jspdf';

import { AuthService } from '../../services/auth';
import { TableInfo, TableOrderItem } from '../../models/table-info.model';
import { PaymentMethod } from '../../models/payment-method.model';
import {
  WaiterService,
  MenuCategoryDto,
  MenuItemDto,
  TableOrderDetailsDto,
} from '../../services/waiter.service';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [],
  templateUrl: './waiter-page.html',
  styleUrl: './waiter-page.css',
})
export class WaiterPageComponent implements OnInit, OnDestroy {
  constructor(
    public auth: AuthService,
    private router: Router,
    private waiterService: WaiterService,
    private realtimeService: RealtimeService,
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
  private stopTableStatusListening: (() => void) | null = null;

  ngOnInit(): void {
    this.loadWaiterPage();

    this.stopTableStatusListening = this.realtimeService.listenToTableStatusChanges((event) => {
      const tableToKeepSelected = this.selected?.id ?? event.table_id;
      this.loadWaiterPage(tableToKeepSelected);
    });
  }

  ngOnDestroy(): void {
    this.stopTableStatusListening?.();
    this.stopTableStatusListening = null;
  }

  get occupiedCount(): number {
    return this.tables.filter(
      (t) => t.status === 'Asztalnál' || t.status === 'Fizetésre vár'
    ).length;
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
                  status: 'Szabad',
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
    if (!table || table.status !== 'Fizetésre vár' || !table.orderId) return;

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
            status: 'Szabad',
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

  async printReceipt(tableId: number): Promise<void> {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return;

    if (!table.items?.length) {
      alert('Ehhez az asztalhoz nincs nyomtathato tetel.');
      return;
    }

    try {
      const { default: JsPDF } = await import('jspdf');

      const doc = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const left = 14;
      const right = 196;
      let y = 18;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('GRILLHOUSE - NYUGTA', left, y);
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Asztal: ${table.name}`, left, y);
      y += 6;
      doc.text(`Statusz: ${table.status}`, left, y);
      y += 6;
      doc.text(`Pincer: ${table.server || '-'}`, left, y);
      y += 6;
      doc.text(`Nyomtatas ideje: ${new Date().toLocaleString('hu-HU')}`, left, y);
      y += 8;

      doc.setDrawColor(120);
      doc.line(left, y, right, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Tetel', left, y);
      doc.text('Db', 128, y, { align: 'right' });
      doc.text('Egysegar', 158, y, { align: 'right' });
      doc.text('Osszesen', right, y, { align: 'right' });
      y += 5;

      doc.setDrawColor(80);
      doc.line(left, y, right, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      table.items.forEach((item) => {
        const lineTotal = item.qty * item.price;
        const nameLines = doc.splitTextToSize(item.name, 92) as string[];
        const rowHeight = Math.max(nameLines.length * 5, 5);

        if (y + rowHeight + 16 > 286) {
          this.addReceiptPageHeader(doc);
          y = 28;
        }

        doc.text(nameLines, left, y);
        doc.text(String(item.qty), 128, y, { align: 'right' });
        doc.text(this.formatFt(item.price), 158, y, { align: 'right' });
        doc.text(this.formatFt(lineTotal), right, y, { align: 'right' });

        y += rowHeight + 2;
      });

      doc.line(left, y, right, y);
      y += 9;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Vegosszeg: ${this.formatFt(this.calcTotal(table))}`, right, y, { align: 'right' });
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Koszonjuk, hogy a Grillhouse-t valasztotta!', left, y);

      doc.save(`nyugta-${table.id}-${this.getReceiptTimestamp(new Date())}.pdf`);
    } catch (err) {
      console.error('RECEIPT PDF ERROR:', err);
      alert('Nem sikerült letölteni a nyugtát PDF-ként.');
    }
  }

  private addReceiptPageHeader(doc: JsPdfType): void {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GRILLHOUSE - NYUGTA (folytatas)', 14, 18);
    doc.setDrawColor(120);
    doc.line(14, 22, 196, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
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

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  onEndShift(): void {
    // End the current shift (without logging out) and navigate to user data page
    this.auth.endShift().subscribe({
      next: () => {
        this.router.navigateByUrl('/waiter/user');
      },
      error: (err) => {
        console.error('END SHIFT ERROR:', err);
        alert('A műszak leadása sikertelen.');
      }
    });
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
      return 'CLOSED';
    }

    return 'Asztalnál';
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
            status: table.status === 'CLOSED' ? 'CLOSED' : 'Asztalnál',
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
