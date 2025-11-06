import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="contact-dialog">
      <mat-dialog-content>
        <div class="dialog-header">
          <mat-icon class="dialog-icon">mail_outline</mat-icon>
          <h2 mat-dialog-title>Send us a message</h2>
          <p class="dialog-subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Name</mat-label>
            <input 
              matInput 
              formControlName="name" 
              placeholder="Enter your full name"
              required
            >
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="contactForm.get('name')?.hasError('required')">
              Name is required
            </mat-error>
            <mat-error *ngIf="contactForm.get('name')?.hasError('minlength')">
              Name must be at least 2 characters
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Address</mat-label>
            <input 
              matInput 
              type="email" 
              formControlName="email" 
              placeholder="your@email.com"
              required
            >
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="contactForm.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="contactForm.get('email')?.hasError('email')">
              Please enter a valid email address
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Message</mat-label>
            <textarea 
              matInput 
              formControlName="message" 
              placeholder="Tell us about your project..."
              rows="5"
              required
            ></textarea>
            <mat-icon matPrefix>message</mat-icon>
            <mat-error *ngIf="contactForm.get('message')?.hasError('required')">
              Message is required
            </mat-error>
            <mat-error *ngIf="contactForm.get('message')?.hasError('minlength')">
              Message must be at least 10 characters
            </mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="contactForm.invalid || isSubmitting"
        >
          <mat-icon>send</mat-icon>
          {{ isSubmitting ? 'Sending...' : 'Send Message' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .contact-dialog {
      max-width: 500px;
      overflow: hidden;
    }

    .dialog-header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding: 1rem 1rem 0;

      .dialog-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #1976d2;
        margin-bottom: 1rem;
      }

      h2 {
        margin-bottom: 0.5rem;
        color: rgba(0, 0, 0, 0.87);
        font-size: 1.5rem;
      }

      .dialog-subtitle {
        color: rgba(0, 0, 0, 0.6);
        margin: 0;
        font-size: 0.9rem;
      }
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      overflow: visible;
      padding: 0 1rem;

      .full-width {
        width: 100%;
      }
    }

    .dialog-actions {
      padding: 1.5rem 1rem 1rem 1rem;
      gap: 1rem;
      justify-content: flex-end;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      margin-top: 1rem;

      button {
        min-width: 120px;
        margin: 0 8px;
        
        &:first-child {
          margin-left: 0;
        }
        
        &:last-child {
          margin-right: 0;
        }
        
        mat-icon {
          margin-right: 8px;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    ::ng-deep {
      .mat-mdc-dialog-content {
        overflow: visible !important;
        max-height: none !important;
      }
      
      .mat-mdc-form-field-icon-prefix {
        margin-right: 12px;
        color: #1976d2;
      }
      
      .mat-mdc-text-field-wrapper {
        overflow: visible;
      }
    }
  `]
})
export class ContactDialogComponent {
  contactForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<ContactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder
  ) {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      
      // Simulate API call
      setTimeout(() => {
        const formData = this.contactForm.value;
        console.log('Form submitted:', formData);
        
        this.isSubmitting = false;
        this.dialogRef.close('sent');
        
        // Reset form
        this.contactForm.reset();
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
}