import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Theme signal: 'light' or 'dark', default is 'light' (white)
  private themeSignal = signal<'light' | 'dark'>('light');
  
  // Public readonly signal
  public currentTheme = this.themeSignal.asReadonly();

  constructor() {
    // Apply initial theme class immediately
    document.body.classList.add('light-theme');
    
    // Load theme from localStorage or default to 'light'
    const savedTheme = this.loadThemeFromStorage();
    this.themeSignal.set(savedTheme);
    
    // Apply theme class to document body
    effect(() => {
      const theme = this.themeSignal();
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${theme}-theme`);
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.themeSignal.set(newTheme);
    this.saveThemeToStorage(newTheme);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSignal.set(theme);
    this.saveThemeToStorage(theme);
  }

  /**
   * Load theme from localStorage
   */
  private loadThemeFromStorage(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'light'; // Default to light (white) theme
  }

  /**
   * Save theme to localStorage
   */
  private saveThemeToStorage(theme: 'light' | 'dark'): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('app-theme', theme);
    }
  }
}

