import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonSpinner, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { NvrService } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, refresh, time } from 'ionicons/icons';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonSpinner, IonCard, IonCardContent, CommonModule
  ]
})
export class TimelinePage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('timelineContainer', { static: true }) timelineContainer!: ElementRef;
  
  isLoading = true;
  currentDate = new Date();
  events: any[] = [];
  fromDate: string = '';
  toDate: string = '';

  constructor(private nvrService: NvrService) {
    addIcons({ arrowBack, arrowForward, refresh, time });
  }

  ngOnInit() {
    this.setDateRange();
    this.loadTimelineData();
  }

  ngAfterViewInit() {
    this.initializeTimeline();
  }

  ngOnDestroy() {
  }

  private setDateRange() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    this.fromDate = yesterday.toISOString();
    this.toDate = today.toISOString();
  }

  private initializeTimeline() {
    console.log('Timeline container initialized');
  }

  private loadTimelineData() {
    const loginData = this.nvrService.getLogin();
    if (!loginData) {
      this.isLoading = false;
      return;
    }

    this.isLoading = false;
  }

  moveDays(direction: number) {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + direction);
    this.currentDate = newDate;
    this.setDateRange();
    this.loadTimelineData();
  }

  gotoNow() {
    this.currentDate = new Date();
    this.setDateRange();
    this.loadTimelineData();
  }

  doRefresh() {
    this.loadTimelineData();
  }

  prettifyDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  prettifyTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString();
  }
}
