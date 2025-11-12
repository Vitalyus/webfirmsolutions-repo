import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface MultiLanguageSEO {
  title: string;
  description: string;
  keywords: string;
  og: {
    title: string;
    description: string;
    image: string;
    imageAlt: string;
  };
  twitter: {
    title: string;
    description: string;
    imageAlt: string;
  };
  structuredData: {
    name: string;
    alternateName: string;
    description: string;
    foundingDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://webfirmsolutions.com';
  private readonly supportedLanguages = ['en', 'ro', 'fr', 'de', 'uk'];
  private readonly languageLocales = {
    en: 'en_US',
    ro: 'ro_RO',
    fr: 'fr_FR',
    de: 'de_DE',
    uk: 'uk_UA'
  };

  constructor() {
    this.initializeRouteTracking();
  }

  private initializeRouteTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCanonicalUrl(event.urlAfterRedirects);
      });
  }

  updateSEO(data: SEOData): void {
    this.updateTitle(data.title);
    this.updateDescription(data.description);
    this.updateKeywords(data.keywords);
    this.updateOpenGraph(data);
    this.updateTwitterCard(data);
    this.updateCanonicalUrl(data.url);
    
    // Add schema for current page
    this.updatePageSchema(data);
  }

  updateTitle(title?: string): void {
    if (title) {
      this.title.setTitle(title);
      this.updateMetaTag('property', 'og:title', title);
      this.updateMetaTag('name', 'twitter:title', title);
    }
  }

  updateDescription(description?: string): void {
    if (description) {
      this.updateMetaTag('name', 'description', description);
      this.updateMetaTag('property', 'og:description', description);
      this.updateMetaTag('name', 'twitter:description', description);
    }
  }

  updateKeywords(keywords?: string): void {
    if (keywords) {
      this.updateMetaTag('name', 'keywords', keywords);
    }
  }

  updateOpenGraph(data: SEOData): void {
    if (data.title) {
      this.updateMetaTag('property', 'og:title', data.title);
    }
    if (data.description) {
      this.updateMetaTag('property', 'og:description', data.description);
    }
    if (data.image) {
      this.updateMetaTag('property', 'og:image', data.image);
    }
    if (data.url) {
      this.updateMetaTag('property', 'og:url', data.url);
    }
    if (data.type) {
      this.updateMetaTag('property', 'og:type', data.type);
    }
  }

  updateTwitterCard(data: SEOData): void {
    this.updateMetaTag('name', 'twitter:card', 'summary_large_image');
    if (data.title) {
      this.updateMetaTag('name', 'twitter:title', data.title);
    }
    if (data.description) {
      this.updateMetaTag('name', 'twitter:description', data.description);
    }
    if (data.image) {
      this.updateMetaTag('name', 'twitter:image', data.image);
    }
  }

  updateCanonicalUrl(url?: string): void {
    if (url) {
      // Get current language from localStorage or default to 'en'
      const currentLang = localStorage.getItem('selectedLanguage') || 'en';
      
      // Build canonical URL with language parameter if not English
      let canonicalUrl = url.startsWith('http') ? url : `https://webfirmsolutions.com${url}`;
      
      // Add language parameter for non-English languages
      if (currentLang !== 'en') {
        const separator = canonicalUrl.includes('?') ? '&' : '?';
        canonicalUrl = `${canonicalUrl}${separator}lang=${currentLang}`;
      }
      
      // Remove existing canonical link
      const existingCanonical = document.querySelector('link[rel="canonical"]');
      if (existingCanonical) {
        existingCanonical.remove();
      }

      // Add new canonical link
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      document.head.appendChild(link);
    }
  }

  updateStructuredData(data: any): void {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  private updateMetaTag(attrName: string, attrValue: string, content: string): void {
    const selector = `meta[${attrName}="${attrValue}"]`;
    let tag = document.querySelector(selector) as HTMLMetaElement;
    
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    
    tag.setAttribute('content', content);
  }

  // Core Web Vitals tracking
  trackCoreWebVitals(): void {
    if ('web-vital' in window) {
      // Track Largest Contentful Paint (LCP)
      this.observePerformanceMetric('largest-contentful-paint', (entry: any) => {
        console.log('LCP:', entry.startTime);
      });

      // Track First Input Delay (FID)
      this.observePerformanceMetric('first-input', (entry: any) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });

      // Track Cumulative Layout Shift (CLS)
      this.observePerformanceMetric('layout-shift', (entry: any) => {
        if (!entry.hadRecentInput) {
          console.log('CLS:', entry.value);
        }
      });
    }
  }

  private observePerformanceMetric(type: string, callback: (entry: any) => void): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      
      try {
        observer.observe({ type, buffered: true });
      } catch (e) {
        console.warn(`Performance observer for ${type} not supported`);
      }
    }
  }

  // Preload critical resources
  preloadResource(href: string, as: string, type?: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) {
      link.type = type;
    }
    document.head.appendChild(link);
  }

  // Add breadcrumb structured data
  addBreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>): void {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };

    this.updateStructuredData(breadcrumbData);
  }

  // Load SEO data for specific language
  loadLanguageSEO(lang: string): Observable<MultiLanguageSEO | null> {
    return this.http.get<MultiLanguageSEO>(`/assets/i18n/seo/${lang}.json`).pipe(
      catchError(error => {
        console.error(`Failed to load SEO data for language: ${lang}`, error);
        return of(null);
      })
    );
  }

  // Update SEO with language-specific data
  updateSEOForLanguage(lang: string, currentPath: string = '/'): void {
    this.loadLanguageSEO(lang).subscribe(seoData => {
      if (seoData) {
        // Update basic meta tags
        this.updateTitle(seoData.title);
        this.updateDescription(seoData.description);
        this.updateKeywords(seoData.keywords);

        // Update Open Graph
        this.updateMetaTag('property', 'og:title', seoData.og.title);
        this.updateMetaTag('property', 'og:description', seoData.og.description);
        this.updateMetaTag('property', 'og:image', seoData.og.image);
        this.updateMetaTag('property', 'og:image:alt', seoData.og.imageAlt);
        this.updateMetaTag('property', 'og:locale', this.languageLocales[lang as keyof typeof this.languageLocales]);

        // Update Twitter Card
        this.updateMetaTag('name', 'twitter:title', seoData.twitter.title);
        this.updateMetaTag('name', 'twitter:description', seoData.twitter.description);
        this.updateMetaTag('name', 'twitter:image:alt', seoData.twitter.imageAlt);

        // Update hreflang tags
        this.updateHreflangTags(currentPath, lang);

        // Update html lang attribute
        document.documentElement.lang = lang;

        // Update structured data with language
        this.updateMultiLanguageStructuredData(seoData.structuredData, lang);
      }
    });
  }

  // Update hreflang tags for all supported languages
  updateHreflangTags(currentPath: string, currentLang: string): void {
    // Remove existing hreflang tags
    const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflang.forEach(link => link.remove());

    // Add hreflang for each language
    this.supportedLanguages.forEach(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = `${this.baseUrl}${currentPath}?lang=${lang}`;
      document.head.appendChild(link);
    });

    // Add x-default hreflang (points to English)
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${this.baseUrl}${currentPath}`;
    document.head.appendChild(defaultLink);

    // Update canonical to include current language
    this.updateCanonicalUrl(`${currentPath}${currentPath.includes('?') ? '&' : '?'}lang=${currentLang}`);
  }

  // Update structured data with multi-language support
  updateMultiLanguageStructuredData(baseData: any, currentLang: string): void {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": ["Organization", "LocalBusiness"],
      "name": baseData.name,
      "alternateName": baseData.alternateName,
      "url": `${this.baseUrl}`,
      "logo": "https://webfirmsolutions.com/favicon.svg",
      "image": "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=1200&q=80",
      "description": baseData.description,
      "foundingDate": baseData.foundingDate,
      "numberOfEmployees": "1-10",
      "serviceArea": {
        "@type": "Place",
        "name": "Worldwide"
      },
      "areaServed": "Worldwide",
      "inLanguage": this.supportedLanguages,
      "availableLanguage": [
        { "@type": "Language", "name": "English", "alternateName": "en" },
        { "@type": "Language", "name": "Romanian", "alternateName": "ro" },
        { "@type": "Language", "name": "French", "alternateName": "fr" },
        { "@type": "Language", "name": "German", "alternateName": "de" },
        { "@type": "Language", "name": "Ukrainian", "alternateName": "uk" }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Web Development Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Web Design",
              "description": "Custom responsive web design with modern UI/UX principles"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Frontend Development",
              "description": "Advanced frontend development with Angular, React, and modern frameworks"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Technical Consulting",
              "description": "Expert technical consulting and architecture guidance"
            }
          }
        ]
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contact@webfirmsolutions.com",
        "contactType": "customer support",
        "availableLanguage": ["English", "Romanian", "French", "German", "Ukrainian"],
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "17:00"
        }
      },
      "sameAs": [
        "https://webfirmsolutions.com/"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "50"
      }
    };

    this.updateStructuredData(structuredData);
  }

  /**
   * Add page-specific schema for better SEO
   */
  private updatePageSchema(data: SEOData): void {
    const pageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": data.title || 'Web Firm Solutions',
      "description": data.description || 'Professional web development services',
      "url": data.url || 'https://webfirmsolutions.com',
      "inLanguage": this.supportedLanguages,
      "isPartOf": {
        "@type": "WebSite",
        "name": "Web Firm Solutions",
        "url": "https://webfirmsolutions.com"
      },
      "about": {
        "@type": "Thing",
        "name": "Web Development Services",
        "description": "Professional web design and development services"
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [{
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://webfirmsolutions.com/"
        }]
      }
    };

    const existingSchema = document.querySelector('script[type="application/ld+json"][data-schema="webpage"]');
    if (existingSchema) {
      existingSchema.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'webpage');
    script.text = JSON.stringify(pageSchema);
    document.head.appendChild(script);
  }
}