import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page.component';
import { LoginPageComponent } from './pages/login-page/login-page';
import { WaiterPageComponent } from './pages/waiter-page/waiter-page';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },

  {
    path: 'waiter',
    component: WaiterPageComponent,
    canActivate: [roleGuard(['pincer'])],
  },

  { path: '**', redirectTo: '' },
];