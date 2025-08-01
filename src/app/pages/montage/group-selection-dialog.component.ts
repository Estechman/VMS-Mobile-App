import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface GroupSelectionData {
  groups: string[];
  currentSelection: string;
}

@Component({
  selector: 'app-group-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Select Camera Group</h2>
    <mat-dialog-content>
      <p class="current-selection">Current: {{ data.currentSelection }}</p>
      <mat-selection-list 
        #groupList 
        [multiple]="false"
        (selectionChange)="onSelectionChange($event)">
        <mat-list-option 
          *ngFor="let group of data.groups" 
          [value]="group"
          [selected]="group === data.currentSelection">
          <mat-icon matListItemIcon>
            {{ group === 'All' ? 'apps' : 'folder' }}
          </mat-icon>
          {{ group }}
        </mat-list-option>
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!selectedGroup"
        (click)="onConfirm()">
        OK
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .current-selection {
      margin-bottom: 16px;
      color: #666;
      font-style: italic;
    }
    
    mat-selection-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    mat-dialog-content {
      min-width: 300px;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class GroupSelectionDialogComponent {
  selectedGroup: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<GroupSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GroupSelectionData
  ) {
    this.selectedGroup = data.currentSelection;
  }

  onSelectionChange(event: any) {
    const selectedOptions = event.source.selectedOptions.selected;
    this.selectedGroup = selectedOptions.length > 0 ? selectedOptions[0].value : null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.selectedGroup);
  }
}
