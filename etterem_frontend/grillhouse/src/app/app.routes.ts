import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { LoginPageComponent } from './components/login-page/login-page';
import { WaiterPageComponent } from './components/waiter-page/waiter-page';
import { AdminPageComponent } from './components/admin-page/admin-page';
import { ReservePageComponent } from './components/reserve-page/reserve-page';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'reserve', component: ReservePageComponent },
  {
    path: 'waiter',
    component: WaiterPageComponent,
    canActivate: [roleGuard(['pincer'])],
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [roleGuard(['admin'])],
  },
  { path: '**', redirectTo: '' },
];