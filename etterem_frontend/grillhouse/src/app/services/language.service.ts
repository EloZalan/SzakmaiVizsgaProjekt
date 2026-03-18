import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'hu' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguage = new BehaviorSubject<Language>('hu');

  get language$() {
    return this.currentLanguage.asObservable();
  }

  get currentLanguageValue(): Language {
    return this.currentLanguage.value;
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage.value === 'hu' ? 'en' : 'hu';
    this.currentLanguage.next(newLang);
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.next(lang);
  }
}