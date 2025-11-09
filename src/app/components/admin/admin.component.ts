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
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

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
      this.snackBar.open(
        this.translationService.translate('admin.login.error'), 
        this.translationService.translate('common.close'), 
        { duration: 3000 }
      );
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
        
        this.snackBar.open(
          this.translationService.translate('admin.login.success'), 
          '✓', 
          {
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
      },
      error: (error) => {
        this.isLoading = false;
        this.isAuthenticated = false;
        this.cdr.markForCheck();
        
        this.snackBar.open(
          this.translationService.translate('admin.login.error'), 
          '❌', 
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
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
        
        const message = this.translationService.translate('admin.messages.loaded')
          .replace('{{count}}', response.total.toString());
        this.snackBar.open(message, '✓', { duration: 2000 });
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        
        this.snackBar.open(
          this.translationService.translate('admin.messages.loadError'), 
          '❌', 
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
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
        this.snackBar.open(
          this.translationService.translate('admin.messages.markedAsRead'), 
          '✓', 
          { duration: 2000 }
        );
        // Messages will be updated via the service subscription
      },
      error: (error) => {
        this.snackBar.open(
          this.translationService.translate('admin.messages.markError'), 
          '❌', 
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  viewMessage(message: ContactMessage): void {
    const from = this.translationService.translate('admin.messages.viewFrom');
    const date = this.translationService.translate('admin.messages.viewDate');
    const messageLabel = this.translationService.translate('admin.messages.viewMessage');
    
    alert(`${from}: ${message.name} (${message.email})\n${date}: ${message.timestamp}\n\n${messageLabel}:\n${message.message}`);
  }

  exportJSON(): void {
    this.messageService.exportMessages(this.messages);
  }

  exportCSV(): void {
    this.messageService.exportMessagesCSV(this.messages);
  }

  clearLocal(): void {
    const confirmMessage = this.translationService.translate('admin.messages.clearConfirm');
    if (confirm(confirmMessage)) {
      this.messageService.clearLocalMessages();
      this.loadLocalMessages();
      this.snackBar.open(
        this.translationService.translate('admin.messages.cleared'), 
        '✓', 
        { duration: 2000 }
      );
    }
  }

  getNewMessagesCount(): number {
    return this.messages.filter(msg => msg.status === 'new').length;
  }

  getReadMessagesCount(): number {
    return this.messages.filter(msg => msg.status === 'read').length;
  }
}