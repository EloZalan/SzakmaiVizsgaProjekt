import { Injectable } from '@angular/core';
import type { BusinessHours } from '../models/business-hours.model';

export type { BusinessHours } from '../models/business-hours.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessHoursService {
                                 
                                                                                               
  private readonly hours: BusinessHours[] = [
    { dayOfWeek: 0, dayName: 'Sunday', opens: '12:00', closes: '21:00' },            
    { dayOfWeek: 1, dayName: 'Monday', opens: '11:00', closes: '20:00' },     
    { dayOfWeek: 2, dayName: 'Tuesday', opens: '11:00', closes: '20:00' },     
    { dayOfWeek: 3, dayName: 'Wednesday', opens: '11:00', closes: '20:00' },      
    { dayOfWeek: 4, dayName: 'Thursday', opens: '11:00', closes: '20:00' },      
    { dayOfWeek: 5, dayName: 'Friday', opens: '11:00', closes: '23:00' },     
    { dayOfWeek: 6, dayName: 'Saturday', opens: '11:00', closes: '23:00' },       
  ];

     
                                                      
                                                               
     
  getHoursForDay(dayOfWeek: number): BusinessHours | null {
    return this.hours.find((h) => h.dayOfWeek === dayOfWeek) || null;
  }

     
                                           
     
  getHoursForDate(date: Date): BusinessHours | null {
    return this.getHoursForDay(date.getDay());
  }

     
                                                    
     
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
