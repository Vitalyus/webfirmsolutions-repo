/**
 * Enterprise-grade performance monitoring and optimization service
 * Following FAANG-level performance engineering standards
 * @fileoverview Performance monitoring, Core Web Vitals tracking, and optimization utilities
 */

import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, fromEvent, throttleTime, debounceTime } from 'rxjs';
import { LoggingService } from './logging.service';

// =============================================================================
// PERFORMANCE INTERFACES AND TYPES
// =============================================================================

export interface PerformanceMetrics {
  readonly FCP: number | null; // First Contentful Paint
  readonly LCP: number | null; // Largest Contentful Paint
  readonly FID: number | null; // First Input Delay
  readonly CLS: number | null; // Cumulative Layout Shift
  readonly TTFB: number | null; // Time to First Byte
  readonly timestamp: string;
}

export interface ResourceTiming {
  readonly name: string;
  readonly duration: number;
  readonly size: number;
  readonly type: ResourceType;
  readonly timestamp: string;
}

export interface MemoryUsage {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
  readonly timestamp: string;
}

export interface BundleAnalysis {
  readonly totalSize: number;
  readonly gzippedSize: number;
  readonly chunks: ChunkInfo[];
  readonly timestamp: string;
}

export interface ChunkInfo {
  readonly name: string;
  readonly size: number;
  readonly modules: string[];
}

export type ResourceType = 
  | 'script' 
  | 'stylesheet' 
  | 'image' 
  | 'font' 
  | 'fetch' 
  | 'xmlhttprequest' 
  | 'other';

export type PerformanceBudget = {
  readonly resource: ResourceType;
  readonly maxSize: number; // in KB
  readonly warning: number; // in KB
};

// =============================================================================
// PERFORMANCE SERVICE IMPLEMENTATION
// =============================================================================

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private readonly loggingService = inject(LoggingService);
  private readonly ngZone = inject(NgZone);

  // Performance state management
  private readonly metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    timestamp: new Date().toISOString()
  });

  private readonly memorySubject = new BehaviorSubject<MemoryUsage | null>(null);
  
  // Performance observers
  private performanceObserver?: PerformanceObserver;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;

  // Configuration
  private readonly performanceBudgets: PerformanceBudget[] = [
    { resource: 'script', maxSize: 250, warning: 200 },
    { resource: 'stylesheet', maxSize: 100, warning: 75 },
    { resource: 'image', maxSize: 500, warning: 300 },
    { resource: 'font', maxSize: 50, warning: 30 }
  ];

  // Observables for external subscribers
  readonly metrics$ = this.metricsSubject.asObservable();
  readonly memory$ = this.memorySubject.asObservable();

  constructor() {
    this.initializePerformanceMonitoring();
    this.initializeMemoryMonitoring();
    this.initializeResourceMonitoring();
  }

  // =============================================================================
  // CORE WEB VITALS MONITORING
  // =============================================================================

  /**
   * Initialize comprehensive performance monitoring
   * @private
   */
  private initializePerformanceMonitoring(): void {
    try {
      if (!('PerformanceObserver' in window)) {
        this.loggingService.warn('PerformanceObserver not supported', {}, 'PerformanceService');
        return;
      }

      this.initLCPObserver();
      this.initFIDObserver();
      this.initCLSObserver();
      this.initFCPObserver();
      this.initTTFBObserver();

      this.loggingService.info('Performance monitoring initialized', {}, 'PerformanceService');
    } catch (error) {
      this.loggingService.error(
        'Performance monitoring initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'PerformanceService'
      );
    }
  }

  /**
   * Initialize Largest Contentful Paint observer
   * @private
   */
  private initLCPObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        
        if (lastEntry) {
          this.updateMetric('LCP', lastEntry.startTime);
          this.checkPerformanceBudget('LCP', lastEntry.startTime);
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      this.loggingService.error('LCP observer initialization failed', error as Error, {}, 'PerformanceService');
    }
  }

  /**
   * Initialize First Input Delay observer
   * @private
   */
  private initFIDObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
          const fid = fidEntry.processingStart - fidEntry.startTime;
          
          this.updateMetric('FID', fid);
          this.checkPerformanceBudget('FID', fid);
        });
      });
      
      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      this.loggingService.error('FID observer initialization failed', error as Error, {}, 'PerformanceService');
    }
  }

  /**
   * Initialize Cumulative Layout Shift observer
   * @private
   */
  private initCLSObserver(): void {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        
        this.updateMetric('CLS', clsValue);
        this.checkPerformanceBudget('CLS', clsValue);
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      this.loggingService.error('CLS observer initialization failed', error as Error, {}, 'PerformanceService');
    }
  }

  /**
   * Initialize First Contentful Paint observer
   * @private
   */
  private initFCPObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          this.updateMetric('FCP', fcpEntry.startTime);
          this.checkPerformanceBudget('FCP', fcpEntry.startTime);
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      this.loggingService.error('FCP observer initialization failed', error as Error, {}, 'PerformanceService');
    }
  }

  /**
   * Initialize Time to First Byte measurement
   * @private
   */
  private initTTFBObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          
          this.updateMetric('TTFB', ttfb);
          this.checkPerformanceBudget('TTFB', ttfb);
        });
      });
      
      observer.observe({ type: 'navigation', buffered: true });
    } catch (error) {
      this.loggingService.error('TTFB observer initialization failed', error as Error, {}, 'PerformanceService');
    }
  }

  // =============================================================================
  // MEMORY MONITORING
  // =============================================================================

  /**
   * Initialize memory usage monitoring
   * @private
   */
  private initializeMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      this.loggingService.warn('Memory API not available', {}, 'PerformanceService');
      return;
    }

    // Monitor memory usage every 30 seconds
    this.ngZone.runOutsideAngular(() => {
      setInterval(() => {
        this.collectMemoryMetrics();
      }, 30000);
    });
  }

  /**
   * Collect current memory metrics
   * @private
   */
  private collectMemoryMetrics(): void {
    try {
      const memoryInfo = (performance as any).memory;
      
      if (memoryInfo) {
        const memoryUsage: MemoryUsage = {
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          timestamp: new Date().toISOString()
        };

        this.memorySubject.next(memoryUsage);
        
        // Check for memory leaks
        this.checkMemoryLeaks(memoryUsage);
        
        this.loggingService.debug('Memory metrics collected', {
          used: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024)
        }, 'PerformanceService');
      }
    } catch (error) {
      this.loggingService.error(
        'Memory metrics collection failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'PerformanceService'
      );
    }
  }

  // =============================================================================
  // RESOURCE MONITORING
  // =============================================================================

  /**
   * Initialize resource loading monitoring
   * @private
   */
  private initializeResourceMonitoring(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        });
      });
      
      observer.observe({ type: 'resource', buffered: true });
    } catch (error) {
      this.loggingService.error(
        'Resource monitoring initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'PerformanceService'
      );
    }
  }

  /**
   * Analyze resource timing and check against budgets
   * @private
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    try {
      const resourceType = this.getResourceType(entry.name);
      const size = entry.transferSize || 0;
      const duration = entry.duration;

      const resourceTiming: ResourceTiming = {
        name: entry.name,
        duration,
        size,
        type: resourceType,
        timestamp: new Date().toISOString()
      };

      // Check against performance budgets
      this.checkResourceBudget(resourceTiming);

      // Log slow resources
      if (duration > 1000) { // > 1 second
        this.loggingService.warn('Slow resource detected', {
          resource: entry.name,
          duration: Math.round(duration),
          size: Math.round(size / 1024)
        }, 'PerformanceService');
      }
    } catch (error) {
      this.loggingService.error(
        'Resource timing analysis failed',
        error instanceof Error ? error : new Error(String(error)),
        { resourceName: entry.name },
        'PerformanceService'
      );
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Update a specific performance metric
   * @private
   */
  private updateMetric(metric: keyof Omit<PerformanceMetrics, 'timestamp'>, value: number): void {
    const currentMetrics = this.metricsSubject.value;
    const updatedMetrics = {
      ...currentMetrics,
      [metric]: value,
      timestamp: new Date().toISOString()
    };
    
    this.metricsSubject.next(updatedMetrics);
    
    this.loggingService.trackPerformance(metric, value);
  }

  /**
   * Check performance against budgets and thresholds
   * @private
   */
  private checkPerformanceBudget(metric: string, value: number): void {
    const thresholds = {
      LCP: { good: 2500, needs_improvement: 4000 },
      FID: { good: 100, needs_improvement: 300 },
      CLS: { good: 0.1, needs_improvement: 0.25 },
      FCP: { good: 1800, needs_improvement: 3000 },
      TTFB: { good: 800, needs_improvement: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return;

    if (value > threshold.needs_improvement) {
      this.loggingService.warn(`Poor ${metric} performance`, {
        metric,
        value: Math.round(value),
        threshold: threshold.needs_improvement
      }, 'PerformanceService');
    } else if (value > threshold.good) {
      this.loggingService.info(`${metric} needs improvement`, {
        metric,
        value: Math.round(value),
        threshold: threshold.good
      }, 'PerformanceService');
    }
  }

  /**
   * Check for potential memory leaks
   * @private
   */
  private checkMemoryLeaks(memoryUsage: MemoryUsage): void {
    const usageMB = memoryUsage.usedJSHeapSize / 1024 / 1024;
    const limitMB = memoryUsage.jsHeapSizeLimit / 1024 / 1024;
    const usagePercentage = (usageMB / limitMB) * 100;

    if (usagePercentage > 80) {
      this.loggingService.warn('High memory usage detected', {
        usedMB: Math.round(usageMB),
        limitMB: Math.round(limitMB),
        percentage: Math.round(usagePercentage)
      }, 'PerformanceService');
    }
  }

  /**
   * Check resource against performance budgets
   * @private
   */
  private checkResourceBudget(resource: ResourceTiming): void {
    const budget = this.performanceBudgets.find(b => b.resource === resource.type);
    if (!budget) return;

    const sizeKB = resource.size / 1024;

    if (sizeKB > budget.maxSize) {
      this.loggingService.warn('Resource exceeds budget', {
        resource: resource.name,
        type: resource.type,
        size: Math.round(sizeKB),
        budget: budget.maxSize
      }, 'PerformanceService');
    } else if (sizeKB > budget.warning) {
      this.loggingService.info('Resource approaching budget limit', {
        resource: resource.name,
        type: resource.type,
        size: Math.round(sizeKB),
        warning: budget.warning
      }, 'PerformanceService');
    }
  }

  /**
   * Determine resource type from URL
   * @private
   */
  private getResourceType(url: string): ResourceType {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    if (url.includes('/api/') || url.includes('fetch')) return 'fetch';
    return 'other';
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.value;
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryUsage | null {
    return this.memorySubject.value;
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): void {
    try {
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
        this.loggingService.info('Garbage collection forced', {}, 'PerformanceService');
      } else {
        this.loggingService.warn('Garbage collection not available', {}, 'PerformanceService');
      }
    } catch (error) {
      this.loggingService.error(
        'Garbage collection failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'PerformanceService'
      );
    }
  }

  /**
   * Measure function execution time
   */
  measureExecutionTime<T>(
    fn: () => T,
    label: string,
    component?: string
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.loggingService.trackPerformance(`${label}-execution`, duration);
      
      if (duration > 100) { // Log slow functions
        this.loggingService.warn('Slow function execution', {
          label,
          duration: Math.round(duration),
          component
        }, 'PerformanceService');
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.loggingService.error(
        `Function execution failed: ${label}`,
        error instanceof Error ? error : new Error(String(error)),
        { duration: Math.round(duration), component },
        'PerformanceService'
      );
      
      throw error;
    }
  }

  /**
   * Clean up performance monitoring
   */
  cleanup(): void {
    try {
      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = undefined;
      }
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = undefined;
      }
      
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = undefined;
      }
      
      this.loggingService.debug('Performance monitoring cleaned up', {}, 'PerformanceService');
    } catch (error) {
      this.loggingService.error(
        'Performance monitoring cleanup failed',
        error instanceof Error ? error : new Error(String(error)),
        {},
        'PerformanceService'
      );
    }
  }
}