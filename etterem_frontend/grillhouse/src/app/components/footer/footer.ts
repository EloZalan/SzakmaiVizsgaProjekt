import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="container footer__inner">
        <div class="brand">
          <span class="brand__icon">🔥</span>
          <span class="brand__text">GRILLHOUSE</span>
        </div>

        <div class="sub">Authentic BBQ Flavors • Est. 2022</div>
        <div class="copy">© 2026 Grillhouse. All rights reserved.</div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        padding: 44px 0 60px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(0, 0, 0, 0.65);
      }

      .footer__inner {
        text-align: center;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }

      .brand__icon {
        color: var(--gh-accent);
      }

      .brand__text {
        letter-spacing: 1px;
        font-weight: 900;
      }

      .sub {
        color: rgba(255, 255, 255, 0.65);
        margin-bottom: 12px;
      }

      .copy {
        color: rgba(255, 255, 255, 0.35);
        font-size: 12px;
      }
    `,
  ],
})
export class FooterComponent {}