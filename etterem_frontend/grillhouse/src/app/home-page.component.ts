import { Component, OnDestroy } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroComponent } from './components/hero/hero';
import { AboutComponent } from './components/about/about';
import { MenuPreviewComponent } from './components/menu-preview/menu-preview';
import { VisitUsComponent } from './components/visit-us/visit-us';
import { FooterComponent } from './components/footer/footer';
import { HomeReserveModalComponent } from './components/home-reserve-modal/home-reserve-modal';

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
    HomeReserveModalComponent,
  ],
  templateUrl: './home-page.component.html',
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