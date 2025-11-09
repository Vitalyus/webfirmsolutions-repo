import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

export type Language = 'en' | 'ro' | 'uk' | 'fr' | 'es' | 'de';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  
  // Available languages
  private readonly supportedLanguages: Language[] = ['en', 'ro', 'uk', 'de', 'fr'];
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
    
    // Detect user's language based on browser/location
    const detectedLanguage = this.detectUserLanguage();
    const storedLanguage = this.getStoredLanguage();
    
    // Priority: stored language only if it exists AND matches detected language region
    // Otherwise use detected language (first visit or different region)
    let targetLanguage: Language;
    
    if (storedLanguage) {
      // If user manually selected a language before, respect it
      targetLanguage = storedLanguage;
      console.log('TranslationService: Using stored language:', storedLanguage);
    } else {
      // First visit - use detected language
      targetLanguage = detectedLanguage;
      console.log('TranslationService: First visit - using detected language:', detectedLanguage);
    }
    
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
   * Detect user's preferred language based on browser settings
   */
  private detectUserLanguage(): Language {
    if (typeof window === 'undefined' || !window.navigator) {
      console.log('TranslationService: No window/navigator, using default');
      return this.defaultLanguage;
    }

    // Get browser language (e.g., 'en-US', 'ro-RO', 'uk-UA')
    const browserLang = window.navigator.language || (window.navigator as any).userLanguage;
    
    console.log('TranslationService: Browser language:', browserLang);
    
    if (!browserLang) {
      console.log('TranslationService: No browser language detected');
      return this.defaultLanguage;
    }

    // Extract language code (first 2 characters)
    const langCode = browserLang.toLowerCase().substring(0, 2);
    
    console.log('TranslationService: Extracted language code:', langCode);
    
    // Map language codes to supported languages
    const languageMap: Record<string, Language> = {
      'en': 'en', // English
      'ro': 'ro', // Romanian
      'uk': 'uk', // Ukrainian
      'ru': 'uk', // Russian -> Ukrainian (given the context)
      'de': 'de', // German
      'fr': 'fr', // French
      'es': 'es'  // Spanish
    };

    const mappedLang = languageMap[langCode];
    
    console.log('TranslationService: Mapped language:', mappedLang);
    console.log('TranslationService: Supported languages:', this.supportedLanguages);
    
    // Return mapped language if supported, otherwise default
    if (mappedLang && this.supportedLanguages.includes(mappedLang)) {
      console.log(`TranslationService: ✅ Language "${langCode}" mapped to "${mappedLang}"`);
      return mappedLang;
    }

    console.log(`TranslationService: ❌ Language "${langCode}" not supported, using default "${this.defaultLanguage}"`);
    return this.defaultLanguage;
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
      'about.description2': 'Every project gets a personalized approach focused on users and performance, delivering measurable results for our clients.',
      // Why Choose Us
      'whyChooseUs.title': 'Why Choose Us',
      'whyChooseUs.subtitle': 'We deliver exceptional results with proven expertise and dedication',
      'whyChooseUs.experience.label': 'Years Experience',
      'whyChooseUs.projects.label': 'Projects Delivered',
      'whyChooseUs.support.label': 'Support Available',
      'whyChooseUs.satisfaction.label': 'Client Satisfaction',
      // Technologies
      'technologies.title': 'Our Technology Stack',
      'technologies.subtitle': 'Cutting-edge tools and technologies we use to build amazing products',
      // Portfolio
      'portfolio.title': 'Our Portfolio',
      'portfolio.subtitle': 'Showcasing our best work and successful projects',
      'portfolio.all': 'All',
      'portfolio.web': 'Web',
      'portfolio.mobile': 'Mobile',
      'portfolio.design': 'Design'
    };

    // If current language is Romanian, provide Romanian fallbacks
    if (this.currentLanguageSignal() === 'ro') {
      const roFallbackMap: Record<string, string> = {
        'navigation.menu': 'Navigare principală',
        'navigation.services': 'Servicii',
        'navigation.about': 'Despre Noi',
        'navigation.contact': 'Contact',
        'common.language': 'Schimbă Limba',
        'footer.copyright': '© {{year}} Web Firm Solutions. Toate drepturile rezervate.',
        'footer.websiteAriaLabel': 'Vizitați site-ul nostru la webfirmsolutions.com',
        'contact.title': 'Să Lucrăm Împreună',
        'contact.subtitle': 'Gata să transformăm ideile în realitate?',
        'hero.title': 'Transformă-ți Ideile în',
        'hero.titleAccent': 'Experiențe Web Ultra Interactive',
        'hero.titleEnd': '',
        'hero.subtitle': 'Cu peste 20 de ani de experiență internațională, creăm site-uri web interactive, optimizate SEO, care cresc vizibilitatea și conversiile. Specializați în Angular, React și tehnologii web moderne.',
        'hero.seoContent': 'Servicii profesionale de web design și dezvoltare frontend. Expert în design responsive, optimizare experiență utilizator și tehnologii web moderne. Servim clienți din întreaga lume cu soluții premium de dezvoltare web.',
        'hero.ctaButton': 'Să Începem',
        'hero.secondaryButton': 'Vezi Lucrările Noastre',
        'hero.ctaAriaLabel': 'Contactează-ne pentru a începe proiectul tău',
        'hero.secondaryAriaLabel': 'Vezi serviciile și portofoliul nostru',
        'hero.features.performance.title': 'Performanță Rapidă',
        'hero.features.performance.description': 'Timpi de încărcare fulgerători',
        'hero.features.mobile.title': 'Mobile First',
        'hero.features.mobile.description': 'Responsive pe toate dispozitivele',
        'hero.features.seo.title': 'Optimizat SEO',
        'hero.features.seo.description': 'Construit pentru motoarele de căutare',
        'services.title': 'Serviciile Noastre Premium',
        'services.subtitle': 'Oferim soluții de vârf adaptate nevoilor afacerii tale',
        'services.learnMore': 'Află Mai Mult',
        'services.learnMoreAbout': 'Află mai mult despre',
        'services.web-design-ux-ui.title': 'Web Design & UX/UI',
        'services.web-design-ux-ui.description': 'Design-uri intuitive și vizual uimitoare care încântă utilizatorii și cresc rata de conversie pe toate dispozitivele.',
        'services.advanced-frontend-development.title': 'Dezvoltare Frontend Avansată',
        'services.advanced-frontend-development.description': 'Aplicații web de înaltă performanță cu React, Angular, Vue sau Vanilla JS, complet optimizate pentru SEO și viteză.',
        'services.technical-consulting-seo.title': 'Consultanță Tehnică & SEO',
        'services.technical-consulting-seo.description': 'Strategii scalabile, securizate și performante pentru a maximiza impactul afacerii și vizibilitatea în motoarele de căutare.',
        'about.title': 'Despre Noi',
        'about.teamImage': 'Echipa Noastră',
        'about.description1': 'Suntem o echipă de experți frontend cu experiență internațională, având colaborări cu Google, Amazon și Facebook. Transformăm idei complexe în soluții web elegante și eficiente.',
        'about.description2': 'Fiecare proiect primește o abordare personalizată centrată pe utilizatori și performanță, oferind rezultate măsurabile pentru clienții noștri.',
        // Why Choose Us
        'whyChooseUs.title': 'De Ce Să Ne Alegi',
        'whyChooseUs.subtitle': 'Oferim rezultate excepționale cu expertiză dovedită și dedicare',
        'whyChooseUs.experience.label': 'Ani de Experiență',
        'whyChooseUs.projects.label': 'Proiecte Livrate',
        'whyChooseUs.support.label': 'Suport Disponibil',
        'whyChooseUs.satisfaction.label': 'Satisfacția Clienților',
        // Technologies
        'technologies.title': 'Tehnologiile Noastre',
        'technologies.subtitle': 'Unelte și tehnologii de ultimă generație pentru produse incredibile',
        // Portfolio
        'portfolio.title': 'Portofoliul Nostru',
        'portfolio.subtitle': 'Prezentăm cele mai bune lucrări și proiecte de succes',
        'portfolio.all': 'Toate',
        'portfolio.web': 'Web',
        'portfolio.mobile': 'Mobil',
        'portfolio.design': 'Design'
      };
      return roFallbackMap[keyPath] || keyPath;
    }

    // If current language is Ukrainian, provide Ukrainian fallbacks
    if (this.currentLanguageSignal() === 'uk') {
      const ukFallbackMap: Record<string, string> = {
        'navigation.menu': 'Головне меню',
        'navigation.services': 'Послуги',
        'navigation.about': 'Про нас',
        'navigation.contact': 'Контакти',
        'common.language': 'Змінити мову',
        'footer.copyright': '© {{year}} Web Firm Solutions. Всі права захищені.',
        'footer.websiteAriaLabel': 'Відвідайте наш сайт webfirmsolutions.com',
        'contact.title': 'Давайте працювати разом',
        'contact.subtitle': 'Готові перетворити ідеї в реальність?',
        'hero.title': 'Перетворіть свої ідеї в',
        'hero.titleAccent': 'Ультра-інтерактивні',
        'hero.titleEnd': 'Веб-досвіди',
        'hero.subtitle': 'З понад 20 роками міжнародного досвіду ми створюємо інтерактивні, SEO-оптимізовані веб-сайти, які підвищують видимість і конверсії. Спеціалізуємося на Angular, React та сучасних веб-технологіях.',
        'hero.seoContent': 'Професійні послуги веб-дизайну та frontend розробки. Експерти в адаптивному дизайні, оптимізації користувацького досвіду та сучасних веб-технологіях. Обслуговуємо клієнтів по всьому світу преміум рішеннями веб-розробки.',
        'hero.ctaButton': 'Розпочнемо',
        'hero.secondaryButton': 'Переглянути Роботи',
        'hero.ctaAriaLabel': 'Зв\'яжіться з нами, щоб розпочати проект',
        'hero.secondaryAriaLabel': 'Перегляньте наші послуги та портфоліо',
        'hero.features.performance.title': 'Швидка Продуктивність',
        'hero.features.performance.description': 'Блискавична швидкість завантаження',
        'hero.features.mobile.title': 'Mobile First',
        'hero.features.mobile.description': 'Адаптивний на всіх пристроях',
        'hero.features.seo.title': 'SEO Оптимізовано',
        'hero.features.seo.description': 'Створено для пошукових систем',
        'services.title': 'Наші преміум-послуги',
        'services.subtitle': 'Ми надаємо передові рішення, адаптовані до потреб вашого бізнесу',
        'services.learnMore': 'Дізнатися Більше',
        'services.learnMoreAbout': 'Дізнатися більше про',
        'services.web-design-ux-ui.title': 'Веб Дизайн & UX/UI',
        'services.web-design-ux-ui.description': 'Інтуїтивні, візуально приголомшливі дизайни, які радують користувачів і підвищують коефіцієнт конверсії на всіх пристроях.',
        'services.advanced-frontend-development.title': 'Розширена Frontend Розробка',
        'services.advanced-frontend-development.description': 'Високопродуктивні веб-додатки з React, Angular, Vue або Vanilla JS, повністю оптимізовані для SEO та швидкості.',
        'services.technical-consulting-seo.title': 'Технічний Консалтинг & SEO',
        'services.technical-consulting-seo.description': 'Масштабовані, безпечні та високопродуктивні стратегії для максимізації бізнес-впливу та видимості в пошукових системах.',
        'about.title': 'Про нас',
        'about.teamImage': 'Наша Команда',
        'about.description1': 'Ми команда frontend експертів з міжнародним досвідом, що працювали в Google, Amazon та Facebook. Ми перетворюємо складні ідеї в елегантні, ефективні веб-рішення.',
        'about.description2': 'Кожен проект отримує персоналізований підхід, зосереджений на користувачах та продуктивності, забезпечуючи вимірні результати для наших клієнтів.',
        // Why Choose Us
        'whyChooseUs.title': 'Чому обирають нас',
        'whyChooseUs.subtitle': 'Ми забезпечуємо виняткові результати з перевіреною експертизою та відданістю',
        'whyChooseUs.experience.label': 'Років досвіду',
        'whyChooseUs.projects.label': 'Виконаних проєктів',
        'whyChooseUs.support.label': 'Підтримка доступна',
        'whyChooseUs.satisfaction.label': 'Задоволених клієнтів',
        // Technologies
        'technologies.title': 'Наш технологічний стек',
        'technologies.subtitle': 'Передові інструменти та технології для створення чудових продуктів',
        // Portfolio
        'portfolio.title': 'Наше портфоліо',
        'portfolio.subtitle': 'Демонструємо наші найкращі роботи та успішні проєкти',
        'portfolio.all': 'Усі',
        'portfolio.web': 'Веб',
        'portfolio.mobile': 'Мобільні',
        'portfolio.design': 'Дизайн'
      };
      return ukFallbackMap[keyPath] || keyPath;
    }

    // If current language is German, provide German fallbacks
    if (this.currentLanguageSignal() === 'de') {
      const deFallbackMap: Record<string, string> = {
        'navigation.menu': 'Hauptnavigation',
        'navigation.services': 'Dienstleistungen',
        'navigation.about': 'Über uns',
        'navigation.contact': 'Kontakt',
        'common.language': 'Sprache ändern',
        'footer.copyright': '© {{year}} Web Firm Solutions. Alle Rechte vorbehalten.',
        'footer.websiteAriaLabel': 'Besuchen Sie unsere Website unter webfirmsolutions.com',
        'contact.title': 'Lassen Sie uns zusammenarbeiten',
        'contact.subtitle': 'Bereit, Ihre Ideen in die Realität umzusetzen?',
        'hero.title': 'Verwandeln Sie Ihre Ideen in',
        'hero.titleAccent': 'Ultra-interaktive',
        'hero.titleEnd': 'Web-Erlebnisse',
        'hero.subtitle': 'Mit über 20 Jahren internationaler Erfahrung erstellen wir interaktive, SEO-optimierte Websites, die Sichtbarkeit und Conversions steigern. Spezialisiert auf Angular, React und moderne Webtechnologien.',
        'hero.seoContent': 'Professionelle Webdesign- und Frontend-Entwicklungsdienste. Experten für responsives Design, Benutzererfahrungsoptimierung und moderne Webtechnologien. Wir bedienen Kunden weltweit mit Premium-Webentwicklungslösungen.',
        'hero.ctaButton': 'Loslegen',
        'hero.secondaryButton': 'Unsere Arbeiten ansehen',
        'hero.ctaAriaLabel': 'Kontaktieren Sie uns, um mit Ihrem Projekt zu beginnen',
        'hero.secondaryAriaLabel': 'Sehen Sie sich unsere Dienstleistungen und unser Portfolio an',
        'hero.features.performance.title': 'Schnelle Leistung',
        'hero.features.performance.description': 'Blitzschnelle Ladezeiten',
        'hero.features.mobile.title': 'Mobile First',
        'hero.features.mobile.description': 'Responsive auf allen Geräten',
        'hero.features.seo.title': 'SEO Optimiert',
        'hero.features.seo.description': 'Für Suchmaschinen entwickelt',
        'services.title': 'Unsere Premium-Dienstleistungen',
        'services.subtitle': 'Wir liefern hochmoderne Lösungen, die auf Ihre Geschäftsanforderungen zugeschnitten sind',
        'services.learnMore': 'Mehr Erfahren',
        'services.learnMoreAbout': 'Mehr erfahren über',
        'services.web-design-ux-ui.title': 'Webdesign & UX/UI',
        'services.web-design-ux-ui.description': 'Intuitive, visuell beeindruckende Designs, die Benutzer begeistern und höhere Conversion-Raten auf allen Geräten fördern.',
        'services.advanced-frontend-development.title': 'Fortgeschrittene Frontend-Entwicklung',
        'services.advanced-frontend-development.description': 'Hochleistungs-Web-Apps mit React, Angular, Vue oder Vanilla JS, vollständig optimiert für SEO und Geschwindigkeit.',
        'services.technical-consulting-seo.title': 'Technische Beratung & SEO',
        'services.technical-consulting-seo.description': 'Skalierbare, sichere und leistungsstarke Strategien zur Maximierung der Geschäftswirkung und Suchmaschinen-Sichtbarkeit.',
        'about.title': 'Über uns',
        'about.teamImage': 'Unser Team',
        'about.description1': 'Wir sind ein Team von Frontend-Experten mit internationaler Erfahrung, die bei Google, Amazon und Facebook gearbeitet haben. Wir verwandeln komplexe Ideen in elegante, effiziente Web-Lösungen.',
        'about.description2': 'Jedes Projekt erhält einen personalisierten Ansatz, der sich auf Benutzer und Leistung konzentriert und messbare Ergebnisse für unsere Kunden liefert.',
        // Why Choose Us
        'whyChooseUs.title': 'Warum uns wählen',
        'whyChooseUs.subtitle': 'Wir liefern außergewöhnliche Ergebnisse mit nachgewiesener Expertise und Engagement',
        'whyChooseUs.experience.label': 'Jahre Erfahrung',
        'whyChooseUs.projects.label': 'Projekte geliefert',
        'whyChooseUs.support.label': 'Support verfügbar',
        'whyChooseUs.satisfaction.label': 'Kundenzufriedenheit',
        // Technologies
        'technologies.title': 'Unser Technologie-Stack',
        'technologies.subtitle': 'Modernste Tools und Technologien zum Erstellen großartiger Produkte',
        // Portfolio
        'portfolio.title': 'Unser Portfolio',
        'portfolio.subtitle': 'Präsentation unserer besten Arbeiten und erfolgreichen Projekte',
        'portfolio.all': 'Alle',
        'portfolio.web': 'Web',
        'portfolio.mobile': 'Mobil',
        'portfolio.design': 'Design'
      };
      return deFallbackMap[keyPath] || keyPath;
    }

    // If current language is French, provide French fallbacks
    if (this.currentLanguageSignal() === 'fr') {
      const frFallbackMap: Record<string, string> = {
        'navigation.menu': 'Navigation principale',
        'navigation.services': 'Services',
        'navigation.about': 'À propos',
        'navigation.contact': 'Contact',
        'common.language': 'Changer de langue',
        'footer.copyright': '© {{year}} Web Firm Solutions. Tous droits réservés.',
        'footer.websiteAriaLabel': 'Visitez notre site Web sur webfirmsolutions.com',
        'contact.title': 'Travaillons ensemble',
        'contact.subtitle': 'Prêt à transformer vos idées en réalité?',
        'hero.title': 'Transformez vos idées en',
        'hero.titleAccent': 'Expériences Web Ultra-interactives',
        'hero.titleEnd': '',
        'hero.subtitle': 'Avec plus de 20 ans d\'expérience internationale, nous créons des sites web interactifs et optimisés SEO qui augmentent la visibilité et les conversions. Spécialisés en Angular, React et technologies web modernes.',
        'hero.seoContent': 'Services professionnels de conception web et développement frontend. Experts en design responsive, optimisation de l\'expérience utilisateur et technologies web modernes. Au service de clients du monde entier avec des solutions de développement web premium.',
        'hero.ctaButton': 'Commencer',
        'hero.secondaryButton': 'Voir Nos Travaux',
        'hero.ctaAriaLabel': 'Contactez-nous pour démarrer votre projet',
        'hero.secondaryAriaLabel': 'Consultez nos services et notre portfolio',
        'hero.features.performance.title': 'Performance Rapide',
        'hero.features.performance.description': 'Temps de chargement ultra-rapides',
        'hero.features.mobile.title': 'Mobile First',
        'hero.features.mobile.description': 'Responsive sur tous les appareils',
        'hero.features.seo.title': 'Optimisé SEO',
        'hero.features.seo.description': 'Conçu pour les moteurs de recherche',
        'services.title': 'Nos Services Premium',
        'services.subtitle': 'Nous livrons des solutions de pointe adaptées aux besoins de votre entreprise',
        'services.learnMore': 'En Savoir Plus',
        'services.learnMoreAbout': 'En savoir plus sur',
        'services.web-design-ux-ui.title': 'Conception Web & UX/UI',
        'services.web-design-ux-ui.description': 'Des designs intuitifs et visuellement époustouflants qui ravissent les utilisateurs et augmentent les taux de conversion sur tous les appareils.',
        'services.advanced-frontend-development.title': 'Développement Frontend Avancé',
        'services.advanced-frontend-development.description': 'Applications web haute performance avec React, Angular, Vue ou Vanilla JS, entièrement optimisées pour le SEO et la vitesse.',
        'services.technical-consulting-seo.title': 'Conseil Technique & SEO',
        'services.technical-consulting-seo.description': 'Stratégies évolutives, sécurisées et performantes pour maximiser l\'impact commercial et la visibilité dans les moteurs de recherche.',
        'about.title': 'À propos de nous',
        'about.teamImage': 'Notre Équipe',
        'about.description1': 'Nous sommes une équipe d\'experts frontend avec une expérience internationale, ayant travaillé chez Google, Amazon et Facebook. Nous transformons des idées complexes en solutions web élégantes et efficaces.',
        'about.description2': 'Chaque projet reçoit une approche personnalisée centrée sur les utilisateurs et la performance, offrant des résultats mesurables pour nos clients.',
        // Why Choose Us
        'whyChooseUs.title': 'Pourquoi nous choisir',
        'whyChooseUs.subtitle': 'Nous offrons des résultats exceptionnels avec une expertise éprouvée et un engagement total',
        'whyChooseUs.experience.label': 'Années d\'expérience',
        'whyChooseUs.projects.label': 'Projets livrés',
        'whyChooseUs.support.label': 'Support disponible',
        'whyChooseUs.satisfaction.label': 'Satisfaction client',
        // Technologies
        'technologies.title': 'Notre stack technologique',
        'technologies.subtitle': 'Des outils et technologies de pointe pour créer de superbes produits',
        // Portfolio
        'portfolio.title': 'Notre portfolio',
        'portfolio.subtitle': 'Présentation de nos meilleurs travaux et projets réussis',
        'portfolio.all': 'Tous',
        'portfolio.web': 'Web',
        'portfolio.mobile': 'Mobile',
        'portfolio.design': 'Design'
      };
      return frFallbackMap[keyPath] || keyPath;
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
    console.log(`TranslationService: Loading translations for ${language}`);
    
    // Load translations via HTTP
    return this.http.get(`/assets/i18n/${language}.json`, { 
      responseType: 'text',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .pipe(
        switchMap((textResponse: string) => {
          try {
            console.log(`TranslationService: Successfully loaded translations for ${language}`);
            const translations = JSON.parse(textResponse) as TranslationData;
            
            this.translationsSignal.set(translations);
            this.currentLanguageSignal.set(language);
            this.currentLanguageSubject.next(language);
            this.storeLanguage(language);
            this.isLoadingSignal.set(false);
            
            console.log(`TranslationService: Loaded HTTP translations for ${language}`, Object.keys(translations));
            return of(true);
          } catch (parseError) {
            console.error(`TranslationService: Failed to parse HTTP response for ${language}:`, parseError);
            throw parseError;
          }
        }),
        catchError(error => {
          console.error(`TranslationService: HTTP request failed for ${language}:`, error);
          this.isLoadingSignal.set(false);
          
          // Final fallback to default language embedded translations
          if (language !== this.defaultLanguage) {
            console.log(`TranslationService: Final fallback to embedded ${this.defaultLanguage}`);
            return this.loadLanguage(this.defaultLanguage);
          }
          
          console.error('TranslationService: All fallbacks failed, using empty translations');
          return of(false);
        })
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
      uk: 'Українська',
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