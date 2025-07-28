import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { videocam, videocamOff, refresh, settings } from 'ionicons/icons';

@Component({
  selector: 'app-monitors',
  templateUrl: './monitors.page.html',
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonList, 
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonBadge,
    CommonModule
  ]
})
export class MonitorsPage implements OnInit, OnDestroy {
  monitors: Monitor[] = [];
  isLoading = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private nvrService: NvrService,
    private router: Router
  ) {
    addIcons({ videocam, videocamOff, refresh, settings });
  }

  ngOnInit() {
    this.loadMonitors();
    this.subscribeToMonitors();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadMonitors(forceReload: boolean = false) {
    this.isLoading = true;
    this.subscription.add(
      this.nvrService.loadMonitors(forceReload).subscribe({
        next: (monitors) => {
          this.monitors = monitors;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading monitors:', error);
          this.isLoading = false;
        }
      })
    );
  }

  private subscribeToMonitors() {
    this.subscription.add(
      this.nvrService.getMonitors().subscribe(monitors => {
        this.monitors = monitors;
      })
    );
  }

  doRefresh(event: any) {
    this.nvrService.loadMonitors(true).subscribe({
      next: () => {
        event.target.complete();
      },
      error: () => {
        event.target.complete();
      }
    });
  }

  openMonitor(monitor: Monitor) {
    this.nvrService.debug(`Opening monitor: ${monitor.Monitor.Name}`);
    this.router.navigate(['/live-view', monitor.Monitor.Id]);
  }

  viewEvents(monitor: Monitor) {
    this.router.navigate(['/events', monitor.Monitor.Id]);
  }

  getMonitorStatusColor(monitor: Monitor): string {
    if (monitor.Monitor.Enabled === '0') {
      return 'medium';
    }
    
    switch (monitor.Monitor.Function) {
      case 'Monitor':
        return 'primary';
      case 'Modect':
      case 'Mocord':
        return 'success';
      case 'Record':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getMonitorIcon(monitor: Monitor): string {
    return monitor.Monitor.Enabled === '1' ? 'videocam' : 'videocam-off';
  }
}
