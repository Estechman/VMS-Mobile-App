import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel,
  IonInput, IonCheckbox
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { construct, checkmarkCircle, arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel,
    IonInput, IonCheckbox, CommonModule, FormsModule
  ]
})
export class WizardPage implements OnInit {
  currentStep = 1;
  totalSteps = 4;
  
  serverUrl = '';
  username = '';
  password = '';
  enableNotifications = false;

  constructor(private router: Router) {
    addIcons({ construct, checkmarkCircle, arrowForward });
  }

  ngOnInit() {
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  completeSetup() {
    console.log('Setup completed with:', {
      serverUrl: this.serverUrl,
      username: this.username,
      enableNotifications: this.enableNotifications
    });
    this.router.navigate(['/login']);
  }

  skipWizard() {
    this.router.navigate(['/login']);
  }
}
