import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { appReducer } from './app/store/app.reducer';
import { environment } from './environments/environment';

if (environment.production) {
  import('@sentry/angular').then(Sentry => {
    Sentry.init({
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
      tracesSampleRate: 0.1,
    });
  });
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      StoreModule.forRoot({ app: appReducer }),
      EffectsModule.forRoot([])
    ),
  ],
}).catch(err => {
  console.error('Error starting app:', err);
  if (environment.production) {
    import('@sentry/angular').then(Sentry => {
      Sentry.captureException(err);
    });
  }
});
