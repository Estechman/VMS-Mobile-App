import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonInfiniteScroll,
  IonInfiniteScrollContent, IonSpinner, IonSearchbar, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonThumbnail
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { refresh, search, calendar, videocam, archive, trash, download } from 'ionicons/icons';
import moment from 'moment';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInfiniteScroll,
    IonInfiniteScrollContent, IonSpinner, IonSearchbar, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonThumbnail,
    CommonModule, FormsModule
  ]
})
export class EventsPage implements OnInit {
  events: any[] = [];
  monitors: Monitor[] = [];
  isLoading = true;
  currentPage = 1;
  maxPages = 1;
  selectedMonitorId = '';
  searchTerm = '';
  fromDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
  toDate = moment().format('YYYY-MM-DD');

  constructor(private nvrService: NvrService) {
    addIcons({ refresh, search, calendar, videocam, archive, trash, download });
  }

  ngOnInit() {
    this.loadMonitors();
  }

  private loadMonitors() {
    this.nvrService.loadMonitors().subscribe({
      next: (monitors) => {
        this.monitors = monitors;
        this.loadEvents();
      },
      error: (error) => {
        console.error('Failed to load monitors:', error);
        this.isLoading = false;
      }
    });
  }

  loadEvents(reset = true) {
    if (reset) {
      this.events = [];
      this.currentPage = 1;
      this.isLoading = true;
    }

    const monitorId = this.selectedMonitorId ? parseInt(this.selectedMonitorId) : 0;
    const fromDateTime = this.fromDate ? moment(this.fromDate).format('YYYY-MM-DD HH:mm:ss') : '';
    const toDateTime = this.toDate ? moment(this.toDate).add(1, 'day').format('YYYY-MM-DD HH:mm:ss') : '';

    console.log('🔧 [Events] Loading events - Monitor:', monitorId, 'Page:', this.currentPage, 'Date range:', fromDateTime, 'to', toDateTime);

    this.nvrService.getEvents(monitorId, this.currentPage, '', fromDateTime, toDateTime).subscribe({
      next: (data) => {
        if (data.events) {
          if (reset) {
            this.events = data.events;
          } else {
            this.events.push(...data.events);
          }
          console.log('🔧 [Events] Loaded', data.events.length, 'events, total:', this.events.length);
        }
        
        if (data.pagination) {
          this.maxPages = data.pagination.pageCount || 1;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load events:', error);
        this.isLoading = false;
      }
    });
  }

  onInfiniteScroll(event: any) {
    if (this.currentPage < this.maxPages) {
      this.currentPage++;
      this.loadEvents(false);
    }
    
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  onFilterChange() {
    this.loadEvents(true);
  }

  onSearchChange() {
    this.loadEvents(true);
  }

  formatEventTime(dateTime: string): string {
    return moment(dateTime).format('MMM DD, YYYY HH:mm:ss');
  }

  getEventDuration(startTime: string, endTime: string): string {
    const start = moment(startTime);
    const end = moment(endTime);
    const duration = moment.duration(end.diff(start));
    return `${Math.floor(duration.asMinutes())}:${duration.seconds().toString().padStart(2, '0')}`;
  }

  getMonitorName(monitorId: string): string {
    const monitor = this.monitors.find(m => m.Monitor.Id === monitorId);
    return monitor ? monitor.Monitor.Name : `Monitor ${monitorId}`;
  }

  getEventThumbnail(event: any): string {
    const loginData = this.nvrService.getLogin();
    if (!loginData || !event.Event) return '';
    
    const eventId = event.Event.Id;
    const monitorId = event.Event.MonitorId;
    return `${environment.apiUrl}/events/${eventId}.jpg?width=150&height=100`;
  }

  viewEvent(event: any) {
    console.log('🔧 [Events] View event:', event.Event.Id);
  }

  deleteEvent(event: any) {
    console.log('🔧 [Events] Delete event:', event.Event.Id);
  }

  archiveEvent(event: any) {
    console.log('🔧 [Events] Archive event:', event.Event.Id);
  }

  downloadEvent(event: any) {
    const loginData = this.nvrService.getLogin();
    if (!loginData) return;
    
    const eventId = event.Event.Id;
    let downloadUrl = `${environment.apiUrl}/events/${eventId}.mp4`;
    
    if (loginData.authSession) {
      downloadUrl += `?${loginData.authSession}`;
    }
    
    console.log('🔧 [Events] Download event:', eventId, 'URL:', downloadUrl);
    window.open(downloadUrl, '_blank');
  }

  getEventStatusColor(event: any): string {
    if (event.Event.Archived === '1') return 'secondary';
    if (parseInt(event.Event.AlarmFrames) > 0) return 'danger';
    return 'primary';
  }
}
