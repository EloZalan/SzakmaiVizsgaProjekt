import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<ThemeMode>('dark');

  get theme$() {
    return this.currentTheme.asObservable();
  }

  get currentThemeValue(): ThemeMode {
    return this.currentTheme.value;
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'dark' ? 'light' : 'dark';
    this.currentTheme.next(newTheme);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.next(theme);
  }
}