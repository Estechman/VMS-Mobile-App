import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, EMPTY } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { NvrService } from './nvr.service';

export interface EventServerMessage {
  type: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventServerService {
  private ws$: WebSocketSubject<any> | null = null;
  private messagesSubject = new Subject<EventServerMessage>();
  private isConnected = false;

  constructor(private nvrService: NvrService) {}

  connect(url: string): Observable<EventServerMessage> {
    if (this.ws$) {
      this.disconnect();
    }

    this.ws$ = webSocket({
      url,
      openObserver: {
        next: () => {
          this.isConnected = true;
          this.nvrService.debug('EventServer: WebSocket connected');
          this.authenticate();
        }
      },
      closeObserver: {
        next: () => {
          this.isConnected = false;
          this.nvrService.debug('EventServer: WebSocket disconnected');
        }
      }
    });

    return this.ws$.pipe(
      tap(message => {
        this.handleMessage(message);
      }),
      retry({ delay: 5000 }),
      catchError(error => {
        this.nvrService.debug(`EventServer: WebSocket error: ${error}`);
        return EMPTY;
      })
    );
  }

  disconnect(): void {
    if (this.ws$) {
      this.ws$.complete();
      this.ws$ = null;
      this.isConnected = false;
    }
  }

  sendMessage(type: string, data?: any): void {
    if (this.ws$ && this.isConnected) {
      const message = { type, ...data };
      this.ws$.next(message);
    }
  }

  getMessages(): Observable<EventServerMessage> {
    return this.messagesSubject.asObservable();
  }

  private authenticate(): void {
    const loginData = this.nvrService.getLogin();
    if (loginData) {
      this.sendMessage('auth', {
        user: loginData.username,
        password: loginData.password
      });
    }
  }

  private handleMessage(message: any): void {
    this.nvrService.debug(`EventServer: Received message: ${JSON.stringify(message)}`);
    
    switch (message.type) {
      case 'auth':
        this.handleAuthMessage(message);
        break;
      case 'alarm':
        this.handleAlarmMessage(message);
        break;
      default:
        this.messagesSubject.next(message);
    }
  }

  private handleAuthMessage(message: any): void {
    if (message.status === 'Success') {
      this.nvrService.debug('EventServer: Authentication successful');
    } else {
      this.nvrService.debug('EventServer: Authentication failed');
    }
    this.messagesSubject.next(message);
  }

  private handleAlarmMessage(message: any): void {
    this.nvrService.debug(`EventServer: Alarm received for monitor ${message.monitorId}`);
    this.messagesSubject.next(message);
  }

  isEventServerConnected(): boolean {
    return this.isConnected;
  }

  async init(): Promise<void> {
    const loginData = this.nvrService.getLogin();
    if (loginData && loginData.isUseEventServer && loginData.eventServer) {
      this.connect(loginData.eventServer).subscribe();
    }
  }

  getState(): string {
    return this.isConnected ? 'Connected' : 'Disconnected';
  }

  restart(): void {
    this.disconnect();
    setTimeout(() => {
      this.init();
    }, 1000);
  }
}
