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
      max-width: 550px;
      overflow: hidden;
    }

    .dialog-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem 2rem 0;

      .dialog-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #1976d2;
        margin: 0 auto 1rem;
        display: block;
      }

      h2 {
        margin-bottom: 0.75rem;
        color: inherit;
        font-size: 1.75rem;
        font-weight: 600;
      }

      .dialog-subtitle {
        color: rgba(128, 128, 128, 0.9);
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
      }
    }

    .contact-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      overflow: visible;
      padding: 0 2rem;

      .full-width {
        width: 100%;
      }
    }

    .dialog-actions {
      padding: 1.5rem 2rem;
      gap: 1rem;
      justify-content: flex-end;
      border-top: 1px solid rgba(128, 128, 128, 0.2);
      margin-top: 1.5rem;

      button {
        min-width: 120px;
        margin: 0 8px;
        font-weight: 500;
        
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

    // Mobile responsive
    @media (max-width: 600px) {
      .dialog-header,
      .contact-form,
      .dialog-actions {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
      }

      .dialog-actions {
        flex-direction: column;
        gap: 0.75rem;

        button {
          width: 100%;
          margin: 0;
          justify-content: center;
        }
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