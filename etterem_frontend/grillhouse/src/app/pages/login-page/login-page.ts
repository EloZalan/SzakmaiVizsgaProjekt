import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <div class="card">
        <h1>Login</h1>

        <label>
          Username
          <input [(ngModel)]="username" />
        </label>

        <label>
          Password
          <input [(ngModel)]="password" type="password" />
        </label>

        <button (click)="onLogin()">Login</button>

        <p class="hint">
          Tipp: ha a username <b>pincer</b>, akkor pincérként lépsz be és a /waiter oldal jön.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .wrap{min-height:100vh;display:grid;place-items:center;background:#070707;color:#fff;padding:24px;}
    .card{width:min(420px,100%);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;}
    label{display:grid;gap:8px;margin:12px 0;color:rgba(255,255,255,.85);}
    input{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#fff;}
    button{margin-top:12px;width:100%;padding:12px;border-radius:12px;border:0;background:#ff6a00;color:#120a05;font-weight:800;cursor:pointer;}
    .hint{color:rgba(255,255,255,.65);font-size:12px;margin-top:14px;line-height:1.6;}
  `],
})
export class LoginPageComponent {
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin(): void {
    this.auth.login(this.username, this.password);
    this.router.navigateByUrl(this.auth.getHomeRouteByRole());
  }
}