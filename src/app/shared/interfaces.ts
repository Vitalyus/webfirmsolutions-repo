/**
 * Enhanced TypeScript interfaces with advanced typing patterns
 * Following FAANG-level enterprise standards
 * @fileoverview Core type definitions and domain models
 */

// =============================================================================
// CORE DOMAIN INTERFACES
// =============================================================================

/** Navigation item with strict typing and immutability */
export interface NavItem {
  readonly label: string;
  readonly href: `#${string}`; // Template literal type for href validation
  readonly icon: string;
  readonly ariaLabel?: string;
  readonly isExternal?: boolean;
}

/** Service offering with comprehensive metadata */
export interface Service {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly color: ThemeColor;
  readonly category?: ServiceCategory;
  readonly priority?: number;
  readonly isActive?: boolean;
}

/** Feature showcase with enhanced structure */
export interface Feature {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly order?: number;
  readonly isHighlighted?: boolean;
}

/** Contact form with comprehensive validation */
export interface ContactFormData {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly phone?: string;
  readonly company?: string;
  readonly source?: ContactSource;
  readonly captcha?: string;
}

/** Contact dialog configuration */
export interface ContactDialogData {
  readonly title?: string;
  readonly subtitle?: string;
}

/** Contact dialog result */
export interface ContactDialogResult {
  readonly action: 'sent' | 'cancelled';
  readonly data?: ContactFormData;
}

/** Mathematical captcha challenge */
export interface CaptchaChallenge {
  readonly question: string;
  readonly answer: number;
  readonly id: string;
}

/** Translation system interfaces */
export type Language = 'en' | 'ro' | 'fr' | 'es' | 'de';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface LanguageOption {
  readonly code: Language;
  readonly name: string;
  readonly flag: string;
  readonly isActive?: boolean;
}

// =============================================================================
// TYPE UNIONS AND ENUMS
// =============================================================================

/** Material Design theme colors with strict typing */
export type ThemeColor = 'primary' | 'accent' | 'warn';

/** Service categories for organization */
export type ServiceCategory = 
  | 'development' 
  | 'design' 
  | 'marketing' 
  | 'consulting';

/** Contact sources for analytics */
export type ContactSource = 
  | 'hero-cta' 
  | 'header-nav' 
  | 'service-card' 
  | 'footer-link' 
  | 'direct';

/** Animation states for complex transitions */
export type AnimationState = 
  | 'initial' 
  | 'loading' 
  | 'visible' 
  | 'hidden' 
  | 'error';

// =============================================================================
// ADVANCED CONFIGURATION TYPES
// =============================================================================

/** Application configuration with environment awareness */
export interface AppConfig {
  readonly company: CompanyInfo;
  readonly ui: UIConfig;
  readonly performance: PerformanceConfig;
}

export interface CompanyInfo {
  readonly name: string;
  readonly email: string;
  readonly website: string;
  readonly phone?: string;
}

export interface UIConfig {
  readonly headerHeight: number;
  readonly animationDuration: number;
  readonly formValidation: FormValidationConfig;
}

export interface PerformanceConfig {
  readonly lazyLoading: boolean;
  readonly preloading: boolean;
  readonly cacheTimeout: number;
}

export interface FormValidationConfig {
  readonly nameMinLength: number;
  readonly messageMinLength: number;
  readonly emailPattern: RegExp;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Deep readonly utility type */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};

/** Make specified keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// =============================================================================
// CONSTANTS WITH ENTERPRISE-GRADE CONFIGURATION
// =============================================================================

export const APP_CONFIG: DeepReadonly<AppConfig> = {
  company: {
    name: 'Web Firm Solutions',
    email: 'contact@webfirmsolutions.com',
    website: 'https://webfirmsolutions.com/',
  },
  ui: {
    headerHeight: 64,
    animationDuration: 300,
    formValidation: {
      nameMinLength: 2,
      messageMinLength: 10,
      emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  performance: {
    lazyLoading: true,
    preloading: true,
    cacheTimeout: 300000, // 5 minutes
  },
} as const;

export const SCROLL_CONFIG = {
  BEHAVIOR: 'smooth' as ScrollBehavior,
  BLOCK: 'start' as ScrollLogicalPosition,
  THRESHOLD: 0.1,
  ROOT_MARGIN: '50px 0px -50px 0px',
} as const;

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/** Type guard for checking if value is defined */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/** Type guard for checking if string is not empty */
export const isNonEmptyString = (value: string | null | undefined): value is string => {
  return isDefined(value) && value.trim().length > 0;
};

/** Type guard for checking valid email format */
export const isValidEmail = (email: string): boolean => {
  return APP_CONFIG.ui.formValidation.emailPattern.test(email);
};