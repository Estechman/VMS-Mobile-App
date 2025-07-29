import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';

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
  enableAlarmCount?: boolean;
  minAlarmCount?: number;
  objectDetectionFilter?: boolean;
  refreshSec?: number;
  montageQuality?: number;
  montageliveFPS?: number;
  packeryPositions?: string;
  maxMontage?: number;
  currentZMGroupName?: string;
  showMontageSubMenu?: boolean;
  packeryPositionsArray?: { [key: string]: string };
  currentMontageProfile?: string;
  cycleMontageProfiles?: boolean;
  cycleMontageInterval?: number;
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
    isRunning?: string;
    isRunningText?: string;
    color?: string;
    listDisplay?: string;
    gridScale?: number;
    showSidebar?: boolean;
    regenHandle?: any;
    char?: string;
  };
  Monitor_Status?: {
    MonitorId: string | null;
    Status: string | null;
    CaptureFPS: string | null;
    AnalysisFPS: string | null;
    CaptureBandwidth: string | null;
    UpdatedOn: string | null;
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

  getEventsObservable(): Observable<Event[]> {
    return this.events.asObservable();
  }

  getApiVersion(): Observable<string> {
    return this.apiVersion.asObservable();
  }

  setApiVersion(version: string): void {
    this.apiVersion.next(version);
  }

  login(serverName: string, username: string, password: string): Observable<any> {
    console.log('🔵 [NVR] login() called with:', {
      serverName,
      username,
      password: password ? '[REDACTED]' : '[EMPTY]'
    });
    
    const loginData = this.loginData.value;
    if (!loginData) {
      console.error('❌ [NVR] No login data configured');
      return throwError('No login data configured');
    }

    console.log('📋 [NVR] Current login data:', {
      isUseAuth: loginData.isUseAuth,
      apiurl: loginData.apiurl,
      serverName: loginData.serverName
    });

    if (!loginData.isUseAuth) {
      console.log('✅ [NVR] Auth is disabled, using no-auth flow');
      this.log("Auth is disabled, setting authSession to empty");
      this.authSession.next('');
      console.log('✅ [NVR] AuthSession set to empty, returning success');
      return new Observable(observer => {
        const response = { success: true, message: 'no auth' };
        console.log('✅ [NVR] Returning no-auth response:', response);
        observer.next(response);
        observer.complete();
      });
    }

    console.log('🔧 [NVR] Auth is enabled, performing API login');
    const apiUrl = `${loginData.apiurl}/host/login.json`;
    const credentials = {
      user: username,
      pass: password
    };

    console.log('🔧 [NVR] Making API call to:', apiUrl);
    console.log('🔧 [NVR] With credentials:', { user: username, pass: password ? '[REDACTED]' : '[EMPTY]' });

    return this.http.post(apiUrl, credentials).pipe(
      tap((response: any) => {
        console.log('✅ [NVR] API login response:', response);
        if (response.access_token) {
          const authSession = `&token=${response.access_token}`;
          this.authSession.next(authSession);
          console.log('✅ [NVR] AuthSession set to:', authSession);
        } else {
          console.log('⚠️ [NVR] No access_token in response');
        }
      }),
      catchError((error) => {
        console.error('❌ [NVR] API login failed:', error);
        return this.handleError(error);
      })
    );
  }

  validateApi(): Observable<any> {
    console.log('🔵 [NVR] validateApi() called');
    
    const loginData = this.loginData.value;
    if (!loginData) {
      console.error('❌ [NVR] No login data configured for API validation');
      return throwError('No login data configured');
    }

    console.log('📋 [NVR] Validating API with login data:', {
      isUseAuth: loginData.isUseAuth,
      apiurl: loginData.apiurl
    });

    if (!loginData.isUseAuth) {
      console.log('✅ [NVR] Auth is disabled, skipping API validation');
      this.log("Auth is disabled, skipping API validation");
      return new Observable(observer => {
        const response = { version: '1.0.0', success: true };
        console.log('✅ [NVR] Returning mock API validation response:', response);
        observer.next(response);
        observer.complete();
      });
    }

    const authSession = this.authSession.value;
    const apiUrl = `${loginData.apiurl}/host/getVersion.json${authSession}`;
    
    console.log('🔧 [NVR] Making API validation call to:', apiUrl);
    console.log('🔧 [NVR] With auth session:', authSession);
    
    return this.http.get<any>(apiUrl).pipe(
      tap((response: any) => {
        console.log('✅ [NVR] API validation response:', response);
        if (response.version) {
          this.setApiVersion(response.version);
          console.log('✅ [NVR] API version set to:', response.version);
        } else {
          console.log('⚠️ [NVR] No version in API response');
        }
      }),
      catchError((error) => {
        console.error('❌ [NVR] API validation failed:', error);
        return this.handleError(error);
      })
    );
  }

  loadMonitors(forceReload: boolean = false): Observable<Monitor[]> {
    console.log('🔵 [NVR] loadMonitors() called with forceReload:', forceReload);
    
    const loginData = this.loginData.value;
    if (!loginData) {
      console.error('❌ [NVR] No login data configured for loading monitors');
      return throwError('No login data configured');
    }

    console.log('📋 [NVR] Loading monitors with login data:', {
      apiurl: loginData.apiurl,
      isUseAuth: loginData.isUseAuth
    });

    const cacheKey = 'monitors';
    if (!forceReload) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log('✅ [NVR] Using cached monitors data:', cachedData);
        this.monitors.next(cachedData);
        return new Observable(observer => {
          observer.next(cachedData);
          observer.complete();
        });
      }
    } else {
      console.log('🔄 [NVR] Force reload - clearing cache');
      this.cache.delete(cacheKey);
    }

    const authSession = this.authSession.value;
    const apiUrl = `${loginData.apiurl}/monitors.json${authSession}`;
    
    console.log('🔧 [NVR] Making monitors API call to:', apiUrl);
    console.log('🔧 [NVR] With auth session:', authSession);
    
    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        console.log('✅ [NVR] Monitors API response:', response);
        const monitors = response.monitors || [];
        console.log('📊 [NVR] Found', monitors.length, 'monitors');
        console.log('🔍 [NVR] Sample monitor structure:', monitors[0]);
        
        const processedMonitors = monitors.map((monitor: Monitor) => {
          monitor.Monitor.connKey = this.generateConnKey();
          monitor.Monitor.isAlarmed = false;
          
          this.configureMonitorUrls(monitor, loginData);
          
          return monitor;
        });

        processedMonitors.sort((a: Monitor, b: Monitor) => 
          parseInt(a.Monitor.Sequence) - parseInt(b.Monitor.Sequence)
        );

        console.log('✅ [NVR] Processed monitors:', processedMonitors);
        this.setCachedData(cacheKey, processedMonitors);
        
        return processedMonitors;
      }),
      switchMap(processedMonitors => {
        return this.updateMonitorStatus(processedMonitors).pipe(
          tap(monitorsWithStatus => {
            this.monitors.next(monitorsWithStatus);
          })
        );
      }),
      catchError((error) => {
        console.error('❌ [NVR] Load monitors failed:', error);
        return this.handleError(error);
      })
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

  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000;

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ [NVR] Service Error:', {
      message: error?.message || String(error),
      status: error?.status,
      statusText: error?.statusText,
      url: error?.url,
      error: error
    });
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

  generateStreamUrl(monitorId: string, scale: string = '100', mode: string = 'jpeg'): Promise<string> {
    const loginData = this.loginData.value;
    if (!loginData) {
      throw new Error('No login data configured');
    }

    const monitor = this.monitors.value.find(m => 
      String(m.Monitor.Id) === String(monitorId) || 
      Number(m.Monitor.Id) === Number(monitorId)
    );
    if (!monitor) {
      throw new Error(`Monitor ${monitorId} not found`);
    }

    const authSession = this.authSession.value;
    const connKey = monitor.Monitor.connKey || this.generateConnKey();
    
    let streamUrl = `${loginData.streamingurl}/nph-zms?mode=${mode}&monitor=${monitorId}&scale=${scale}`;
    
    if (connKey && mode !== 'single') {
      streamUrl += `&connkey=${connKey}`;
    }
    
    streamUrl += authSession;
    streamUrl += `&rand=${Math.floor(Math.random() * 100000)}`;
    
    console.log('🔧 [NVR] Generated stream URL:', streamUrl);
    return Promise.resolve(streamUrl);
  }

  pauseLiveStream(monitorId: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const monitor = this.monitors.value.find(m => 
      String(m.Monitor.Id) === String(monitorId) || 
      Number(m.Monitor.Id) === Number(monitorId)
    );
    if (!monitor || !monitor.Monitor.connKey) {
      return throwError('Monitor or connection key not found');
    }

    const authToken = this.authSession.value.replace('&auth=', '');
    const url = `${loginData.url}/index.php?view=request&request=stream&connkey=${monitor.Monitor.connKey}&auth=${authToken}&command=1`;
    
    console.log('🔧 [NVR] Pausing live stream for monitor:', monitorId);
    return this.http.get(url);
  }

  resumeLiveStream(monitorId: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const monitor = this.monitors.value.find(m => 
      String(m.Monitor.Id) === String(monitorId) || 
      Number(m.Monitor.Id) === Number(monitorId)
    );
    if (!monitor || !monitor.Monitor.connKey) {
      return throwError('Monitor or connection key not found');
    }

    const authToken = this.authSession.value.replace('&auth=', '');
    const url = `${loginData.url}/index.php?view=request&request=stream&connkey=${monitor.Monitor.connKey}&auth=${authToken}&command=2`;
    
    console.log('🔧 [NVR] Resuming live stream for monitor:', monitorId);
    return this.http.get(url);
  }

  killLiveStream(monitorId: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const monitor = this.monitors.value.find(m => 
      String(m.Monitor.Id) === String(monitorId) || 
      Number(m.Monitor.Id) === Number(monitorId)
    );
    if (!monitor || !monitor.Monitor.connKey) {
      return throwError('Monitor or connection key not found');
    }

    const authToken = this.authSession.value.replace('&auth=', '');
    const url = `${loginData.url}/index.php?view=request&request=stream&connkey=${monitor.Monitor.connKey}&auth=${authToken}&command=17`;
    
    console.log('🔧 [NVR] Killing live stream for monitor:', monitorId);
    return this.http.get(url);
  }

  checkMonitorStatus(monitorId: string): Observable<any> {
    const loginData = this.loginData.value;
    if (!loginData) {
      return throwError('No login data configured');
    }

    const authSession = this.authSession.value;
    const apiUrl = `${loginData.apiurl}/monitors/daemonStatus/id:${monitorId}/daemon:zmc.json${authSession}`;
    
    console.log('🔧 [NVR] Checking daemon status for monitor:', monitorId);
    return this.http.get<any>(apiUrl).pipe(
      map(response => {
        console.log('✅ [NVR] Daemon status response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('❌ [NVR] Daemon status check failed:', error);
        return this.handleError(error);
      })
    );
  }

  updateMonitorStatus(monitors: Monitor[]): Observable<Monitor[]> {
    if (!monitors.length) {
      return of(monitors);
    }

    const hasValidMonitorStatus = monitors[0].Monitor_Status && 
      monitors.some(m => m.Monitor_Status?.Status !== null);

    if (hasValidMonitorStatus) {
      console.log('🔧 [NVR] Using Monitor_Status for status display');
      return of(this.processMonitorStatus(monitors));
    } else {
      console.log('🔧 [NVR] No valid Monitor_Status, using daemon status checks');
      return this.checkAllMonitorDaemonStatus(monitors);
    }
  }

  private processMonitorStatus(monitors: Monitor[]): Monitor[] {
    return monitors.map(monitor => {
      if (monitor.Monitor_Status?.Status === 'Connected') {
        monitor.Monitor.isRunning = 'true';
        monitor.Monitor.color = '#4CAF50';
        monitor.Monitor.char = 'checkmark-circle';
        monitor.Monitor.isRunningText = monitor.Monitor_Status.Status;
      } else {
        monitor.Monitor.isRunning = 'false';
        monitor.Monitor.color = '#F44336';
        monitor.Monitor.char = 'close-circle';
        monitor.Monitor.isRunningText = monitor.Monitor_Status?.Status || 'Unknown';
      }
      return monitor;
    });
  }

  private checkAllMonitorDaemonStatus(monitors: Monitor[]): Observable<Monitor[]> {
    const statusChecks = monitors.map(monitor => {
      monitor.Monitor.isRunning = '...';
      monitor.Monitor.color = '#03A9F4';
      monitor.Monitor.char = 'help-circle';
      monitor.Monitor.isRunningText = '...';

      return this.checkMonitorStatus(monitor.Monitor.Id).pipe(
        map(statusData => {
          if (statusData.statustext.indexOf('not running') > -1) {
            monitor.Monitor.isRunning = 'false';
            monitor.Monitor.color = '#F44336';
            monitor.Monitor.char = 'close-circle';
          } else if (statusData.statustext.indexOf('pending') > -1) {
            monitor.Monitor.isRunning = 'pending';
            monitor.Monitor.color = '#FF9800';
            monitor.Monitor.char = 'help-circle';
          } else if (statusData.statustext.indexOf('running since') > -1) {
            monitor.Monitor.isRunning = 'true';
            monitor.Monitor.color = '#4CAF50';
            monitor.Monitor.char = 'checkmark-circle';
          } else if (statusData.statustext.indexOf('Unable to connect') > -1) {
            monitor.Monitor.isRunning = 'false';
            monitor.Monitor.color = '#F44336';
            monitor.Monitor.char = 'close-circle';
          } else {
            monitor.Monitor.isRunning = 'error';
            monitor.Monitor.color = '#795548';
            monitor.Monitor.char = 'help-circle';
          }
          monitor.Monitor.isRunningText = statusData.statustext;
          return monitor;
        }),
        catchError(error => {
          console.error('❌ [NVR] Error checking monitor status:', error);
          monitor.Monitor.isRunning = 'error';
          monitor.Monitor.color = '#795548';
          monitor.Monitor.char = 'help-circle';
          monitor.Monitor.isRunningText = 'Error checking status';
          return of(monitor);
        })
      );
    });

    return forkJoin(statusChecks);
  }

  getEvents(monitorId: number = 0, pageId: number = 1, loadingStr: string = '', startTime: string = '', endTime: string = '', noObjectFilter: boolean = false, monListFilter: string = ''): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    let myurl = `/api/events/index`;
    
    if (monitorId) {
      myurl += `/MonitorId:${monitorId}`;
    }
    
    if (startTime && endTime) {
      myurl += `/StartTime <=:${endTime}/EndTime >=:${startTime}`;
    }
    
    if (loginData.enableAlarmCount && loginData.minAlarmCount) {
      myurl += `/AlarmFrames >=:${loginData.minAlarmCount}`;
    }
    
    if (monListFilter) {
      myurl += monListFilter;
    }
    
    if (loginData.objectDetectionFilter && !noObjectFilter) {
      myurl += '/Notes REGEXP:detected:';
    }

    myurl += `.json?sort=StartTime&direction=desc&page=${pageId}`;
    
    const authSession = this.authSession.value;
    console.log('🔧 [NVR] getEvents URL:', `${myurl}${authSession}`);
    return this.http.get<any>(`${myurl}${authSession}`);
  }

  getEventsPages(monitorId: number = 0, startTime: string = '', endTime: string = '', noObjectFilter: boolean = false): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    let myurl = `/api/events/index`;
    
    if (monitorId) {
      myurl += `/MonitorId:${monitorId}`;
    }
    
    if (startTime && endTime) {
      myurl += `/StartTime <=:${endTime}/EndTime >=:${startTime}`;
    }

    myurl += `.json?sort=StartTime&direction=desc&page=1&limit=1`;
    
    const authSession = this.authSession.value;
    console.log('🔧 [NVR] getEventsPages URL:', `${myurl}${authSession}`);
    return this.http.get<any>(`${myurl}${authSession}`);
  }

  generateStreamUrlSync(monitorId: string | number, mode: string = 'single', scale: number = 100): string {
    const loginData = this.getLogin();
    if (!loginData) return '';

    const monitor = this.findMonitorById(String(monitorId));
    if (!monitor) {
      console.warn('🔧 [NVR] Monitor not found for stream generation:', monitorId);
      return '';
    }

    const streamingURL = monitor.Monitor.streamingURL || loginData.streamingurl;
    const rand = new Date().getTime();
    
    let stream = `${streamingURL}/nph-zms?mode=${mode}&monitor=${monitorId}&scale=${scale}&rand=${rand}`;
    
    if (loginData.authSession) {
      stream += `&${loginData.authSession}`;
    }
    
    console.log('🔧 [NVR] Generated stream URL:', stream);
    return stream;
  }

  getDaemonStatus(): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    const authSession = this.authSession.value;
    const apiUrl = `/api/host/daemonCheck.json${authSession}`;
    return this.http.get<any>(apiUrl);
  }

  getSystemLoad(): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    const authSession = this.authSession.value;
    const apiUrl = `/api/host/getLoad.json${authSession}`;
    return this.http.get<any>(apiUrl);
  }

  getStorageInfo(): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    const authSession = this.authSession.value;
    const apiUrl = `/api/storage.json${authSession}`;
    return this.http.get<any>(apiUrl);
  }

  getServerInfo(): Observable<any> {
    const loginData = this.getLogin();
    if (!loginData) return throwError(() => new Error('Not logged in'));

    const authSession = this.authSession.value;
    const apiUrl = `/api/servers.json${authSession}`;
    return this.http.get<any>(apiUrl);
  }

  private findMonitorById(id: string): Monitor | undefined {
    return this.monitors.value.find(m => String(m.Monitor.Id) === String(id));
  }

  debug(message: string): void {
    console.log(`[NVR] ${message}`);
  }

  log(message: string): void {
    console.log(`[NVR] ${message}`);
  }

  getAuthSession(): string {
    return this.authSession.value;
  }

  getMontageProfiles(): { [key: string]: string } {
    const loginData = this.getLogin();
    return loginData?.packeryPositionsArray || {};
  }

  saveMontageProfile(name: string, positions: any[]): void {
    const loginData = this.getLogin();
    if (!loginData) return;
    
    if (!loginData.packeryPositionsArray) {
      loginData.packeryPositionsArray = {};
    }
    
    loginData.packeryPositionsArray[name] = JSON.stringify(positions);
    loginData.currentMontageProfile = name;
    this.setLogin(loginData);
    console.log('🔧 [NVR] Saved montage profile:', name);
  }

  deleteMontageProfile(name: string): void {
    const loginData = this.getLogin();
    if (!loginData?.packeryPositionsArray) return;
    
    delete loginData.packeryPositionsArray[name];
    if (loginData.currentMontageProfile === name) {
      loginData.currentMontageProfile = '';
    }
    this.setLogin(loginData);
    console.log('🔧 [NVR] Deleted montage profile:', name);
  }

  switchMontageProfile(name: string): any[] | null {
    const loginData = this.getLogin();
    if (!loginData?.packeryPositionsArray?.[name]) return null;
    
    loginData.currentMontageProfile = name;
    this.setLogin(loginData);
    
    try {
      const positions = JSON.parse(loginData.packeryPositionsArray[name]);
      console.log('🔧 [NVR] Switched to montage profile:', name);
      return positions;
    } catch (e) {
      console.error('Error parsing montage profile:', e);
      return null;
    }
  }

  getCurrentMontageProfile(): string {
    return this.getLogin()?.currentMontageProfile || '';
  }

  isMontageProfileCycling(): boolean {
    return this.getLogin()?.cycleMontageProfiles || false;
  }

  toggleMontageProfileCycling(): void {
    const loginData = this.getLogin();
    if (!loginData) return;
    
    loginData.cycleMontageProfiles = !loginData.cycleMontageProfiles;
    this.setLogin(loginData);
    console.log('🔧 [NVR] Montage profile cycling:', loginData.cycleMontageProfiles ? 'enabled' : 'disabled');
  }
}
