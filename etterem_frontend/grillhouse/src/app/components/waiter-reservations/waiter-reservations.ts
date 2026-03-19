import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { jsPDF as JsPdfType } from 'jspdf';

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
export class WaiterReservationsComponent implements OnInit {
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

  ngOnInit(): void {
    this.loadReservations();
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

    return reservation.order.display_total ?? reservation.order.paid_total ?? reservation.order.total_price;
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
      doc.text(`Foglalas: #${reservation.reservation_id}`, left, y);
      y += 6;
      doc.text(`Asztal: Table ${reservation.table_id}`, left, y);
      y += 6;
      doc.text(`Vendeg: ${reservation.guest_name}`, left, y);
      y += 6;
      doc.text(`Letszam: ${reservation.guest_count} fo`, left, y);
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

      reservation.order.items.forEach((item) => {
        const nameLines = doc.splitTextToSize(item.name, 92) as string[];
        const rowHeight = Math.max(nameLines.length * 5, 5);

        if (y + rowHeight + 16 > 286) {
          this.addReceiptPageHeader(doc);
          y = 28;
        }

        doc.text(nameLines, left, y);
        doc.text(String(item.quantity), 128, y, { align: 'right' });
        doc.text(this.formatFt(item.price), 158, y, { align: 'right' });
        doc.text(this.formatFt(item.line_total), right, y, { align: 'right' });

        y += rowHeight + 2;
      });

      doc.line(left, y, right, y);
      y += 9;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Vegosszeg: ${this.formatFt(this.getReservationTotal(reservation))}`, right, y, {
        align: 'right',
      });
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Koszonjuk, hogy a Grillhouse-t valasztotta!', left, y);

      doc.save(`nyugta-foglalas-${reservation.reservation_id}-${this.getReceiptTimestamp(new Date())}.pdf`);
    } catch (err) {
      console.error('DAILY RESERVATION RECEIPT PDF ERROR:', err);
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
}
