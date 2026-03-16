import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
