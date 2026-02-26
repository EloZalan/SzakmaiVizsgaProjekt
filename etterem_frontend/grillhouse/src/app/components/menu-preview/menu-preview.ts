import { Component } from '@angular/core';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

type MenuCard = {
  name: string;
  price: number;
  desc: string;
};

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  template: `
    <div class="container">
      <div class="head">
        <div class="flame" aria-hidden="true">🔥</div>
        <h2 class="title">Our Signature Menu</h2>
        <p class="subtitle">Premium cuts, expertly grilled</p>
      </div>

      <div class="grid">
        <article class="item" *ngFor="let m of items">
          <div class="item__top">
            <div class="item__name">{{ m.name }}</div>
            <div class="item__price">\${{ m.price }}</div>
          </div>
          <div class="item__desc">{{ m.desc }}</div>
        </article>
      </div>

      <div class="cta">
        <button class="btn btn--primary" (click)="onViewFullMenu()">View Full Menu</button>
      </div>
    </div>
  `,
  styles: [
    `
      .head {
        text-align: center;
        margin-bottom: 34px;
      }

      .flame {
        color: var(--gh-accent);
        font-size: 22px;
        margin-bottom: 8px;
      }

      .title {
        font-size: 52px;
        margin: 0 0 10px;
      }

      .subtitle {
        margin: 0;
        color: rgba(255, 255, 255, 0.7);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
        margin-top: 28px;
      }

      .item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 16px;
        padding: 22px;
        min-height: 120px;
      }

      .item__top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 14px;
      }

      .item__name {
        font-weight: 800;
        font-size: 18px;
      }

      .item__price {
        color: var(--gh-accent);
        font-weight: 900;
      }

      .item__desc {
        margin-top: 10px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
        font-size: 13px;
      }

      .cta {
        display: flex;
        justify-content: center;
        margin-top: 34px;
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

      @media (max-width: 1000px) {
        .grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 700px) {
        .title {
          font-size: 38px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MenuPreviewComponent {
  items: MenuCard[] = [
    { name: 'Signature Ribeye', price: 48, desc: '16oz prime cut, flame-grilled to perfection' },
    { name: 'BBQ Brisket Platter', price: 36, desc: 'Slow-smoked for 14 hours, served with house sauce' },
    { name: 'Tomahawk Steak', price: 89, desc: '32oz bone-in ribeye, served for two' },
    { name: 'Fall-Off-The-Bone Ribs', price: 42, desc: 'Full rack of St. Louis style ribs' },
    { name: 'Smoked Pulled Pork', price: 28, desc: 'Hickory-smoked shoulder with coleslaw' },
    { name: 'Grilled Chicken Platter', price: 24, desc: 'Half chicken, charcoal-grilled with BBQ glaze' },
  ];

  constructor(private actions: GrillhouseActionsService) {}

  onViewFullMenu(): void {
    this.actions.viewFullMenu(); // TODO later
  }
}