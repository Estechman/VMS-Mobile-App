import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonSpinner, IonItem, IonLabel, IonDatetime
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import { NvrService } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, refresh, time, add, remove } from 'ionicons/icons';
import { forkJoin, Observable } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonSpinner, IonItem, IonLabel, IonDatetime, 
    CommonModule, FormsModule
  ]
})
export class TimelinePage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('timelineContainer', { static: true }) timelineContainer!: ElementRef;
  
  private timeline: Timeline | null = null;
  private groups = new DataSet<any>();
  private items = new DataSet<any>();
  isLoading = true;
  fromDate = moment().subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss');
  toDate = moment().format('YYYY-MM-DDTHH:mm:ss');

  constructor(private nvrService: NvrService) {
    addIcons({ arrowBack, arrowForward, refresh, time, add, remove });
  }

  ngOnInit() {
    this.loadMonitors();
  }

  ngAfterViewInit() {
    this.initializeTimeline();
  }

  ngOnDestroy() {
    if (this.timeline) {
      this.timeline.destroy();
    }
  }

  private loadMonitors() {
    this.nvrService.loadMonitors().subscribe({
      next: (monitors) => {
        this.setupGroups(monitors);
        this.loadTimelineData();
      },
      error: (error) => {
        console.error('Failed to load monitors:', error);
        this.isLoading = false;
      }
    });
  }

  private setupGroups(monitors: any[]) {
    this.groups.clear();
    monitors.forEach(monitor => {
      this.groups.add({
        id: monitor.Monitor.Id,
        content: monitor.Monitor.Name,
        order: parseInt(monitor.Monitor.Sequence) || 0
      });
    });
    console.log('🔧 [Timeline] Setup groups:', this.groups.length);
  }

  private initializeTimeline() {
    const container = this.timelineContainer.nativeElement;
    
    const options = {
      showCurrentTime: true,
      editable: false,
      verticalScroll: true,
      maxHeight: window.innerHeight - 300,
      moveable: true,
      zoomable: true,
      selectable: true,
      start: moment(this.fromDate).toDate(),
      end: moment(this.toDate).toDate(),
      orientation: 'top',
      zoomMin: 5 * 60 * 1000, // 5 minutes
      stack: false,
      format: {
        minorLabels: {
          minute: 'HH:mm',
          hour: 'HH:mm',
          second: 'ss',
        },
        majorLabels: {
          second: 'D MMM HH:mm',
        }
      }
    };

    this.timeline = new Timeline(container, this.items, this.groups, options);
    
    this.timeline.on('select', (properties) => {
      if (properties.items.length > 0) {
        this.onEventSelected(properties.items[0]);
      }
    });

    console.log('🔧 [Timeline] Timeline initialized');
  }

  private loadTimelineData() {
    this.isLoading = true;
    this.items.clear();

    const fromDateFormatted = moment(this.fromDate).format('YYYY-MM-DD HH:mm:ss');
    const toDateFormatted = moment(this.toDate).format('YYYY-MM-DD HH:mm:ss');

    console.log('🔧 [Timeline] Loading data from', fromDateFormatted, 'to', toDateFormatted);

    this.nvrService.getEventsPages(0, fromDateFormatted, toDateFormatted, true).subscribe({
      next: (epData) => {
        const itemsPerPage = parseInt(epData.limit) || 25;
        const totalPages = epData.pageCount || 1;
        
        console.log('🔧 [Timeline] Found', totalPages, 'pages with', itemsPerPage, 'items per page');
        this.loadEventPages(Math.min(totalPages, 5), fromDateFormatted, toDateFormatted);
      },
      error: (error) => {
        console.error('Failed to load timeline data:', error);
        this.isLoading = false;
      }
    });
  }

  private loadEventPages(totalPages: number, fromDate: string, toDate: string) {
    const observables: Observable<any>[] = [];
    
    for (let page = 1; page <= totalPages; page++) {
      observables.push(this.nvrService.getEvents(0, page, '', fromDate, toDate, true));
    }

    forkJoin(observables).subscribe({
      next: (results: any[]) => {
        let eventCount = 0;
        results.forEach((data: any) => {
          if (data && data.events) {
            this.processEvents(data.events);
            eventCount += data.events.length;
          }
        });
        console.log('🔧 [Timeline] Processed', eventCount, 'events');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load event pages:', error);
        this.isLoading = false;
      }
    });
  }

  private processEvents(events: any[]) {
    events.forEach(eventData => {
      const event = eventData.Event;
      const startTime = moment(event.StartTime).toDate();
      const endTime = moment(event.EndTime).toDate();
      
      this.items.add({
        id: event.Id,
        group: event.MonitorId,
        start: startTime,
        end: endTime,
        content: `Event ${event.Id}`,
        title: `${event.Name || 'Event'} - ${event.Cause || 'Unknown'}`,
        className: event.Archived === '1' ? 'archived-event' : 'normal-event'
      });
    });
  }

  onDateRangeChange() {
    if (this.timeline) {
      this.timeline.setWindow(moment(this.fromDate).toDate(), moment(this.toDate).toDate());
      this.loadTimelineData();
    }
  }

  private onEventSelected(eventId: string) {
    console.log('🔧 [Timeline] Event selected:', eventId);
  }

  moveToNow() {
    if (this.timeline) {
      this.timeline.moveTo(new Date());
    }
  }

  zoomInTimeline() {
    if (this.timeline) {
      this.timeline.zoomIn(0.2);
    }
  }

  zoomOutTimeline() {
    if (this.timeline) {
      this.timeline.zoomOut(0.2);
    }
  }

  refreshTimeline() {
    this.loadTimelineData();
  }
}
