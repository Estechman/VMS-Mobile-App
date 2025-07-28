import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { keypad } from 'ionicons/icons';

@Component({
  selector: 'app-montage-history',
  templateUrl: './montage-history.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonButton, IonIcon, CommonModule
  ]
})
export class MontageHistoryPage implements OnInit {

  constructor() {
    addIcons({ keypad });
  }

  ngOnInit() {
  }

}
