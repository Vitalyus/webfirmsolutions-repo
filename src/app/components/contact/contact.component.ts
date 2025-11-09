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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientModule } from '@angular/common/http';
import { ContactFormData, CaptchaChallenge } from '../../shared/interfaces';
import { CaptchaService } from '../../services/captcha.service';
import { MessageService } from '../../services/message.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ToastService } from '../../shared/toast.service';

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
    HttpClientModule,
    TranslatePipe
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly captchaService = inject(CaptchaService);
  private readonly translationService = inject(TranslationService);

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
      
      // Validate captcha - ensure we have valid data
      const captchaAnswer = this.formData.captcha ? String(this.formData.captcha).trim() : '';
      if (!this.captchaChallenge || !captchaAnswer || 
          !this.captchaService.validateAnswer(captchaAnswer, this.captchaChallenge.id)) {
        this.toastService.warning(
          this.translationService.translate('contact.validation.captchaIncorrect')
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
            
            this.toastService.success(
              this.translationService.translate('contact.modal.success')
            );
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Message submission failed:', error);
            this.isSubmitting = false;
            this.generateNewCaptcha(); // Generate new captcha on error
            this.cdr.markForCheck();
            
            this.toastService.error(
              this.translationService.translate('contact.modal.error')
            );
          }
        });
      } else {
        this.toastService.warning(
          this.translationService.translate('contact.validation.allRequired')
        );
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.isSubmitting = false;
      this.cdr.markForCheck();
      
      this.toastService.error(
        this.translationService.translate('contact.modal.error')
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

  // Translation helper methods
  get translations() {
    return {
      title: this.translationService.translate('contact.title'),
      subtitle: this.translationService.translate('contact.subtitle'),
      emailUs: this.translationService.translate('contact.emailUs'),
      responseTime: this.translationService.translate('contact.responseTime'),
      within24Hours: this.translationService.translate('contact.within24Hours'),
      basedIn: this.translationService.translate('contact.basedIn'),
      availableWorldwide: this.translationService.translate('contact.availableWorldwide'),
      sendMessage: this.translationService.translate('contact.sendMessage'),
      scheduleCall: this.translationService.translate('contact.scheduleCall'),
      modal: {
        title: this.translationService.translate('contact.modal.title'),
        name: this.translationService.translate('contact.modal.name'),
        namePlaceholder: this.translationService.translate('contact.modal.namePlaceholder'),
        email: this.translationService.translate('contact.modal.email'),
        emailPlaceholder: this.translationService.translate('contact.modal.emailPlaceholder'),
        message: this.translationService.translate('contact.modal.message'),
        messagePlaceholder: this.translationService.translate('contact.modal.messagePlaceholder'),
        sendMessage: this.translationService.translate('contact.modal.sendMessage'),
        sending: this.translationService.translate('contact.modal.sending'),
        captcha: {
          answer: this.translationService.translate('contact.modal.captcha.answer'),
          placeholder: this.translationService.translate('contact.modal.captcha.placeholder')
        }
      },
      common: {
        cancel: this.translationService.translate('common.cancel')
      }
    };
  }
}