import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { AuthService } from '../../services/auth';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  scrolled = false;

  constructor(
    private actions: GrillhouseActionsService,
    public auth: AuthService,
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
    if (this.auth.isLoggedIn()) {
      return this.currentLanguage === 'hu' ? 'Vezérlőpult' : 'Dashboard';
    } else {
      return this.currentLanguage === 'hu' ? 'Bejelentkezés' : 'Login';
    }
  }

  get homeActionRoute(): string {
    return this.auth.isLoggedIn() ? this.auth.getHomeRouteByRole() : '/login';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 6;
  }

  onReserveTable(): void {
    this.actions.reserveTable();
  }

  scrollToSection(fragment: string): void {
    const element = document.getElementById(fragment);
    if (element) {
      const navbarHeight = 72; // navbar min-height
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
