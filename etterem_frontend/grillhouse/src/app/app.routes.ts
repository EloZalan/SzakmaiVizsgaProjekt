import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { LoginPageComponent } from './components/login-page/login-page';
import { WaiterPageComponent } from './components/waiter-page/waiter-page';
import { WaiterDashboardComponent } from './components/waiter-dashboard/waiter-dashboard';
import { WaiterReservationsComponent } from './components/waiter-reservations/waiter-reservations';
import { WaiterUserDataComponent } from './components/waiter-user-data/waiter-user-data';
import { AdminPageComponent } from './components/admin-page/admin-page';
import { AdminStatsComponent } from './components/admin-stats/admin-stats';
import { AdminStaffComponent } from './components/admin-staff/admin-staff';
import { AdminTablesComponent } from './components/admin-tables/admin-tables';
import { AdminMenuComponent } from './components/admin-menu/admin-menu';
import { ReservePageComponent } from './components/reserve-page/reserve-page';
import { InviteAcceptComponent } from './components/invite-accept/invite-accept';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'invite/:token', component: InviteAcceptComponent },
  { path: 'reserve', component: ReservePageComponent },
  {
    path: 'waiter/user',
    component: WaiterUserDataComponent,
    canActivate: [roleGuard(['waiter'])],
  },
  {
    path: 'waiter',
    component: WaiterPageComponent,
    canActivate: [roleGuard(['waiter'])],
    children: [
      { path: 'dashboard', component: WaiterDashboardComponent },
      { path: 'reservations', component: WaiterReservationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [roleGuard(['admin'])],
    children: [
      { path: 'stats', component: AdminStatsComponent },
      { path: 'staff', component: AdminStaffComponent },
      { path: 'tables', component: AdminTablesComponent },
      { path: 'menu', component: AdminMenuComponent },
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
