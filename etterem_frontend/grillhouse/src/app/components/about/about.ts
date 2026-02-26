import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="container">
      <div class="card">
        <div class="grid">
          <div class="left">
            <div class="logoBox" aria-hidden="true">
              <div class="logoCircle">GRILLS</div>
            </div>

            <h2 class="title">Where Fire Meets Flavor</h2>

            <p class="text">
              At Grillhouse, we believe in the art of flame-grilling. Our pitmasters have perfected the craft of
              creating tender, smoky, and unforgettable BBQ that keeps our guests coming back.
            </p>

            <p class="text">
              Every cut is hand-selected, every sauce is house-made, and every dish is prepared with passion and
              expertise. Come taste the difference that real BBQ makes.
            </p>

            <div class="stats">
              <div class="stat">
                <div class="stat__value">500°F</div>
                <div class="stat__label">Perfect Sear</div>
              </div>
              <div class="stat">
                <div class="stat__value">14hrs</div>
                <div class="stat__label">Slow Smoked</div>
              </div>
              <div class="stat">
                <div class="stat__value">100%</div>
                <div class="stat__label">Prime Cuts</div>
              </div>
            </div>
          </div>

          <div class="right">
            <div
              class="image"
              [style.backgroundImage]="'url(assets/images/about.jpg)'"
              role="img"
              aria-label="Wood and smoker"
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
        grid-template-columns: 1.05fr 1fr;
        gap: 34px;
        align-items: center;
      }

      .logoBox {
        width: 160px;
        height: 120px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
      }

      .logoCircle {
        width: 120px;
        height: 120px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-weight: 900;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.85);
      }

      .title {
        font-size: 54px;
        margin: 10px 0 14px;
        line-height: 1.05;
      }

      .text {
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.8;
        margin: 0 0 14px;
        max-width: 560px;
      }

      .stats {
        display: flex;
        gap: 28px;
        margin-top: 22px;
        flex-wrap: wrap;
      }

      .stat__value {
        color: var(--gh-accent);
        font-weight: 900;
        font-size: 28px;
      }

      .stat__label {
        color: rgba(255, 255, 255, 0.65);
        margin-top: 6px;
        font-size: 12px;
      }

      .image {
        height: 320px;
        border-radius: 16px;
        border: 1px solid rgba(255, 140, 60, 0.35);
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
export class AboutComponent {}