import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MessageService, ContactMessage } from '../../services/message.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="admin-container">
      <mat-card class="admin-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>admin_panel_settings</mat-icon>
            Admin Panel - Contact Messages
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Login Section -->
          <div *ngIf="!isAuthenticated" class="login-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Admin Key</mat-label>
              <input matInput 
                     type="password" 
                     [(ngModel)]="adminKey" 
                     (keyup.enter)="login()"
                     placeholder="Enter admin key">
            </mat-form-field>
            <button mat-raised-button 
                    color="primary" 
                    (click)="login()"
                    [disabled]="!adminKey">
              Login
            </button>
          </div>

          <!-- Messages Section -->
          <div *ngIf="isAuthenticated">
            <div class="admin-actions">
              <button mat-raised-button 
                      color="primary" 
                      (click)="loadMessages()"
                      [disabled]="isLoading">
                <mat-icon>refresh</mat-icon>
                Refresh Messages
              </button>
              
              <button mat-raised-button 
                      color="accent" 
                      (click)="exportJSON()"
                      [disabled]="messages.length === 0">
                <mat-icon>download</mat-icon>
                Export JSON
              </button>
              
              <button mat-raised-button 
                      color="accent" 
                      (click)="exportCSV()"
                      [disabled]="messages.length === 0">
                <mat-icon>table_chart</mat-icon>
                Export CSV
              </button>
              
              <button mat-raised-button 
                      color="warn" 
                      (click)="clearLocal()">
                <mat-icon>clear_all</mat-icon>
                Clear Local
              </button>
            </div>

            <div *ngIf="isLoading" class="loading-section">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading messages...</p>
            </div>

            <div *ngIf="!isLoading && messages.length === 0" class="no-messages">
              <mat-icon>inbox</mat-icon>
              <p>No messages found</p>
            </div>

            <!-- Messages Table -->
            <div *ngIf="!isLoading && messages.length > 0" class="messages-table">
              <table mat-table [dataSource]="messages" class="full-width">
                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let message">
                    <mat-chip-set>
                      <mat-chip [class]="'status-' + message.status">
                        {{message.status | uppercase}}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                </ng-container>

                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let message">{{message.name}}</td>
                </ng-container>

                <!-- Email Column -->
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let message">
                    <a [href]="'mailto:' + message.email">{{message.email}}</a>
                  </td>
                </ng-container>

                <!-- Message Column -->
                <ng-container matColumnDef="message">
                  <th mat-header-cell *matHeaderCellDef>Message</th>
                  <td mat-cell *matCellDef="let message" class="message-cell">
                    <div class="message-preview" [title]="message.message">
                      {{message.message.length > 100 ? (message.message | slice:0:100) + '...' : message.message}}
                    </div>
                  </td>
                </ng-container>

                <!-- Timestamp Column -->
                <ng-container matColumnDef="timestamp">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let message">
                    {{message.timestamp | date:'short'}}
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let message">
                    <button mat-icon-button 
                            *ngIf="message.status === 'new'"
                            (click)="markAsRead(message.id)"
                            matTooltip="Mark as read">
                      <mat-icon>mark_email_read</mat-icon>
                    </button>
                    <button mat-icon-button 
                            (click)="viewMessage(message)"
                            matTooltip="View full message">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>

            <!-- Statistics -->
            <div *ngIf="messages.length > 0" class="statistics">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-item">
                    <span class="stat-label">Total Messages:</span>
                    <span class="stat-value">{{messages.length}}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">New:</span>
                    <span class="stat-value new">{{getNewMessagesCount()}}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Read:</span>
                    <span class="stat-value read">{{getReadMessagesCount()}}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  adminKey = '';
  isAuthenticated = false;
  isLoading = false;
  messages: ContactMessage[] = [];
  
  displayedColumns: string[] = ['status', 'name', 'email', 'message', 'timestamp', 'actions'];

  ngOnInit(): void {
    // Load local messages initially
    this.loadLocalMessages();
  }

  login(): void {
    if (!this.adminKey.trim()) {
      this.snackBar.open('Please enter admin key', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    // Test authentication by trying to load messages
    this.messageService.getMessages(this.adminKey).subscribe({
      next: (response) => {
        this.isAuthenticated = true;
        this.messages = response.messages;
        this.isLoading = false;
        this.cdr.markForCheck();
        
        this.snackBar.open('Successfully authenticated!', '✓', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.isAuthenticated = false;
        this.cdr.markForCheck();
        
        this.snackBar.open('Invalid admin key', '❌', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadMessages(): void {
    if (!this.isAuthenticated) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    this.messageService.getMessages(this.adminKey).subscribe({
      next: (response) => {
        this.messages = response.messages;
        this.isLoading = false;
        this.cdr.markForCheck();
        
        this.snackBar.open(`Loaded ${response.total} messages`, '✓', {
          duration: 2000
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        
        this.snackBar.open('Failed to load messages', '❌', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadLocalMessages(): void {
    const localMessages = this.messageService.getLocalMessagesForAdmin();
    if (localMessages.length > 0) {
      this.messages = localMessages;
      this.cdr.markForCheck();
    }
  }

  markAsRead(messageId: string): void {
    if (!this.isAuthenticated) return;

    this.messageService.markAsRead(messageId, this.adminKey).subscribe({
      next: () => {
        this.snackBar.open('Message marked as read', '✓', { duration: 2000 });
        // Messages will be updated via the service subscription
      },
      error: (error) => {
        this.snackBar.open('Failed to mark as read', '❌', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  viewMessage(message: ContactMessage): void {
    alert(`From: ${message.name} (${message.email})\nDate: ${message.timestamp}\n\nMessage:\n${message.message}`);
  }

  exportJSON(): void {
    this.messageService.exportMessages(this.messages);
  }

  exportCSV(): void {
    this.messageService.exportMessagesCSV(this.messages);
  }

  clearLocal(): void {
    if (confirm('Are you sure you want to clear local messages? This action cannot be undone.')) {
      this.messageService.clearLocalMessages();
      this.loadLocalMessages();
      this.snackBar.open('Local messages cleared', '✓', { duration: 2000 });
    }
  }

  getNewMessagesCount(): number {
    return this.messages.filter(msg => msg.status === 'new').length;
  }

  getReadMessagesCount(): number {
    return this.messages.filter(msg => msg.status === 'read').length;
  }
}