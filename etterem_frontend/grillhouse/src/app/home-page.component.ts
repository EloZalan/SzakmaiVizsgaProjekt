import { Component, OnDestroy } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { MenuPreviewComponent } from './components/menu-preview/menu-preview';
import { VisitUsComponent } from './components/visit-us/visit-us';
import { FooterComponent } from './components/footer/footer';
import { ReservePageComponent } from './components/reserve-page/reserve-page';

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
    ReservePageComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnDestroy {
  showReserveModal = false;

  openReserveModal(): void {
    this.showReserveModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeReserveModal(): void {
    this.showReserveModal = false;
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}