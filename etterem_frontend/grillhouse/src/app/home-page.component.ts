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
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {}