import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReservePageComponent } from '../reserve-page/reserve-page';

@Component({
  selector: 'app-home-reserve-modal',
  standalone: true,
  imports: [ReservePageComponent],
  templateUrl: './home-reserve-modal.html',
  styleUrl: './home-reserve-modal.css',
})
export class HomeReserveModalComponent {
  @Input() visible = false;
  @Output() closeRequested = new EventEmitter<void>();

  requestClose(): void {
    this.closeRequested.emit();
  }
}
