import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Language, LanguageOption } from '../../shared/interfaces';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <button mat-icon-button
            [matMenuTriggerFor]="languageMenu"
            [matTooltip]="'common.language' | translate"
            class="language-selector">
      <mat-icon>language</mat-icon>
      <span class="language-code">{{ currentLanguageCode() }}</span>
    </button>

    <mat-menu #languageMenu="matMenu" class="language-menu">
      <button mat-menu-item
              *ngFor="let language of availableLanguages()"
              (click)="selectLanguage(language.code)"
              [class.active]="language.code === currentLanguageCode()"
              class="language-option">
        <span class="language-flag">{{ language.flag }}</span>
        <span class="language-name">{{ language.name }}</span>
        <mat-icon *ngIf="language.code === currentLanguageCode()"
                  class="check-icon">check</mat-icon>
      </button>
    </mat-menu>
  `,
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSelectorComponent implements OnInit {
  private readonly translationService = inject(TranslationService);
  
  // Language options with flags
  private readonly languageOptions: LanguageOption[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // Reactive signals
  public readonly currentLanguageCode = computed(() => 
    this.translationService.currentLanguage().toUpperCase()
  );
  
  public readonly availableLanguages = computed(() => {
    const supportedLangs = this.translationService.getSupportedLanguages();
    return this.languageOptions.filter(lang => supportedLangs.includes(lang.code));
  });
  
  public readonly isLoading = computed(() => this.translationService.isLoading());

  ngOnInit(): void {
    // Auto-detect language on component initialization
    this.translationService.autoDetectLanguage().subscribe({
      next: (success) => {
        if (success) {
          console.log('LanguageSelector: Auto-detected language successfully');
        }
      },
      error: (error) => {
        console.error('LanguageSelector: Failed to auto-detect language:', error);
      }
    });
  }

  /**
   * Select and set a new language
   */
  selectLanguage(language: Language): void {
    if (this.isLoading()) {
      return; // Prevent language changes while loading
    }

    this.translationService.setLanguage(language).subscribe({
      next: (success) => {
        if (success) {
          console.log(`LanguageSelector: Successfully changed to ${language}`);
        } else {
          console.error(`LanguageSelector: Failed to change to ${language}`);
        }
      },
      error: (error) => {
        console.error(`LanguageSelector: Error changing to ${language}:`, error);
      }
    });
  }

  /**
   * Get current language display info
   */
  getCurrentLanguageInfo(): LanguageOption | undefined {
    const currentLang = this.translationService.getCurrentLanguage();
    return this.languageOptions.find(lang => lang.code === currentLang);
  }
}