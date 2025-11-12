import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { AdminComponent } from './components/admin/admin.component';
import { SEOService } from './services/seo.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    AdminComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Web Firm Solutions';
  
  private readonly seoService = inject(SEOService);
  private readonly translationService = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  
  showAdminPanel = false;
  isAdminRoute = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTranslations();
      this.setupPerformanceMonitoring();
      this.setupAdminPanelShortcut();
      this.setupLanguageBasedSEO();
    }
    
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAdminRoute = event.urlAfterRedirects.includes('/admin');
        
        // Update SEO on route change
        const currentLang = this.translationService.getCurrentLanguage();
        this.seoService.updateSEOForLanguage(currentLang, event.urlAfterRedirects);
      });
      
    // Check initial route
    this.isAdminRoute = this.router.url.includes('/admin');
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private async initializeTranslations(): Promise<void> {
    // First, try to auto-detect language based on user's country
    await this.translationService.detectAndSetLanguageByCountry();
    
    // Then get the current language (either auto-detected or from browser/default)
    const currentLang = this.translationService.getCurrentLanguage();
    console.log('Initializing translation system with language:', currentLang);
    
    // Wait for translations to load before showing the app
    this.translationService.setLanguage(currentLang).subscribe({
      next: (success) => {
        if (success) {
          console.log('Translations loaded successfully');
          console.log('Current language:', this.translationService.currentLanguage());
          console.log('Test translation:', this.translationService.translate('contact.title'));
          console.log('Available translations:', this.translationService.translations());
          
          // Initialize SEO after translations are loaded
          this.seoService.updateSEOForLanguage(currentLang, this.router.url);
        } else {
          console.error('Failed to load translations');
        }
      },
      error: (error) => {
        console.error('Error loading translations:', error);
      }
    });
  }

  private setupLanguageBasedSEO(): void {
    // Subscribe to language changes
    this.translationService.currentLanguage$.subscribe(lang => {
      if (lang) {
        console.log('Language changed to:', lang);
        // Update SEO when language changes
        this.seoService.updateSEOForLanguage(lang, this.router.url);
      }
    });
  }

  private initializeSEO(): void {
    // Deprecated: SEO now initialized in setupLanguageBasedSEO
    // Kept for backward compatibility but does nothing
  }

  private setupPerformanceMonitoring(): void {
    // Track Core Web Vitals
    this.seoService.trackCoreWebVitals();

    // Preload critical resources
    this.seoService.preloadResource('/assets/hero-bg.jpg', 'image');
    this.seoService.preloadResource('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap', 'style');

    // Setup intersection observer for lazy loading
    this.setupLazyLoading();
  }

  private setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset['src']) {
              img.src = img.dataset['src'];
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });

      // Observe lazy images after view init
      setTimeout(() => {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => imageObserver.observe(img));
      }, 0);
    }
  }

  private setupAdminPanelShortcut(): void {
    // Admin panel shortcut: Ctrl+Shift+A (or Cmd+Shift+A on Mac)
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        this.toggleAdminPanel();
      }
    });
  }

  toggleAdminPanel(): void {
    this.showAdminPanel = !this.showAdminPanel;
  }

  closeAdminPanel(): void {
    this.showAdminPanel = false;
  }
}