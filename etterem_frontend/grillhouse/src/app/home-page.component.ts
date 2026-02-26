import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { MenuPreviewComponent } from './components/menu-preview/menu-preview';
import { VisitUsComponent } from './components/visit-us/visit-us';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    AboutComponent,
    MenuPreviewComponent,
    VisitUsComponent,
    FooterComponent,
  ],
  template: `
    <app-navbar />

    <main class="page">
      <section id="top">
        <app-hero />
      </section>

      <section id="about" class="section">
        <app-about />
      </section>

      <section id="menu" class="section">
        <app-menu-preview />
      </section>

      <section id="location" class="section">
        <app-visit-us />
      </section>

      <app-footer />
    </main>
  `,
  styles: [
    `
      .page {
        background: var(--gh-bg);
        color: var(--gh-text);
        min-height: 100vh;
      }

      .section {
        padding: 72px 0;
      }

      @media (max-width: 900px) {
        .section {
          padding: 56px 0;
        }
      }
    `,
  ],
})
export class HomePageComponent {}