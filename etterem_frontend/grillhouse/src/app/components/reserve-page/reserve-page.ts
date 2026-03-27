import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

interface CreateReservationPayload {
  guest_name: string;
  phone_number: string;
  guest_count: number;
  start_time: string;
  note?: string | null;
}

interface ReservationResponse {
  id: number;
  table_id: number;
  guest_name: string;
  phone_number: string | null;
  start_time: string;
  end_time: string;
  guest_count: number;
}

interface MaxCapacityResponse {
  max_capacity: number;
}

@Component({
  selector: 'app-reserve-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reserve-page.html',
  styleUrl: './reserve-page.css',
})
export class ReservePageComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  name = '';
  phoneNumber = '';
  date = '';
  time = '';
  guests: number | null = null;
  note = '';
  minDate = '';

  submitting = false;
  showResultModal = false;
  resultTitle = '';
  resultMessage = '';
  isResultSuccess = false;
  maxTableCapacity: number | null = null;
  @Input() embeddedMode = false;
  @Output() closeRequested = new EventEmitter<void>();

  readonly allTimes: string[] = this.generateAllTimes();
  availableTimes: string[] = [];

  ngOnInit(): void {
    this.minDate = this.toDateInputValue(new Date());
    this.date = this.minDate;
    this.refreshTimeOptions();
    this.loadMaxTableCapacity();
  }

  onDateChange(): void {
    this.refreshTimeOptions();
  }

  submitReservation(): void {
    this.showResultModal = false;

    const guestName = this.name.trim();
    const phone = this.phoneNumber.trim();
    const guestCount = Number(this.guests);

    if (!guestName || !phone || !this.date || !this.time || !guestCount || guestCount < 1) {
      this.openResultModal(false, 'Sikertelen foglalás', 'Kérlek tölts ki minden mezőt helyesen.');
      return;
    }

    if (this.maxTableCapacity !== null && guestCount > this.maxTableCapacity) {
      this.openResultModal(
        false,
        'Sikertelen foglalás',
        'Nincs ekkora asztal az étteremben a megadott létszámhoz.'
      );
      return;
    }

    const startTime = this.toUtcIso(this.date, this.time);
    if (!startTime) {
      this.openResultModal(false, 'Sikertelen foglalás', 'Érvénytelen dátum vagy időpont.');
      return;
    }

    this.submitting = true;
    const payload: CreateReservationPayload = {
      guest_name: guestName,
      phone_number: phone,
      guest_count: guestCount,
      start_time: startTime,
      note: this.note.trim() || null,
    };

    this.http
      .post<ReservationResponse>(`${this.config.apiUrl}/reservations`, payload)
      .pipe(finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.openResultModal(true, 'Sikeres foglalás', 'A foglalás sikeresen rögzítve lett.');
          this.name = '';
          this.phoneNumber = '';
          this.guests = null;
          this.note = '';
          this.time = this.availableTimes[0] ?? '';
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          const rawMessage = this.extractErrorMessage(err);
          this.openResultModal(
            false,
            'Sikertelen foglalás',
            this.normalizeReservationError(rawMessage)
          );
          this.cdr.detectChanges();
        },
      });
  }

  closeResultModal(): void {
    this.showResultModal = false;
  }

  backToHome(): void {
    this.showResultModal = false;
    if (this.embeddedMode) {
      this.closeRequested.emit();
      return;
    }

    this.router.navigateByUrl('/');
  }

  private openResultModal(isSuccess: boolean, title: string, message: string): void {
    this.isResultSuccess = isSuccess;
    this.resultTitle = title;
    this.resultMessage = message;
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  private loadMaxTableCapacity(): void {
    this.http
      .get<MaxCapacityResponse>(`${this.config.apiUrl}/tables/max-capacity`)
      .subscribe({
        next: (res) => {
          this.maxTableCapacity = Number(res?.max_capacity ?? 0);
        },
        error: () => {
          this.maxTableCapacity = null;
        },
      });
  }

  private normalizeReservationError(message: string): string {
    const normalized = (message || '').toLowerCase();

    if (normalized.includes('nincs ekkora asztal')) {
      return 'Nincs ekkora asztal az étteremben a megadott létszámhoz.';
    }

    if (normalized.includes('nincs szabad asztal')) {
      return 'Nincs szabad asztal ebben az időpontban.';
    }

    return message;
  }

  private toUtcIso(dateValue: string, timeValue: string): string | null {
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute)
    ) {
      return null;
    }

    const localDate = new Date(year, month - 1, day, hour, minute, 0);

    if (Number.isNaN(localDate.getTime())) {
      return null;
    }

    return localDate.toISOString().replace('.000Z', 'Z');
  }

  private refreshTimeOptions(): void {
    const selected = this.parseLocalDate(this.date);

    if (!selected) {
      this.availableTimes = this.allTimes;
      this.time = this.availableTimes[0] ?? '';
      return;
    }

    if (!this.isToday(selected)) {
      this.availableTimes = this.allTimes;
      if (!this.availableTimes.includes(this.time)) {
        this.time = this.availableTimes[0] ?? '';
      }
      return;
    }

    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes() + 1;

    this.availableTimes = this.allTimes.filter((slot) => {
      const [hourPart, minutePart] = slot.split(':').map(Number);
      const slotMinuteOfDay = hourPart * 60 + minutePart;
      return slotMinuteOfDay >= minuteOfDay;
    });

    if (!this.availableTimes.includes(this.time)) {
      this.time = this.availableTimes[0] ?? '';
    }
  }

  private generateAllTimes(): string[] {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
    return times;
  }

  private toDateInputValue(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  }

  private parseLocalDate(dateValue: string): Date | null {
    if (!dateValue) {
      return null;
    }

    const parsed = new Date(`${dateValue}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  private extractErrorMessage(error: unknown): string {
    const errorObj = error as {
      error?: {
        message?: unknown;
        errors?: Record<string, unknown>;
      };
    };

    const message = errorObj?.error?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    const validationErrors = errorObj?.error?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstMessage = Object.values(validationErrors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value) => typeof value === 'string' && value.trim());

      if (typeof firstMessage === 'string') {
        return firstMessage;
      }
    }

    return 'Nem sikerült a foglalás. Próbáld újra később.';
  }
}
