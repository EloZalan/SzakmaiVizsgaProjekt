import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgFor } from '@angular/common';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';
import { HeroSlide } from '../../models/hero-slide.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgFor],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css'],
})
export class HeroComponent implements OnInit, OnDestroy {
  slides: HeroSlide[] = [
    {
      imageUrl: 'assets/images/hero-1.jpg',
      headline: 'AUTHENTIC BBQ FLAVORS',
      subline: 'Fire-grilled perfection since 2022',
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
  private intervalId: any;

  constructor(private actions: GrillhouseActionsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  select(i: number): void {
    this.activeIndex = i;
    this.resetAutoSlide();
  }

  private startAutoSlide(): void {
    this.intervalId = setInterval(() => {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
      this.cdr.markForCheck();
    }, 5000); // 5 másodperc
  }

  private stopAutoSlide(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private resetAutoSlide(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  onViewMenu(): void {
    this.actions.viewMenu();
  }
}
