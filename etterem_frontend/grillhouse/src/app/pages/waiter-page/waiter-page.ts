// src/app/pages/waiter-page/waiter-page.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../services/auth';

type TableStatus = 'FREE' | 'OCCUPIED' | 'NEEDS_PAYMENT' | 'CLOSED';
type PaymentMethod = 'CARD' | 'CASH' | 'QR';

type OrderItem = {
  name: string;
  qty: number;
  price: number; // per item
};

type TableInfo = {
  id: number;
  name: string;
  status: TableStatus;
  guests: number;
  server: string;
  updatedAt: string;
  items: OrderItem[];
  note?: string;
};

@Component({
  selector: 'app-waiter-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  template: `
    <div class="page">
      <header class="top">
        <div class="left">
          <div class="brand">
            <span class="brand__icon">🔥</span>
            <span class="brand__text">GRILLHOUSE</span>
          </div>
          <div class="sub">Pincér felület</div>
        </div>

        <div class="right">
          <div class="pill">
            <span class="dot"></span>
            <span class="pill__text">Bejelentkezve: <b>{{ auth.user()?.username }}</b></span>
          </div>
          <button class="btn" (click)="onLogout()">Logout</button>
        </div>
      </header>

      <main class="container content">
        <div class="layout">
          <!-- 1) DASHBOARD -->
          <section class="panel panel--dash">
            <div class="panel__head">
              <h2 class="panel__title">Dashboard</h2>
              <p class="panel__sub">Gyors áttekintés</p>
            </div>

            <div class="cards">
              <div class="kpi kpi--accent">
                <div class="kpi__label">Foglalt asztalok</div>
                <div class="kpi__value">{{ occupiedCount }}</div>
                <div class="kpi__meta">Aktív rendelések</div>
              </div>

              <div class="kpi">
                <div class="kpi__label">Szabad asztalok</div>
                <div class="kpi__value">{{ freeCount }}</div>
                <div class="kpi__meta">Azonnal ültethető</div>
              </div>

              <div class="kpi">
                <div class="kpi__label">Vendégek száma</div>
                <div class="kpi__value">{{ guestsTotal }}</div>
                <div class="kpi__meta">Összesen bent</div>
              </div>
            </div>

            <div class="dashMore">
              <div class="mini">
                <div class="mini__title">Fizetésre vár</div>
                <div class="mini__value">{{ needsPaymentCount }}</div>
                <div class="mini__hint">Asztalok, ahol zárható a számla</div>
              </div>

              <div class="mini">
                <div class="mini__title">Mai csúcsidő</div>
                <div class="mini__value">19:00–21:00</div>
                <div class="mini__hint">Minta adat</div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="tips">
              <div class="tip">
                <div class="tip__icon">⚡</div>
                <div>
                  <div class="tip__title">Gyors műveletek</div>
                  <div class="tip__text">
                    Kattints egy asztalra a részletekhez. A “PAY” jelzés fizetésre váró asztalt jelent.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 2) TABLE GRID -->
          <section class="panel panel--tables">
            <div class="panel__head panel__head--row">
              <div>
                <h2 class="panel__title">Asztalok</h2>
                <p class="panel__sub">Csempés nézet • kattints a részletekhez</p>
              </div>

              <div class="legend">
                <span class="tag tag--free">FREE</span>
                <span class="tag tag--occ">OCCUPIED</span>
                <span class="tag tag--pay">PAY</span>
                <span class="tag tag--closed">CLOSED</span>
              </div>
            </div>

            <div class="grid">
              <button
                class="tile"
                *ngFor="let t of tables"
                (click)="selectTable(t)"
                [class.tile--selected]="selected?.id === t.id"
                [class.tile--free]="t.status === 'FREE'"
                [class.tile--occ]="t.status === 'OCCUPIED'"
                [class.tile--pay]="t.status === 'NEEDS_PAYMENT'"
                [class.tile--closed]="t.status === 'CLOSED'"
              >
                <div class="tile__top">
                  <div class="tile__name">{{ t.name }}</div>
                  <div class="badge" *ngIf="t.status === 'NEEDS_PAYMENT'">PAY</div>
                  <div class="badge badge--closed" *ngIf="t.status === 'CLOSED'">CLOSED</div>
                </div>

                <div class="tile__mid">
                  <div class="muted">{{ t.guests }} fő</div>
                  <div class="muted">frissítve: {{ t.updatedAt }}</div>
                </div>

                <div class="tile__bottom">
                  <div class="total">
                    {{ calcTotal(t) | currency:'USD':'symbol':'1.0-0' }}
                  </div>
                  <div class="status">{{ t.status }}</div>
                </div>
              </button>
            </div>
          </section>

          <!-- 3) DETAILS / PAYMENT -->
          <ng-container *ngIf="selected as s; else emptyDetails">
            <!-- PAYMENT VIEW -->
            <section class="panel panel--details" *ngIf="mode === 'payment'; else detailsView">
              <div class="panel__head panel__head--row">
                <div>
                  <h2 class="panel__title">Fizetés • {{ s.name }}</h2>
                  <p class="panel__sub">
                    Összeg:
                    <b class="accent">{{ calcTotal(s) | currency:'USD':'symbol':'1.2-2' }}</b>
                  </p>
                </div>

                <div class="headActions">
                  <button class="btn btn--ghost" (click)="backToDetails()">Vissza</button>
                  <button class="btn btn--ghost" (click)="clearSelection()">Bezár</button>
                </div>
              </div>

              <div class="pay">
                <div class="pay__summary">
                  <div class="sumCard">
                    <div class="sumCard__label">Alapösszeg</div>
                    <div class="sumCard__value">
                      {{ calcTotal(s) | currency:'USD':'symbol':'1.2-2' }}
                    </div>
                  </div>

                  <div class="sumCard">
                    <div class="sumCard__label">Borravaló (minta)</div>
                    <div class="tipRow">
                      <button class="chip" [class.chip--active]="tipPreset === 0" (click)="setTipPreset(0)">0%</button>
                      <button class="chip" [class.chip--active]="tipPreset === 10" (click)="setTipPreset(10)">10%</button>
                      <button class="chip" [class.chip--active]="tipPreset === 12" (click)="setTipPreset(12)">12%</button>
                      <button class="chip" [class.chip--active]="tipPreset === 15" (click)="setTipPreset(15)">15%</button>
                    </div>
                    <div class="sumCard__hint">
                      Borravaló: <b>{{ tipAmount(s) | currency:'USD':'symbol':'1.2-2' }}</b>
                    </div>
                  </div>

                  <div class="sumCard sumCard--accent">
                    <div class="sumCard__label">Fizetendő</div>
                    <div class="sumCard__value">
                      {{ grandTotal(s) | currency:'USD':'symbol':'1.2-2' }}
                    </div>
                    <div class="sumCard__hint">Alap + borravaló</div>
                  </div>
                </div>

                <div class="pay__options">
                  <div class="block">
                    <div class="block__title">Fizetési mód</div>
                    <div class="methods">
                      <button class="method" [class.method--active]="paymentMethod==='CARD'" (click)="setPaymentMethod('CARD')">
                        💳 Card
                      </button>
                      <button class="method" [class.method--active]="paymentMethod==='CASH'" (click)="setPaymentMethod('CASH')">
                        💵 Cash
                      </button>
                      <button class="method" [class.method--active]="paymentMethod==='QR'" (click)="setPaymentMethod('QR')">
                        📱 QR
                      </button>
                    </div>
                    <div class="block__hint">Csak UI (template), később jön a valódi fizetés.</div>
                  </div>

                  <div class="block">
                    <div class="block__title">Split bill (minta)</div>
                    <div class="split">
                      <div class="split__row">
                        <span class="muted">Vendégek</span>
                        <b>{{ s.guests }}</b>
                      </div>
                      <div class="split__row">
                        <span class="muted">Fizetendő / fő</span>
                        <b>{{ perGuest(s) | currency:'USD':'symbol':'1.2-2' }}</b>
                      </div>
                      <div class="split__row">
                        <span class="muted">Mód</span>
                        <b>{{ paymentMethod }}</b>
                      </div>
                    </div>
                  </div>

                  <div class="block">
                    <div class="block__title">Nyugta</div>
                    <div class="receipt">
                      <div class="receipt__row">
                        <span class="muted">Rendelés tételek</span>
                        <b>{{ s.items.length }}</b>
                      </div>
                      <div class="receipt__row">
                        <span class="muted">Utolsó frissítés</span>
                        <b>{{ s.updatedAt }}</b>
                      </div>
                      <button class="btn btn--ghost w100" (click)="printReceipt(s.id)">Print receipt</button>
                    </div>
                  </div>

                  <div class="payActions">
                    <button class="btn btn--ghost" (click)="cancelPayment()">Mégse</button>
                    <button class="btn btn--primary" (click)="confirmPayment(s.id)">
                      Fizetés véglegesítése
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- DETAILS VIEW -->
            <ng-template #detailsView>
              <section class="panel panel--details">
                <div class="panel__head panel__head--row">
                  <div>
                    <h2 class="panel__title">{{ s.name }} részletek</h2>
                    <p class="panel__sub">
                      Státusz:
                      <span class="tag"
                        [class.tag--free]="s.status==='FREE'"
                        [class.tag--occ]="s.status==='OCCUPIED'"
                        [class.tag--pay]="s.status==='NEEDS_PAYMENT'"
                        [class.tag--closed]="s.status==='CLOSED'"
                      >
                        {{ s.status }}
                      </span>
                    </p>
                  </div>

                  <button class="btn btn--ghost" (click)="clearSelection()">Bezár</button>
                </div>

                <div class="details">
                  <div class="details__row">
                    <div class="infoBox">
                      <div class="infoBox__label">Vendégek</div>
                      <div class="infoBox__value">{{ s.guests }} fő</div>
                    </div>
                    <div class="infoBox">
                      <div class="infoBox__label">Pincér</div>
                      <div class="infoBox__value">{{ s.server }}</div>
                    </div>
                  </div>

                  <div class="details__row">
                    <div class="infoBox">
                      <div class="infoBox__label">Utolsó frissítés</div>
                      <div class="infoBox__value">{{ s.updatedAt }}</div>
                    </div>
                    <div class="infoBox infoBox--accent">
                      <div class="infoBox__label">Összeg</div>
                      <div class="infoBox__value">
                        {{ calcTotal(s) | currency:'USD':'symbol':'1.2-2' }}
                      </div>
                    </div>
                  </div>

                  <div class="orderCard">
                    <div class="orderCard__head">
                      <div>
                        <div class="orderCard__title">Rendelés</div>
                        <div class="orderCard__sub">Minta tételek (template)</div>
                      </div>
                      <div class="orderCard__right">
                        <span class="small muted">Tételek: {{ s.items.length }}</span>
                      </div>
                    </div>

                    <div class="items" *ngIf="s.items.length > 0; else emptyOrder">
                      <div class="itemRow" *ngFor="let it of s.items">
                        <div class="itemRow__left">
                          <div class="itemRow__name">{{ it.name }}</div>
                          <div class="itemRow__meta">{{ it.qty }} × {{ it.price | currency:'USD':'symbol':'1.0-0' }}</div>
                        </div>
                        <div class="itemRow__sum">
                          {{ (it.qty * it.price) | currency:'USD':'symbol':'1.2-2' }}
                        </div>
                      </div>
                    </div>

                    <ng-template #emptyOrder>
                      <div class="emptyOrder">
                        <div class="muted">Nincs aktív rendelés (minta).</div>
                      </div>
                    </ng-template>

                    <div class="orderFoot">
                      <div class="note" *ngIf="s.note">
                        <div class="note__label">Megjegyzés</div>
                        <div class="note__text">{{ s.note }}</div>
                      </div>

                      <div class="actions">
                        <button class="btn btn--primary" (click)="addItem(s.id)">+ Tétel</button>
                        <button class="btn btn--ghost" (click)="openPayment(s.id)" [disabled]="s.status==='CLOSED'">
                          Fizetve
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </ng-template>
          </ng-container>

          <ng-template #emptyDetails>
            <section class="panel panel--details panel--detailsEmpty">
              <div class="empty">
                <div class="empty__icon">🍽️</div>
                <div class="empty__title">Válassz egy asztalt</div>
                <div class="empty__text">
                  A jobb oldali részletek itt fognak megjelenni, miután rákattintasz egy asztalra.
                </div>
              </div>
            </section>
          </ng-template>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; }

    .page{
      min-height:100vh;
      background: radial-gradient(1200px 800px at 30% 0%, rgba(255,106,0,.10), transparent 55%),
                  radial-gradient(900px 700px at 80% 10%, rgba(255,106,0,.06), transparent 55%),
                  #070707;
      color:#fff;
    }

    .top{
      position: sticky; top: 0; z-index: 50;
      height: 72px;
      display:flex; align-items:center; justify-content:space-between;
      padding: 0 18px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(12px);
    }

    .brand{ display:flex; align-items:center; gap:10px; }
    .brand__icon{ color: var(--gh-accent, #ff6a00); }
    .brand__text{ font-weight: 900; letter-spacing: 1px; }
    .sub{ color: rgba(255,255,255,.65); font-size: 12px; margin-left: 32px; margin-top: -6px; }

    .right{ display:flex; align-items:center; gap:12px; }

    .pill{
      display:flex; align-items:center; gap:10px;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(255,255,255,.03);
    }
    .dot{
      width:8px; height:8px; border-radius:999px;
      background: var(--gh-accent, #ff6a00);
      box-shadow: 0 0 0 4px rgba(255,106,0,.12);
    }
    .pill__text{ color: rgba(255,255,255,.78); font-size: 13px; }

    .btn{
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.12);
      background: transparent;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
      transition: transform .08s ease, background .15s ease, border-color .15s ease, opacity .15s ease;
    }
    .btn:active{ transform: translateY(1px); }
    .btn:disabled{ opacity: .55; cursor: not-allowed; }
    .btn--primary{
      background: var(--gh-accent, #ff6a00);
      border-color: var(--gh-accent, #ff6a00);
      color: #120a05;
    }
    .btn--ghost:hover{ background: rgba(255,255,255,.06); }
    .w100{ width: 100%; }

    .container{
      width: min(1280px, calc(100% - 48px));
      margin: 0 auto;
    }
    .content{ padding: 18px 0 28px; }

    .layout{
      display:grid;
      grid-template-columns: 0.95fr 1.25fr 1.1fr;
      gap: 18px;
      align-items: start;
    }

    .panel{
      background: rgba(255,255,255,.035);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 18px 55px rgba(0,0,0,.35);
    }

    .panel__head{ margin-bottom: 14px; }
    .panel__head--row{ display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; }
    .panel__title{ margin:0; font-size: 20px; letter-spacing: .2px; }
    .panel__sub{ margin:6px 0 0; color: rgba(255,255,255,.65); font-size: 12px; }
    .accent{ color: var(--gh-accent, #ff6a00); }
    .headActions{ display:flex; gap: 10px; }

    /* DASH */
    .cards{ display:grid; grid-template-columns: 1fr; gap: 12px; margin-top: 12px; }
    .kpi{
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.30);
    }
    .kpi--accent{
      border-color: rgba(255,106,0,.35);
      box-shadow: 0 0 0 4px rgba(255,106,0,.08) inset;
    }
    .kpi__label{ color: rgba(255,255,255,.72); font-size: 12px; font-weight: 700; }
    .kpi__value{ font-size: 34px; font-weight: 900; margin-top: 6px; }
    .kpi__meta{ color: rgba(255,255,255,.55); font-size: 12px; margin-top: 6px; }

    .dashMore{ display:grid; grid-template-columns: 1fr; gap: 12px; margin-top: 12px; }
    .mini{
      padding: 14px;
      border-radius: 14px;
      border: 1px dashed rgba(255,255,255,.14);
      background: rgba(255,255,255,.02);
    }
    .mini__title{ color: rgba(255,255,255,.75); font-weight: 800; font-size: 12px; }
    .mini__value{ margin-top: 6px; font-size: 20px; font-weight: 900; color: var(--gh-accent, #ff6a00); }
    .mini__hint{ margin-top: 6px; color: rgba(255,255,255,.55); font-size: 12px; line-height: 1.5; }

    .divider{ height: 1px; background: rgba(255,255,255,.08); margin: 14px 0; }
    .tips .tip{
      display:flex; gap: 12px; align-items:flex-start;
      padding: 12px; border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.28);
    }
    .tip__icon{ color: var(--gh-accent, #ff6a00); }
    .tip__title{ font-weight: 900; }
    .tip__text{ color: rgba(255,255,255,.65); font-size: 12px; line-height: 1.6; margin-top: 4px; }

    /* TABLES */
    .legend{ display:flex; gap: 8px; flex-wrap: wrap; justify-content:flex-end; }
    .tag{
      display:inline-flex; align-items:center;
      padding: 6px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 900;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
      color: rgba(255,255,255,.85);
    }
    .tag--free{ border-color: rgba(140,255,170,.28); }
    .tag--occ{ border-color: rgba(255,255,255,.16); }
    .tag--pay{ border-color: rgba(255,106,0,.45); color: #ffb27a; }
    .tag--closed{ border-color: rgba(255,255,255,.10); color: rgba(255,255,255,.55); }

    .grid{
      display:grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .tile{
      height: 118px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.30);
      color: #fff;
      cursor: pointer;
      padding: 12px;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      text-align:left;
      transition: transform .08s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease;
    }
    .tile:hover{
      transform: translateY(-1px);
      border-color: rgba(255,255,255,.18);
      background: rgba(0,0,0,.36);
    }
    .tile--selected{
      border-color: rgba(255,106,0,.55);
      box-shadow: 0 0 0 4px rgba(255,106,0,.10);
    }

    .tile__top{ display:flex; align-items:center; justify-content:space-between; gap: 8px; }
    .tile__name{ font-weight: 950; letter-spacing: .2px; }

    .badge{
      background: rgba(255,106,0,.16);
      border: 1px solid rgba(255,106,0,.45);
      color: #ffb27a;
      font-weight: 950;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .badge--closed{
      background: rgba(255,255,255,.06);
      border-color: rgba(255,255,255,.14);
      color: rgba(255,255,255,.65);
    }

    .tile__mid{ display:flex; justify-content:space-between; gap: 10px; }
    .muted{ color: rgba(255,255,255,.60); font-size: 12px; }

    .tile__bottom{ display:flex; justify-content:space-between; align-items:flex-end; }
    .total{ font-weight: 950; }
    .status{ font-size: 11px; color: rgba(255,255,255,.55); font-weight: 800; }

    .tile--free{ border-color: rgba(140,255,170,.22); }
    .tile--pay{ border-color: rgba(255,106,0,.30); }
    .tile--closed{
      opacity: .72;
      border-color: rgba(255,255,255,.10);
    }

    /* DETAILS */
    .details{ display:grid; gap: 12px; margin-top: 10px; }
    .details__row{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .infoBox{
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.28);
    }
    .infoBox--accent{
      border-color: rgba(255,106,0,.35);
      box-shadow: 0 0 0 4px rgba(255,106,0,.08) inset;
    }
    .infoBox__label{ color: rgba(255,255,255,.65); font-size: 12px; font-weight: 800; }
    .infoBox__value{ margin-top: 6px; font-weight: 950; font-size: 18px; }

    .orderCard{
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.30);
    }
    .orderCard__head{ display:flex; align-items:flex-start; justify-content:space-between; gap: 10px; }
    .orderCard__title{ font-weight: 950; }
    .orderCard__sub{ color: rgba(255,255,255,.60); font-size: 12px; margin-top: 4px; }

    .items{ margin-top: 12px; display:grid; gap: 10px; }
    .itemRow{
      display:flex; align-items:center; justify-content:space-between; gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.02);
    }
    .itemRow__name{ font-weight: 900; }
    .itemRow__meta{ color: rgba(255,255,255,.60); font-size: 12px; margin-top: 4px; }
    .itemRow__sum{ font-weight: 950; }

    .emptyOrder{
      margin-top: 12px;
      padding: 12px;
      border-radius: 12px;
      border: 1px dashed rgba(255,255,255,.12);
      background: rgba(255,255,255,.02);
    }

    .orderFoot{
      margin-top: 12px;
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .note{
      flex: 1;
      min-width: 220px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.22);
    }
    .note__label{ color: rgba(255,255,255,.65); font-size: 12px; font-weight: 900; }
    .note__text{ margin-top: 6px; color: rgba(255,255,255,.72); font-size: 12px; line-height: 1.5; }
    .actions{ display:flex; gap: 10px; }
    .small{ font-size: 12px; }

    /* PAYMENT */
    .pay{ display:grid; gap: 14px; }
    .pay__summary{ display:grid; gap: 12px; }
    .sumCard{
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.28);
    }
    .sumCard--accent{
      border-color: rgba(255,106,0,.35);
      box-shadow: 0 0 0 4px rgba(255,106,0,.08) inset;
    }
    .sumCard__label{ color: rgba(255,255,255,.65); font-size: 12px; font-weight: 900; }
    .sumCard__value{ margin-top: 6px; font-weight: 950; font-size: 20px; }
    .sumCard__hint{ margin-top: 8px; color: rgba(255,255,255,.60); font-size: 12px; }

    .tipRow{ display:flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .chip{
      padding: 8px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
      color: rgba(255,255,255,.85);
      font-weight: 950;
      cursor: pointer;
    }
    .chip--active{
      border-color: rgba(255,106,0,.55);
      box-shadow: 0 0 0 4px rgba(255,106,0,.10);
      color: #ffb27a;
    }

    .pay__options{ display:grid; gap: 12px; }
    .block{
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.26);
    }
    .block__title{ font-weight: 950; }
    .block__hint{ margin-top: 8px; color: rgba(255,255,255,.60); font-size: 12px; line-height: 1.5; }

    .methods{ display:flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .method{
      flex: 1;
      min-width: 90px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
      color: #fff;
      font-weight: 950;
      cursor: pointer;
      text-align: left;
    }
    .method--active{
      border-color: rgba(255,106,0,.55);
      box-shadow: 0 0 0 4px rgba(255,106,0,.10);
    }

    .split{ margin-top: 10px; display:grid; gap: 10px; }
    .split__row{ display:flex; align-items:center; justify-content:space-between; }

    .receipt{ margin-top: 10px; display:grid; gap: 10px; }
    .receipt__row{ display:flex; align-items:center; justify-content:space-between; }

    .payActions{
      display:flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .panel--detailsEmpty{
      display:grid;
      place-items:center;
      min-height: 520px;
    }
    .empty{ text-align:center; max-width: 320px; }
    .empty__icon{ font-size: 28px; opacity: .9; }
    .empty__title{ margin-top: 10px; font-weight: 950; font-size: 18px; }
    .empty__text{ margin-top: 8px; color: rgba(255,255,255,.65); font-size: 12px; line-height: 1.6; }

    @media (max-width: 1200px){
      .layout{ grid-template-columns: 1fr 1.2fr; }
      .panel--details{ grid-column: 1 / -1; }
      .panel--detailsEmpty{ grid-column: 1 / -1; min-height: 320px; }
    }
    @media (max-width: 760px){
      .layout{ grid-template-columns: 1fr; }
      .grid{ grid-template-columns: repeat(2, 1fr); }
      .details__row{ grid-template-columns: 1fr; }
      .sub{ display:none; }
    }
  `],
})
export class WaiterPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  // view mode
  mode: 'details' | 'payment' = 'details';

  // payment UI state (template)
  paymentMethod: PaymentMethod = 'CARD';
  tipPreset: 0 | 10 | 12 | 15 = 10;

  // IMPORTANT: NOT readonly -> we reassign immutably
  tables: TableInfo[] = [
    {
      id: 1, name: 'Table 1', status: 'OCCUPIED', guests: 2, server: 'Alex', updatedAt: '18:42',
      items: [
        { name: 'Signature Ribeye', qty: 1, price: 48 },
        { name: 'Cola', qty: 2, price: 4 },
      ],
      note: 'Medium-rare steak, extra sauce.',
    },
    { id: 2, name: 'Table 2', status: 'FREE', guests: 0, server: '—', updatedAt: '18:10', items: [] },
    {
      id: 3, name: 'Table 3', status: 'NEEDS_PAYMENT', guests: 4, server: 'Sam', updatedAt: '19:05',
      items: [
        { name: 'BBQ Brisket Platter', qty: 2, price: 36 },
        { name: 'Beer (sample)', qty: 4, price: 6 },
      ],
      note: 'Kérés: külön számla 2 részre (minta).',
    },
    {
      id: 4, name: 'Table 4', status: 'OCCUPIED', guests: 3, server: 'Alex', updatedAt: '19:12',
      items: [
        { name: 'Fall-Off-The-Bone Ribs', qty: 1, price: 42 },
        { name: 'Smoked Pulled Pork', qty: 1, price: 28 },
      ],
    },
    { id: 5, name: 'Table 5', status: 'FREE', guests: 0, server: '—', updatedAt: '17:55', items: [] },
    {
      id: 6, name: 'Table 6', status: 'NEEDS_PAYMENT', guests: 2, server: 'Sam', updatedAt: '19:18',
      items: [
        { name: 'Grilled Chicken Platter', qty: 2, price: 24 },
        { name: 'Lemonade', qty: 2, price: 5 },
      ],
    },
    { id: 7, name: 'Table 7', status: 'CLOSED', guests: 0, server: '—', updatedAt: '18:30', items: [] },
    {
      id: 8, name: 'Table 8', status: 'OCCUPIED', guests: 5, server: 'Alex', updatedAt: '19:20',
      items: [
        { name: 'Tomahawk Steak', qty: 1, price: 89 },
        { name: 'Cola', qty: 5, price: 4 },
      ],
    },
  ];

  selected: TableInfo | null = null;

  // Dashboard stats
  get occupiedCount(): number {
    return this.tables.filter(t => t.status === 'OCCUPIED' || t.status === 'NEEDS_PAYMENT').length;
  }
  get freeCount(): number {
    return this.tables.filter(t => t.status === 'FREE').length;
  }
  get needsPaymentCount(): number {
    return this.tables.filter(t => t.status === 'NEEDS_PAYMENT').length;
  }
  get guestsTotal(): number {
    return this.tables.reduce((sum, t) => sum + (t.guests || 0), 0);
  }

  // Selection
  selectTable(t: TableInfo): void {
    this.selected = t;
    this.mode = 'details';
  }
  clearSelection(): void {
    this.selected = null;
    this.mode = 'details';
  }

  // Totals
  calcTotal(t: TableInfo): number {
    return (t.items || []).reduce((sum, it) => sum + it.qty * it.price, 0);
  }
  tipAmount(t: TableInfo): number {
    return this.calcTotal(t) * (this.tipPreset / 100);
  }
  grandTotal(t: TableInfo): number {
    return this.calcTotal(t) + this.tipAmount(t);
  }
  perGuest(t: TableInfo): number {
    const g = Math.max(1, t.guests || 1);
    return this.grandTotal(t) / g;
  }

  // Mode switching
  openPayment(tableId: number): void {
    // payment view only if we have a selected table
    const t = this.tables.find(x => x.id === tableId);
    if (!t) return;
    if (t.status === 'CLOSED') return;

    this.selected = t;
    this.mode = 'payment';
  }
  backToDetails(): void {
    this.mode = 'details';
  }

  // Payment UI interactions
  setPaymentMethod(m: PaymentMethod): void {
    this.paymentMethod = m;
  }
  setTipPreset(p: 0 | 10 | 12 | 15): void {
    this.tipPreset = p;
  }

  cancelPayment(): void {
    this.mode = 'details';
  }

  // ✅ This makes the table CLOSED (immutable update -> UI surely refreshes)
  confirmPayment(tableId: number): void {
    this.tables = this.tables.map(t => {
      if (t.id !== tableId) return t;

      return {
        ...t,
        status: 'CLOSED',
        guests: 0,
        items: [],
        note: undefined,
        updatedAt: this.nowTime(),
      };
    });

    this.selected = this.tables.find(t => t.id === tableId) ?? null;
    this.mode = 'details';

    // TODO: implement later (persist payment)
  }

  // Buttons with empty bodies for later
  addItem(tableId: number): void {
    // TODO: implement later
  }
  printReceipt(tableId: number): void {
    // TODO: implement later
  }

  // Auth
  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  private nowTime(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}