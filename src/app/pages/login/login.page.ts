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
  IonToast,
  IonCheckbox,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButtons
} from '@ionic/angular/standalone';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { NvrService } from '../../services/nvr.service';
import { EventServerService } from '../../services/event-server.service';
import { AppState } from '../../store/app.state';
import * as AppActions from '../../store/app.actions';

interface LoginData {
  serverName: string;
  username: string;
  password: string;
  isUseAuth: boolean;
  isUseBasicAuth: boolean;
  basicAuthUser: string;
  basicAuthPassword: string;
  url: string;
  apiurl: string;
  streamingurl: string;
  eventServer: string;
  isUseEventServer: boolean;
  enableStrictSSL: boolean;
  saveToCloud: boolean;
  enableLowBandwidth: boolean;
  autoSwitchBandwidth: boolean;
  fallbackConfiguration: string;
  usePin: boolean;
  isKiosk: boolean;
  keepAwake: boolean;
  authSession: string;
}

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
    IonCheckbox,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonButtons,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showToast = false;
  toastMessage = '';

  constructor(
    private fb: FormBuilder,
    private nvrService: NvrService,
    private eventServerService: EventServerService,
    private router: Router,
    private store: Store<AppState>
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit() {
    this.loadSavedData();
    this.addDemoServerPreset();
  }

  private addDemoServerPreset() {
    if (!this.loginForm.get('serverName')?.value) {
      this.loginForm.patchValue({
        serverName: 'ZoneMinder Demo',
        url: 'https://demo.zoneminder.com/',
        apiurl: 'https://demo.zoneminder.com/api',
        streamingurl: 'https://demo.zoneminder.com/cgi-bin/',
        username: '',
        password: '',
        isUseAuth: false
      });
    }
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      serverName: ['', Validators.required],
      username: [''],
      password: [''],
      isUseAuth: [true],
      isUseBasicAuth: [false],
      basicAuthUser: [''],
      basicAuthPassword: [''],
      url: [''],
      apiurl: [''],
      streamingurl: [''],
      eventServer: [''],
      isUseEventServer: [false],
      enableStrictSSL: [false],
      saveToCloud: [false],
      enableLowBandwidth: [false],
      autoSwitchBandwidth: [false],
      fallbackConfiguration: [''],
      usePin: [false],
      isKiosk: [false],
      keepAwake: [true],
      authSession: ['']
    });
  }

  async saveItems() {
    if (!this.loginForm.valid) {
      this.showError('Please fill in required fields');
      return;
    }

    this.isLoading = true;
    const loginData = this.loginForm.value as LoginData;

    try {
      this.sanitizeLoginData(loginData);
      
      this.nvrService.setLogin(loginData);
      
      await this.configureSecuritySettings(loginData);
      
      if (loginData.isUseEventServer) {
        await this.eventServerService.init();
      }

      const response = await this.nvrService.login(
        loginData.serverName,
        loginData.username,
        loginData.password
      ).toPromise();

      await this.nvrService.validateApi().toPromise();

      this.store.dispatch(AppActions.setAuthentication({
        isAuthenticated: true,
        authSession: response.access_token || '',
        username: loginData.username
      }));

      await this.saveLoginData(loginData);
      
      await this.nvrService.loadMonitors().toPromise();
      this.router.navigate(['/monitors']);
      
    } catch (error) {
      console.error('Login failed:', error);
      this.showError('Login failed. Please check your credentials.');
    } finally {
      this.isLoading = false;
    }
  }

  private sanitizeLoginData(loginData: LoginData) {
    loginData.url = loginData.url.replace(/\s/g, "");
    loginData.apiurl = loginData.apiurl.replace(/\s/g, "");
    loginData.streamingurl = loginData.streamingurl.replace(/\s/g, "");
    loginData.eventServer = loginData.eventServer.replace(/\s/g, "");
    
    if (loginData.isUseAuth) {
      if (!loginData.username) loginData.username = "x";
      if (!loginData.password) loginData.password = "x";
    }
  }

  private async configureSecuritySettings(loginData: LoginData) {
    if (loginData.isUseBasicAuth) {
      await this.nvrService.configureBasicAuth(
        loginData.basicAuthUser, 
        loginData.basicAuthPassword
      );
    }

    await this.nvrService.configureSSL(loginData.enableStrictSSL);
  }

  private async saveLoginData(loginData: LoginData) {
    loginData.authSession = '';
    this.nvrService.setLogin(loginData);
    
    if (loginData.saveToCloud && this.nvrService.isMobile()) {
      await this.nvrService.saveToCloud(loginData);
    }
  }

  private loadSavedData() {
    try {
      const saved = localStorage.getItem('zmNinja-loginData');
      if (saved) {
        const data = JSON.parse(saved);
        this.loginForm.patchValue(data);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
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
