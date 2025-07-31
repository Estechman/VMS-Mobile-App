import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonBadge, IonPopover,
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonRange, IonFab, IonFabButton, IonActionSheet, IonAlert,
  IonModal, ModalController, AlertController, ActionSheetController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { NvrService, Monitor } from '../../services/nvr.service';
import { RestService } from '../../services/rest.service';
import { addIcons } from 'ionicons';
import { 
  refresh, videocam, videocamOff, camera, play, pause, move, grid,
  add, remove, bicycle, eye, save, trash, settings, resize, chevronDown,
  chevronUp, close, pin, folder, notifications
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
    IonModal,
    CommonModule, FormsModule
  ]
})
export class MontagePage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('gridContainer', { static: true }) gridContainer!: ElementRef;
  
  monitors: MontageMonitor[] = [];
  zmGroups: string[] = [];
  currentZMGroupNames: string[] = [];
  tempZMGroups: { name: string; selection: boolean }[] = [];
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
  private currentStreamState = this.streamState.SNAPSHOT;

  constructor(
    private nvrService: NvrService,
    private restService: RestService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController
  ) {
    console.log('=== MONTAGE DEBUG: Constructor called ===');
    console.log('Available stream states:', this.streamState);
    console.log('Initial stream state set to SNAPSHOT (normal quality):', this.streamState.SNAPSHOT);
    
    addIcons({ 
      refresh, videocam, videocamOff, camera, play, pause, move, grid,
      add, remove, bicycle, eye, save, trash, settings, resize, chevronDown,
      chevronUp, close, pin, folder, notifications
    });
  }

  ngOnInit() {
    console.log('=== MONTAGE DEBUG: ngOnInit called ===');
    console.log('Current stream state:', this.currentStreamState);
    console.log('Stream state enum:', this.streamState);
    
    this.loadMonitors();
    this.startIntervals();
    this.currentProfileName = this.nvrService.getCurrentMontageProfile() || 'Default';
    
    this.nvrService.getZMGroups().subscribe({
      next: (groups) => {
        this.zmGroups = groups;
        console.log('Loaded ZM Groups:', groups);
      },
      error: (error) => {
        console.error('Error loading ZM Groups:', error);
        this.zmGroups = [];
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      console.log('🔧 [MONTAGE] Initializing GridStack...');
      console.log('🔧 [MONTAGE] GridStack available:', typeof GridStack);
      console.log('🔧 [MONTAGE] Container element:', this.gridContainer?.nativeElement);
      console.log('🔧 [MONTAGE] isLoading:', this.isLoading);
      
      if (!this.gridContainer?.nativeElement && !this.isLoading) {
        console.log('🔧 [MONTAGE] Container not found, retrying in 200ms...');
        setTimeout(() => this.initializeGridStack(), 200);
      } else {
        this.initializeGridStack();
        
        if (this.monitors.length > 0) {
          setTimeout(() => this.layoutGridItems(), 100);
        }
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.refreshInterval?.unsubscribe();
    this.cycleInterval?.unsubscribe();
    this.alarmInterval?.unsubscribe();
    this.gridStack?.destroy();
  }

  private initializeGridStack() {
    console.log('🔧 [MONTAGE] initializeGridStack called');
    console.log('🔧 [MONTAGE] GridStack type:', typeof GridStack);
    console.log('🔧 [MONTAGE] Container element:', this.gridContainer?.nativeElement);
    
    if (!this.gridContainer?.nativeElement) {
      console.error('❌ [MONTAGE] Grid container element not found');
      return;
    }
    
    if (typeof GridStack === 'undefined') {
      console.error('❌ [MONTAGE] GridStack library not loaded');
      return;
    }
    
    try {
      this.gridStack = GridStack.init({
        cellHeight: 200,
        margin: 5,
        animate: true,
        float: false,
        acceptWidgets: true,
        removable: false,
        disableDrag: !this.isDragMode,
        disableResize: !this.isDragMode,
        column: 12,
        minRow: 1,
        staticGrid: false
      }, this.gridContainer.nativeElement);

      this.gridStack.on('change', (event, items) => {
        this.saveCurrentLayout();
      });
      
      console.log('✅ [MONTAGE] GridStack initialized successfully');
    } catch (error) {
      console.error('❌ [MONTAGE] GridStack initialization failed:', error);
    }
  }

  private loadMonitors(forceRefresh = false) {
    this.isLoading = true;
    this.subscriptions.add(
      this.restService.getMonitors().subscribe({
        next: (monitors) => {
          if (monitors && typeof monitors === 'object' && monitors.placeholder) {
            console.log('🔧 [MONTAGE] API failed, creating mock monitors for testing...');
            this.isLoading = false;
            this.createMockMonitors();
            return;
          }
          
          if (!Array.isArray(monitors)) {
            console.log('🔧 [MONTAGE] Invalid monitors data, creating mock monitors for testing...');
            this.isLoading = false;
            this.createMockMonitors();
            return;
          }
          
          this.monitors = monitors
            .filter((m: Monitor) => m.Monitor.Function !== 'None')
            .map((m: Monitor) => this.enhanceMonitor(m));
          
          this.applyCurrentProfile();
          this.currentStreamState = this.streamState.SNAPSHOT;
          this.isLoading = false;
          
          setTimeout(() => this.layoutGridItems(), 200);
        },
        error: (error) => {
          console.error('Failed to load monitors:', error);
          console.log('🔧 [MONTAGE] API failed, creating mock monitors for testing...');
          this.isLoading = false;
          this.createMockMonitors();
        }
      })
    );
  }

  private enhanceMonitor(monitor: Monitor): MontageMonitor {
    const enhanced = {
      ...monitor,
      gridScale: parseInt(monitor.Monitor.gridScale?.toString() || '50') || 50,
      listDisplay: monitor.Monitor.listDisplay || 'show',
      isAlarmed: monitor.Monitor.isAlarmed || false,
      isStamp: false,
      selectStyle: '',
      showSidebar: false,
      eventCount: 0,
      lastEvent: null
    } as MontageMonitor;

    this.restService.getEvents({ 
      monitorId: parseInt(monitor.Monitor.Id), 
      limit: 1 
    }).subscribe({
      next: (events) => {
        if (events && events.length > 0) {
          enhanced.lastEvent = events[0];
          enhanced.eventCount = events.length;
        }
      },
      error: (error) => console.error('Error loading events for monitor:', error)
    });

    return enhanced;
  }

  private createMockMonitors() {
    console.log('=== MONTAGE DEBUG: Creating mock monitors for testing ===');
    console.log('Current stream state before mock creation:', this.currentStreamState);
    
    const mockMonitors: any[] = [];
    for (let i = 1; i <= 12; i++) {
      mockMonitors.push({
        Monitor: {
          Id: i.toString(),
          Name: `Test Monitor ${i}`,
          Function: 'Monitor',
          Enabled: '1',
          Width: '640',
          Height: '480',
          isRunning: i % 3 !== 0 ? 'true' : 'false' // Most monitors running
        },
        gridScale: 50,
        listDisplay: 'show' as 'show' | 'noshow' | 'blank',
        isAlarmed: i % 4 === 0, // Every 4th monitor is "alarmed"
        isStamp: false,
        selectStyle: '',
        showSidebar: false,
        eventCount: 0
      });
    }
    this.monitors = mockMonitors as any;
    console.log('✅ [MONTAGE] Created mock monitors:', this.monitors.length);
    
    if (this.gridStack) {
      setTimeout(() => this.layoutGridItems(), 100);
    }
  }

  doRefresh(event: any) {
    this.loadMonitors(true);
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  private startIntervals() {
    const loginData = this.nvrService.getLogin();
    const refreshSec = loginData?.refreshSec || 3;
    this.refreshInterval = interval(refreshSec * 1000).subscribe(() => {
      this.refreshMonitorImages();
    });
    
    this.alarmInterval = interval(5000).subscribe(() => {
      this.checkAlarmStatus();
    });
    
    if (this.nvrService.isMontageProfileCycling()) {
      this.startProfileCycling();
    }
  }

  private layoutGridItems() {
    console.log('🔧 [MONTAGE] layoutGridItems called');
    console.log('🔧 [MONTAGE] GridStack instance:', this.gridStack);
    console.log('🔧 [MONTAGE] Monitors count:', this.monitors.length);
    
    if (!this.gridStack) {
      console.error('❌ [MONTAGE] GridStack not initialized - deferring layout');
      setTimeout(() => this.layoutGridItems(), 200);
      return;
    }
    
    this.gridStack.removeAll();
    
    let visibleCount = 0;
    this.monitors.forEach((monitor, index) => {
      if (monitor.listDisplay === 'noshow') {
        console.log('🔧 [MONTAGE] Skipping hidden monitor:', monitor.Monitor.Name);
        return;
      }
      
      visibleCount++;
      console.log('🔧 [MONTAGE] Adding monitor:', monitor.Monitor.Name, 'ID:', monitor.Monitor.Id);
      
      try {
        const widgetElement = this.createMonitorElement(monitor);
        this.gridStack?.addWidget(widgetElement);
        console.log('✅ [MONTAGE] Added widget for monitor:', monitor.Monitor.Name);
      } catch (error) {
        console.error('❌ [MONTAGE] Failed to add widget for monitor:', monitor.Monitor.Name, error);
      }
    });
    
    console.log('✅ [MONTAGE] Layout complete. Visible monitors:', visibleCount);
  }

  private createMonitorElement(monitor: MontageMonitor): HTMLElement {
    console.log('🔧 [MONTAGE] Creating element for monitor:', monitor.Monitor.Name, 'ID:', monitor.Monitor.Id);
    
    const widget = document.createElement('div');
    widget.className = 'grid-stack-item';
    widget.setAttribute('data-gs-id', monitor.Monitor.Id);
    
    const gridScale = parseInt((monitor.Monitor.gridScale || 50).toString()) || 50;
    widget.style.width = `${gridScale}%`;
    widget.style.minWidth = `${Math.max(gridScale, 20)}%`;
    widget.style.height = 'auto';
    widget.style.aspectRatio = '16/9';
    widget.style.position = 'relative';
    widget.style.marginBottom = '10px';
    
    console.log('🔧 [MONTAGE] Applied percentage width:', gridScale + '%', 'to monitor', monitor.Monitor.Id);
    
    const content = document.createElement('div');
    content.className = 'grid-stack-item-content monitor-widget';
    
    const streamUrl = this.generateStreamUrl(monitor);
    const statusColor = this.getMonitorStatusColor(monitor);
    
    console.log('🔧 [MONTAGE] Stream URL for monitor', monitor.Monitor.Id, ':', streamUrl);
    
    content.innerHTML = `
      <div class="monitor-widget" data-monitor-id="${monitor.Monitor.Id}">
        <div class="monitor-stream-container ${monitor.isAlarmed ? 'alarmed' : ''}">
          <img class="monitor-stream-image ${monitor.selectStyle || ''}" 
               src="${streamUrl}" 
               alt="${monitor.Monitor.Name}"
               data-monitor-id="${monitor.Monitor.Id}">
          <div class="monitor-overlay">
            <div class="monitor-status" style="background-color: ${statusColor}">
              <ion-icon name="videocam"></ion-icon>
            </div>
            ${monitor.isStamp ? '<div class="stamp-indicator"><ion-icon name="bookmark"></ion-icon></div>' : ''}
            ${monitor.lastEvent ? `
              <div class="event-overlay">
                <ion-icon name="notifications" class="event-icon"></ion-icon>
                <span class="event-count">${monitor.eventCount}</span>
              </div>
            ` : ''}
          </div>
          <div class="monitor-timestamp">
            ${new Date().toLocaleTimeString()}
          </div>
        </div>
        <div class="monitor-info">
          <h4>${monitor.Monitor.Name}</h4>
          <span class="monitor-id">ID: ${monitor.Monitor.Id}</span>
          ${monitor.lastEvent ? `
            <div class="event-info">
              <small>Latest: ${monitor.lastEvent.Event?.StartTime || 'Unknown'}</small>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    const imgElement = content.querySelector('.monitor-stream-image') as HTMLImageElement;
    if (imgElement) {
      imgElement.addEventListener('dblclick', () => {
        this.maximizeCamera(monitor.Monitor.Id);
      });
      
      imgElement.addEventListener('error', () => {
        imgElement.src = 'assets/img/noimage.png';
        console.warn('Failed to load stream for monitor:', monitor.Monitor.Id);
      });
    }
    
    widget.appendChild(content);
    return widget;
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

  async saveMontageProfile() {
    const positions = this.getCurrentLayout();
    const alert = await this.alertController.create({
      header: 'Save Profile',
      message: 'Enter profile name:',
      inputs: [
        {
          name: 'profileName',
          type: 'text',
          placeholder: 'My Profile'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            const profileName = data.profileName?.trim();
            if (profileName) {
              this.nvrService.saveMontageProfile(profileName, positions);
              this.currentProfileName = profileName;
              console.log('Profile saved:', profileName);
            }
          }
        }
      ]
    });
    await alert.present();
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
        
        const gridItem = document.querySelector(`[data-monitor-id="${monitor.Monitor.Id}"]`);
        if (gridItem) {
          (gridItem as HTMLElement).style.setProperty('--monitor-width', `${monitor.gridScale}%`);
          (gridItem as HTMLElement).setAttribute('data-monitor-scale', monitor.gridScale.toString());
        }
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
    console.log('🔧 [MONTAGE] Adjusting monitor sizes by:', delta);
    
    const selectedMonitors = this.monitors.filter(m => m.selectStyle === 'dragborder-selected');
    const monitorsToResize = selectedMonitors.length > 0 ? selectedMonitors : this.monitors;
    
    monitorsToResize.forEach(monitor => {
      const currentScale = parseInt((monitor.Monitor.gridScale || 50).toString()) || 50;
      const newScale = Math.max(5, Math.min(100, currentScale + (delta * 5)));
      monitor.Monitor.gridScale = newScale;
      
      const element = document.querySelector(`[data-gs-id="${monitor.Monitor.Id}"]`) as HTMLElement;
      if (element) {
        element.style.width = `${newScale}%`;
        element.style.minWidth = `${Math.max(newScale, 20)}%`;
        console.log('🔧 [MONTAGE] Updated DOM element width for monitor', monitor.Monitor.Id, 'to', newScale + '%');
      }
      
      console.log('🔧 [MONTAGE] Monitor', monitor.Monitor.Id, 'scale changed from', currentScale, 'to', newScale);
    });
    
    if (this.gridStack) {
      setTimeout(() => {
        this.gridStack?.compact();
        console.log('🔧 [MONTAGE] GridStack compacted after size adjustment');
      }, 100);
    }
    this.saveCurrentLayout();
  }

  async resetSizesWithInput() {
    const alert = await this.alertController.create({
      header: 'Grid Size',
      message: 'Enter number of columns:',
      inputs: [
        {
          name: 'columns',
          type: 'number',
          placeholder: '4',
          min: 1,
          max: 10
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Apply',
          handler: (data) => {
            const cols = parseInt(data.columns);
            if (cols && !isNaN(cols) && cols > 0) {
              const size = Math.floor(100 / cols);
              this.monitors.forEach(monitor => {
                monitor.Monitor.gridScale = size;
                
                const element = document.querySelector(`[data-gs-id="${monitor.Monitor.Id}"]`) as HTMLElement;
                if (element) {
                  element.style.width = `${size}%`;
                  element.style.minWidth = `${Math.max(size, 20)}%`;
                }
              });
              
              if (this.gridStack) {
                this.gridStack.compact();
              }
              this.saveCurrentLayout();
            }
          }
        }
      ]
    });
    await alert.present();
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

  async generateStreamUrl(monitor: MontageMonitor): Promise<string> {
    console.log(`=== MONTAGE DEBUG: Generating stream URL for monitor ${monitor.Monitor.Id} ===`);
    console.log('Current stream state:', this.currentStreamState);
    console.log('Stream state enum values:', this.streamState);
    console.log('Monitor listDisplay:', monitor.listDisplay);
    
    if (this.currentStreamState === this.streamState.STOPPED || monitor.listDisplay === 'noshow') {
      console.log('Returning empty URL - stopped or hidden');
      return '';
    }
    
    const loginData = this.nvrService.getLogin();
    if (!loginData) {
      console.log('No login data available');
      return '';
    }
    
    let mode = 'single';
    let scale = loginData.montageQuality || 50;
    console.log('Initial scale from montageQuality:', scale);
    
    if (this.currentStreamState === this.streamState.SNAPSHOT_LOWQUALITY) {
      mode = 'single';
      scale = 10;
      console.log('Using SNAPSHOT_LOWQUALITY - scale set to 10');
    } else if (this.currentStreamState === this.streamState.ACTIVE) {
      mode = 'jpeg';
      console.log('Using ACTIVE mode - jpeg streaming');
    } else {
      console.log('Using default SNAPSHOT mode with scale:', scale);
    }
    
    try {
      const streamUrl = await this.restService.getMonitorStreamUrl(
        parseInt(monitor.Monitor.Id), 
        { mode, scale }
      );
      console.log('Generated stream URL:', streamUrl);
      return streamUrl;
    } catch (error) {
      console.error('Error generating stream URL:', error);
      return '';
    }
  }

  switchToLiveStreaming() {
    console.log('=== MONTAGE DEBUG: Switching to live streaming ===');
    this.currentStreamState = this.streamState.ACTIVE;
    console.log('New stream state:', this.currentStreamState);
    this.layoutGridItems();
  }

  switchToSnapshots() {
    console.log('=== MONTAGE DEBUG: Switching to snapshots ===');
    this.currentStreamState = this.streamState.SNAPSHOT;
    console.log('New stream state:', this.currentStreamState);
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

  async toggleHideUnhide() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Monitor Visibility',
      buttons: [
        {
          text: 'Show All Monitors',
          handler: () => {
            this.monitors.forEach(monitor => {
              monitor.listDisplay = 'show';
            });
            this.layoutGridItems();
            this.saveCurrentLayout();
          }
        },
        {
          text: 'Hide All Monitors',
          handler: () => {
            this.monitors.forEach(monitor => {
              monitor.listDisplay = 'noshow';
            });
            this.layoutGridItems();
            this.saveCurrentLayout();
          }
        },
        {
          text: 'Select Individual Monitors',
          handler: () => {
            this.showMonitorSelectionModal();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async showMonitorSelectionModal() {
    const alert = await this.alertController.create({
      header: 'Select Monitors to Show',
      inputs: this.monitors.map(monitor => ({
        name: monitor.Monitor.Id,
        type: 'checkbox',
        label: monitor.Monitor.Name,
        value: monitor.Monitor.Id,
        checked: monitor.listDisplay === 'show'
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Apply',
          handler: (selectedIds: string[]) => {
            this.monitors.forEach(monitor => {
              monitor.listDisplay = selectedIds.includes(monitor.Monitor.Id) ? 'show' : 'noshow';
            });
            this.layoutGridItems();
            this.saveCurrentLayout();
          }
        }
      ]
    });
    await alert.present();
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

  async selectZMGroup() {
    this.tempZMGroups = [];
    const loginData = this.nvrService.getLogin();
    
    if (!loginData || this.zmGroups.length === 0) {
      return;
    }

    for (const group of this.zmGroups) {
      const isSelected = loginData.currentZMGroupNames?.includes(group) || false;
      this.tempZMGroups.push({
        name: group,
        selection: isSelected
      });
    }
    
    this.tempZMGroups.unshift({ name: 'All', selection: false });

    const alert = await this.alertController.create({
      header: 'Select Camera Groups',
      subHeader: `Active: ${loginData.currentZMGroupNames?.join(', ') || 'All'}`,
      inputs: this.tempZMGroups.map(group => ({
        type: 'checkbox',
        label: group.name,
        value: group.name,
        checked: group.selection
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: (selectedGroups: string[]) => {
            const loginData = this.nvrService.getLogin();
            if (loginData) {
              if (selectedGroups.includes('All') || selectedGroups.length === 0) {
                loginData.currentZMGroupNames = [];
              } else {
                loginData.currentZMGroupNames = selectedGroups;
              }
              this.nvrService.setLogin(loginData);
              this.applyGroupFilter();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private applyGroupFilter() {
    const loginData = this.nvrService.getLogin();
    if (!loginData?.currentZMGroupNames || loginData.currentZMGroupNames.length === 0) {
      this.monitors.forEach(monitor => {
        monitor.listDisplay = 'show';
      });
    } else {
      this.monitors.forEach(monitor => {
        const hasMatchingGroup = monitor.Monitor.Group?.some(group => 
          loginData.currentZMGroupNames!.includes(group)
        );
        monitor.listDisplay = hasMatchingGroup ? 'show' : 'noshow';
      });
    }
    this.layoutGridItems();
  }

  async openMonitorModal(monitorId: string) {
    const monitor = this.monitors.find(m => m.Monitor.Id === monitorId);
    if (!monitor) return;

    const alert = await this.alertController.create({
      header: monitor.Monitor.Name,
      message: `Monitor ID: ${monitorId}`,
      subHeader: 'Full-screen view would open here',
      buttons: ['Close']
    });

    (window as any).openMonitorModal = (id: string) => {
      this.openMonitorModal(id);
    };

    await alert.present();
  }

  async maximizeCamera(monitorId: string) {
    const monitor = this.monitors.find(m => m.Monitor.Id === monitorId);
    if (!monitor) {
      console.error('Monitor not found:', monitorId);
      return;
    }

    const alert = await this.alertController.create({
      header: monitor.Monitor.Name,
      message: `Full-screen view for ${monitor.Monitor.Name}`,
      cssClass: 'fullscreen-modal',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        },
        {
          text: 'Live View',
          handler: () => {
            console.log('Opening live view for monitor:', monitorId);
          }
        }
      ]
    });

    await alert.present();
  }

  private refreshMonitorImages() {
    const loginData = this.nvrService.getLogin();
    const runMode = loginData?.runMode || 'normal';
    
    if (runMode === 'lowbw') {
      this.monitors.forEach(monitor => {
        if (Math.random() > 0.5) {
          this.updateMonitorImage(monitor);
        }
      });
    } else {
      this.monitors.forEach(monitor => {
        if (monitor.listDisplay === 'show') {
          this.updateMonitorImage(monitor);
        }
      });
    }
  }

  private updateMonitorImage(monitor: MontageMonitor) {
    const imgElement = document.querySelector(`[data-gs-id="${monitor.Monitor.Id}"] img`) as HTMLImageElement;
    if (imgElement) {
      this.generateStreamUrl(monitor).then(url => {
        imgElement.src = url + '&t=' + Date.now();
      });
    }
  }
}
