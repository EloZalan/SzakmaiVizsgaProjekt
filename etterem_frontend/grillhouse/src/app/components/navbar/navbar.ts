import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="nav" [class.scrolled]="scrolled">
      <div class="nav__inner container">
        <a class="brand" [routerLink]="['/']" fragment="top">
          <span class="brand__icon">🔥</span>
          <span class="brand__text">GRILLHOUSE</span>
        </a>

        <nav class="links">
          <a [routerLink]="['/']" fragment="menu">Menu</a>
          <a [routerLink]="['/']" fragment="about">About</a>
          <a [routerLink]="['/']" fragment="location">Location</a>
        </nav>

        <div class="actions">
 <button class="btn btn--ghost" [routerLink]="['/login']">
  <span class="btn__icon">⟶</span>
  Login
</button>
          <button class="btn btn--primary" (click)="onReserveTable()">
            Reserve Table
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .nav {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .nav.scrolled {
        background: rgba(0, 0, 0, 0.92);
      }

      .nav__inner {
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: var(--gh-text);
      }

      .brand__icon {
        color: var(--gh-accent);
        font-size: 18px;
      }

      .brand__text {
        letter-spacing: 1px;
        font-weight: 700;
      }

      .links {
        display: flex;
        gap: 28px;
      }

      .links a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        font-weight: 500;
      }
      .links a:hover {
        color: #fff;
      }

      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .btn {
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: transparent;
        color: #fff;
        padding: 10px 14px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .btn:active {
        transform: translateY(1px);
      }

      .btn--ghost {
        border-color: rgba(255, 255, 255, 0.18);
      }

      .btn--ghost:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .btn--primary {
        background: var(--gh-accent);
        border-color: var(--gh-accent);
        color: #120a05;
      }

      .btn--primary:hover {
        filter: brightness(1.03);
      }

      .btn__icon {
        opacity: 0.9;
      }

      @media (max-width: 900px) {
        .links {
          display: none;
        }
      }
    `,
  ],
})
export class NavbarComponent {
  scrolled = false;

  constructor(private actions: GrillhouseActionsService) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 6;
  }

  onLogin(): void {
    this.actions.login(); // TODO later
  }

  onReserveTable(): void {
    this.actions.reserveTable(); // TODO later
  }
}