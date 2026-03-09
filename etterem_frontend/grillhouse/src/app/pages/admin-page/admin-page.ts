import { Component } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

type StaffRole = 'PINCER' | 'ADMIN';
type StaffStatus = 'ACTIVE' | 'INACTIVE';

type StaffMember = {
  id: number;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  shift: string;
};

type RestaurantTable = {
  id: number;
  name: string;
  seats: number;
  status: 'ACTIVE' | 'DISABLED';
};

@Component({
  selector: 'app-admin-page',
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
          <div class="sub">Admin felület</div>
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
          <!-- DASHBOARD -->
          <section class="panel">
            <div class="panel__head">
              <h2 class="panel__title">Dashboard</h2>
              <p class="panel__sub">Étterem statisztikák</p>
            </div>

            <div class="statsGrid">
              <div class="statCard statCard--accent">
                <div class="statCard__label">Mai bevétel</div>
                <div class="statCard__value">{{ dailyRevenue | currency:'USD':'symbol':'1.0-0' }}</div>
                <div class="statCard__hint">Minta adat</div>
              </div>

              <div class="statCard">
                <div class="statCard__label">Mai vendégek</div>
                <div class="statCard__value">{{ todayGuests }}</div>
                <div class="statCard__hint">Összes kiszolgált vendég</div>
              </div>

              <div class="statCard">
                <div class="statCard__label">Aktív pincérek</div>
                <div class="statCard__value">{{ activeWaiters }}</div>
                <div class="statCard__hint">Jelenleg aktív dolgozók</div>
              </div>

              <div class="statCard">
                <div class="statCard__label">Asztalok száma</div>
                <div class="statCard__value">{{ tables.length }}</div>
                <div class="statCard__hint">Összes konfigurált asztal</div>
              </div>
            </div>

            <div class="miniCards">
              <div class="miniCard">
                <div class="miniCard__title">Foglaltság</div>
                <div class="miniCard__value">82%</div>
                <div class="miniCard__hint">Esti csúcsidő minta adat</div>
              </div>

              <div class="miniCard">
                <div class="miniCard__title">Legnépszerűbb étel</div>
                <div class="miniCard__value">BBQ Brisket</div>
                <div class="miniCard__hint">Minta statisztika</div>
              </div>
            </div>
          </section>

          <!-- STAFF MANAGEMENT -->
          <section class="panel">
            <div class="panel__head panel__head--row">
              <div>
                <h2 class="panel__title">Szerepkörök kezelése</h2>
                <p class="panel__sub">Pincérek felvétele, kirúgása, szerepkör módosítás</p>
              </div>
              <button class="btn btn--primary" (click)="addWaiter()">+ Pincér felvétele</button>
            </div>

            <div class="tableWrap">
              <table class="adminTable">
                <thead>
                  <tr>
                    <th>Név</th>
                    <th>Szerepkör</th>
                    <th>Státusz</th>
                    <th>Műszak</th>
                    <th>Művelet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let staff of staffMembers" [class.selectedRow]="selectedStaff?.id === staff.id">
                    <td>{{ staff.name }}</td>
                    <td>
                      <span class="tag" [class.tag--admin]="staff.role === 'ADMIN'">
                        {{ staff.role }}
                      </span>
                    </td>
                    <td>
                      <span class="tag" [class.tag--inactive]="staff.status === 'INACTIVE'">
                        {{ staff.status }}
                      </span>
                    </td>
                    <td>{{ staff.shift }}</td>
                    <td>
                      <div class="rowActions">
                        <button class="btn btn--ghost btn--small" (click)="selectStaff(staff)">Részletek</button>
                        <button class="btn btn--ghost btn--small" (click)="toggleRole(staff.id)">Role váltás</button>
                        <button class="btn btn--danger btn--small" (click)="removeStaff(staff.id)">Kirúgás</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- TABLE MANAGEMENT -->
          <section class="panel">
            <div class="panel__head panel__head--row">
              <div>
                <h2 class="panel__title">Asztalok módosítása</h2>
                <p class="panel__sub">Férőhely, törlés, hozzáadás</p>
              </div>
              <button class="btn btn--primary" (click)="addTable()">+ Asztal hozzáadás</button>
            </div>

            <div class="tablesGrid">
              <div class="tableCard" *ngFor="let table of tables" [class.tableCard--selected]="selectedTable?.id === table.id">
                <div class="tableCard__top">
                  <div class="tableCard__title">{{ table.name }}</div>
                  <span class="tag" [class.tag--inactive]="table.status === 'DISABLED'">
                    {{ table.status }}
                  </span>
                </div>

                <div class="tableCard__info">
                  <div class="muted">Férőhely</div>
                  <div class="tableCard__seats">{{ table.seats }} fő</div>
                </div>

                <div class="rowActions rowActions--mt">
                  <button class="btn btn--ghost btn--small" (click)="selectTable(table)">Szerkesztés</button>
                  <button class="btn btn--ghost btn--small" (click)="changeSeats(table.id)">Férőhely</button>
                  <button class="btn btn--danger btn--small" (click)="deleteTable(table.id)">Törlés</button>
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT DETAIL PANEL -->
          <section class="panel panel--detail">
            <div class="panel__head">
              <h2 class="panel__title">Részletek</h2>
              <p class="panel__sub">Kiválasztott admin elem</p>
            </div>

            <ng-container *ngIf="selectedStaff; else tableOrEmpty">
              <div class="detailCard">
                <div class="detailCard__title">Dolgozó adatai</div>
                <div class="detailRow">
                  <span class="muted">Név</span>
                  <b>{{ selectedStaff.name }}</b>
                </div>
                <div class="detailRow">
                  <span class="muted">Szerepkör</span>
                  <b>{{ selectedStaff.role }}</b>
                </div>
                <div class="detailRow">
                  <span class="muted">Státusz</span>
                  <b>{{ selectedStaff.status }}</b>
                </div>
                <div class="detailRow">
                  <span class="muted">Műszak</span>
                  <b>{{ selectedStaff.shift }}</b>
                </div>

                <div class="detailActions">
                  <button class="btn btn--ghost" (click)="toggleRole(selectedStaff.id)">Szerepkör váltása</button>
                  <button class="btn btn--danger" (click)="removeStaff(selectedStaff.id)">Kirúgás</button>
                </div>
              </div>
            </ng-container>

            <ng-template #tableOrEmpty>
              <ng-container *ngIf="selectedTable; else emptyState">
                <div class="detailCard">
                  <div class="detailCard__title">Asztal adatai</div>
                  <div class="detailRow">
                    <span class="muted">Név</span>
                    <b>{{ selectedTable.name }}</b>
                  </div>
                  <div class="detailRow">
                    <span class="muted">Férőhely</span>
                    <b>{{ selectedTable.seats }} fő</b>
                  </div>
                  <div class="detailRow">
                    <span class="muted">Státusz</span>
                    <b>{{ selectedTable.status }}</b>
                  </div>

                  <div class="detailActions">
                    <button class="btn btn--ghost" (click)="changeSeats(selectedTable.id)">Férőhely módosítás</button>
                    <button class="btn btn--danger" (click)="deleteTable(selectedTable.id)">Asztal törlése</button>
                  </div>
                </div>
              </ng-container>
            </ng-template>

            <ng-template #emptyState>
              <div class="emptyState">
                <div class="emptyState__icon">⚙️</div>
                <div class="emptyState__title">Válassz egy elemet</div>
                <div class="emptyState__text">
                  Kattints egy dolgozóra vagy asztalra, és itt megjelennek a részletek.
                </div>
              </div>
            </ng-template>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; }

    .page{
      min-height:100vh;
      background:
        radial-gradient(1200px 800px at 30% 0%, rgba(255,106,0,.10), transparent 55%),
        radial-gradient(900px 700px at 80% 10%, rgba(255,106,0,.06), transparent 55%),
        #070707;
      color:#fff;
    }

    .top{
      position: sticky;
      top: 0;
      z-index: 50;
      height: 72px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 0 18px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(12px);
    }

    .brand{ display:flex; align-items:center; gap:10px; }
    .brand__icon{ color: #ff6a00; }
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
      background: #ff6a00;
      box-shadow: 0 0 0 4px rgba(255,106,0,.12);
    }

    .pill__text{ color: rgba(255,255,255,.78); font-size: 13px; }

    .container{
      width: min(1380px, calc(100% - 48px));
      margin: 0 auto;
    }

    .content{ padding: 18px 0 28px; }

    .layout{
      display:grid;
      grid-template-columns: 1.2fr 1.3fr;
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

    .panel--detail{
      grid-column: 2;
      min-height: 320px;
    }

    .panel__head{ margin-bottom: 14px; }
    .panel__head--row{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
    }

    .panel__title{
      margin:0;
      font-size: 20px;
      letter-spacing: .2px;
    }

    .panel__sub{
      margin:6px 0 0;
      color: rgba(255,255,255,.65);
      font-size: 12px;
    }

    .btn{
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.12);
      background: transparent;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
      transition: transform .08s ease, background .15s ease, border-color .15s ease;
    }

    .btn:active{ transform: translateY(1px); }

    .btn--primary{
      background: #ff6a00;
      border-color: #ff6a00;
      color: #120a05;
    }

    .btn--ghost:hover{ background: rgba(255,255,255,.06); }

    .btn--danger{
      border-color: rgba(255, 90, 90, 0.35);
      color: #ff9d9d;
    }

    .btn--small{
      padding: 8px 10px;
      font-size: 12px;
      border-radius: 10px;
    }

    .statsGrid{
      display:grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .statCard{
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.30);
    }

    .statCard--accent{
      border-color: rgba(255,106,0,.35);
      box-shadow: 0 0 0 4px rgba(255,106,0,.08) inset;
    }

    .statCard__label{
      color: rgba(255,255,255,.72);
      font-size: 12px;
      font-weight: 700;
    }

    .statCard__value{
      font-size: 30px;
      font-weight: 900;
      margin-top: 6px;
    }

    .statCard__hint{
      color: rgba(255,255,255,.55);
      font-size: 12px;
      margin-top: 6px;
    }

    .miniCards{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:12px;
      margin-top: 12px;
    }

    .miniCard{
      padding: 14px;
      border-radius: 14px;
      border: 1px dashed rgba(255,255,255,.14);
      background: rgba(255,255,255,.02);
    }

    .miniCard__title{
      color: rgba(255,255,255,.75);
      font-weight: 800;
      font-size: 12px;
    }

    .miniCard__value{
      margin-top: 6px;
      font-size: 20px;
      font-weight: 900;
      color: #ff6a00;
    }

    .miniCard__hint{
      margin-top: 6px;
      color: rgba(255,255,255,.55);
      font-size: 12px;
      line-height: 1.5;
    }

    .tableWrap{
      overflow:auto;
      margin-top: 12px;
    }

    .adminTable{
      width:100%;
      border-collapse: collapse;
      min-width: 720px;
    }

    .adminTable th,
    .adminTable td{
      text-align:left;
      padding: 14px 12px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      vertical-align: middle;
    }

    .adminTable th{
      color: rgba(255,255,255,.60);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .4px;
    }

    .selectedRow{
      background: rgba(255,106,0,.06);
    }

    .tag{
      display:inline-flex;
      align-items:center;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
      color: rgba(255,255,255,.85);
    }

    .tag--admin{
      border-color: rgba(255,106,0,.45);
      color: #ffb27a;
    }

    .tag--inactive{
      border-color: rgba(255,255,255,.10);
      color: rgba(255,255,255,.55);
    }

    .rowActions{
      display:flex;
      gap:8px;
      flex-wrap: wrap;
    }

    .rowActions--mt{
      margin-top: 12px;
    }

    .tablesGrid{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .tableCard{
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.30);
      transition: border-color .15s ease, box-shadow .15s ease;
    }

    .tableCard--selected{
      border-color: rgba(255,106,0,.55);
      box-shadow: 0 0 0 4px rgba(255,106,0,.10);
    }

    .tableCard__top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    .tableCard__title{
      font-weight: 950;
    }

    .tableCard__info{
      margin-top: 14px;
    }

    .tableCard__seats{
      font-size: 22px;
      font-weight: 900;
      margin-top: 6px;
    }

    .muted{
      color: rgba(255,255,255,.60);
      font-size: 12px;
    }

    .detailCard{
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(0,0,0,.28);
    }

    .detailCard__title{
      font-size: 18px;
      font-weight: 950;
      margin-bottom: 14px;
    }

    .detailRow{
      display:flex;
      justify-content:space-between;
      gap:10px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }

    .detailActions{
      display:flex;
      gap:10px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .emptyState{
      min-height: 220px;
      display:grid;
      place-items:center;
      text-align:center;
      color: rgba(255,255,255,.70);
    }

    .emptyState__icon{
      font-size: 28px;
    }

    .emptyState__title{
      margin-top: 10px;
      font-size: 18px;
      font-weight: 900;
      color: #fff;
    }

    .emptyState__text{
      margin-top: 8px;
      max-width: 280px;
      font-size: 13px;
      line-height: 1.6;
    }

    @media (max-width: 1200px){
      .layout{
        grid-template-columns: 1fr;
      }

      .panel--detail{
        grid-column: auto;
      }

      .tablesGrid{
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 760px){
      .statsGrid,
      .miniCards,
      .tablesGrid{
        grid-template-columns: 1fr;
      }

      .sub{
        display:none;
      }

      .right{
        gap:8px;
      }

      .pill{
        display:none;
      }
    }
  `],
})
export class AdminPageComponent {
  constructor(public auth: AuthService, private router: Router) {}

  dailyRevenue = 4280;
  todayGuests = 136;

  staffMembers: StaffMember[] = [
    { id: 1, name: 'Alex Kovács', role: 'PINCER', status: 'ACTIVE', shift: 'Délelőtt' },
    { id: 2, name: 'Sam Nagy', role: 'PINCER', status: 'ACTIVE', shift: 'Este' },
    { id: 3, name: 'Bence Tóth', role: 'ADMIN', status: 'ACTIVE', shift: 'Egész nap' },
    { id: 4, name: 'Lili Kiss', role: 'PINCER', status: 'INACTIVE', shift: 'Szabadnap' },
  ];

  tables: RestaurantTable[] = [
    { id: 1, name: 'Asztal 1', seats: 2, status: 'ACTIVE' },
    { id: 2, name: 'Asztal 2', seats: 4, status: 'ACTIVE' },
    { id: 3, name: 'Asztal 3', seats: 6, status: 'ACTIVE' },
    { id: 4, name: 'Asztal 4', seats: 4, status: 'ACTIVE' },
    { id: 5, name: 'Asztal 5', seats: 8, status: 'DISABLED' },
    { id: 6, name: 'Asztal 6', seats: 2, status: 'ACTIVE' },
  ];

  selectedStaff: StaffMember | null = null;
  selectedTable: RestaurantTable | null = null;

  get activeWaiters(): number {
    return this.staffMembers.filter(s => s.role === 'PINCER' && s.status === 'ACTIVE').length;
  }

  selectStaff(staff: StaffMember): void {
    this.selectedStaff = staff;
    this.selectedTable = null;
  }

  selectTable(table: RestaurantTable): void {
    this.selectedTable = table;
    this.selectedStaff = null;
  }

addWaiter(): void {
  const name = prompt('Új dolgozó neve:');
  if (!name || !name.trim()) return;

  const roleInput = prompt('Szerepkör (PINCER / ADMIN):', 'PINCER');
  const role = roleInput?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'PINCER';

  const shift = prompt('Műszak:', 'Délelőtt') || 'Délelőtt';

  const newStaff: StaffMember = {
    id: this.getNextStaffId(),
    name: name.trim(),
    role,
    status: 'ACTIVE',
    shift: shift.trim(),
  };

  this.staffMembers = [...this.staffMembers, newStaff];
  this.selectedStaff = newStaff;
  this.selectedTable = null;
}

removeStaff(staffId: number): void {
  const staff = this.staffMembers.find(s => s.id === staffId);
  if (!staff) return;

  const confirmed = confirm(`Biztosan eltávolítod őt: ${staff.name}?`);
  if (!confirmed) return;

  this.staffMembers = this.staffMembers.filter(s => s.id !== staffId);

  if (this.selectedStaff?.id === staffId) {
    this.selectedStaff = null;
  }
}

toggleRole(staffId: number): void {
  this.staffMembers = this.staffMembers.map(staff => {
    if (staff.id !== staffId) return staff;

    return {
      ...staff,
      role: staff.role === 'PINCER' ? 'ADMIN' : 'PINCER',
    };
  });

  if (this.selectedStaff?.id === staffId) {
    this.selectedStaff =
      this.staffMembers.find(s => s.id === staffId) ?? null;
  }
}

addTable(): void {
  const tableName = prompt('Új asztal neve:', `Asztal ${this.getNextTableId()}`);
  if (!tableName || !tableName.trim()) return;

  const seatsInput = prompt('Férőhelyek száma:', '4');
  const seats = Number(seatsInput);

  if (!Number.isFinite(seats) || seats <= 0) {
    alert('Adj meg érvényes férőhely számot.');
    return;
  }

  const newTable: RestaurantTable = {
    id: this.getNextTableId(),
    name: tableName.trim(),
    seats,
    status: 'ACTIVE',
  };

  this.tables = [...this.tables, newTable];
  this.selectedTable = newTable;
  this.selectedStaff = null;
}

changeSeats(tableId: number): void {
  const table = this.tables.find(t => t.id === tableId);
  if (!table) return;

  const seatsInput = prompt(
    `${table.name} új férőhely száma:`,
    String(table.seats)
  );

  if (seatsInput === null) return;

  const seats = Number(seatsInput);

  if (!Number.isFinite(seats) || seats <= 0) {
    alert('Adj meg érvényes férőhely számot.');
    return;
  }

  this.tables = this.tables.map(t => {
    if (t.id !== tableId) return t;

    return {
      ...t,
      seats,
    };
  });

  if (this.selectedTable?.id === tableId) {
    this.selectedTable = this.tables.find(t => t.id === tableId) ?? null;
  }
}

deleteTable(tableId: number): void {
  const table = this.tables.find(t => t.id === tableId);
  if (!table) return;

  const confirmed = confirm(`Biztosan törlöd ezt az asztalt: ${table.name}?`);
  if (!confirmed) return;

  this.tables = this.tables.filter(t => t.id !== tableId);

  if (this.selectedTable?.id === tableId) {
    this.selectedTable = null;
  }
}

private getNextStaffId(): number {
  if (this.staffMembers.length === 0) return 1;
  return Math.max(...this.staffMembers.map(s => s.id)) + 1;
}

private getNextTableId(): number {
  if (this.tables.length === 0) return 1;
  return Math.max(...this.tables.map(t => t.id)) + 1;
}

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}