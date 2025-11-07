import { 
  Component, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  inject,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Feature, APP_CONFIG } from '../../shared/interfaces';
import { ScrollService } from '../../shared/scroll.service';
import { LoggingService } from '../../shared/logging.service';
import { PerformanceService } from '../../shared/performance.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TranslatePipe
  ],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  // Service injection following modern Angular patterns
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly scrollService = inject(ScrollService);
  private readonly loggingService = inject(LoggingService);
  private readonly performanceService = inject(PerformanceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  
  // Memory management and lifecycle tracking
  private animationFrame?: number;
  private scrollHandler?: EventListener;
  private resizeHandler?: EventListener;
  private isDestroyed = false;
  private isInitialized = false;

  // Immutable feature data with enhanced typing
  readonly features: ReadonlyArray<Feature> = [
    {
      id: 'performance',
      icon: 'speed',
      title: 'Fast Performance',
      description: 'Lightning-fast loading times',
      order: 1,
      isHighlighted: true
    },
    {
      id: 'mobile',
      icon: 'mobile_friendly',
      title: 'Mobile First',
      description: 'Responsive across all devices',
      order: 2,
      isHighlighted: false
    },
    {
      id: 'seo',
      icon: 'search',
      title: 'SEO Optimized',
      description: 'Built for search engines',
      order: 3,
      isHighlighted: true
    }
  ] as const;

  // Configuration constants
  private readonly PARALLAX_SPEED = 0.5;
  private readonly THROTTLE_DELAY = 16; // ~60fps
  private readonly INTERSECTION_THRESHOLD = 0.1;

  ngOnInit(): void {
    try {
      this.loggingService.debug('HeroComponent initializing', {}, 'HeroComponent');
      this.initParallaxEffect();
      this.initResizeHandler();
      this.isInitialized = true;
    } catch (error) {
      this.loggingService.error(
        'Failed to initialize HeroComponent',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  ngAfterViewInit(): void {
    // Use RAF for better performance and avoid change detection issues
    this.ngZone.runOutsideAngular(() => {
      this.animationFrame = requestAnimationFrame(() => {
        this.initAnimations();
      });
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.cleanupResources();
    this.loggingService.debug('HeroComponent destroyed', {}, 'HeroComponent');
  }

  /**
   * Initialize animations with proper error handling and performance monitoring
   * @private
   */
  private initAnimations(): void {
    if (this.isDestroyed || !this.isInitialized) return;
    
    try {
      const heroContent = this.elementRef.nativeElement?.querySelector('.hero-content');
      
      if (heroContent) {
        // First add initial class for animation setup
        heroContent.classList.add('initial');
        
        // Use performance service to measure animation time
        this.performanceService.measureExecutionTime(() => {
          // Use RAF for smooth animation outside Angular zone
          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => {
              heroContent.classList.remove('initial');
              heroContent.classList.add('animate');
            });
          });
        }, 'hero-animation-init', 'HeroComponent');
        
        this.loggingService.debug('Hero animation initialized successfully', {}, 'HeroComponent');
      } else {
        this.loggingService.warn('Hero content element not found for animation', {}, 'HeroComponent');
      }
    } catch (error) {
      this.loggingService.error(
        'Animation initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * Initialize parallax scrolling effect with throttling and error handling
   * @private
   */
  private initParallaxEffect(): void {
    try {
      // Create throttled scroll handler outside Angular zone for performance
      this.scrollHandler = this.createThrottledScrollHandler();
      
      // Use passive listener for better scroll performance
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('scroll', this.scrollHandler as EventListener, { 
          passive: true 
        });
      });
      
      this.loggingService.debug('Parallax effect initialized', {}, 'HeroComponent');
    } catch (error) {
      this.loggingService.error(
        'Parallax effect initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * Initialize resize handler for responsive behavior
   * @private
   */
  private initResizeHandler(): void {
    try {
      this.resizeHandler = this.throttle(() => {
        if (this.isDestroyed) return;
        
        // Handle responsive behavior
        this.handleResize();
      }, this.THROTTLE_DELAY);

      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('resize', this.resizeHandler as EventListener, {
          passive: true
        });
      });
    } catch (error) {
      this.loggingService.error(
        'Resize handler initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * Clean up all resources and event listeners
   * @private
   */
  private cleanupResources(): void {
    try {
      // Cancel any pending animation frames
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = undefined;
      }

      // Remove event listeners
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler as EventListener);
        this.scrollHandler = undefined;
      }

      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler as EventListener);
        this.resizeHandler = undefined;
      }

      this.loggingService.debug('Resources cleaned up successfully', {}, 'HeroComponent');
    } catch (error) {
      this.loggingService.error(
        'Resource cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * Create throttled scroll handler for parallax effect
   * @private
   */
  private createThrottledScrollHandler(): () => void {
    return this.throttle(() => {
      if (this.isDestroyed || !this.isInitialized) return;
      
      try {
        const scrolled = window.scrollY;
        const parallaxElement = this.elementRef.nativeElement?.querySelector('.hero-background');
        
        if (parallaxElement instanceof HTMLElement) {
          const speed = scrolled * this.PARALLAX_SPEED;
          parallaxElement.style.transform = `translateY(${speed}px)`;
        }
      } catch (error) {
        this.loggingService.error(
          'Parallax scroll handler error',
          error instanceof Error ? error : new Error(String(error)),
          { scrollY: window.scrollY },
          'HeroComponent'
        );
      }
    }, this.THROTTLE_DELAY);
  }

  /**
   * Handle window resize events
   * @private
   */
  private handleResize(): void {
    try {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      this.loggingService.debug('Viewport resized', viewport, 'HeroComponent');
      
      // Force change detection if needed
      if (!this.isDestroyed) {
        this.ngZone.run(() => {
          this.cdr.markForCheck();
        });
      }
    } catch (error) {
      this.loggingService.error(
        'Resize handler error',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * High-performance throttle implementation
   * @private
   */
  private throttle(func: Function, delay: number): () => void {
    let timeoutId: number | undefined;
    let lastExecTime = 0;
    
    return () => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func();
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
          func();
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Handle contact button click with analytics tracking
   */
  onContactClick(): void {
    try {
      this.loggingService.trackUserAction('contact-click', 'hero-cta-button', 'HeroComponent');
      
      const success = this.scrollService.scrollToElement('#contact');
      if (success) {
        this.loggingService.info('Contact navigation successful', { source: 'hero' }, 'HeroComponent');
      } else {
        this.loggingService.warn('Contact navigation failed', { source: 'hero' }, 'HeroComponent');
      }
    } catch (error) {
      this.loggingService.error(
        'Contact click handler error',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  /**
   * Handle view work button click with analytics tracking
   */
  onViewWorkClick(): void {
    try {
      this.loggingService.trackUserAction('view-work-click', 'hero-secondary-button', 'HeroComponent');
      
      const success = this.scrollService.scrollToElement('#services');
      if (success) {
        this.loggingService.info('Services navigation successful', { source: 'hero' }, 'HeroComponent');
      } else {
        this.loggingService.warn('Services navigation failed', { source: 'hero' }, 'HeroComponent');
      }
    } catch (error) {
      this.loggingService.error(
        'View work click handler error',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'HeroComponent'
      );
    }
  }

  trackByFeatureId(index: number, feature: Feature): string {
    return feature.id;
  }
}