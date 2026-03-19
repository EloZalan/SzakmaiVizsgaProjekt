import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { LanguageService, Language } from '../../services/language.service';
import { HeroSlide } from '../../models/hero-slide.model';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgFor],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css'],
})
export class HeroComponent implements OnInit, OnDestroy {
  slides: HeroSlide[] = [
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'AUTHENTIC BBQ FLAVORS',
      subline: 'Fire-grilled perfection since 2022',
    },
    {
      imageUrl: 'assets/images/hero-2.jpg',
      headline: 'SMOKE • SEAR • SERVE',
      subline: 'House-made sauces, prime cuts',
    },
    {
      imageUrl: 'assets/images/hero-3.jpg',
      headline: 'SLOW SMOKED, BIG FLAVOR',
      subline: 'Pitmaster-crafted, every day',
    },
    {
      imageUrl: 'assets/images/hero-4.jpg',
      headline: 'YOUR TABLE IS WAITING',
      subline: 'Reserve in seconds',
    },
  ];

  activeIndex = 0;
  displayHeadline = '';
  displaySubline = '';
  private intervalId: any;
  private headlineTimerId: any;
  private sublineTimerId: any;
  currentLanguage: Language = 'hu';
  currentTheme: ThemeMode = 'dark';

  constructor(
    private actions: GrillhouseActionsService,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.startAutoSlide();
    this.startTypingAnimation();
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
      this.updateSlides();
      this.startTypingAnimation();
      this.cdr.markForCheck();
    });
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
      this.updateBodyClass();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    this.stopTypingAnimation();
  }

  select(i: number): void {
    this.activeIndex = i;
    this.resetAutoSlide();
    this.startTypingAnimation();
  }

  private updateSlides(): void {
    if (this.currentLanguage === 'hu') {
      this.slides = [
        {
          imageUrl: 'assets/images/hero-1.jpg',
          headline: 'HITELVES BBQ ÍZELÍTŐK',
          subline: 'Tűzön grillezett tökélyesség 2022 óta',
        },
        {
          imageUrl: 'assets/images/hero-2.jpg',
          headline: 'FÜST • SÜTÉS • SZOLGÁLTATÁS',
          subline: 'Házilag készült szószok, első osztályú húsok',
        },
        {
          imageUrl: 'assets/images/hero-3.jpg',
          headline: 'LASSAN FÜSTÖLT, NAGY ÍZ',
          subline: 'Pitmaster által készített, minden nap',
        },
        {
          imageUrl: 'assets/images/hero-4.jpg',
          headline: 'AZ ÖN ASZTALA VÁR',
          subline: 'Foglaljon másodpercek alatt',
        },
      ];
    } else {
      this.slides = [
        {
          imageUrl: 'assets/images/hero-1.jpg',
          headline: 'AUTHENTIC BBQ FLAVORS',
          subline: 'Fire-grilled perfection since 2022',
        },
        {
          imageUrl: 'assets/images/hero-2.jpg',
          headline: 'SMOKE • SEAR • SERVE',
          subline: 'House-made sauces, prime cuts',
        },
        {
          imageUrl: 'assets/images/hero-3.jpg',
          headline: 'SLOW SMOKED, BIG FLAVOR',
          subline: 'Pitmaster-crafted, every day',
        },
        {
          imageUrl: 'assets/images/hero-4.jpg',
          headline: 'YOUR TABLE IS WAITING',
          subline: 'Reserve in seconds',
        },
      ];
    }
  }

  private startAutoSlide(): void {
    this.intervalId = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
      this.startTypingAnimation();
      this.cdr.markForCheck();
    }, 5000); // 5 másodperc
  }

  private stopAutoSlide(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private resetAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  private stopTypingAnimation(): void {
    if (this.headlineTimerId) { clearInterval(this.headlineTimerId); this.headlineTimerId = null; }
    if (this.sublineTimerId) { clearInterval(this.sublineTimerId); this.sublineTimerId = null; }
  }

  private startTypingAnimation(): void {
    this.stopTypingAnimation();
    const headline = this.slides[this.activeIndex].headline;
    const subline = this.slides[this.activeIndex].subline;
    this.displayHeadline = '';
    this.displaySubline = '';
    let hIndex = 0;
    const hStep = Math.max(1, Math.round(1500 / headline.length));
    this.headlineTimerId = setInterval(() => {
      hIndex++;
      this.displayHeadline = headline.slice(0, hIndex);
      this.cdr.markForCheck();
      if (hIndex >= headline.length) { clearInterval(this.headlineTimerId); this.headlineTimerId = null; }
    }, hStep);
    let sIndex = 0;
    const sStep = Math.max(1, Math.round(1500 / subline.length));
    this.sublineTimerId = setInterval(() => {
      sIndex++;
      this.displaySubline = subline.slice(0, sIndex);
      this.cdr.markForCheck();
      if (sIndex >= subline.length) { clearInterval(this.sublineTimerId); this.sublineTimerId = null; }
    }, sStep);
  }

  onViewMenu(): void {
    this.actions.viewMenu();
  }

  private updateBodyClass(): void {
    document.body.classList.toggle('light-theme', this.currentTheme === 'light');

    const homePage = document.querySelector('.home-page');
    if (homePage) {
      homePage.classList.toggle('light-theme', this.currentTheme === 'light');
    }
  }
}
