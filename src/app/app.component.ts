import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { grid, time, calendar, keypad, star, videocam, informationCircle, person, settings, help, construct, clipboard } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel],
})
export class AppComponent {
  constructor() {
    addIcons({ grid, time, calendar, keypad, star, videocam, informationCircle, person, settings, help, construct, clipboard });
  }
}
