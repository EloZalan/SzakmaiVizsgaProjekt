import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  scrolled = false;

  constructor(private actions: GrillhouseActionsService) {}

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
}
