import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonBadge, IonPopover,
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonRange, IonFab, IonFabButton, IonActionSheet, IonAlert
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { NvrService, Monitor } from '../../services/nvr.service';
import { addIcons } from 'ionicons';
import { 
  refresh, videocam, videocamOff, camera, play, pause, move, grid,
  add, remove, bicycle, eye, save, trash, settings, resize, chevronDown,
  chevronUp, close, pin
} from 'ionicons/icons';
import { GridStack, GridStackWidget } from 'gridstack';

interface MontageMonitor extends Monitor {
  gridScale: number;
  listDisplay: 'show' | 'noshow' | 'blank';
  isAlarmed: boolean;
  isStamp: boolean;
  selectStyle: string;
  showSidebar: boolean;
  lastEvent?: any;
  eventCount: number;
}

@Component({
  selector: 'app-montage',
  templateUrl: './montage.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner, IonBadge, IonPopover,
    IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonToggle, IonRange, IonFab, IonFabButton, IonActionSheet, IonAlert,
    CommonModule, FormsModule
  ]
})
export class MontagePage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('gridContainer', { static: true }) gridContainer!: ElementRef;
  
  monitors: MontageMonitor[] = [];
  isLoading = true;
  isDragMode = false;
  isMinimal = false;
  showSubMenu = false;
  currentProfileName = 'Default';
  selectAllToggle = true;
  
  private subscriptions = new Subscription();
  private refreshInterval?: Subscription;
  private cycleInterval?: Subscription;
  private alarmInterval?: Subscription;
  private gridStack?: GridStack;
  
  private streamState = {
    SNAPSHOT: 1,
    SNAPSHOT_LOWQUALITY: 2,
    ACTIVE: 3,
    STOPPED: 4
  };
  private currentStreamState = this.streamState.SNAPSHOT_LOWQUALITY;

  constructor(private nvrService: NvrService) {
    addIcons({ 
      refresh, videocam, videocamOff, camera, play, pause, move, grid,
      add, remove, bicycle, eye, save, trash, settings, resize, chevronDown,
      chevronUp, close, pin
    });
  }

  ngOnInit() {
    this.loadMonitors();
    this.startIntervals();
    this.currentProfileName = this.nvrService.getCurrentMontageProfile() || 'Default';
  }

  ngAfterViewInit() {
    setTimeout(() => this.initializeGridStack(), 100);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.refreshInterval?.unsubscribe();
    this.cycleInterval?.unsubscribe();
    this.alarmInterval?.unsubscribe();
    this.gridStack?.destroy();
  }

  private initializeGridStack() {
    if (!this.gridContainer?.nativeElement) return;
    
    this.gridStack = GridStack.init({
      cellHeight: 200,
      margin: 5,
      animate: true,
      float: true,
      acceptWidgets: true,
      removable: false,
      disableDrag: !this.isDragMode,
      disableResize: !this.isDragMode
    }, this.gridContainer.nativeElement);

    this.gridStack.on('change', (event, items) => {
      this.saveCurrentLayout();
    });
  }

  private loadMonitors(forceRefresh = false) {
    this.isLoading = true;
    this.subscriptions.add(
      this.nvrService.loadMonitors(forceRefresh).subscribe({
        next: (monitors) => {
          this.monitors = monitors
            .filter(m => m.Monitor.Function !== 'None')
            .map(m => this.enhanceMonitor(m));
          
          this.applyCurrentProfile();
          this.currentStreamState = this.streamState.SNAPSHOT;
          this.isLoading = false;
          
          setTimeout(() => this.layoutGridItems(), 200);
        },
        error: (error) => {
          console.error('Failed to load monitors:', error);
          this.isLoading = false;
        }
      })
    );
  }

  private enhanceMonitor(monitor: Monitor): MontageMonitor {
    return {
      ...monitor,
      gridScale: 50,
      listDisplay: 'show',
      isAlarmed: false,
      isStamp: false,
      selectStyle: '',
      showSidebar: false,
      eventCount: 0
    };
  }

  doRefresh(event: any) {
    this.loadMonitors(true);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  private startIntervals() {
    const loginData = this.nvrService.getLogin();
    const refreshSec = loginData?.refreshSec || 30;
    
    this.refreshInterval = interval(refreshSec * 1000).subscribe(() => {
      this.loadMonitors(true);
    });
    
    this.alarmInterval = interval(5000).subscribe(() => {
      this.checkAlarmStatus();
    });
    
    if (this.nvrService.isMontageProfileCycling()) {
      this.startProfileCycling();
    }
  }

  private layoutGridItems() {
    if (!this.gridStack) return;
    
    this.gridStack.removeAll();
    
    this.monitors.forEach((monitor, index) => {
      if (monitor.listDisplay === 'noshow') return;
      
      const widget: GridStackWidget = {
        id: monitor.Monitor.Id,
        x: (index % 4) * 3,
        y: Math.floor(index / 4) * 3,
        w: Math.max(1, Math.floor(monitor.gridScale / 25)),
        h: Math.max(1, Math.floor(monitor.gridScale / 25)),
        content: this.createMonitorElement(monitor)
      };
      
      this.gridStack?.addWidget(widget);
    });
  }

  private createMonitorElement(monitor: MontageMonitor): string {
    const streamUrl = this.generateStreamUrl(monitor);
    const statusColor = this.getMonitorStatusColor(monitor);
    
    return `
      <div class="monitor-widget" data-monitor-id="${monitor.Monitor.Id}">
        <div class="monitor-stream-container ${monitor.isAlarmed ? 'alarmed' : ''}">
          <img src="${streamUrl}" 
               alt="${monitor.Monitor.Name}"
               class="monitor-stream-image ${monitor.selectStyle}"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk9mZmxpbmU8L3RleHQ+PC9zdmc+'">
          <div class="monitor-overlay">
            <ion-badge color="${statusColor}" class="monitor-status">
              <ion-icon name="${monitor.Monitor.isRunning === 'true' ? 'videocam' : 'videocam-off'}"></ion-icon>
            </ion-badge>
            ${monitor.isStamp ? '<ion-icon name="pin" class="stamp-indicator"></ion-icon>' : ''}
          </div>
        </div>
        <div class="monitor-info">
          <h4>${monitor.Monitor.Name}</h4>
          <span class="monitor-id">ID: ${monitor.Monitor.Id}</span>
        </div>
      </div>
    `;
  }

  switchMontageProfile() {
    const profiles = this.nvrService.getMontageProfiles();
    const profileNames = Object.keys(profiles);
    
    if (profileNames.length === 0) {
      console.log('No saved profiles found');
      return;
    }
    
    const currentIndex = profileNames.indexOf(this.currentProfileName);
    const nextIndex = (currentIndex + 1) % profileNames.length;
    const nextProfile = profileNames[nextIndex];
    this.selectProfile(nextProfile);
  }

  saveMontageProfile() {
    const positions = this.getCurrentLayout();
    const profileName = prompt('Enter profile name:');
    
    if (profileName && profileName.trim()) {
      this.nvrService.saveMontageProfile(profileName.trim(), positions);
      this.currentProfileName = profileName.trim();
      console.log('Profile saved:', profileName);
    }
  }

  deleteMontageProfile() {
    const profiles = this.nvrService.getMontageProfiles();
    const profileNames = Object.keys(profiles);
    
    if (profileNames.length === 0) {
      console.log('No profiles to delete');
      return;
    }
    
    const profileToDelete = prompt('Enter profile name to delete:', this.currentProfileName);
    if (profileToDelete && profileNames.includes(profileToDelete)) {
      this.nvrService.deleteMontageProfile(profileToDelete);
      if (this.currentProfileName === profileToDelete) {
        this.currentProfileName = 'Default';
      }
      console.log('Profile deleted:', profileToDelete);
    }
  }

  private getCurrentLayout(): any[] {
    if (!this.gridStack) return [];
    
    return this.gridStack.getGridItems().map(item => {
      const monitorId = item.getAttribute('data-monitor-id');
      
      return {
        attr: monitorId,
        x: parseInt(item.getAttribute('gs-x') || '0'),
        y: parseInt(item.getAttribute('gs-y') || '0'),
        w: parseInt(item.getAttribute('gs-w') || '1'),
        h: parseInt(item.getAttribute('gs-h') || '1'),
        size: this.getMonitorById(monitorId!)?.gridScale || 50,
        display: this.getMonitorById(monitorId!)?.listDisplay || 'show'
      };
    });
  }

  private saveCurrentLayout() {
    const positions = this.getCurrentLayout();
    this.nvrService.saveMontageProfile('__current__', positions);
  }

  private applyCurrentProfile() {
    const currentProfile = this.nvrService.getCurrentMontageProfile();
    if (!currentProfile) return;
    
    const positions = this.nvrService.switchMontageProfile(currentProfile);
    if (!positions) return;
    
    positions.forEach(pos => {
      const monitor = this.getMonitorById(pos.attr);
      if (monitor) {
        monitor.gridScale = pos.size || 50;
        monitor.listDisplay = pos.display || 'show';
      }
    });
  }

  increaseSize() {
    this.adjustMonitorSizes(10);
  }

  decreaseSize() {
    this.adjustMonitorSizes(-10);
  }

  private adjustMonitorSizes(delta: number) {
    const selectedMonitors = this.monitors.filter(m => m.selectStyle === 'dragborder-selected');
    const monitorsToResize = selectedMonitors.length > 0 ? selectedMonitors : this.monitors;
    
    monitorsToResize.forEach(monitor => {
      monitor.gridScale = Math.max(5, Math.min(100, monitor.gridScale + delta));
    });
    
    this.layoutGridItems();
    this.saveCurrentLayout();
  }

  resetSizesWithInput() {
    const cols = prompt('Enter number of columns:');
    if (cols && !isNaN(Number(cols))) {
      const size = Math.floor(100 / Number(cols));
      this.monitors.forEach(monitor => {
        monitor.gridScale = size;
      });
      this.layoutGridItems();
      this.saveCurrentLayout();
    }
  }

  squeezeMonitors() {
    if (this.gridStack) {
      this.gridStack.compact();
      this.saveCurrentLayout();
    }
  }

  toggleDragMode() {
    this.isDragMode = !this.isDragMode;
    
    if (this.gridStack) {
      this.gridStack.enableMove(this.isDragMode);
      this.gridStack.enableResize(this.isDragMode);
    }
    
    this.monitors.forEach(monitor => {
      monitor.selectStyle = this.isDragMode ? 'dragborder' : '';
    });
    
    this.layoutGridItems();
  }

  toggleCycling() {
    this.nvrService.toggleMontageProfileCycling();
    
    if (this.nvrService.isMontageProfileCycling()) {
      this.startProfileCycling();
    } else {
      this.cycleInterval?.unsubscribe();
    }
  }

  isCycling(): boolean {
    return this.nvrService.isMontageProfileCycling();
  }

  private startProfileCycling() {
    const loginData = this.nvrService.getLogin();
    const intervalSec = loginData?.cycleMontageInterval || 10;
    
    this.cycleInterval = interval(intervalSec * 1000).subscribe(() => {
      this.cycleToNextProfile();
    });
  }

  private cycleToNextProfile() {
    const profiles = this.nvrService.getMontageProfiles();
    const profileNames = Object.keys(profiles);
    
    if (profileNames.length <= 1) return;
    
    const currentIndex = profileNames.indexOf(this.currentProfileName);
    const nextIndex = (currentIndex + 1) % profileNames.length;
    const nextProfile = profileNames[nextIndex];
    
    this.selectProfile(nextProfile);
  }

  selectProfile(profileName: string) {
    const positions = this.nvrService.switchMontageProfile(profileName);
    if (positions) {
      this.currentProfileName = profileName;
      this.applyCurrentProfile();
      this.layoutGridItems();
    }
  }

  private getMonitorById(id: string): MontageMonitor | undefined {
    return this.monitors.find(m => m.Monitor.Id === id);
  }

  getProfileNames(): string[] {
    return Object.keys(this.nvrService.getMontageProfiles());
  }

  generateStreamUrl(monitor: MontageMonitor): string {
    if (this.currentStreamState === this.streamState.STOPPED || monitor.listDisplay === 'noshow') {
      return '';
    }
    
    const loginData = this.nvrService.getLogin();
    if (!loginData) return '';
    
    let mode = 'single';
    let scale = monitor.gridScale;
    
    if (this.currentStreamState === this.streamState.SNAPSHOT_LOWQUALITY) {
      mode = 'single';
      scale = 10;
    } else if (this.currentStreamState === this.streamState.ACTIVE) {
      mode = 'jpeg';
    }
    
    const streamingURL = monitor.Monitor.streamingURL || loginData.streamingurl;
    const rand = new Date().getTime() + monitor.Monitor.Id;
    
    let stream = `${streamingURL}/nph-zms?mode=${mode}&monitor=${monitor.Monitor.Id}&scale=${scale}&rand=${rand}`;
    
    if (mode !== 'single' && monitor.Monitor.connKey) {
      stream += `&connkey=${monitor.Monitor.connKey}`;
    }
    
    if (loginData.authSession) {
      stream += `&${loginData.authSession}`;
    }
    
    return stream;
  }

  switchToLiveStreaming() {
    this.currentStreamState = this.streamState.ACTIVE;
    this.layoutGridItems();
  }

  switchToSnapshots() {
    this.currentStreamState = this.streamState.SNAPSHOT;
    this.layoutGridItems();
  }

  getMonitorStatusColor(monitor: MontageMonitor): string {
    if (monitor.isAlarmed) return 'danger';
    return monitor.Monitor.isRunning === 'true' ? 'success' : 'warning';
  }

  private checkAlarmStatus() {
  }

  toggleMinimal() {
    this.isMinimal = !this.isMinimal;
  }

  toggleHideUnhide() {
    this.selectAllToggle = !this.selectAllToggle;
    this.toggleAllMonitors();
  }

  toggleAllMonitors() {
    this.monitors.forEach(monitor => {
      monitor.listDisplay = this.selectAllToggle ? 'show' : 'noshow';
    });
    this.layoutGridItems();
    this.saveCurrentLayout();
  }

  onMonitorVisibilityChange() {
    this.layoutGridItems();
    this.saveCurrentLayout();
  }

  trackByMonitorId(index: number, monitor: MontageMonitor): string {
    return monitor.Monitor.Id;
  }
}
