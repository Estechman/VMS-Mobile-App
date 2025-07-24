import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface LoginData {
  serverName: string;
  username: string;
  password: string;
  isUseAuth: boolean;
  isUseBasicAuth: boolean;
  basicAuthUser: string;
  basicAuthPassword: string;
  url: string;
  apiurl: string;
  streamingurl: string;
  eventServer: string;
  isUseEventServer: boolean;
  enableStrictSSL: boolean;
  saveToCloud: boolean;
  enableLowBandwidth: boolean;
  autoSwitchBandwidth: boolean;
  fallbackConfiguration: string;
  usePin: boolean;
  isKiosk: boolean;
  keepAwake: boolean;
  authSession: string;
}

export interface Monitor {
  Monitor: {
    Id: string;
    Name: string;
    Function: string;
    Enabled: string;
    Width: string;
    Height: string;
    Sequence: string;
    streamingURL?: string;
    baseURL?: string;
    controlURL?: string;
    connKey?: string;
    isAlarmed?: boolean;
  };
}

export interface Event {
  Event: {
    Id: string;
    MonitorId: string;
    Name: string;
    StartTime: string;
    EndTime: string;
    Length: string;
    Frames: string;
    AlarmFrames: string;
    Archived: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NvrService {
  private loginData = new BehaviorSubject<LoginData | null>(null);
  private monitors = new BehaviorSubject<Monitor[]>([]);
  private events = new BehaviorSubject<Event[]>([]);
  private authSession = new BehaviorSubject<string>('');
  private apiVersion = new BehaviorSubject<string>('0.0.0');

  constructor(private http: HttpClient) {
    this.loadSavedLogin();
  }

  getLogin(): LoginData | null {
    return this.loginData.value;
  }

  setLogin(data: LoginData): void {
    this.loginData.next(data);
    localStorage.setItem('zmNinja-loginData', JSON.stringify(data));
  }

  getMonitors(): Observable<Monitor[]> {
    return this.monitors.asObservable();
  }

  setMonitors(monitors: Monitor[]): void {
    this.monitors.next(monitors);
  }

  getEvents(): Observable<Event[]> {
    return this.events.asObservable();
  }

  getApiVersion(): Observable<string> {
    return this.apiVersion.asObservable();
  }

  setApiVersion(version: string): void {
    this.apiVersion.next(version);
  }

  login(serverName: string, username: string, password: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const apiUrl = `${loginData.apiurl}/host/login.json`;
    const credentials = {
      user: username,
      pass: password
    };

    return this.http.post(apiUrl, credentials).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.authSession.next(`&token=${response.access_token}`);
        }
      }),
      catchError(this.handleError)
    );
  }

  loadMonitors(): Observable<Monitor[]> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const apiUrl = `${loginData.apiurl}/monitors.json${this.authSession.value}`;
    
    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        const monitors = response.monitors || [];
        
        const processedMonitors = monitors.map((monitor: Monitor) => {
          monitor.Monitor.connKey = this.generateConnKey();
          monitor.Monitor.isAlarmed = false;
          
          this.configureMonitorUrls(monitor, loginData);
          
          return monitor;
        });

        processedMonitors.sort((a: Monitor, b: Monitor) => 
          parseInt(a.Monitor.Sequence) - parseInt(b.Monitor.Sequence)
        );

        this.monitors.next(processedMonitors);
        return processedMonitors;
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data');
    }

    const apiUrl = `${loginData.apiurl}/host/logout.json${this.authSession.value}`;
    return this.http.post(apiUrl, {}).pipe(
      tap(() => {
        this.authSession.next('');
        this.monitors.next([]);
        this.events.next([]);
      }),
      catchError(this.handleError)
    );
  }

  loadEvents(monitorId?: string, startTime?: string, endTime?: string): Observable<Event[]> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    let apiUrl = `${loginData.apiurl}/events.json${this.authSession.value}`;
    
    const params: string[] = [];
    if (monitorId) params.push(`MonitorId=${monitorId}`);
    if (startTime) params.push(`StartTime>=${startTime}`);
    if (endTime) params.push(`EndTime<=${endTime}`);
    
    if (params.length > 0) {
      apiUrl += `&${params.join('&')}`;
    }

    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        const events = response.events || [];
        this.events.next(events);
        return events;
      }),
      catchError(this.handleError)
    );
  }

  archiveEvent(eventId: string, archived: boolean): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const apiUrl = `${loginData.apiurl}/events/${eventId}.json${this.authSession.value}`;
    const data = { 'Event[Archived]': archived ? '1' : '0' };

    return this.http.post(apiUrl, data).pipe(
      tap(() => {
        const currentEvents = this.events.value;
        const eventIndex = currentEvents.findIndex(e => e.Event.Id === eventId);
        if (eventIndex >= 0) {
          currentEvents[eventIndex].Event.Archived = archived ? '1' : '0';
          this.events.next([...currentEvents]);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteEvent(eventId: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const apiUrl = `${loginData.apiurl}/events/${eventId}.json${this.authSession.value}`;

    return this.http.delete(apiUrl).pipe(
      tap(() => {
        const currentEvents = this.events.value;
        const filteredEvents = currentEvents.filter(e => e.Event.Id !== eventId);
        this.events.next(filteredEvents);
      }),
      catchError(this.handleError)
    );
  }

  async configureBasicAuth(username: string, password: string): Promise<void> {
    if (this.isMobile()) {
      if ((window as any).Capacitor) {
        
      } else if ((window as any).cordova) {
        
      }
    }
  }

  async configureSSL(enableStrictSSL: boolean): Promise<void> {
    if (this.isMobile()) {
      if ((window as any).Capacitor) {
        
      } else if ((window as any).cordova) {
        
      }
    }
  }

  async saveToCloud(loginData: LoginData): Promise<void> {
    if (this.isMobile() && (window as any).cordova) {
      
    }
  }

  isMobile(): boolean {
    return !!(window as any).Capacitor?.isNativePlatform() || !!(window as any).cordova;
  }

  private configureMonitorUrls(monitor: Monitor, loginData: LoginData) {
    monitor.Monitor.streamingURL = loginData.streamingurl;
    monitor.Monitor.baseURL = loginData.url;
    monitor.Monitor.controlURL = loginData.url;
  }

  private generateConnKey(): string {
    return Math.floor(Math.random() * 999999).toString();
  }

  private loadSavedLogin(): void {
    try {
      const saved = localStorage.getItem('zmNinja-loginData');
      if (saved) {
        const loginData = JSON.parse(saved);
        this.loginData.next(loginData);
      }
    } catch (error) {
      console.error('Error loading saved login data:', error);
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('NVR Service Error:', error);
    return throwError(error);
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
