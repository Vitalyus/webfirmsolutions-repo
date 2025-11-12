import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

export type Language = 'en' | 'ro' | 'fr' | 'es' | 'de' | 'uk';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  
  // Available languages
  private readonly supportedLanguages: Language[] = ['en', 'ro', 'fr', 'de', 'uk'];
  private readonly defaultLanguage: Language = 'en';
  
  // Current language state
  private readonly currentLanguageSignal = signal<Language>(this.defaultLanguage);
  private readonly translationsSignal = signal<TranslationData>({});
  private readonly isLoadingSignal = signal<boolean>(false);
  
  // Public computed properties
  public readonly currentLanguage = computed(() => this.currentLanguageSignal());
  public readonly translations = computed(() => this.translationsSignal());
  public readonly isLoading = computed(() => this.isLoadingSignal());
  
  // Legacy observable support for components not using signals
  private readonly currentLanguageSubject = new BehaviorSubject<Language>(this.defaultLanguage);
  public readonly currentLanguage$ = this.currentLanguageSubject.asObservable();
  
  constructor() {
    // Load default language on initialization
    console.log('TranslationService: Constructor called');
    const targetLanguage = this.getStoredLanguage() || this.defaultLanguage;
    console.log('TranslationService: Target language:', targetLanguage);
    
    // Subscribe to the observable to actually trigger the HTTP request
    this.loadLanguage(targetLanguage).subscribe({
      next: (success) => {
        console.log('TranslationService: Loading completed, success:', success);
      },
      error: (error) => {
        console.error('TranslationService: Loading failed:', error);
      }
    });
  }

  /**
   * Get translation for a key with optional parameters
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslationByKey(key);
    
    if (!params) {
      return translation;
    }
    
    // Replace parameters in the format {{param}}
    return Object.keys(params).reduce((text, param) => {
      return text.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
    }, translation);
  }

  /**
   * Get translation by key path (e.g., 'navigation.home')
   */
  private getTranslationByKey(keyPath: string): string {
    const keys = keyPath.split('.');
    let current: any = this.translationsSignal();
    
    // If translations are not loaded yet, return a user-friendly fallback
    if (!current || Object.keys(current).length === 0) {
      console.log(`Translations not loaded yet for: ${keyPath}`);
      return this.getFallbackText(keyPath);
    }
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`Translation key not found: ${keyPath}`);
        return this.getFallbackText(keyPath);
      }
    }
    
    return typeof current === 'string' ? current : this.getFallbackText(keyPath);
  }

  /**
   * Get fallback text for missing translation keys
   */
  private getFallbackText(keyPath: string): string {
    const fallbackMap: Record<string, string> = {
      'navigation.menu': 'Main navigation',
      'navigation.services': 'Services',
      'navigation.about': 'About Us',
      'navigation.contact': 'Contact',
      'common.language': 'Change Language',
      'footer.copyright': '© {{year}} Web Firm Solutions. All rights reserved.',
      'footer.websiteAriaLabel': 'Visit our website at webfirmsolutions.com',
      'contact.title': 'Let\'s Work Together',
      'contact.subtitle': 'Ready to transform your ideas into reality?',
      'hero.title': 'Transform Your Ideas into',
      'hero.titleAccent': 'Ultra Interactive',
      'hero.titleEnd': 'Web Experiences',
      'hero.subtitle': 'With 20+ years of international experience, we craft interactive, SEO-optimized websites that elevate visibility and conversions. Specialized in Angular, React, and modern web technologies.',
      'hero.seoContent': 'Professional web design and frontend development services. Expert in responsive design, user experience optimization, and modern web technologies. Serving clients worldwide with premium web development solutions.',
      'hero.ctaButton': 'Let\'s Get Started',
      'hero.secondaryButton': 'View Our Work',
      'hero.ctaAriaLabel': 'Contact us to get started with your project',
      'hero.secondaryAriaLabel': 'View our services and portfolio',
      'hero.features.performance.title': 'Fast Performance',
      'hero.features.performance.description': 'Lightning-fast loading times',
      'hero.features.mobile.title': 'Mobile First',
      'hero.features.mobile.description': 'Responsive across all devices',
      'hero.features.seo.title': 'SEO Optimized',
      'hero.features.seo.description': 'Built for search engines',
      'services.title': 'Our Premium Services',
      'services.subtitle': 'We deliver cutting-edge solutions tailored to your business needs',
      'services.learnMore': 'Learn More',
      'services.learnMoreAbout': 'Learn more about',
      'services.web-design-ux-ui.title': 'Web Design & UX/UI',
      'services.web-design-ux-ui.description': 'Intuitive, visually stunning designs that delight users and drive higher conversion rates across devices.',
      'services.advanced-frontend-development.title': 'Advanced Frontend Development',
      'services.advanced-frontend-development.description': 'High-performance web apps with React, Angular, Vue, or Vanilla JS, fully optimized for SEO and speed.',
      'services.technical-consulting-seo.title': 'Technical Consulting & SEO',
      'services.technical-consulting-seo.description': 'Scalable, secure, and high-performing strategies to maximize business impact and search engine visibility.',
      'about.title': 'About Us',
      'about.teamImage': 'Our Team',
      'about.professionalExcellence': 'Professional Excellence',
      'about.ourApproach': 'Our Approach',
      'about.startupReady': 'Startup Ready',
      'about.description1': 'We are a team of frontend experts with international experience, having worked at Google, Amazon, and Facebook. We turn complex ideas into elegant, efficient web solutions.',
      'about.description2': 'Every project gets a personalized approach focused on users and performance, delivering measurable results for our clients.',
      'about.stats.projects': 'Projects',
      'about.stats.clients': 'Clients',
      'about.stats.satisfaction': 'Satisfaction',
      'about.whyChooseUs.title': 'Why Choose Us',
      'about.whyChooseUs.modernTech': 'Modern Tech Stack',
      'about.whyChooseUs.seoOptimized': 'SEO Optimized',
      'about.whyChooseUs.fastDelivery': 'Fast Delivery',
      'about.whyChooseUs.support247': '24/7 Support',
      'about.quote.text': 'Transforming startup ideas into stunning web experiences',
      'about.quote.author': 'WebFirm Team',
      'about.quote.role': 'Frontend Experts',
      'whyChooseUs.title': 'Why Choose Us',
      'whyChooseUs.experience.label': 'Projects Completed',
      'whyChooseUs.projects.label': 'Happy Clients',
      'whyChooseUs.satisfaction.label': 'Client Satisfaction',
      'whyChooseUs.features.fast.title': 'Lightning Fast',
      'whyChooseUs.features.fast.description': 'Optimized for speed and performance',
      'whyChooseUs.features.modern.title': 'Modern Design',
      'whyChooseUs.features.modern.description': 'Beautiful, contemporary interfaces',
      'whyChooseUs.features.secure.title': 'Secure & Reliable',
      'whyChooseUs.features.secure.description': 'Built with security best practices',
      'whyChooseUs.features.responsive.title': 'Fully Responsive',
      'whyChooseUs.features.responsive.description': 'Perfect on all devices',
      'technologies.title': 'Technologies We Use',
      'technologies.subtitle': 'Modern tools for powerful solutions',
      'technologies.angular.description': 'Enterprise-grade framework for scalable applications',
      'technologies.react.description': 'Dynamic and flexible UI library',
      'technologies.typescript.description': 'Type-safe JavaScript for reliable code',
      'technologies.nodejs.description': 'Server-side JavaScript runtime',
      'technologies.wordpress.description': 'Powerful CMS for content-driven sites',
      'technologies.mongodb.description': 'Flexible NoSQL database',
      'portfolio.title': 'Our Work',
      'portfolio.subtitle': 'Stunning websites for startups and businesses',
      'portfolio.categories.all': 'All Projects',
      'portfolio.categories.web': 'Websites',
      'portfolio.categories.ecommerce': 'E-Commerce',
      'portfolio.categories.landing': 'Landing Pages',
      'portfolio.projects.ecommerce.title': 'E-Commerce Platform',
      'portfolio.projects.ecommerce.description': 'Full-featured online store with payment integration',
      'portfolio.projects.corporate.title': 'Corporate Website',
      'portfolio.projects.corporate.description': 'Professional business presentation site',
      'portfolio.projects.startup.title': 'Startup Landing Page',
      'portfolio.projects.startup.description': 'Modern landing page for tech startup',
      'portfolio.projects.restaurant.title': 'Restaurant Website',
      'portfolio.projects.restaurant.description': 'Beautiful site with online reservations',
      'portfolio.projects.saas.title': 'SaaS Dashboard',
      'portfolio.projects.saas.description': 'Advanced web application with analytics',
      'portfolio.projects.blog.title': 'Blog Platform',
      'portfolio.projects.blog.description': 'Content management system with SEO'
    };
    
    return fallbackMap[keyPath] || keyPath;
  }

  /**
   * Change the current language
   */
  setLanguage(language: Language): Observable<boolean> {
    if (!this.supportedLanguages.includes(language)) {
      console.error(`Language ${language} is not supported`);
      return of(false);
    }
    
    if (language === this.currentLanguageSignal()) {
      return of(true); // Already loaded
    }
    
    return this.loadLanguage(language);
  }

  /**
   * Load translations for a specific language
   */
  private loadLanguage(language: Language): Observable<boolean> {
    this.isLoadingSignal.set(true);
    console.log(`TranslationService: Loading ${language}.json from /assets/i18n/${language}.json`);
    
    return this.http.get<TranslationData>(`/assets/i18n/${language}.json`)
      .pipe(
        tap(translations => {
          console.log(`TranslationService: HTTP request successful for ${language}`, translations);
          this.translationsSignal.set(translations);
          this.currentLanguageSignal.set(language);
          this.currentLanguageSubject.next(language);
          this.storeLanguage(language);
          this.isLoadingSignal.set(false);
          
          console.log(`TranslationService: Loaded translations for ${language}`, Object.keys(translations));
        }),
        catchError(error => {
          console.error(`TranslationService: HTTP request failed for ${language}:`, error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          this.isLoadingSignal.set(false);
          
          // Fallback to default language if it's different
          if (language !== this.defaultLanguage) {
            console.log(`TranslationService: Falling back to default language: ${this.defaultLanguage}`);
            return this.loadLanguage(this.defaultLanguage);
          }
          
          console.error('TranslationService: No fallback available, using empty translations');
          return of(false);
        }),
        tap(() => {}),
        // Convert to boolean result
        switchMap(() => of(true))
      );
  }

  /**
   * Get available languages
   */
  getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): language is Language {
    return this.supportedLanguages.includes(language as Language);
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language: Language): string {
    const displayNames: Record<Language, string> = {
      en: 'English',
      ro: 'Română',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch',
      uk: 'Українська'
    };
    
    return displayNames[language] || language;
  }

  /**
   * Get browser language preference
   */
  getBrowserLanguage(): Language | null {
    if (typeof navigator === 'undefined') {
      return null;
    }
    
    const browserLang = navigator.language.split('-')[0] as Language;
    return this.isLanguageSupported(browserLang) ? browserLang : null;
  }

  /**
   * Store language preference in localStorage
   */
  private storeLanguage(language: Language): void {
    try {
      localStorage.setItem('webfirm_language', language);
    } catch (error) {
      console.warn('Failed to store language preference:', error);
    }
  }

  /**
   * Get stored language preference
   */
  private getStoredLanguage(): Language | null {
    try {
      const stored = localStorage.getItem('webfirm_language');
      return stored && this.isLanguageSupported(stored) ? stored : null;
    } catch (error) {
      console.warn('Failed to get stored language preference:', error);
      return null;
    }
  }

  /**
   * Auto-detect and set the best language
   */
  autoDetectLanguage(): Observable<boolean> {
    const storedLang = this.getStoredLanguage();
    const browserLang = this.getBrowserLanguage();
    
    const preferredLang = storedLang || browserLang || this.defaultLanguage;
    
    return this.setLanguage(preferredLang);
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): Language {
    return this.currentLanguageSignal();
  }

  /**
   * Check if translations are loaded
   */
  areTranslationsLoaded(): boolean {
    return Object.keys(this.translationsSignal()).length > 0;
  }

  /**
   * Get all translations for current language (for debugging)
   */
  getAllTranslations(): TranslationData {
    return this.translationsSignal();
  }

  /**
   * Preload multiple languages
   */
  preloadLanguages(languages: Language[]): Observable<boolean[]> {
    const loadPromises = languages
      .filter(lang => this.supportedLanguages.includes(lang))
      .map(lang => this.loadLanguage(lang));
    
    return new Observable(observer => {
      Promise.all(loadPromises.map(obs => obs.toPromise()))
        .then(results => {
          observer.next(results as boolean[]);
          observer.complete();
        })
        .catch(error => {
          console.error('Failed to preload languages:', error);
          observer.error(error);
        });
    });
  }
}