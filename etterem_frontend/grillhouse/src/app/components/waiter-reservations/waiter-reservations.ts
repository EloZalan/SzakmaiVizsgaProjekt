import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import {
  WaiterDailyReservationDto,
  WaiterDailyReservationOrderDto,
  WaiterService,
} from '../../services/waiter.service';

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
    private cdr: ChangeDetectorRef
  ) {}

  loading = false;
  errorMessage = '';
  reservations: WaiterDailyReservationDto[] = [];
  expandedReservationId: number | null = null;

  private readonly ftFormatter = new Intl.NumberFormat('hu-HU', {
    maximumFractionDigits: 0,
  });
  private hasLoadedOnce = false;
  private isRequestInFlight = false;
  private pollSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.loadReservations();

    this.pollSubscription = interval(10000).subscribe(() => {
      if (this.isRequestInFlight) {
        return;
      }

      this.waiterService.invalidateTodayReservationsCache();
      this.loadReservations(true);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  loadReservations(silent = false): void {
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

    this.waiterService.getTodayReservationsWithOrders().subscribe({
      next: (reservations) => {
        this.isRequestInFlight = false;
        this.loading = false;
        this.hasLoadedOnce = true;
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
        this.isRequestInFlight = false;
        this.loading = false;
        if (!silent || !this.hasLoadedOnce) {
          this.errorMessage = 'Nem sikerült betölteni a mai foglalásokat.';
        }
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

      const [fontNormal, fontBold] = await Promise.all([
        fetch('fonts/DejaVuSansMono.ttf').then((r) => r.arrayBuffer()),
        fetch('fonts/DejaVuSansMono-Bold.ttf').then((r) => r.arrayBuffer()),
      ]);

      const toBase64 = (buf: ArrayBuffer): string => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

      const doc = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 220],
      });

      doc.addFileToVFS('DejaVuSansMono.ttf', toBase64(fontNormal));
      doc.addFont('DejaVuSansMono.ttf', 'DejaVuSansMono', 'normal');
      doc.addFileToVFS('DejaVuSansMono-Bold.ttf', toBase64(fontBold));
      doc.addFont('DejaVuSansMono-Bold.ttf', 'DejaVuSansMono', 'bold');

      const left = 6;
      const right = 74;
      const center = 40;
      let y = 10;

      doc.setFont('DejaVuSansMono', 'bold');
      doc.setFontSize(12);
      doc.text('GRILLHOUSE', center, y, { align: 'center' });
      y += 5;
      doc.setFontSize(10);
      doc.text('ÉTTERMI NYUGTA', center, y, { align: 'center' });
      y += 5;

      doc.setFont('DejaVuSansMono', 'normal');
      doc.setFontSize(8);
      doc.text(`Foglalás: #${reservation.reservation_id}`, left, y);
      y += 4;
      doc.text(`Asztal: ${reservation.table_id}`, left, y);
      y += 4;
      doc.text(`Vendég: ${this.displayGuestName(reservation.guest_name)}`, left, y);
      y += 4;
      doc.text(`Létszám: ${reservation.guest_count} fő`, left, y);
      y += 4;
      doc.text(`Dátum: ${new Date().toLocaleString('hu-HU')}`, left, y);
      y += 3;

      doc.line(left, y, right, y);
      y += 4;

      reservation.order.items.forEach((item) => {
        const nameLines = doc.splitTextToSize(item.name, 44) as string[];
        doc.setFont('DejaVuSansMono', 'bold');
        doc.text(nameLines, left, y);
        y += nameLines.length * 3.7;

        doc.setFont('DejaVuSansMono', 'normal');
        doc.text(`${item.quantity} x ${this.formatFt(item.price)}`, left, y);
        doc.text(this.formatFt(item.line_total), right, y, { align: 'right' });
        y += 4.5;
      });

      y += 1;
      doc.line(left, y, right, y);
      y += 4;

      const foodAndDrinkTotal = reservation.order.total_price;

      doc.setFont('DejaVuSansMono', 'normal');
      doc.text('Étel + ital összesen:', left, y);
      doc.text(this.formatFt(foodAndDrinkTotal), right, y, { align: 'right' });
      y += 4;

      doc.setFont('DejaVuSansMono', 'bold');
      doc.text('Fizetendő végösszeg:', left, y);
      doc.text(this.formatFt(foodAndDrinkTotal), right, y, { align: 'right' });
      y += 6;

      doc.setFont('DejaVuSansMono', 'normal');
      doc.setFontSize(7);
      doc.text('Köszönjük, hogy a Grillhouse-t választotta!', center, y, { align: 'center' });

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
