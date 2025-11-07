import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { ContactFormData } from '../shared/interfaces';

export interface ContactMessage extends ContactFormData {
  id: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  status: 'new' | 'read';
  readAt?: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: ContactMessage[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly http = inject(HttpClient);
  
  private readonly API_BASE_URL = 'http://localhost:3001/api';
  private readonly LOCAL_STORAGE_KEY = 'webfirm_messages_backup';
  
  // Subject for real-time message updates
  private messagesSubject = new BehaviorSubject<ContactMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  constructor() {
    this.loadLocalMessages();
  }

  /**
   * Submit contact form message
   */
  submitMessage(formData: ContactFormData, captchaId?: string): Observable<ContactSubmissionResponse> {
    console.log('MessageService: Submitting contact message', { email: formData.email });
    
    const payload = {
      ...formData,
      captchaId
    };
    
    return this.http.post<ContactSubmissionResponse>(`${this.API_BASE_URL}/contact`, payload)
      .pipe(
        retry(2),
        tap(response => {
          if (response.success) {
            console.log('MessageService: Message submitted successfully', { id: response.id });
            
            // Save to local storage as backup
            this.saveMessageLocally(formData, response.id);
          }
        }),
        catchError(error => this.handleError('submitMessage', error))
      );
  }

  /**
   * Get all messages (admin only)
   */
  getMessages(adminKey: string): Observable<MessagesResponse> {
    console.log('MessageService: Fetching admin messages');
    
    return this.http.get<MessagesResponse>(`${this.API_BASE_URL}/admin/messages?key=${adminKey}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.messagesSubject.next(response.messages);
            console.log('MessageService: Loaded messages', response.total);
          }
        }),
        catchError(error => this.handleError('getMessages', error))
      );
  }

  /**
   * Mark message as read (admin only)
   */
  markAsRead(messageId: string, adminKey: string): Observable<{success: boolean; message?: string}> {
    console.log('MessageService: Marking message as read', { messageId });
    
    return this.http.post<{success: boolean; message?: string}>(`${this.API_BASE_URL}/admin/messages/${messageId}/read?key=${adminKey}`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            // Update local messages array
            const currentMessages = this.messagesSubject.value;
            const updatedMessages = currentMessages.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: 'read' as const, readAt: new Date().toISOString() }
                : msg
            );
            this.messagesSubject.next(updatedMessages);
          }
        }),
        catchError(error => this.handleError('markAsRead', error))
      );
  }

  /**
   * Save message to local storage as backup
   */
  private saveMessageLocally(formData: ContactFormData, id: string): void {
    try {
      const localMessages = this.getLocalMessages();
      const message: ContactMessage = {
        ...formData,
        id,
        timestamp: new Date().toISOString(),
        status: 'new'
      };
      
      localMessages.push(message);
      
      // Keep only last 100 messages locally
      const recentMessages = localMessages.slice(-100);
      
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(recentMessages));
      console.log('MessageService: Message saved to local storage', { id });
      
    } catch (error) {
      console.error('MessageService: Failed to save message locally', error);
    }
  }

  /**
   * Get messages from local storage
   */
  private getLocalMessages(): ContactMessage[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('MessageService: Failed to load local messages', error);
      return [];
    }
  }

  /**
   * Load local messages into subject
   */
  private loadLocalMessages(): void {
    const localMessages = this.getLocalMessages();
    if (localMessages.length > 0) {
      this.messagesSubject.next(localMessages);
      console.log('MessageService: Loaded messages from local storage', localMessages.length);
    }
  }

  /**
   * Get messages from local storage (for offline access)
   */
  getLocalMessagesForAdmin(): ContactMessage[] {
    return this.getLocalMessages();
  }

  /**
   * Clear local storage messages
   */
  clearLocalMessages(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      this.messagesSubject.next([]);
      console.log('MessageService: Local messages cleared');
    } catch (error) {
      console.error('MessageService: Failed to clear local messages', error);
    }
  }

  /**
   * Export messages as JSON
   */
  exportMessages(messages: ContactMessage[]): void {
    try {
      const dataStr = JSON.stringify(messages, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `webfirm-messages-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      console.log('MessageService: Exported messages', messages.length);
    } catch (error) {
      console.error('MessageService: Failed to export messages', error);
    }
  }

  /**
   * Export messages as CSV
   */
  exportMessagesCSV(messages: ContactMessage[]): void {
    try {
      const headers = ['ID', 'Name', 'Email', 'Message', 'Timestamp', 'Status', 'Read At'];
      const csvContent = [
        headers.join(','),
        ...messages.map(msg => [
          msg.id,
          `"${msg.name.replace(/"/g, '""')}"`,
          msg.email,
          `"${msg.message.replace(/"/g, '""')}"`,
          msg.timestamp,
          msg.status,
          msg.readAt || ''
        ].join(','))
      ].join('\n');
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `webfirm-messages-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      console.log('MessageService: Exported messages as CSV', messages.length);
    } catch (error) {
      console.error('MessageService: Failed to export messages as CSV', error);
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.error || `Server error: ${error.status} ${error.statusText}`;
    }
    
    console.error('MessageService:', `${operation} failed`, { 
      error: errorMessage, 
      status: error.status 
    });
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Check if server is available
   */
  checkServerHealth(): Observable<{ status: string; timestamp: string; service: string }> {
    return this.http.get<{ status: string; timestamp: string; service: string }>(`${this.API_BASE_URL}/health`)
      .pipe(
        catchError(error => {
          console.warn('MessageService: Server health check failed', error);
          return throwError(() => new Error('Server unavailable'));
        })
      );
  }
}