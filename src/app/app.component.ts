import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
import { ServicesComponent } from './components/services/services.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './components/footer/footer.component';
import { SEOService } from './services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeroComponent,
    ServicesComponent,
    AboutComponent,
    ContactComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Web Firm Solutions';
  
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSEO();
      this.setupPerformanceMonitoring();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initializeSEO(): void {
    this.seoService.updateSEO({
      title: 'Web Firm Solutions - Premium Web Design & Frontend Development Services',
      description: 'Professional web design and frontend development services with 20+ years of experience. Specializing in Angular, React, and modern web technologies for exceptional user experiences.',
      keywords: 'web design, frontend development, UX/UI, SEO, technical consulting, Angular development, React development, responsive design, premium web services',
      image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=1200&q=80',
      url: 'https://webfirmsolutions.com/',
      type: 'website',
      author: 'Web Firm Solutions'
    });

    // Add breadcrumb for homepage
    this.seoService.addBreadcrumbStructuredData([
      { name: 'Home', url: 'https://webfirmsolutions.com/' }
    ]);
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
}