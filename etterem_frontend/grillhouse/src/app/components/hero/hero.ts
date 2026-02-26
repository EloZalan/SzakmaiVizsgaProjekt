import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
type HeroSlide = {
  imageUrl: string;
  headline: string;
  subline: string;
};

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div
        class="hero__bg"
        [style.backgroundImage]="'url(' + slides[activeIndex].imageUrl + ')'"
        aria-hidden="true"
      ></div>
      <div class="hero__overlay" aria-hidden="true"></div>

      <div class="container hero__content">
        <div class="hero__center">
          <h1 class="hero__title">{{ slides[activeIndex].headline }}</h1>
          <p class="hero__subtitle">{{ slides[activeIndex].subline }}</p>

          <button class="btn btn--primary" (click)="onViewMenu()">View Menu</button>

          <div class="dots" role="tablist" aria-label="Hero slides">
            <button
              *ngFor="let _ of slides; let i = index"
              class="dot"
              [class.active]="i === activeIndex"
              (click)="select(i)"
              aria-label="Select slide"
            ></button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        position: relative;
        min-height: 640px;
        display: grid;
        place-items: center;
        overflow: hidden;
      }

      .hero__bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        transform: scale(1.02);
        filter: saturate(1.05);
      }

      .hero__overlay {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            60% 50% at 50% 50%,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.75)
          ),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.85));
      }

      .hero__content {
        position: relative;
        z-index: 1;
        padding: 36px 0;
      }

      .hero__center {
        text-align: center;
        max-width: 900px;
        margin: 0 auto;
      }

      .hero__title {
        font-size: 64px;
        letter-spacing: 6px;
        font-weight: 800;
        margin: 0 0 14px;
      }

      .hero__subtitle {
        margin: 0 0 22px;
        color: rgba(255, 255, 255, 0.85);
        font-size: 18px;
      }

      .btn {
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: transparent;
        color: #fff;
        padding: 12px 18px;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.08s ease, filter 0.15s ease;
      }

      .btn:active {
        transform: translateY(1px);
      }

      .btn--primary {
        background: var(--gh-accent);
        border-color: var(--gh-accent);
        color: #120a05;
      }

      .dots {
        margin-top: 22px;
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        border: 0;
        background: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        padding: 0;
      }

      .dot.active {
        width: 22px;
        background: var(--gh-accent);
      }

      @media (max-width: 900px) {
        .hero {
          min-height: 560px;
        }
        .hero__title {
          font-size: 40px;
          letter-spacing: 3px;
        }
      }
    `,
  ],
})
export class HeroComponent {
  slides: HeroSlide[] = [
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'AUTHENTIC BBQ FLAVORS',
      subline: 'Fire-grilled perfection since 2020',
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

  constructor(private actions: GrillhouseActionsService) {}

  select(i: number): void {
    this.activeIndex = i;
  }

  onViewMenu(): void {
    this.actions.viewMenu(); // TODO later
  }
}