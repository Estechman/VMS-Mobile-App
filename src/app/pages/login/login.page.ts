import { Component, OnInit } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonInput, 
  IonItem, 
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonToast
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { NvrService } from '../../services/nvr.service';
import { AppState } from '../../store/app.state';
import * as AppActions from '../../store/app.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButton, 
    IonInput, 
    IonItem, 
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSpinner,
    IonToast,
    FormsModule,
    CommonModule
  ]
})
export class LoginPage implements OnInit {
  loginData = {
    serverName: '',
    username: '',
    password: ''
  };

  isLoading = false;
  showToast = false;
  toastMessage = '';

  constructor(
    private nvrService: NvrService,
    private router: Router,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    this.loadSavedData();
  }

  async saveItems() {
    if (!this.loginData.serverName || !this.loginData.username || !this.loginData.password) {
      this.showError('Please fill in all fields');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.nvrService.login(
        this.loginData.serverName,
        this.loginData.username,
        this.loginData.password
      ).toPromise();

      this.store.dispatch(AppActions.setAuthentication({
        isAuthenticated: true,
        authSession: response.access_token || '',
        username: this.loginData.username
      }));

      this.saveToLocalStorage();
      this.router.navigate(['/monitors']);
      
    } catch (error) {
      console.error('Login failed:', error);
      this.showError('Login failed. Please check your credentials.');
    } finally {
      this.isLoading = false;
    }
  }

  private loadSavedData() {
    try {
      const saved = localStorage.getItem('zmNinja-loginData');
      if (saved) {
        const data = JSON.parse(saved);
        this.loginData = {
          serverName: data.serverName || '',
          username: data.username || '',
          password: ''
        };
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      const dataToSave = {
        serverName: this.loginData.serverName,
        username: this.loginData.username
      };
      localStorage.setItem('zmNinja-loginData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private showError(message: string) {
    this.toastMessage = message;
    this.showToast = true;
  }

  onToastDismiss() {
    this.showToast = false;
  }
}
