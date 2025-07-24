import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LoginData {
  serverName: string;
  username: string;
  password: string;
  url: string;
  apiurl: string;
  streamingurl: string;
  isUseAuth: boolean;
  authSession: string;
}

export interface Monitor {
  Monitor: {
    Id: string;
    Name: string;
    Function: string;
    Enabled: string;
    Type: string;
    Host: string;
    Port: string;
    Path: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NvrService {
  private loginData = new BehaviorSubject<LoginData | null>(null);
  private monitors = new BehaviorSubject<Monitor[]>([]);
  private apiVersion = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {}

  getLogin(): LoginData | null {
    return this.loginData.value;
  }

  setLogin(data: LoginData | null): void {
    this.loginData.next(data);
  }

  getMonitors(): Observable<Monitor[]> {
    return this.monitors.asObservable();
  }

  setMonitors(monitors: Monitor[]): void {
    this.monitors.next(monitors);
  }

  getApiVersion(): Observable<string> {
    return this.apiVersion.asObservable();
  }

  setApiVersion(version: string): void {
    this.apiVersion.next(version);
  }

  login(serverName: string, username: string, password: string): Observable<any> {
    const url = this.addHttp(serverName);
    const apiurl = url + '/zm/api';
    
    const loginPayload = {
      user: username,
      pass: password
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(`${apiurl}/host/login.json`, this.objectToQueryString(loginPayload), { headers })
      .pipe(
        map((response: any) => {
          if (response && response.access_token) {
            const loginData: LoginData = {
              serverName,
              username,
              password,
              url,
              apiurl,
              streamingurl: url + '/zm/cgi-bin',
              isUseAuth: true,
              authSession: `token=${response.access_token}`
            };
            this.setLogin(loginData);
            return response;
          }
          throw new Error('Invalid login response');
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  loadMonitors(): Observable<Monitor[]> {
    const loginData = this.getLogin();
    if (!loginData) {
      return throwError(() => new Error('Not logged in'));
    }

    const url = `${loginData.apiurl}/monitors.json?${loginData.authSession}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const monitors = response.monitors || [];
        this.setMonitors(monitors);
        return monitors;
      }),
      catchError(error => {
        console.error('Error loading monitors:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return this.http.get(`${loginData.apiurl}/host/logout.json`).pipe(
      map(() => {
        this.setLogin(null);
        this.setMonitors([]);
        return true;
      }),
      catchError(error => {
        this.setLogin(null);
        this.setMonitors([]);
        return new Observable(observer => {
          observer.next(true);
          observer.complete();
        });
      })
    );
  }

  private addHttp(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    return url;
  }

  private objectToQueryString(obj: any): string {
    const str: string[] = [];
    for (const p in obj) {
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    }
    return str.join('&');
  }

  debug(message: string): void {
    console.log(`[NVR] ${message}`);
  }

  log(message: string): void {
    console.log(`[NVR] ${message}`);
  }
}
