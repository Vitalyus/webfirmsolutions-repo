import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false, // Make it impure to detect language changes
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly translationService = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  private languageSubscription?: Subscription;
  private lastKey = '';
  private lastParams: Record<string, string | number> | undefined;
  private lastValue = '';
  private lastLanguage = '';

  constructor() {
    // Subscribe to language changes to force re-calculation
    this.languageSubscription = this.translationService.currentLanguage$.subscribe((language) => {
      console.log(`TranslatePipe: Language changed to ${language}, clearing cache`);
      // Clear cache when language changes
      this.lastKey = '';
      this.lastParams = undefined;
      this.lastValue = '';
      this.lastLanguage = language;
      
      // Force change detection
      this.cdr?.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    const currentLanguage = this.translationService.getCurrentLanguage();
    
    // Force recalculation if language, key, or params changed
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(this.lastParams);
    const needsRecalculation = 
      key !== this.lastKey || 
      paramsChanged || 
      currentLanguage !== this.lastLanguage;
    
    if (needsRecalculation) {
      console.log(`TranslatePipe: Recalculating translation for key: ${key}, language: ${currentLanguage}`);
      
      this.lastKey = key;
      this.lastParams = params;
      this.lastLanguage = currentLanguage;
      this.lastValue = this.translationService.translate(key, params);
      
      console.log(`TranslatePipe: Translation result: "${this.lastValue}"`);
    }
    
    return this.lastValue;
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }
}