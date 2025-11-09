// Advanced performance optimizations for 2025

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for scroll/resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Prefetch critical resources
export function prefetchResources(urls: string[]): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      });
    });
  }
}

// Web Vitals tracking
export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

export function trackWebVitals(callback: (vitals: Partial<WebVitals>) => void): void {
  if ('web-vital' in window) {
    // Track LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      callback({ lcp: lastEntry.renderTime || lastEntry.loadTime });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Track FID
    new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0] as any;
      callback({ fid: firstInput.processingStart - firstInput.startTime });
    }).observe({ entryTypes: ['first-input'] });
    
    // Track CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          callback({ cls: clsValue });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
