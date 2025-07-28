import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon,
  IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { refresh, videocam, videocamOff } from 'ionicons/icons';

@Component({
  selector: 'app-montage',
  templateUrl: './montage.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon,
    IonSpinner, IonRefresher, IonRefresherContent,
    CommonModule
  ]
})
export class MontagePage implements OnInit, OnDestroy {
  monitors: Monitor[] = [];
  isLoading = true;
  private subscription: Subscription = new Subscription();
  private refreshInterval: Subscription = new Subscription();

  constructor(private nvrService: NvrService) {
    addIcons({ refresh, videocam, videocamOff });
  }

  ngOnInit() {
    this.loadMonitors();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.refreshInterval.unsubscribe();
  }

  loadMonitors(forceReload: boolean = false) {
    this.isLoading = true;
    this.subscription.add(
      this.nvrService.loadMonitors(forceReload).subscribe({
        next: (monitors) => {
          this.monitors = monitors.filter(m => m.Monitor.Enabled === '1');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading monitors:', error);
          this.isLoading = false;
        }
      })
    );
  }

  doRefresh(event: any) {
    this.loadMonitors(true);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  private startAutoRefresh() {
    this.refreshInterval = interval(30000).subscribe(() => {
      this.loadMonitors(true);
    });
  }

  async generateStreamUrl(monitor: Monitor): Promise<string> {
    try {
      return await this.nvrService.generateStreamUrl(monitor.Monitor.Id);
    } catch (error) {
      console.error('Error generating stream URL:', error);
      return '';
    }
  }

  onImageError(event: any, monitor: Monitor) {
    console.error('Image load error for monitor:', monitor.Monitor.Name);
    event.target.src = 'assets/images/noimage.png';
  }

  getMonitorStatusColor(monitor: Monitor): string {
    if (monitor.Monitor.isRunning === 'true') {
      return 'success';
    } else if (monitor.Monitor.isRunning === 'false') {
      return 'danger';
    }
    return 'medium';
  }
}
