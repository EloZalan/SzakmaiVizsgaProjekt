import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { HeroSlide } from '../../models/hero-slide.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgFor],
  templateUrl: './hero.html',
})
export class HeroComponent {
  slides: HeroSlide[] = [
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'AUTHENTIC BBQ FLAVORS',
      subline: 'Fire-grilled perfection since 2022',
    },
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'SMOKE • SEAR • SERVE',
      subline: 'House-made sauces, prime cuts',
    },
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'SLOW SMOKED, BIG FLAVOR',
      subline: 'Pitmaster-crafted, every day',
    },
    {
      imageUrl: 'assets/images/hero-1.jpg',
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
    this.actions.viewMenu();
  }
}