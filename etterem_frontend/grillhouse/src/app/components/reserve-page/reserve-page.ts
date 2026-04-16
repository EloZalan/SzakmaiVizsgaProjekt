import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../services/config.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { LanguageService, Language } from '../../services/language.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import type { CreateReservationPayload } from '../../models/reserve-page-create-reservation-payload.model';
import type { ReservationResponse } from '../../models/reserve-page-reservation-response.model';
import type { MaxCapacityResponse } from '../../models/reserve-page-max-capacity-response.model';


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
    private businessHours: BusinessHoursService,
    private languageService: LanguageService,
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

  allTimes: string[] = [];
  availableTimes: string[] = [];
  currentLanguage: Language = 'hu';

  private readonly texts: Record<Language, Record<string, string>> = {
    hu: {
      title: 'Asztalfoglalás',
      subtitle: 'Foglalj asztalt néhány kattintással',
      nameLabel: 'Név',
      namePlaceholder: 'Kiss Pista',
      phoneLabel: 'Telefonszám',
      dateLabel: 'Dátum',
      timeLabel: 'Időpont',
      guestsLabel: 'Vendégek száma',
      noteLabel: 'Megjegyzés (opcionális)',
      notePlaceholder: 'Pl. születésnap, allergia, különleges kérés...',
      noSlots: 'Erre a napra már nincs foglalható idősáv. Válassz másik dátumot.',
      submitButton: 'Foglalás elküldése',
      sendingButton: 'Küldés...',
      successTitle: 'Sikeres foglalás',
      successMessage: 'A foglalás sikeresen rögzítve lett.',
      failTitle: 'Sikertelen foglalás',
      closeButton: 'Bezár',
      backHome: 'Vissza a főoldalra',
      fillAllFields: 'Kérlek tölts ki minden mezőt helyesen.',
      invalidDateTime: 'Érvénytelen dátum vagy időpont.',
      noTableCapacity: 'Nincs ekkora asztal az étteremben a megadott létszámhoz.',
      noTableTime: 'Nincs szabad asztal ebben az időpontban.',
      phoneInvalid: 'A telefonszám nem megfelelő formátumú. Használd a +36... formátumot.',
      networkError: 'Nem sikerült a foglalás. Próbáld újra később.',
    },
    en: {
      title: 'Table Reservation',
      subtitle: 'Book a table in a few clicks',
      nameLabel: 'Name',
      namePlaceholder: 'Jane Doe',
      phoneLabel: 'Phone number',
      dateLabel: 'Date',
      timeLabel: 'Time',
      guestsLabel: 'Number of guests',
      noteLabel: 'Note (optional)',
      notePlaceholder: 'E.g. birthday, allergy, special request...',
      noSlots: 'No time slots are available for that day. Choose another date.',
      submitButton: 'Send reservation',
      sendingButton: 'Sending...',
      successTitle: 'Reservation success',
      successMessage: 'Your reservation has been saved successfully.',
      failTitle: 'Reservation failed',
      closeButton: 'Close',
      backHome: 'Back to home',
      fillAllFields: 'Please fill in all fields correctly.',
      invalidDateTime: 'Invalid date or time.',
      noTableCapacity: 'There is no table this large in the restaurant.',
      noTableTime: 'No table is available at this time.',
      phoneInvalid: 'The phone number format is invalid. Use +36... format.',
      networkError: 'Reservation failed. Please try again later.',
    },
  };

  ngOnInit(): void {
    this.currentLanguage = this.languageService.currentLanguageValue;
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
      this.cdr.detectChanges();
    });

    this.minDate = this.toDateInputValue(new Date());
    this.date = this.minDate;
                                                                  
    this.generateAllTimesForDate(this.parseLocalDate(this.date) || new Date());
    this.refreshTimeOptions();
    this.loadMaxTableCapacity();
  }

  onDateChange(): void {
    const selectedDate = this.parseLocalDate(this.date);
    if (selectedDate) {
      this.generateAllTimesForDate(selectedDate);
    }
    this.refreshTimeOptions();
  }

  submitReservation(): void {
    this.showResultModal = false;

    const guestName = this.name.trim();
    const phone = this.phoneNumber.trim();
    const guestCount = Number(this.guests);

    if (!guestName || !phone || !this.date || !this.time || !guestCount || guestCount < 1) {
      this.openResultModal(false, this.tr('failTitle'), this.tr('fillAllFields'));
      return;
    }

    if (this.maxTableCapacity !== null && guestCount > this.maxTableCapacity) {
      this.openResultModal(false, this.tr('failTitle'), this.tr('noTableCapacity'));
      return;
    }

    const startTime = this.toUtcIso(this.date, this.time);
    if (!startTime) {
      this.openResultModal(false, this.tr('failTitle'), this.tr('invalidDateTime'));
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
      .post<ReservationResponse>(`${this.config.apiUrl}/reservations`, payload, this.buildHeaders())
      .pipe(finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.openResultModal(true, this.tr('successTitle'), this.tr('successMessage'));
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
            this.tr('failTitle'),
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
      .get<MaxCapacityResponse>(`${this.config.apiUrl}/tables/max-capacity`, this.buildHeaders())
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

    if (normalized.includes('validation.phone') || normalized.includes('phone number is not valid') || normalized.includes('telefonszám')) {
      return this.tr('phoneInvalid');
    }

    if (normalized.includes('nincs ekkora asztal') || normalized.includes('there is no table this large')) {
      return this.tr('noTableCapacity');
    }

    if (normalized.includes('nincs szabad asztal') || normalized.includes('no table is available')) {
      return this.tr('noTableTime');
    }

    if (normalized.includes('the given data was invalid')) {
      return this.tr('fillAllFields');
    }

    return message || this.tr('networkError');
  }

  private buildHeaders() {
    return {
      headers: {
        'Accept-Language': this.currentLanguage,
      },
    };
  }

  public tr(key: string): string {
    return this.texts[this.currentLanguage][key] ?? key;
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

  private generateAllTimesForDate(date: Date): void {
    const openingHour = this.businessHours.getOpeningHour(date);
    const closingHour = this.businessHours.getClosingHour(date);

    const times: string[] = [];
    for (let hour = openingHour; hour < closingHour; hour++) {
      for (const minute of [0, 30]) {
        times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
    this.allTimes = times;
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
