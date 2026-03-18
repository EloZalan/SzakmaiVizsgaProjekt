import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { GrillhouseActionsService, TravelMode } from '../../services/grillhouse-actions';

@Component({
  selector: 'app-visit-us',
  standalone: true,
  imports: [NgIf],
  templateUrl: './visit-us.html',
})
export class VisitUsComponent {
  showDirectionsModal = false;

  constructor(private actions: GrillhouseActionsService) {}

  onGetDirections(): void {
    this.showDirectionsModal = true;
  }

  closeDirectionsModal(): void {
    this.showDirectionsModal = false;
  }

  selectTravelMode(mode: TravelMode): void {
    this.actions.getDirections(mode);
    this.closeDirectionsModal();
  }
}