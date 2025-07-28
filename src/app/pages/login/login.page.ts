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
import { RootState } from '../../store/app.state';
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
    private store: Store<RootState>
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
      isUseAuth: [false],
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
    console.log('🔵 [LOGIN] saveItems() called');
    
    if (!this.loginForm.valid) {
      console.log('❌ [LOGIN] Form validation failed');
      this.showError('Please fill in required fields');
      return;
    }

    console.log('✅ [LOGIN] Form validation passed');
    this.isLoading = true;
    const loginData = this.loginForm.value as LoginData;
    console.log('📋 [LOGIN] Login data:', JSON.stringify(loginData, null, 2));

    try {
      console.log('🔧 [LOGIN] Step 1: Sanitizing login data...');
      this.sanitizeLoginData(loginData);
      console.log('✅ [LOGIN] Data sanitized:', JSON.stringify(loginData, null, 2));
      
      console.log('🔧 [LOGIN] Step 2: Setting login data in NVR service...');
      this.nvrService.setLogin(loginData);
      console.log('✅ [LOGIN] Login data set in service');
      
      console.log('🔧 [LOGIN] Step 3: Configuring security settings...');
      await this.configureSecuritySettings(loginData);
      console.log('✅ [LOGIN] Security settings configured');
      
      if (loginData.isUseEventServer) {
        console.log('🔧 [LOGIN] Step 4: Initializing event server...');
        await this.eventServerService.init();
        console.log('✅ [LOGIN] Event server initialized');
      } else {
        console.log('⏭️ [LOGIN] Step 4: Skipping event server (disabled)');
      }

      console.log('🔧 [LOGIN] Step 5: Performing authentication...');
      console.log('🔧 [LOGIN] Calling nvrService.login with:', {
        serverName: loginData.serverName,
        username: loginData.username,
        password: loginData.password ? '[REDACTED]' : '[EMPTY]',
        isUseAuth: loginData.isUseAuth
      });
      
      const authResponse = await this.nvrService.login(
        loginData.serverName,
        loginData.username,
        loginData.password
      ).toPromise();
      
      console.log('✅ [LOGIN] Authentication response:', authResponse);

      console.log('🔧 [LOGIN] Step 6: Validating API...');
      const apiResponse = await this.nvrService.validateApi().toPromise();
      console.log('✅ [LOGIN] API validation response:', apiResponse);

      console.log('🔧 [LOGIN] Step 7: Setting authentication state...');
      this.store.dispatch(AppActions.setAuthentication({
        isAuthenticated: true,
        authSession: authResponse.access_token || '',
        username: loginData.username
      }));
      console.log('✅ [LOGIN] Authentication state set');

      console.log('🔧 [LOGIN] Step 8: Saving login data...');
      await this.saveLoginData(loginData);
      console.log('✅ [LOGIN] Login data saved');
      
      console.log('🔧 [LOGIN] Step 9: Loading monitors...');
      const monitors = await this.nvrService.loadMonitors().toPromise();
      console.log('✅ [LOGIN] Monitors loaded:', monitors);
      
      console.log('🔧 [LOGIN] Step 10: Navigating to monitors page...');
      const navigationResult = this.router.navigate(['/monitors']);
      console.log('✅ [LOGIN] Navigation initiated:', navigationResult);
      
      console.log('🎉 [LOGIN] Authentication flow completed successfully!');
      
    } catch (error) {
      console.error('❌ [LOGIN] Authentication failed at step:', error);
      console.error('❌ [LOGIN] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      this.showError('Login failed. Please check your credentials.');
    } finally {
      console.log('🔄 [LOGIN] Setting isLoading to false');
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
    } else {
      loginData.username = "";
      loginData.password = "";
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
