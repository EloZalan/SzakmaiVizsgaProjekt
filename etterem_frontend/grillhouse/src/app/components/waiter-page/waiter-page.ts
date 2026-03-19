import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './waiter-page.html',
  styleUrl: './waiter-page.css',
})
export class WaiterPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  onEndShift(): void {
    this.auth.endShift().subscribe({
      next: () => {
        this.router.navigateByUrl('/waiter/user');
      },
      error: (err) => {
        console.error('END SHIFT ERROR:', err);
        alert('A műszak leadása sikertelen.');
      },
    });
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
