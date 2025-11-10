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
  private currentLanguage = '';

  constructor() {
    // Subscribe to language changes to trigger updates
    this.languageSubscription = this.translationService.currentLanguage$.subscribe((lang) => {
      // Reset cache when language changes
      if (this.currentLanguage !== lang) {
        this.currentLanguage = lang;
        this.lastKey = '';
        this.lastValue = '';
        this.lastParams = undefined;
      }
      this.cdr?.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    // Check if we need to recalculate
    if (key !== this.lastKey || JSON.stringify(params) !== JSON.stringify(this.lastParams)) {
      this.lastKey = key;
      this.lastParams = params;
      this.lastValue = this.translationService.translate(key, params);
    }
    
    return this.lastValue;
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }
}