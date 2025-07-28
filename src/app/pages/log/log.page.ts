import { Component, OnInit } from '@angular/core';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonCard, IonCardContent,
  IonTextarea, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { clipboard, download, refresh, trash, funnel } from 'ionicons/icons';

@Component({
  selector: 'app-log',
  templateUrl: './log.page.html',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonCard, IonCardContent,
    IonTextarea, IonSelect, IonSelectOption, CommonModule, FormsModule
  ]
})
export class LogPage implements OnInit {
  logs: string[] = [];
  logLevel = 'all';
  
  constructor() {
    addIcons({ clipboard, download, refresh, trash, funnel });
  }

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.logs = [
      '[INFO] 2024-01-15 10:30:15 - Application started',
      '[DEBUG] 2024-01-15 10:30:16 - Loading monitors from API',
      '[INFO] 2024-01-15 10:30:17 - Successfully loaded 4 monitors',
      '[WARN] 2024-01-15 10:30:20 - Monitor 2 connection timeout, retrying...',
      '[INFO] 2024-01-15 10:30:22 - Monitor 2 connection restored',
      '[ERROR] 2024-01-15 10:31:05 - Failed to load events: Network error',
      '[DEBUG] 2024-01-15 10:31:06 - Retrying events load...',
      '[INFO] 2024-01-15 10:31:08 - Events loaded successfully'
    ];
  }

  refreshLogs() {
    console.log('Refreshing logs...');
    this.loadLogs();
  }

  clearLogs() {
    this.logs = [];
    console.log('Logs cleared');
  }

  exportLogs() {
    const logContent = this.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zmNinja-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  filterLogs() {
    console.log('Filtering logs by level:', this.logLevel);
  }

  getLogClass(log: string): string {
    if (log.includes('[ERROR]')) return 'log-error';
    if (log.includes('[WARN]')) return 'log-warning';
    if (log.includes('[DEBUG]')) return 'log-debug';
    return 'log-info';
  }
}
