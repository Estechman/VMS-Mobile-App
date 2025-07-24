import { Component, OnInit } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { NvrService } from '../../services/nvr.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    CommonModule
  ]
})
export class EventsPage implements OnInit {
  monitorId: string = '';
  events: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private nvrService: NvrService
  ) {}

  ngOnInit() {
    this.monitorId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    this.nvrService.debug(`Loading events for monitor ${this.monitorId}`);
    
    setTimeout(() => {
      this.events = [];
      this.isLoading = false;
    }, 1000);
  }
}
