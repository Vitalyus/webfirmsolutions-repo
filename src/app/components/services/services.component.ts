import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  inject,
  ElementRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Service, APP_CONFIG } from '../../shared/interfaces';
import { LoggingService } from '../../shared/logging.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesComponent implements OnInit, OnDestroy {
  // Modern Angular dependency injection
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly loggingService = inject(LoggingService);
  private readonly ngZone = inject(NgZone);

  // Component state management
  private isDestroyed = false;
  private isInitialized = false;

  readonly services: ReadonlyArray<Service> = [
    {
      id: 'web-design-ux-ui',
      title: 'Web Design & UX/UI',
      description: 'Intuitive, visually stunning designs that delight users and drive higher conversion rates across devices.',
      icon: 'design_services',
      color: 'primary'
    },
    {
      id: 'advanced-frontend-development',
      title: 'Advanced Frontend Development',
      description: 'High-performance web apps with React, Angular, Vue, or Vanilla JS, fully optimized for SEO and speed.',
      icon: 'code',
      color: 'accent'
    },
    {
      id: 'technical-consulting-seo',
      title: 'Technical Consulting & SEO',
      description: 'Scalable, secure, and high-performing strategies to maximize business impact and search engine visibility.',
      icon: 'analytics',
      color: 'warn'
    }
  ];

  private intersectionObserver?: IntersectionObserver;
  private visibleCards = new Set<string>();

  constructor() {}

  ngOnInit(): void {
    try {
      this.loggingService.debug('ServicesComponent initializing', {}, 'ServicesComponent');
      this.initializeIntersectionObserver();
      this.isInitialized = true;
    } catch (error) {
      this.loggingService.error(
        'ServicesComponent initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'ServicesComponent'
      );
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.cleanupIntersectionObserver();
    this.loggingService.debug('ServicesComponent destroyed', {}, 'ServicesComponent');
  }

  /**
   * Initialize IntersectionObserver with enterprise-grade error handling
   * @private
   */
  private initializeIntersectionObserver(): void {
    try {
      if (!('IntersectionObserver' in window)) {
        this.loggingService.warn('IntersectionObserver not supported, skipping animations', {}, 'ServicesComponent');
        return;
      }

      this.intersectionObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          threshold: APP_CONFIG.ui.formValidation.emailPattern ? 0.1 : 0.1, // Use config or fallback
          rootMargin: '50px 0px -50px 0px'
        }
      );

      // Use setTimeout to ensure DOM is ready, but run outside Angular zone
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.observeServiceCards();
          }
        }, 100);
      });

      this.loggingService.debug('IntersectionObserver initialized successfully', {}, 'ServicesComponent');
    } catch (error) {
      this.loggingService.error(
        'IntersectionObserver initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'ServicesComponent'
      );
    }
  }

  /**
   * Observe service cards for intersection animations
   * @private
   */
  private observeServiceCards(): void {
    try {
      const cards = this.elementRef.nativeElement.querySelectorAll('.service-card');
      
      if (cards.length === 0) {
        this.loggingService.warn('No service cards found to observe', {}, 'ServicesComponent');
        return;
      }

      cards.forEach((card: Element, index: number) => {
        if (this.intersectionObserver && card instanceof HTMLElement) {
          // Add service ID as data attribute for tracking
          const serviceId = this.services[index]?.id || `service-${index}`;
          card.setAttribute('data-service-id', serviceId);
          
          this.intersectionObserver.observe(card);
        }
      });

      this.loggingService.debug(`Observing ${cards.length} service cards`, {}, 'ServicesComponent');
    } catch (error) {
      this.loggingService.error(
        'Failed to observe service cards',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'ServicesComponent'
      );
    }
  }

  /**
   * Handle intersection observer entries with performance optimization
   * @private
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    try {
      let hasChanges = false;

      entries.forEach((entry: IntersectionObserverEntry) => {
        const cardId = entry.target.getAttribute('data-service-id');
        if (!cardId) {
          this.loggingService.warn('Service card missing data-service-id attribute', {}, 'ServicesComponent');
          return;
        }

        const wasVisible = this.visibleCards.has(cardId);
        const isVisible = entry.isIntersecting;

        if (wasVisible !== isVisible) {
          hasChanges = true;
          
          if (isVisible) {
            this.visibleCards.add(cardId);
            entry.target.classList.add('animate-in');
            this.loggingService.debug(`Service card "${cardId}" became visible`, {}, 'ServicesComponent');
          } else {
            this.visibleCards.delete(cardId);
            entry.target.classList.remove('animate-in');
            this.loggingService.debug(`Service card "${cardId}" became hidden`, {}, 'ServicesComponent');
          }
        }
      });

      // Only trigger change detection if there were actual changes
      if (hasChanges && !this.isDestroyed) {
        this.ngZone.run(() => {
          this.cdr.markForCheck();
        });
      }
    } catch (error) {
      this.loggingService.error(
        'Intersection handling error',
        error instanceof Error ? error : new Error(String(error)),
        { entriesCount: entries.length },
        'ServicesComponent'
      );
    }
  }

  /**
   * Clean up intersection observer and related resources
   * @private
   */
  private cleanupIntersectionObserver(): void {
    try {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = undefined;
        this.loggingService.debug('IntersectionObserver disconnected', {}, 'ServicesComponent');
      }
      
      this.visibleCards.clear();
    } catch (error) {
      this.loggingService.error(
        'IntersectionObserver cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'ServicesComponent'
      );
    }
  }

  isCardVisible(serviceId: string): boolean {
    return this.visibleCards.has(serviceId);
  }

  trackByServiceId(index: number, service: Service): string {
    return service.id;
  }

  /**
   * Handle service card click with analytics and navigation
   */
  onServiceClick(service: Service): void {
    try {
      this.loggingService.trackUserAction(
        'service-click', 
        `service-${service.id}`, 
        'ServicesComponent'
      );
      
      this.loggingService.info(
        'Service clicked', 
        { 
          serviceId: service.id, 
          serviceTitle: service.title,
          category: service.category 
        }, 
        'ServicesComponent'
      );
      
      // In a real application, this might navigate to a detailed service page
      // or open a modal with more information
      // this.router.navigate(['/services', service.id]);
      
    } catch (error) {
      this.loggingService.error(
        'Service click handler error',
        error instanceof Error ? error : new Error(String(error)),
        { serviceId: service.id },
        'ServicesComponent'
      );
    }
  }
}