import { Component, OnInit } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

import { NvrService } from '../../services/nvr.service';

@Component({
  selector: 'app-state',
  templateUrl: './state.page.html',
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonSpinner,
    CommonModule
  ]
})
export class StatePage implements OnInit {
  zmState = 'Unknown';
  isLoading = true;

  constructor(private nvrService: NvrService) {}

  ngOnInit() {
    this.loadState();
  }

  loadState() {
    this.isLoading = true;
    this.nvrService.debug('Loading ZoneMinder state');
    
    setTimeout(() => {
      this.zmState = 'Running';
      this.isLoading = false;
    }, 1000);
  }

  toggleState() {
    this.nvrService.debug('Toggling ZoneMinder state');
  }
}
