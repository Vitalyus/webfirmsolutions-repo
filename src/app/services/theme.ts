import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private readonly STORAGE_KEY = 'theme-mode';
  
  // Signal for reactive theme state
  currentTheme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    // Apply theme on initialization
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  private getInitialTheme(): ThemeMode {
    // Check localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeMode;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  toggleTheme(): void {
    this.currentTheme.set(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
  }
}
