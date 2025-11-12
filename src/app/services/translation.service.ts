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
  
  // Country to language mapping
  private readonly countryToLanguage: Record<string, Language> = {
    'RO': 'ro', 'MD': 'ro', // Romania, Moldova
    'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'CA': 'fr', 'LU': 'fr', // French-speaking countries
    'DE': 'de', 'AT': 'de', // Germany, Austria
    'UA': 'uk', // Ukraine
    'US': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en' // English-speaking
  };
  
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
    // Check localStorage first (user preference takes priority)
    const savedLang = this.getStoredLanguage();
    if (savedLang) {
      return savedLang;
    }
    
    // Check if auto-detection already happened in this session
    if (typeof window !== 'undefined') {
      const autoDetected = sessionStorage.getItem('autoDetectedLanguage');
      if (autoDetected && this.isLanguageSupported(autoDetected)) {
        return autoDetected as Language;
      }
    }
    
    // Fallback to browser language
    const browserLang = this.getBrowserLanguage();
    if (browserLang) {
      return browserLang;
    }
    
    return this.defaultLanguage;
  }

  /**
   * Check if running in browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Detect user's country and set appropriate language
   */
  async detectAndSetLanguageByCountry(): Promise<void> {
    if (!this.isBrowser()) return;
    
    // Don't auto-detect if user already has a saved preference
    const savedLang = this.getStoredLanguage();
    if (savedLang) {
      console.log('User has saved language preference:', savedLang);
      return;
    }
    
    // Check if already detected in this session
    const autoDetected = sessionStorage.getItem('autoDetectedLanguage');
    if (autoDetected) {
      console.log('Language already auto-detected in this session:', autoDetected);
      return;
    }

    try {
      console.log('Detecting user country for language...');
      
      // Try multiple geo-location APIs for reliability
      const countryCode = await this.detectCountry();
      
      if (countryCode) {
        console.log('Detected country code:', countryCode);
        
        const language = this.countryToLanguage[countryCode] || this.defaultLanguage;
        console.log('Setting language based on country:', language);
        
        // Save to sessionStorage (not localStorage, so user can change it)
        sessionStorage.setItem('autoDetectedLanguage', language);
        
        // Set the language
        this.setLanguage(language).subscribe({
          next: (success) => {
            if (success) {
              console.log('Successfully set language to:', language);
            }
          },
          error: (error) => {
            console.error('Error setting language:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error detecting country:', error);
      // Fallback to browser language detection
      const browserLang = this.getBrowserLanguage();
      if (browserLang) {
        sessionStorage.setItem('autoDetectedLanguage', browserLang);
        this.setLanguage(browserLang).subscribe();
      }
    }
  }

  /**
   * Detect country from IP using multiple APIs
   */
  private async detectCountry(): Promise<string | null> {
    // Try multiple APIs for better reliability
    const apis = [
      // API 1: ipapi.co (free, no key needed, 1000 req/day)
      {
        url: 'https://ipapi.co/json/',
        parser: (data: any) => data.country_code
      },
      // API 2: ip-api.com (free, no key needed, 45 req/minute)
      {
        url: 'http://ip-api.com/json/?fields=countryCode',
        parser: (data: any) => data.countryCode
      },
      // API 3: ipwhois.app (free, no key needed, 10000 req/month)
      {
        url: 'https://ipwhois.app/json/',
        parser: (data: any) => data.country_code
      }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = api.parser(data);
          
          if (countryCode) {
            console.log('Country detected from API:', countryCode);
            return countryCode;
          }
        }
      } catch (error) {
        console.warn('Failed to get country from API:', api.url, error);
        // Continue to next API
      }
    }

    // If all APIs fail, try to get from browser timezone as last resort
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Timezone detected:', timezone);
      
      // Simple timezone to country mapping for common cases
      const timezoneToCountry: Record<string, string> = {
        'Europe/Bucharest': 'RO',
        'Europe/Chisinau': 'MD',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Vienna': 'AT',
        'Europe/Kiev': 'UA',
        'Europe/Kyiv': 'UA',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Chicago': 'US',
        'Europe/London': 'GB'
      };
      
      return timezoneToCountry[timezone] || null;
    } catch (error) {
      console.error('Failed to detect from timezone:', error);
    }

    return null;
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