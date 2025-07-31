import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonRange, IonButton, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { refresh, play, pause } from 'ionicons/icons';
import moment from 'moment';

@Component({
  selector: 'app-moment',
  templateUrl: './moment.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonItem, IonLabel, IonSelect, IonSelectOption,
    IonRange, IonButton, IonIcon, IonSpinner, CommonModule, FormsModule
  ],
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
    }

    .playback-controls {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
    }

    .main-controls {
      display: flex;
      justify-content: center;
    }

    .video-container {
      position: relative;
      width: 100%;
      height: 300px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .review-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .video-placeholder {
      color: white;
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      text-align: center;
    }
  `]
})
export class MomentPage implements OnInit {
  monitors: Monitor[] = [];
  isLoading = true;
  selectedMonitorId = '';
  selectedDate = moment().format('YYYY-MM-DD');
  currentHour = new Date().getHours();
  playbackSpeed = 1;
  isPlaying = false;

  constructor(private nvrService: NvrService) {
    addIcons({ refresh, play, pause });
  }

  ngOnInit() {
    this.loadMonitors();
  }

  loadMonitors() {
    this.isLoading = true;
    this.nvrService.loadMonitors().subscribe({
      next: (monitors) => {
        this.monitors = monitors.filter(m => m.Monitor.Function !== 'None');
        console.log('🔧 [24hr Review] Loaded', this.monitors.length, 'monitors');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load monitors:', error);
        this.isLoading = false;
      }
    });
  }

  onMonitorChange() {
    console.log('🔧 [24hr Review] Monitor changed to:', this.selectedMonitorId);
  }

  onDateChange() {
    console.log('🔧 [24hr Review] Date changed to:', this.selectedDate);
  }

  onHourChange(event: any) {
    this.currentHour = event.detail.value;
    console.log('🔧 [24hr Review] Hour changed to:', this.currentHour);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  changeSpeed(speed: number) {
    this.playbackSpeed = speed;
    console.log('🔧 [24hr Review] Speed changed to:', speed);
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    console.log('🔧 [24hr Review] Playback:', this.isPlaying ? 'started' : 'stopped');
  }

  generateReviewUrl(): string {
    if (!this.selectedMonitorId || !this.isPlaying) return '';
    
    const loginData = this.nvrService.getLogin();
    if (!loginData) return '';

    const monitor = this.monitors.find(m => m.Monitor.Id === this.selectedMonitorId);
    if (!monitor) return '';

    const streamingURL = monitor.Monitor.streamingURL || loginData.streamingurl;
    const rand = new Date().getTime();
    
    let stream = `${streamingURL}/nph-zms?mode=jpeg&monitor=${this.selectedMonitorId}&scale=100&rand=${rand}`;
    
    if (loginData.authSession) {
      stream += `&${loginData.authSession}`;
    }
    
    if (this.playbackSpeed !== 1) {
      stream += `&maxfps=${Math.round(25 / this.playbackSpeed)}`;
    }
    
    return stream;
  }

  getMonitorName(monitorId: string): string {
    const monitor = this.monitors.find(m => m.Monitor.Id === monitorId);
    return monitor ? monitor.Monitor.Name : `Monitor ${monitorId}`;
  }
}
