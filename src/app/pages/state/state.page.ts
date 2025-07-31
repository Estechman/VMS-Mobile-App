import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NvrService } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { home, trendingUp, refresh, server, desktop, add, remove } from 'ionicons/icons';

interface SystemStatus {
  zmRun: string;
  zmLoad: string;
  color: string;
  customState: string;
  storage: any[];
  servers: any[];
}

@Component({
  selector: 'app-state',
  templateUrl: './state.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonRefresher, IonRefresherContent,
    CommonModule
  ]
})
export class StatePage implements OnInit {
  status: SystemStatus = {
    zmRun: '...',
    zmLoad: '...',
    color: '',
    customState: '',
    storage: [],
    servers: []
  };

  showStorage = true;
  showServer = true;

  constructor(
    private http: HttpClient,
    private nvrService: NvrService
  ) {
    addIcons({ home, trendingUp, refresh, server, desktop, add, remove });
  }

  ngOnInit() {
    this.loadSystemStatus();
  }

  loadSystemStatus() {
    this.getRunStatus();
    this.getLoadStatus();
    this.getStorageStatus();
    this.getServerStatus();
  }

  doRefresh(event: any) {
    this.loadSystemStatus();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  private getRunStatus() {
    const loginData = this.nvrService.getLogin();
    if (!loginData) return;

    const apiUrl = `${loginData.apiurl}/host/daemonCheck.json`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        switch (response.result) {
          case 1:
            this.status.zmRun = 'ZoneMinder Running';
            this.status.color = 'green';
            break;
          case 0:
            this.status.zmRun = 'ZoneMinder Stopped';
            this.status.color = 'red';
            break;
          default:
            this.status.zmRun = 'Status Undetermined';
            this.status.color = 'orange';
        }
      },
      error: () => {
        this.status.zmRun = 'Status Undetermined';
        this.status.color = 'red';
      }
    });
  }

  private getLoadStatus() {
    const loginData = this.nvrService.getLogin();
    if (!loginData) return;

    const apiUrl = `${loginData.apiurl}/host/getLoad.json`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.status.zmLoad = response.load[1];
      },
      error: () => {
        this.status.zmLoad = 'undetermined';
      }
    });
  }

  private getStorageStatus() {
    const loginData = this.nvrService.getLogin();
    if (!loginData) return;

    const apiUrl = `${loginData.apiurl}/storage.json`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.status.storage = response.storage || [];
      },
      error: () => {
        this.status.storage = [];
      }
    });
  }

  private getServerStatus() {
    const loginData = this.nvrService.getLogin();
    if (!loginData) return;

    const apiUrl = `${loginData.apiurl}/servers.json`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.status.servers = response.servers || [];
      },
      error: () => {
        this.status.servers = [];
      }
    });
  }

  selectCustomState() {
    console.log('Select custom state clicked');
  }

  controlZM(action: string) {
    console.log('Control ZM action:', action);
  }

  restartEventServer() {
    console.log('Restart event server clicked');
  }

  getEventServerState(): string {
    return 'Running';
  }

  toggleStorage() {
    this.showStorage = !this.showStorage;
  }

  toggleServer() {
    this.showServer = !this.showServer;
  }

  humanFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  matchServer(serverId: string): string {
    const server = this.status.servers.find(s => s.Server.Id === serverId);
    return server ? server.Server.Name : 'Unknown';
  }
}
