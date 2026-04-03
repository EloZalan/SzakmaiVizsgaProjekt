import { Injectable } from '@angular/core';

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string;
  opens: string; // HH:mm
  closes: string; // HH:mm
}

@Injectable({
  providedIn: 'root',
})
export class BusinessHoursService {
  // Business hours configuration
  // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  private readonly hours: BusinessHours[] = [
    { dayOfWeek: 0, dayName: 'Sunday', opens: '12:00', closes: '21:00' }, // Vasárnap
    { dayOfWeek: 1, dayName: 'Monday', opens: '11:00', closes: '20:00' }, // H
    { dayOfWeek: 2, dayName: 'Tuesday', opens: '11:00', closes: '20:00' }, // K
    { dayOfWeek: 3, dayName: 'Wednesday', opens: '11:00', closes: '20:00' }, // Sz
    { dayOfWeek: 4, dayName: 'Thursday', opens: '11:00', closes: '20:00' }, // Cs
    { dayOfWeek: 5, dayName: 'Friday', opens: '11:00', closes: '23:00' }, // P
    { dayOfWeek: 6, dayName: 'Saturday', opens: '11:00', closes: '23:00' }, // Szo
  ];

  /**
   * Get business hours for a specific day of the week
   * @param dayOfWeek 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  getHoursForDay(dayOfWeek: number): BusinessHours | null {
    return this.hours.find((h) => h.dayOfWeek === dayOfWeek) || null;
  }

  /**
   * Get business hours for a specific date
   */
  getHoursForDate(date: Date): BusinessHours | null {
    return this.getHoursForDay(date.getDay());
  }

  /**
   * Check if the restaurant is open at a given time
   */
  isOpenAtTime(date: Date): boolean {
    const hours = this.getHoursForDate(date);
    if (!hours) return false;

    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;

    return timeStr >= hours.opens && timeStr < hours.closes;
  }

  /**
   * Get opening hour in 24-hour format
   */
  getOpeningHour(date: Date): number {
    const hours = this.getHoursForDate(date);
    if (!hours) return 0;

    const [hour] = hours.opens.split(':').map(Number);
    return hour;
  }

  /**
   * Get closing hour in 24-hour format
   */
  getClosingHour(date: Date): number {
    const hours = this.getHoursForDate(date);
    if (!hours) return 24;

    const [hour] = hours.closes.split(':').map(Number);
    return hour;
  }

  /**
   * Get all business hours in readable format
   */
  getAllHours(): BusinessHours[] {
    return this.hours;
  }

  /**
   * Get formatted hours string for display (Hungarian)
   */
  getFormattedHours(date: Date): string {
    const hours = this.getHoursForDate(date);
    if (!hours) return 'Zárva';

    return `${hours.opens} - ${hours.closes}`;
  }

  /**
   * Get opening time string (HH:mm format)
   */
  getOpeningTime(date: Date): string {
    const hours = this.getHoursForDate(date);
    return hours ? hours.opens : '00:00';
  }

  /**
   * Get closing time string (HH:mm format)
   */
  getClosingTime(date: Date): string {
    const hours = this.getHoursForDate(date);
    return hours ? hours.closes : '00:00';
  }
}
