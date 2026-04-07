import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import {
  WaiterDailyReservationDto,
  WaiterDailyReservationOrderDto,
  WaiterService,
} from '../../services/waiter.service';
import { RealtimeService } from '../../services/realtime.service';

@Component({
  selector: 'app-waiter-reservations',
  standalone: true,
  imports: [],
  templateUrl: './waiter-reservations.html',
  styleUrl: './waiter-reservations.css',
})
export class WaiterReservationsComponent implements OnInit, OnDestroy {
  constructor(
    private waiterService: WaiterService,
    private realtimeService: RealtimeService,
    private cdr: ChangeDetectorRef
  ) {}

  loading = false;
  errorMessage = '';
  reservations: WaiterDailyReservationDto[] = [];
  expandedReservationId: number | null = null;

  private readonly ftFormatter = new Intl.NumberFormat('hu-HU', {
    maximumFractionDigits: 0,
  });
  private stopTableStatusListening: (() => void) | null = null;

  ngOnInit(): void {
    this.loadReservations();

    this.stopTableStatusListening = this.realtimeService.listenToTableStatusChanges(() => {
      this.waiterService.invalidateTodayReservationsCache();
      this.loadReservations();
    });
  }

  ngOnDestroy(): void {
    this.stopTableStatusListening?.();
    this.stopTableStatusListening = null;
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.waiterService.getTodayReservationsWithOrders().subscribe({
      next: (reservations) => {
        this.loading = false;
        this.reservations = [...reservations].sort((a, b) => {
          const aTime = new Date(a.start_time).getTime();
          const bTime = new Date(b.start_time).getTime();
          return aTime - bTime;
        });

        if (
          this.expandedReservationId !== null &&
          !this.reservations.some((r) => r.reservation_id === this.expandedReservationId)
        ) {
          this.expandedReservationId = null;
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Nem sikerült betölteni a mai foglalásokat.';
        console.error('DAILY RESERVATIONS LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  toggleReservation(reservationId: number): void {
    this.expandedReservationId =
      this.expandedReservationId === reservationId ? null : reservationId;
  }

  isExpanded(reservationId: number): boolean {
    return this.expandedReservationId === reservationId;
  }

  formatFt(value: number): string {
    return `${this.ftFormatter.format(value)} Ft`;
  }

  formatDateTime(dateTime?: string | null): string {
    if (!dateTime) {
      return '-';
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  displayGuestName(name: string): string {
    const normalized = (name ?? '').trim().toLowerCase();

    if (normalized === 'walk-in guest') {
      return 'Helyszíni vendég';
    }

    return name;
  }

  canPrintReceipt(reservation: WaiterDailyReservationDto): boolean {
    return (
      !!reservation.order?.items?.length &&
      reservation.order?.status === 'done'
    );
  }

  getClosingTime(reservation: WaiterDailyReservationDto): string | null {
    if (reservation.order?.status === 'done') {
      return reservation.closed_at ?? reservation.end_time;
    }

    return reservation.end_time;
  }

  getOrderStatusLabel(status?: WaiterDailyReservationOrderDto['status']): string {
    if (status === 'ready_to_pay') {
      return 'Fizetésre vár';
    }

    if (status === 'done') {
      return 'Lezárt';
    }

    return 'Folyamatban';
  }

  getReservationTotal(reservation: WaiterDailyReservationDto): number {
    if (!reservation.order) {
      return 0;
    }

    return reservation.order.total_price;
  }

  getPerGuestTotal(reservation: WaiterDailyReservationDto): number {
    const guestCount = Math.max(1, reservation.guest_count || 1);
    return this.getReservationTotal(reservation) / guestCount;
  }

  async printReceipt(reservation: WaiterDailyReservationDto): Promise<void> {
    if (!reservation.order?.items?.length) {
      alert('Ehhez a foglaláshoz nincs nyomtatható rendelés.');
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
      doc.text(`Foglalas: #${reservation.reservation_id}`, left, y);
      y += 4;
      doc.text(`Asztal: ${reservation.table_id}`, left, y);
      y += 4;
      doc.text(`Vendeg: ${this.displayGuestName(reservation.guest_name)}`, left, y);
      y += 4;
      doc.text(`Letszam: ${reservation.guest_count} fo`, left, y);
      y += 4;
      doc.text(`Datum: ${new Date().toLocaleString('hu-HU')}`, left, y);
      y += 3;

      doc.line(left, y, right, y);
      y += 4;

      reservation.order.items.forEach((item) => {
        const nameLines = doc.splitTextToSize(item.name, 44) as string[];
        doc.setFont('courier', 'bold');
        doc.text(nameLines, left, y);
        y += nameLines.length * 3.7;

        doc.setFont('courier', 'normal');
        doc.text(`${item.quantity} x ${this.formatFt(item.price)}`, left, y);
        doc.text(this.formatFt(item.line_total), right, y, { align: 'right' });
        y += 4.5;
      });

      y += 1;
      doc.line(left, y, right, y);
      y += 4;

      const foodAndDrinkTotal = reservation.order.total_price;

      doc.setFont('courier', 'normal');
      doc.text('Etel + ital osszesen:', left, y);
      doc.text(this.formatFt(foodAndDrinkTotal), right, y, { align: 'right' });
      y += 4;

      doc.setFont('courier', 'bold');
      doc.text('Fizetendo vegosszeg:', left, y);
      doc.text(this.formatFt(foodAndDrinkTotal), right, y, { align: 'right' });
      y += 6;

      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('Koszonjuk, hogy a Grillhouse-t valasztotta!', center, y, { align: 'center' });

      doc.save(`nyugta-foglalas-${reservation.reservation_id}-${this.getReceiptTimestamp(new Date())}.pdf`);
    } catch (err) {
      console.error('DAILY RESERVATION RECEIPT PDF ERROR:', err);
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
}
