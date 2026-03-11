import { Component } from '@angular/core';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

@Component({
  selector: 'app-visit-us',
  standalone: true,
  templateUrl: './visit-us.html',
})
export class VisitUsComponent {
  constructor(private actions: GrillhouseActionsService) {}

  onGetDirections(): void {
    this.actions.getDirections();
  }
}