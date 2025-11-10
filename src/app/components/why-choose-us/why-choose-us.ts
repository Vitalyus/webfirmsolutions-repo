import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-why-choose-us',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './why-choose-us.html',
  styleUrl: './why-choose-us.scss',
})
export class WhyChooseUs implements OnInit, OnDestroy {
  private animationFrameId?: number;
  private observer?: IntersectionObserver;

  stats = signal<Stat[]>([
    { value: 50, suffix: '+', label: 'whyChooseUs.experience.label', icon: '🏆' },
    { value: 30, suffix: '+', label: 'whyChooseUs.projects.label', icon: '🎯' },
    { value: 98, suffix: '%', label: 'whyChooseUs.satisfaction.label', icon: '⭐' }
  ]);

  currentValues = signal<number[]>([0, 0, 0]);
  isVisible = signal(false);

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isVisible()) {
            this.isVisible.set(true);
            this.animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    // Observe the component after a small delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.querySelector('.why-choose-us-section');
      if (element) {
        this.observer?.observe(element);
      }
    }, 100);
  }

  private animateCounters(): void {
    const duration = 2000;
    const startTime = performance.now();
    const startValues = [0, 0, 0];
    const endValues = this.stats().map(s => s.value);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const newValues = endValues.map((end, i) => 
        Math.floor(startValues[i] + (end - startValues[i]) * easeOutQuart)
      );
      
      this.currentValues.set(newValues);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  getDisplayValue(index: number): string {
    return this.currentValues()[index]?.toString() || '0';
  }
}
