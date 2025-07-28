import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonButtons,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { arrowBack, play, pause, videocamOff } from 'ionicons/icons';

@Component({
  selector: 'app-live-view',
  templateUrl: './live-view.page.html',
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonButtons,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    CommonModule
  ],
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
    }

    .stream-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }

    .live-stream-image {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      text-align: center;
    }

    .stream-info {
      padding: 16px;
    }
  `]
})
export class LiveViewPage implements OnInit, OnDestroy {
  monitor: Monitor | null = null;
  streamUrl: string = '';
  isLoading = true;
  isStreamPaused = false;
  private monitorId: string = '';
  private subscription: Subscription = new Subscription();
  private streamRefreshInterval: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nvrService: NvrService
  ) {
    addIcons({ arrowBack, play, pause, videocamOff });
  }

  ngOnInit() {
    console.log('🔵 [LIVE-VIEW] Initializing live view page');
    
    this.monitorId = this.route.snapshot.paramMap.get('id') || '';
    console.log('📋 [LIVE-VIEW] Monitor ID:', this.monitorId);
    
    if (this.monitorId) {
      this.loadMonitorAndStream();
    } else {
      console.error('❌ [LIVE-VIEW] No monitor ID provided');
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    console.log('🔄 [LIVE-VIEW] Cleaning up live view');
    this.subscription.unsubscribe();
    this.streamRefreshInterval.unsubscribe();
    this.nvrService.killLiveStream(this.monitorId).subscribe({
      next: () => console.log('✅ [LIVE-VIEW] Stream killed successfully'),
      error: (error) => console.error('❌ [LIVE-VIEW] Error killing stream:', error)
    });
  }

  private async loadMonitorAndStream() {
    try {
      console.log('🔧 [LIVE-VIEW] Loading monitor data...');
      
      this.subscription.add(
        this.nvrService.loadMonitors().subscribe({
          next: (monitors) => {
            console.log('✅ [LIVE-VIEW] Monitors loaded, count:', monitors.length);
            this.monitor = monitors.find(m => m.Monitor.Id === this.monitorId) || null;
            console.log('✅ [LIVE-VIEW] Monitor found:', this.monitor?.Monitor?.Name);
            
            if (this.monitor) {
              this.generateAndSetStreamUrl();
            } else {
              console.error('❌ [LIVE-VIEW] Monitor not found in loaded monitors');
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('❌ [LIVE-VIEW] Error loading monitors:', error);
            this.isLoading = false;
          }
        })
      );
      
    } catch (error) {
      console.error('❌ [LIVE-VIEW] Error in loadMonitorAndStream:', error);
      this.isLoading = false;
    }
  }

  private async generateAndSetStreamUrl() {
    try {
      console.log('🔧 [LIVE-VIEW] Generating stream URL for monitor:', this.monitorId);
      this.streamUrl = await this.nvrService.generateStreamUrl(this.monitorId);
      console.log('✅ [LIVE-VIEW] Stream URL generated:', this.streamUrl ? 'Success' : 'Failed');
      
      if (this.streamUrl) {
        this.startStreamRefresh();
      }
      
      this.isLoading = false;
      
    } catch (error) {
      console.error('❌ [LIVE-VIEW] Error generating stream URL:', error);
      this.isLoading = false;
    }
  }

  private startStreamRefresh() {
    this.streamRefreshInterval = interval(30000).subscribe(() => {
      if (!this.isStreamPaused) {
        this.refreshStreamUrl();
      }
    });
  }

  private async refreshStreamUrl() {
    try {
      if (this.monitor) {
        const newUrl = await this.nvrService.generateStreamUrl(this.monitorId);
        if (newUrl) {
          this.streamUrl = newUrl;
        }
      }
    } catch (error) {
      console.error('❌ [LIVE-VIEW] Error refreshing stream:', error);
    }
  }

  toggleStream() {
    console.log('🔧 [LIVE-VIEW] Toggling stream:', this.isStreamPaused ? 'Resume' : 'Pause');
    
    if (this.isStreamPaused) {
      this.resumeStream();
    } else {
      this.pauseStream();
    }
  }

  private pauseStream() {
    this.isStreamPaused = true;
    this.streamRefreshInterval.unsubscribe();
    this.subscription.add(
      this.nvrService.pauseLiveStream(this.monitorId).subscribe({
        next: () => console.log('⏸️ [LIVE-VIEW] Stream paused successfully'),
        error: (error) => console.error('❌ [LIVE-VIEW] Error pausing stream:', error)
      })
    );
    console.log('⏸️ [LIVE-VIEW] Stream paused');
  }

  private resumeStream() {
    this.isStreamPaused = false;
    this.startStreamRefresh();
    this.subscription.add(
      this.nvrService.resumeLiveStream(this.monitorId).subscribe({
        next: () => console.log('▶️ [LIVE-VIEW] Stream resumed successfully'),
        error: (error) => console.error('❌ [LIVE-VIEW] Error resuming stream:', error)
      })
    );
    this.refreshStreamUrl();
    console.log('▶️ [LIVE-VIEW] Stream resumed');
  }

  async retryStream() {
    console.log('🔄 [LIVE-VIEW] Retrying stream...');
    this.isLoading = true;
    this.streamUrl = '';
    await this.loadMonitorAndStream();
  }

  onStreamLoad() {
    console.log('✅ [LIVE-VIEW] Stream image loaded successfully');
  }

  onStreamError(event: any) {
    console.error('❌ [LIVE-VIEW] Stream image load error:', event);
  }

  goBack() {
    console.log('🔙 [LIVE-VIEW] Navigating back to monitors');
    this.router.navigate(['/monitors']);
  }
}
