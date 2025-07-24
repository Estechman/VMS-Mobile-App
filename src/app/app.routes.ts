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
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'monitors',
    loadComponent: () => import('./pages/monitors/monitors.page').then(m => m.MonitorsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./pages/events/events.page').then(m => m.EventsPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'state',
    loadComponent: () => import('./pages/state/state.page').then(m => m.StatePage),
    canActivate: [AuthGuard]
  },
];
