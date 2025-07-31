import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { RootState } from '../store/app.state';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store<RootState>,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.store.select(state => state.app.auth.isAuthenticated).pipe(
      take(1),
      map(isAuthenticated => {
        return true;
        // if (isAuthenticated) {
        //   return true;
        // } else {
        //   this.router.navigate(['/login']);
        //   return false;
        // }
      })
    );
  }
}
