import { Injectable } from '@angular/core';
import { SCROLL_CONFIG } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  /**
   * Smooth scroll to element with proper error handling
   */
  scrollToElement(selector: string): boolean {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        console.warn(`ScrollService: Element with selector "${selector}" not found`);
        return false;
      }

      element.scrollIntoView({
        behavior: SCROLL_CONFIG.BEHAVIOR,
        block: SCROLL_CONFIG.BLOCK
      });
      
      return true;
    } catch (error) {
      console.error('ScrollService: Error during scroll operation:', error);
      return false;
    }
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): { x: number; y: number } {
    return {
      x: window.scrollX || document.documentElement.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop
    };
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element: Element, threshold: number = SCROLL_CONFIG.THRESHOLD): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight * (1 + threshold) &&
      rect.right <= windowWidth * (1 + threshold)
    );
  }
}