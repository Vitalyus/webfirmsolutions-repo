import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

export type Language = 'en' | 'ro' | 'fr' | 'es' | 'de';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  
  // Available languages
  private readonly supportedLanguages: Language[] = ['en', 'ro'];
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
      'about.description1': 'We are a team of frontend experts with international experience, having worked at Google, Amazon, and Facebook. We turn complex ideas into elegant, efficient web solutions.',
      'about.description2': 'Every project gets a personalized approach focused on users and performance, delivering measurable results for our clients.'
    };

    // If current language is Romanian, provide Romanian fallbacks
    if (this.currentLanguageSignal() === 'ro') {
      const roFallbackMap: Record<string, string> = {
        'navigation.menu': 'Navigare principală',
        'navigation.services': 'Servicii',
        'navigation.about': 'Despre Noi',
        'navigation.contact': 'Contact',
        'common.language': 'Schimbă Limba',
        'hero.title': 'Transformă-ți Ideile în',
        'hero.titleAccent': 'Experiențe Web Ultra Interactive',
        'hero.titleEnd': '',
        'hero.subtitle': 'Cu peste 20 de ani de experiență internațională, creăm site-uri web interactive, optimizate SEO, care cresc vizibilitatea și conversiile.',
        'services.title': 'Serviciile Noastre Premium',
        'services.subtitle': 'Oferim soluții de vârf adaptate nevoilor afacerii tale',
        'about.title': 'Despre Noi',
        'contact.title': 'Să Lucrăm Împreună',
        'footer.copyright': '© {{year}} Web Firm Solutions. Toate drepturile rezervate.'
      };
      return roFallbackMap[keyPath] || keyPath;
    }
    
    return fallbackMap[keyPath] || keyPath;
  }

  /**
   * Change the current language
   */
  setCurrentLanguage(language: string): void {
    console.log(`TranslationService: Setting language to ${language}`);
    
    if (this.isLanguageSupported(language)) {
      const typedLanguage = language as Language;
      localStorage.setItem('preferred-language', language);
      
      // Load translations first, then signals will automatically update
      this.loadLanguage(typedLanguage).subscribe(() => {
        console.log(`TranslationService: Language change completed for ${language}`);
      });
    } else {
      console.warn(`TranslationService: Language ${language} not supported`);
    }
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
      de: 'Deutsch'
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
    
    return this.loadLanguage(preferredLang);
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