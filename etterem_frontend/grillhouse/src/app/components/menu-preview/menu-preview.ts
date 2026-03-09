import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { GrillhouseActionsService } from '../../services/grillhouse-actions';

import { MenuCard } from '../../models/menu-card.model';

@Component({
  selector: 'app-menu-preview',
  standalone: true,
  imports: [NgFor, NgIf],
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
        <button class="btn btn--primary" (click)="onViewFullMenu()">
          {{ isFullMenuVisible() ? 'Hide Full Menu' : 'View Full Menu' }}
        </button>
      </div>

      <div class="full-menu-box" *ngIf="isFullMenuVisible()">
        <h3 class="full-menu-title">Full Menu</h3>

        <div class="full-menu-section">
          <h4 class="section-title">Starters</h4>
          <div class="grid">
            <article class="item" *ngFor="let m of starters">
              <div class="item__top">
                <div class="item__name">{{ m.name }}</div>
                <div class="item__price">\${{ m.price }}</div>
              </div>
              <div class="item__desc">{{ m.desc }}</div>
            </article>
          </div>
        </div>

        <div class="full-menu-section">
          <h4 class="section-title">Sides</h4>
          <div class="grid">
            <article class="item" *ngFor="let m of sides">
              <div class="item__top">
                <div class="item__name">{{ m.name }}</div>
                <div class="item__price">\${{ m.price }}</div>
              </div>
              <div class="item__desc">{{ m.desc }}</div>
            </article>
          </div>
        </div>

        <div class="full-menu-section">
          <h4 class="section-title">Desserts</h4>
          <div class="grid">
            <article class="item" *ngFor="let m of desserts">
              <div class="item__top">
                <div class="item__name">{{ m.name }}</div>
                <div class="item__price">\${{ m.price }}</div>
              </div>
              <div class="item__desc">{{ m.desc }}</div>
            </article>
          </div>
        </div>

        <div class="full-menu-section">
          <h4 class="section-title">Drinks</h4>
          <div class="grid">
            <article class="item" *ngFor="let m of drinks">
              <div class="item__top">
                <div class="item__name">{{ m.name }}</div>
                <div class="item__price">\${{ m.price }}</div>
              </div>
              <div class="item__desc">{{ m.desc }}</div>
            </article>
          </div>
        </div>
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

      .full-menu-box {
        margin-top: 36px;
        padding: 28px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .full-menu-title {
        text-align: center;
        font-size: 32px;
        margin: 0 0 24px;
      }

      .full-menu-section {
        margin-top: 28px;
      }

      .section-title {
        font-size: 22px;
        margin: 0 0 8px;
        color: var(--gh-accent);
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

        .full-menu-box {
          padding: 18px;
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

  starters: MenuCard[] = [
    { name: 'Buffalo Wings', price: 14, desc: 'Spicy wings with ranch dip' },
    { name: 'Cheddar Jalapeño Bites', price: 11, desc: 'Crispy bites with smoky cheese filling' },
    { name: 'Onion Rings', price: 9, desc: 'Golden fried onion rings with BBQ dip' },
  ];

  sides: MenuCard[] = [
    { name: 'Mac & Cheese', price: 8, desc: 'Creamy baked mac with cheddar crust' },
    { name: 'Coleslaw', price: 6, desc: 'Fresh, crunchy house slaw' },
    { name: 'Sweet Potato Fries', price: 7, desc: 'Crispy fries with chipotle mayo' },
  ];

  desserts: MenuCard[] = [
    { name: 'Chocolate Brownie', price: 10, desc: 'Warm brownie with vanilla ice cream' },
    { name: 'Cheesecake', price: 9, desc: 'Classic creamy cheesecake' },
  ];

  drinks: MenuCard[] = [
    { name: 'House Lemonade', price: 5, desc: 'Freshly squeezed lemon drink' },
    { name: 'Iced Tea', price: 4, desc: 'Classic sweet iced tea' },
    { name: 'Craft Beer', price: 7, desc: 'Locally brewed draft beer' },
    { name: 'Cola', price: 4, desc: 'Chilled soft drink' },
  ];

  constructor(private actions: GrillhouseActionsService) {}

  onViewFullMenu(): void {
    this.actions.viewFullMenu();
  }

  isFullMenuVisible(): boolean {
    return this.actions.isFullMenuVisible();
  }
}