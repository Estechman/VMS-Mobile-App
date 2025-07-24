import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./events.page').then(m => m.EventsPage),
    title: 'zmNinja - Events'
  },
  {
    path: ':id',
    loadComponent: () => import('./event-detail/event-detail.page').then(m => m.EventDetailPage),
    title: 'zmNinja - Event Detail'
  }
];
