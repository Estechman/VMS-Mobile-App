import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    title: 'zmNinja - Login'
  },
  {
    path: 'monitors',
    loadComponent: () => import('./pages/monitors/monitors.page').then(m => m.MonitorsPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Monitors'
  },
  {
    path: 'events',
    loadChildren: () => import('./pages/events/events.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'state',
    loadComponent: () => import('./pages/state/state.page').then(m => m.StatePage),
    canActivate: [AuthGuard],
    title: 'zmNinja - System State'
  }
];
