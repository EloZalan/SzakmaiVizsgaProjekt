import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { TableInfo } from '../../models/table-info.model';
import { PaymentMethod } from '../../models/payment-method.model';


@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './waiter-page.html',
})
export class WaiterPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  mode: 'details' | 'payment' = 'details';
  paymentMethod: PaymentMethod = 'CARD';
  tipPreset: 0 | 10 | 12 | 15 = 10;

  tables: TableInfo[] = [
    {
      id: 1,
      name: 'Table 1',
      status: 'OCCUPIED',
      guests: 2,
      server: 'Alex',
      updatedAt: '18:42',
      items: [
        { name: 'Signature Ribeye', qty: 1, price: 48 },
        { name: 'Cola', qty: 2, price: 4 },
      ],
      note: 'Medium-rare steak, extra sauce.',
    },
    {
      id: 2,
      name: 'Table 2',
      status: 'FREE',
      guests: 0,
      server: '—',
      updatedAt: '18:10',
      items: [],
    },
    {
      id: 3,
      name: 'Table 3',
      status: 'NEEDS_PAYMENT',
      guests: 4,
      server: 'Sam',
      updatedAt: '19:05',
      items: [
        { name: 'BBQ Brisket Platter', qty: 2, price: 36 },
        { name: 'Beer (sample)', qty: 4, price: 6 },
      ],
      note: 'Kérés: külön számla 2 részre (minta).',
    },
    {
      id: 4,
      name: 'Table 4',
      status: 'OCCUPIED',
      guests: 3,
      server: 'Alex',
      updatedAt: '19:12',
      items: [
        { name: 'Fall-Off-The-Bone Ribs', qty: 1, price: 42 },
        { name: 'Smoked Pulled Pork', qty: 1, price: 28 },
      ],
    },
    {
      id: 5,
      name: 'Table 5',
      status: 'FREE',
      guests: 0,
      server: '—',
      updatedAt: '17:55',
      items: [],
    },
    {
      id: 6,
      name: 'Table 6',
      status: 'NEEDS_PAYMENT',
      guests: 2,
      server: 'Sam',
      updatedAt: '19:18',
      items: [
        { name: 'Grilled Chicken Platter', qty: 2, price: 24 },
        { name: 'Lemonade', qty: 2, price: 5 },
      ],
    },
    {
      id: 7,
      name: 'Table 7',
      status: 'CLOSED',
      guests: 0,
      server: '—',
      updatedAt: '18:30',
      items: [],
    },
    {
      id: 8,
      name: 'Table 8',
      status: 'OCCUPIED',
      guests: 5,
      server: 'Alex',
      updatedAt: '19:20',
      items: [
        { name: 'Tomahawk Steak', qty: 1, price: 89 },
        { name: 'Cola', qty: 5, price: 4 },
      ],
    },
  ];

  selected: TableInfo | null = null;

  get occupiedCount(): number {
    return this.tables.filter(t => t.status === 'OCCUPIED' || t.status === 'NEEDS_PAYMENT').length;
  }

  get freeCount(): number {
    return this.tables.filter(t => t.status === 'FREE').length;
  }

  get needsPaymentCount(): number {
    return this.tables.filter(t => t.status === 'NEEDS_PAYMENT').length;
  }

  get guestsTotal(): number {
    return this.tables.reduce((sum, t) => sum + (t.guests || 0), 0);
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
    const table = this.tables.find(x => x.id === tableId);
    if (!table || table.status === 'CLOSED') return;

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
    this.tables = this.tables.map(t => {
      if (t.id !== tableId) return t;

      return {
        ...t,
        status: 'CLOSED',
        guests: 0,
        items: [],
        note: undefined,
        updatedAt: this.nowTime(),
      };
    });

    this.selected = this.tables.find(t => t.id === tableId) ?? null;
    this.mode = 'details';
  }

  addItem(tableId: number): void {
    // TODO: implement later
  }

  printReceipt(tableId: number): void {
    // TODO: implement later
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  private nowTime(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}