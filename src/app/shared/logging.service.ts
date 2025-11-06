/**
 * Enterprise-grade error tracking and logging service
 * Following FAANG-level observability standards
 * @fileoverview Centralized error handling and monitoring
 */

import { Injectable, inject } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly component?: string;
  readonly userId?: string;
  readonly sessionId: string;
  readonly userAgent: string;
  readonly url: string;
}

export interface ErrorReport {
  readonly error: Error;
  readonly context: ErrorContext;
  readonly severity: ErrorSeverity;
  readonly timestamp: string;
  readonly stackTrace: string;
  readonly breadcrumbs: Breadcrumb[];
}

export interface ErrorContext {
  readonly component: string;
  readonly action?: string;
  readonly userId?: string;
  readonly sessionId: string;
  readonly url: string;
  readonly userAgent: string;
  readonly additionalData?: Record<string, unknown>;
}

export interface Breadcrumb {
  readonly timestamp: string;
  readonly category: BreadcrumbCategory;
  readonly message: string;
  readonly level: LogLevel;
  readonly data?: Record<string, unknown>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BreadcrumbCategory = 'navigation' | 'user' | 'http' | 'console' | 'dom';

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly sessionId = this.generateSessionId();
  private readonly breadcrumbs: Breadcrumb[] = [];
  private readonly maxBreadcrumbs = 100;
  
  private readonly logSubject = new Subject<LogEntry>();
  private readonly errorSubject = new Subject<ErrorReport>();
  
  private readonly isProduction = typeof ngDevMode === 'undefined' || !ngDevMode;
  private readonly isDevelopment = !this.isProduction;

  // Observables for external subscribers
  readonly logs$ = this.logSubject.asObservable();
  readonly errors$ = this.errorSubject.asObservable();

  constructor() {
    this.initializeErrorHandlers();
    this.initializePerformanceMonitoring();
  }

  // =============================================================================
  // PUBLIC LOGGING METHODS
  // =============================================================================

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: Record<string, unknown>, component?: string): void {
    if (this.isDevelopment) {
      this.log('debug', message, context, component);
      console.debug(`[${component || 'App'}] ${message}`, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log('info', message, context, component);
    
    if (this.isDevelopment) {
      console.info(`[${component || 'App'}] ${message}`, context);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: Record<string, unknown>, component?: string): void {
    this.log('warn', message, context, component);
    
    if (this.isDevelopment) {
      console.warn(`[${component || 'App'}] ${message}`, context);
    }
    
    this.addBreadcrumb('console', message, 'warn', context);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error, context?: Record<string, unknown>, component?: string): void {
    this.log('error', message, { ...context, error: error?.message }, component);
    
    if (this.isDevelopment) {
      console.error(`[${component || 'App'}] ${message}`, error, context);
    }
    
    if (error) {
      this.captureException(error, {
        component: component || 'Unknown',
        action: message,
        additionalData: context
      }, 'medium');
    }
    
    this.addBreadcrumb('console', message, 'error', context);
  }

  /**
   * Log fatal errors
   */
  fatal(message: string, error: Error, context?: Record<string, unknown>, component?: string): void {
    this.log('fatal', message, { ...context, error: error.message }, component);
    
    console.error(`[FATAL][${component || 'App'}] ${message}`, error, context);
    
    this.captureException(error, {
      component: component || 'Unknown',
      action: message,
      additionalData: context
    }, 'critical');
    
    this.addBreadcrumb('console', message, 'fatal', context);
  }

  // =============================================================================
  // ERROR CAPTURING
  // =============================================================================

  /**
   * Capture and report exceptions
   */
  captureException(
    error: Error, 
    context: Partial<ErrorContext> = {}, 
    severity: ErrorSeverity = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      error,
      context: this.buildErrorContext(context),
      severity,
      timestamp: new Date().toISOString(),
      stackTrace: error.stack || 'No stack trace available',
      breadcrumbs: [...this.breadcrumbs]
    };

    this.errorSubject.next(errorReport);

    // In production, send to external error tracking service
    if (this.isProduction) {
      this.sendToErrorTracking(errorReport);
    }
  }

  // =============================================================================
  // BREADCRUMB MANAGEMENT
  // =============================================================================

  /**
   * Add breadcrumb for debugging context
   */
  addBreadcrumb(
    category: BreadcrumbCategory,
    message: string,
    level: LogLevel = 'info',
    data?: Record<string, unknown>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  // =============================================================================
  // USER ACTIONS TRACKING
  // =============================================================================

  /**
   * Track user navigation
   */
  trackNavigation(from: string, to: string, component?: string): void {
    this.addBreadcrumb('navigation', `Navigated from ${from} to ${to}`, 'info', {
      from,
      to,
      component
    });
    
    this.info(`Navigation: ${from} → ${to}`, { from, to }, component);
  }

  /**
   * Track user interactions
   */
  trackUserAction(action: string, element?: string, component?: string): void {
    this.addBreadcrumb('user', `User ${action}${element ? ` on ${element}` : ''}`, 'info', {
      action,
      element,
      component
    });
    
    this.debug(`User action: ${action}`, { element }, component);
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, { value, unit, metric });
    
    // In production, send to analytics service
    if (this.isProduction && 'performance' in window) {
      performance.mark(`custom-${metric}-${value}`);
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, unknown>, 
    component?: string
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logSubject.next(logEntry);

    // In production, send to logging service
    if (this.isProduction && (level === 'error' || level === 'fatal' || level === 'warn')) {
      this.sendToLoggingService(logEntry);
    }
  }

  private buildErrorContext(partialContext: Partial<ErrorContext>): ErrorContext {
    return {
      component: partialContext.component || 'Unknown',
      action: partialContext.action,
      userId: partialContext.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData: partialContext.additionalData
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers(): void {
    // Global unhandled error handler
    window.addEventListener('error', (event) => {
      this.captureException(
        event.error || new Error(event.message),
        {
          component: 'GlobalErrorHandler',
          action: 'Unhandled Error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        'high'
      );
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        {
          component: 'GlobalErrorHandler',
          action: 'Unhandled Promise Rejection'
        },
        'high'
      );
    });
  }

  private initializePerformanceMonitoring(): void {
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        // Monitor Largest Contentful Paint
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.trackPerformance('LCP', entry.startTime);
            }
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        this.warn('Failed to initialize performance monitoring', { error }, 'LoggingService');
      }
    }
  }

  private sendToErrorTracking(errorReport: ErrorReport): void {
    // In a real application, send to Sentry, Bugsnag, or similar service
    // Example: this.sentryService.captureException(errorReport);
    
    // For now, just ensure it's logged
    console.error('Error Report:', errorReport);
  }

  private sendToLoggingService(logEntry: LogEntry): void {
    // In a real application, send to centralized logging service
    // Example: this.loggingAPI.send(logEntry);
    
    // For now, throttle console output in production
    if (logEntry.level === 'error' || logEntry.level === 'fatal') {
      console.error('Log Entry:', logEntry);
    }
  }
}