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
import { ContactFormData } from '../../shared/interfaces';

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
    MatSnackBarModule
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

  contactForm: FormGroup;
  isModalOpen = false;

  // Legacy formData property for template compatibility
  formData: ContactFormData = {
    name: '',
    email: '',
    message: ''
  };

  constructor() {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
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
      if (this.formData.name && this.formData.email && this.formData.message) {
        // Simulate form submission
        alert(`Thank you ${this.formData.name}! Your message has been sent.`);
        
        // Reset form
        this.formData = { name: '', email: '', message: '' };
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
}