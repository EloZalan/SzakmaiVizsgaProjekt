import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GrillhouseActionsService {
  private fullMenuVisible = false;

  login(): void {
    // TODO: implement later
  }

  reserveTable(): void {
    // TODO: implement later
  }

  viewMenu(): void {
    const menuSection = document.getElementById('menu');
    menuSection?.scrollIntoView({ behavior: 'smooth' });
  }

  viewFullMenu(): void {
    this.fullMenuVisible = !this.fullMenuVisible;
  }

  isFullMenuVisible(): boolean {
    return this.fullMenuVisible;
  }

  getDirections(): void {
    // TODO: implement later
  }
}