import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';
import { Router } from '@angular/router';

interface CreateReservationPayload {
  guest_name: string;
  phone_number: string;
  guest_count: number;
  start_time: string;
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
    private router: Router
  ) {}

  name = '';
  phoneNumber = '';
  date = '';
  time = '';
  guests = 2;
  minDate = '';

  submitting = false;
  successMessage = '';
  errorMessage = '';
  redirecting = false;
  private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly allTimes: string[] = this.generateAllTimes();
  availableTimes: string[] = [];

  ngOnInit(): void {
    this.minDate = this.toDateInputValue(new Date());
    this.date = this.minDate;
    this.refreshTimeOptions();
  }

  ngOnDestroy(): void {
    if (this.redirectTimeoutId) {
      clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
    }
  }

  onDateChange(): void {
    this.refreshTimeOptions();
  }

  submitReservation(): void {
    if (this.redirecting) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    const guestName = this.name.trim();
    const phone = this.phoneNumber.trim();

    if (!guestName || !phone || !this.date || !this.time || this.guests < 1) {
      this.errorMessage = 'Kérlek tölts ki minden mezőt helyesen.';
      return;
    }

    const startTime = this.toUtcIso(this.date, this.time);
    if (!startTime) {
      this.errorMessage = 'Érvénytelen dátum vagy időpont.';
      return;
    }

    this.submitting = true;
    const payload: CreateReservationPayload = {
      guest_name: guestName,
      phone_number: phone,
      guest_count: this.guests,
      start_time: startTime,
    };

    this.http
      .post<ReservationResponse>(`${this.config.apiUrl}/reservations`, payload)
      .subscribe({
        next: (reservation: ReservationResponse) => {
          this.successMessage = 'Sikeres foglalás!';
          this.phoneNumber = '';
          this.guests = 2;
          this.submitting = false;
          this.redirecting = true;

          if (this.redirectTimeoutId) {
            clearTimeout(this.redirectTimeoutId);
          }

          this.redirectTimeoutId = setTimeout(() => {
            this.router.navigateByUrl('/');
          }, 3000);
        },
        error: (err: unknown) => {
          this.errorMessage = this.extractErrorMessage(err);
          this.submitting = false;
          this.redirecting = false;
        },
      });
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
