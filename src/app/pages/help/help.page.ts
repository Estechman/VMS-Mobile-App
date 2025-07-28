import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { help, book, mail, globe } from 'ionicons/icons';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel, CommonModule
  ]
})
export class HelpPage implements OnInit {

  constructor() {
    addIcons({ help, book, mail, globe });
  }

  ngOnInit() {
  }

  openDocumentation() {
    window.open('https://zoneminder.readthedocs.io/', '_blank');
  }

  openForum() {
    window.open('https://forums.zoneminder.com/', '_blank');
  }

  sendFeedback() {
    console.log('Send feedback');
  }
}
