import { 
  Component, 
  ElementRef, 
  OnInit, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { ContactFormData, CaptchaChallenge } from '../../shared/interfaces';
import { CaptchaService } from '../../services/captcha.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    HttpClientModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly captchaService = inject(CaptchaService);

  contactForm: FormGroup;
  isModalOpen = false;
  isSubmitting = false;
  captchaChallenge: CaptchaChallenge | null = null;
  honeypotField = '';

  // Legacy formData property for template compatibility
  formData = {
    name: '',
    email: '',
    message: '',
    captcha: ''
  };

  constructor() {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      captcha: ['', [Validators.required]]
    });
    
    // Generate initial captcha challenge
    this.generateNewCaptcha();
  }

  ngOnInit(): void {
    this.initScrollAnimation();
  }

  private initScrollAnimation(): void {
    try {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate');
            }
          });
        },
        { threshold: 0.1 }
      );

      setTimeout(() => {
        const contactCard = this.elementRef.nativeElement?.querySelector('.contact-card');
        if (contactCard) {
          observer.observe(contactCard);
        }
      }, 100);
    } catch (error) {
      console.warn('Contact animation initialization failed:', error);
    }
  }

  openModal(): void {
    this.isModalOpen = true;
    this.generateNewCaptcha();
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.markForCheck();
  }

  onModalBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onSubmit(): void {
    try {
      // Check honeypot field for bot detection
      if (this.honeypotField && this.honeypotField.trim() !== '') {
        console.warn('Bot detected via honeypot field');
        return;
      }
      
      // Validate captcha
      if (!this.captchaChallenge || !this.formData.captcha || 
          !this.captchaService.validateAnswer(this.formData.captcha, this.captchaChallenge.id)) {
        this.snackBar.open(
          'Please solve the captcha correctly.',
          '⚠️',
          {
            duration: 3000,
            panelClass: ['warning-snackbar']
          }
        );
        this.generateNewCaptcha();
        return;
      }

      if (this.formData.name && this.formData.email && this.formData.message) {
        this.isSubmitting = true;
        this.cdr.markForCheck();
        
        // Submit message via MessageService
        this.messageService.submitMessage(this.formData, this.captchaChallenge?.id).subscribe({
          next: (response) => {
            console.log('Message submitted successfully:', response);
            
            // Reset form
            this.formData = { name: '', email: '', message: '', captcha: '' };
            this.isSubmitting = false;
            this.closeModal();
            
            this.snackBar.open(
              'Message sent successfully! We\'ll get back to you soon.', 
              '✓', 
              {
                duration: 5000,
                panelClass: ['success-snackbar'],
                horizontalPosition: 'right',
                verticalPosition: 'top'
              }
            );
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Message submission failed:', error);
            this.isSubmitting = false;
            this.generateNewCaptcha(); // Generate new captcha on error
            this.cdr.markForCheck();
            
            this.snackBar.open(
              'Failed to send message. Please try again or contact us directly.',
              '❌',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
          }
        });
      } else {
        this.snackBar.open(
          'Please fill in all required fields.',
          '⚠️',
          {
            duration: 3000,
            panelClass: ['warning-snackbar']
          }
        );
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.isSubmitting = false;
      this.cdr.markForCheck();
      
      this.snackBar.open(
        'An error occurred. Please try again.',
        '❌',
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  openContactDialog(): void {
    console.log('Opening contact modal...');
    this.openModal();
  }

  generateNewCaptcha(): void {
    this.captchaChallenge = this.captchaService.generateChallenge();
    this.formData.captcha = ''; // Clear previous answer
    this.cdr.markForCheck();
  }

  refreshCaptcha(): void {
    this.generateNewCaptcha();
  }
}