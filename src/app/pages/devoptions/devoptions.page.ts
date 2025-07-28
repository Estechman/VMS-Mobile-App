import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { settings, bug, code } from 'ionicons/icons';

@Component({
  selector: 'app-devoptions',
  templateUrl: './devoptions.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardContent, 
    CommonModule, FormsModule
  ]
})
export class DevOptionsPage implements OnInit {
  debugMode = false;
  verboseLogging = false;

  constructor() {
    addIcons({ settings, bug, code });
  }

  ngOnInit() {
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log('Debug mode:', this.debugMode);
  }

  toggleVerboseLogging() {
    this.verboseLogging = !this.verboseLogging;
    console.log('Verbose logging:', this.verboseLogging);
  }

  clearCache() {
    console.log('Cache cleared');
  }

  exportLogs() {
    console.log('Exporting logs');
  }
}
