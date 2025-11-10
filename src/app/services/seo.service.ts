import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

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
      const canonicalUrl = url.startsWith('http') ? url : `https://webfirmsolutions.com${url}`;
      
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
}