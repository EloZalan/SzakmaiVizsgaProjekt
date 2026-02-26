import { Component } from '@angular/core';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

@Component({
  selector: 'app-visit-us',
  standalone: true,
  template: `
    <div class="container">
      <div class="card">
        <div class="grid">
          <div class="left">
            <h2 class="title">Visit Us</h2>

            <div class="info">
              <div class="row">
                <div class="icon">📍</div>
                <div>
                  <div class="label">Location</div>
                  <div class="value">123 Grill Street</div>
                  <div class="value">Smoketown, TX 75001</div>
                </div>
              </div>

              <div class="row">
                <div class="icon">🕒</div>
                <div>
                  <div class="label">Hours</div>
                  <div class="value">Mon-Thu: 11am - 10pm</div>
                  <div class="value">Fri-Sat: 11am - 11pm</div>
                  <div class="value">Sunday: 12pm - 9pm</div>
                </div>
              </div>

              <div class="row">
                <div class="icon">📞</div>
                <div>
                  <div class="label">Contact</div>
                  <div class="value">(555) GRILL-01</div>
                  <div class="value">info@grillhouse.com</div>
                </div>
              </div>
            </div>

            <button class="btn btn--primary" (click)="onGetDirections()">Get Directions</button>
          </div>

          <div class="right">
            <div
              class="image"
              [style.backgroundImage]="'url(assets/images/visit.jpg)'"
              role="img"
              aria-label="Restaurant seating area"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 18px;
        padding: 38px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 30px;
        align-items: center;
      }

      .title {
        font-size: 54px;
        margin: 0 0 18px;
      }

      .info {
        display: grid;
        gap: 18px;
        margin-bottom: 22px;
      }

      .row {
        display: grid;
        grid-template-columns: 26px 1fr;
        gap: 14px;
        align-items: start;
      }

      .icon {
        color: var(--gh-accent);
        font-size: 18px;
        line-height: 1;
        margin-top: 3px;
      }

      .label {
        font-weight: 800;
        margin-bottom: 6px;
      }

      .value {
        color: rgba(255, 255, 255, 0.72);
        line-height: 1.7;
      }

      .btn {
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: transparent;
        color: #fff;
        padding: 12px 18px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.08s ease, filter 0.15s ease;
      }

      .btn:active {
        transform: translateY(1px);
      }

      .btn--primary {
        background: var(--gh-accent);
        border-color: var(--gh-accent);
        color: #120a05;
      }

      .image {
        height: 330px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
        background-size: cover;
        background-position: center;
      }

      @media (max-width: 900px) {
        .card {
          padding: 22px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        .title {
          font-size: 38px;
        }
        .image {
          height: 260px;
        }
      }
    `,
  ],
})
export class VisitUsComponent {
  constructor(private actions: GrillhouseActionsService) {}

  onGetDirections(): void {
    this.actions.getDirections(); // TODO later
  }
}