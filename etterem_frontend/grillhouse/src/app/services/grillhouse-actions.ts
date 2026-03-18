import { Injectable } from '@angular/core';

export type TravelMode = 'driving' | 'walking' | 'transit';

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

  /**
   * Opens Google Maps directions in a new tab using the selected travel mode.
   */
  getDirections(mode: TravelMode = 'driving'): void {
    const destination = 'Gízai piramismező';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}&travelmode=${mode}`;

    window.open(url, '_blank');
  }
}