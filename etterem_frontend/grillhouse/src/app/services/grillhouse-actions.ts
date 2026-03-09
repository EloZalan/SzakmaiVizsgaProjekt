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
    // TODO: implement later
  }

  viewFullMenu(): void {
    this.fullMenuVisible = !this.fullMenuVisible;
  }

  getDirections(): void {
    // TODO: implement later
  }

  isFullMenuVisible(): boolean {
    return this.fullMenuVisible;
  }
}