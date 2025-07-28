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
    path: 'live-view/:id',
    loadComponent: () => import('./pages/live-view/live-view.page').then(m => m.LiveViewPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Live View'
  },
  {
    path: 'state',
    loadComponent: () => import('./pages/state/state.page').then(m => m.StatePage),
    canActivate: [AuthGuard],
    title: 'zmNinja - System Status'
  },
  {
    path: 'montage',
    loadComponent: () => import('./pages/montage/montage.page').then(m => m.MontagePage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Montage'
  },
  {
    path: 'timeline',
    loadComponent: () => import('./pages/timeline/timeline.page').then(m => m.TimelinePage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Timeline'
  },
  {
    path: 'montage-history',
    loadComponent: () => import('./pages/montage-history/montage-history.page').then(m => m.MontageHistoryPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Event Montage'
  },
  {
    path: 'moment',
    loadComponent: () => import('./pages/moment/moment.page').then(m => m.MomentPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - 24hr Review'
  },
  {
    path: 'devoptions',
    loadComponent: () => import('./pages/devoptions/devoptions.page').then(m => m.DevOptionsPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Developer Options'
  },
  {
    path: 'help',
    loadComponent: () => import('./pages/help/help.page').then(m => m.HelpPage),
    title: 'zmNinja - Help'
  },
  {
    path: 'wizard',
    loadComponent: () => import('./pages/wizard/wizard.page').then(m => m.WizardPage),
    title: 'zmNinja - Setup Wizard'
  },
  {
    path: 'log',
    loadComponent: () => import('./pages/log/log.page').then(m => m.LogPage),
    canActivate: [AuthGuard],
    title: 'zmNinja - Logs'
  }
];
