import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reserve-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reserve-page.html',
})
export class ReservePageComponent {
  name = '';
  email = '';
  date = '';
  guests = 2;

  submitReservation(): void {
    // TODO: implement later
  }
}