import { Injectable } from '@angular/core';

export type TravelMode = 'driving' | 'walking' | 'transit';

@Injectable({ providedIn: 'root' })
export class GrillhouseActionsService {
  private fullMenuVisible = false;

  login(): void {
                            
  }

  reserveTable(): void {
                            
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

     
                                                                              
     
  getDirections(mode: TravelMode = 'driving'): void {
    const destination = 'Gízai piramismező';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}&travelmode=${mode}`;

    window.open(url, '_blank');
  }
}