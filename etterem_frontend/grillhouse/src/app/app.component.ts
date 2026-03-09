import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  template: `
    <router-outlet></router-outlet>

    <button
      *ngIf="showScrollButton"
      class="scroll-top-btn"
      (click)="scrollToTop()"
    >
      ↑
    </button>
  `,
})
export class AppComponent {
  showScrollButton = false;

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.showScrollButton = window.pageYOffset > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}