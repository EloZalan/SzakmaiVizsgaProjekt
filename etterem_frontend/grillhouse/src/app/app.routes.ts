import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { LoginPageComponent } from './components/login-page/login-page';
import { WaiterPageComponent } from './components/waiter-page/waiter-page';
import { roleGuard } from './guards/role-guard';
import { AdminPageComponent } from './components/admin-page/admin-page';
import { ReserevePage } from './components/resereve-page/resereve-page';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },

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

  {
  path: 'reserve',
  component: ReserevePage,

},

  { path: '**', redirectTo: '' },
];