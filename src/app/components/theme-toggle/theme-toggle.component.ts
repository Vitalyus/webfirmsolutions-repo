import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Theme } from '../../services/theme';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button 
      mat-icon-button 
      (click)="toggleTheme()"
      [matTooltip]="tooltipText()"
      class="theme-toggle"
      [attr.aria-label]="tooltipText()"
    >
      <mat-icon>{{ icon() }}</mat-icon>
    </button>
  `,
  styles: [`
    .theme-toggle {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &:hover {
        transform: rotate(20deg);
      }

      &:active {
        transform: rotate(20deg) scale(0.95);
      }
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: Theme) {}

  icon = computed(() => 
    this.themeService.currentTheme() === 'dark' ? 'light_mode' : 'dark_mode'
  );

  tooltipText = computed(() => 
    this.themeService.currentTheme() === 'dark' 
      ? 'Switch to Light Mode'
      : 'Switch to Dark Mode'
  );

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
