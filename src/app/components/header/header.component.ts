import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NavItem, APP_CONFIG, isNonEmptyString } from '../../shared/interfaces';
import { ScrollService } from '../../shared/scroll.service';
import { LoggingService } from '../../shared/logging.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
    LanguageSelectorComponent,
    ThemeToggleComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  private readonly scrollService = inject(ScrollService);
  private readonly loggingService = inject(LoggingService);
  
  // Immutable navigation items with proper typing
  readonly navItems: ReadonlyArray<NavItem> = [
    { 
      label: 'Services', 
      href: '#services', 
      icon: 'design_services',
      ariaLabel: 'Navigate to Services section'
    },
    { 
      label: 'About Us', 
      href: '#about', 
      icon: 'info',
      ariaLabel: 'Navigate to About Us section'
    },
    { 
      label: 'Contact', 
      href: '#contact', 
      icon: 'contact_mail',
      ariaLabel: 'Navigate to Contact section'
    }
  ] as const;

  readonly companyName = APP_CONFIG.company.name;

  /**
   * Handle navigation click with enterprise-grade error handling and validation
   * @param event - The click event
   * @param href - The target anchor href
   */
  onNavigate(event: Event, href: string): void {
    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Validate href with type guard
    if (!isNonEmptyString(href) || !href.startsWith('#')) {
      this.loggingService.warn('Invalid navigation href provided', { href }, 'HeaderComponent');
      return;
    }

    // Track user navigation action
    this.loggingService.trackUserAction('navigation', href, 'HeaderComponent');

    // Attempt smooth scroll with service
    const success = this.scrollService.scrollToElement(href);
    
    if (!success) {
      // Enterprise fallback with proper error handling
      this.handleNavigationFallback(href);
    } else {
      this.loggingService.debug('Navigation successful', { href }, 'HeaderComponent');
    }
  }

  /**
   * Fallback navigation method with robust error handling
   * @private
   */
  private handleNavigationFallback(href: string): void {
    try {
      // Check if element exists before setting hash
      const targetElement = document.querySelector(href);
      if (targetElement) {
        window.location.hash = href;
        this.loggingService.info('Navigation fallback successful', { href }, 'HeaderComponent');
      } else {
        this.loggingService.warn('Target element not found for navigation', { href }, 'HeaderComponent');
      }
    } catch (error) {
      this.loggingService.error(
        'Navigation fallback failed', 
        error instanceof Error ? error : new Error(String(error)),
        { href },
        'HeaderComponent'
      );
    }
  }

  /**
   * Track by function for *ngFor optimization
   */
  trackByHref(index: number, item: NavItem): string {
    return item.href;
  }

  ngOnDestroy(): void {
    // Clean up any potential memory leaks
    // In this case, no cleanup needed as we're using injection
  }
}