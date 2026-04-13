import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent implements AfterViewInit {
  scrolled = false;
  mobileMenuOpen = false;
  linksCollapsed = false;
  minimalActions = false;
  compactNav = false;
  private measuredBrandWidth = 0;
  private measuredLinksWidth = 0;
  private measuredActionsWidth = 0;
  private measuredLanguageButtonWidth = 0;

  @ViewChild('navInner') navInnerRef?: ElementRef<HTMLElement>;
  @ViewChild('navBrand') navBrandRef?: ElementRef<HTMLElement>;
  @ViewChild('navLinks') navLinksRef?: ElementRef<HTMLElement>;
  @ViewChild('navActions') navActionsRef?: ElementRef<HTMLElement>;
  @ViewChild('languageButton') languageButtonRef?: ElementRef<HTMLElement>;

  @Output() reserveRequested = new EventEmitter<void>();

  constructor(
    private actions: GrillhouseActionsService,
    private router: Router,
    public languageService: LanguageService,
    public themeService: ThemeService
  ) {}

  get currentLanguage(): string {
    return this.languageService.currentLanguageValue;
  }

  get currentTheme(): string {
    return this.themeService.currentThemeValue;
  }

  get homeActionLabel(): string {
    return this.currentLanguage === 'hu' ? 'Bejelentkezés' : 'Login';
  }

  get homeActionRoute(): string {
    return '/login';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 6;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateCompactNavMode();
    if (!this.compactNav && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  onReserveTable(): void {
    this.actions.reserveTable();
    this.reserveRequested.emit();
    this.mobileMenuOpen = false;
  }

  scrollToSection(fragment: string): void {
    this.mobileMenuOpen = false;

    const currentUrl = this.router.url.split('#')[0];
    if (currentUrl !== '/') {
      void this.router.navigate(['/'], { fragment }).then((navigated) => {
        if (navigated) {
          this.scrollToSectionWhenAvailable(fragment);
        }
      });
      return;
    }

    this.scrollToSectionWhenAvailable(fragment);
  }

  private scrollToSectionWhenAvailable(fragment: string, attempt = 0): void {
    const target = document.getElementById(fragment);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (attempt >= 12) {
      return;
    }

    setTimeout(() => this.scrollToSectionWhenAvailable(fragment, attempt + 1), 50);
  }

  toggleMobileMenu(): void {
    if (!this.compactNav) {
      return;
    }

    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
    setTimeout(() => this.updateCompactNavMode(), 0);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    setTimeout(() => this.updateCompactNavMode(), 0);
  }

  ngAfterViewInit(): void {
    this.updateCompactNavMode();
    setTimeout(() => this.updateCompactNavMode(), 0);
  }

  private updateCompactNavMode(): void {
    const navInner = this.navInnerRef?.nativeElement;
    const navBrand = this.navBrandRef?.nativeElement;
    const navLinks = this.navLinksRef?.nativeElement;
    const navActions = this.navActionsRef?.nativeElement;
    const languageButton = this.languageButtonRef?.nativeElement;

    if (!navInner || !navBrand || !navLinks || !navActions || !languageButton) {
      return;
    }

    if (navBrand.offsetWidth > 0) {
      this.measuredBrandWidth = Math.max(this.measuredBrandWidth, navBrand.offsetWidth);
    }

    if (navLinks.scrollWidth > 0) {
      this.measuredLinksWidth = Math.max(this.measuredLinksWidth, navLinks.scrollWidth);
    }

    if (navActions.scrollWidth > 0) {
      this.measuredActionsWidth = Math.max(this.measuredActionsWidth, navActions.scrollWidth);
    }

    if (languageButton.offsetWidth > 0) {
      this.measuredLanguageButtonWidth = Math.max(this.measuredLanguageButtonWidth, languageButton.offsetWidth);
    }

    const brandWidth = this.measuredBrandWidth || navBrand.offsetWidth;
    const linksWidth = this.measuredLinksWidth || navLinks.scrollWidth;
    const actionsWidth = this.measuredActionsWidth || navActions.scrollWidth;
    const availableWidth = navInner.clientWidth;
    const spacing = 44;
    const safety = 18;
    const fullRequiredWidth = brandWidth + linksWidth + actionsWidth + spacing + safety;
    const noLinksRequiredWidth = brandWidth + actionsWidth + spacing + safety;

    this.linksCollapsed = fullRequiredWidth > availableWidth;
    this.minimalActions = this.linksCollapsed && noLinksRequiredWidth > availableWidth;
    this.compactNav = this.minimalActions;

    if (!this.compactNav) {
      this.mobileMenuOpen = false;
    }
  }
}
