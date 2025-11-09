import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface Stat {
  id: string;
  icon: string;
  value: number;
  suffix: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-why-choose-us',
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './why-choose-us.html',
  styleUrl: './why-choose-us.scss',
})
export class WhyChooseUs implements OnInit, OnDestroy {
  private animationFrameId?: number;
  
  stats: Stat[] = [
    {
      id: 'experience',
      icon: 'workspace_premium',
      value: 10,
      suffix: '+',
      label: 'Years Experience',
      color: 'primary'
    },
    {
      id: 'projects',
      icon: 'rocket_launch',
      value: 100,
      suffix: '+',
      label: 'Projects Delivered',
      color: 'accent'
    },
    {
      id: 'support',
      icon: 'support_agent',
      value: 24,
      suffix: '/7',
      label: 'Support Available',
      color: 'warn'
    },
    {
      id: 'satisfaction',
      icon: 'favorite',
      value: 98,
      suffix: '%',
      label: 'Client Satisfaction',
      color: 'success'
    }
  ];

  animatedValues = signal<{ [key: string]: number }>({});

  ngOnInit(): void {
    this.observeSection();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private observeSection(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    const section = document.querySelector('.why-choose-us-section');
    if (section) {
      observer.observe(section);
    }
  }

  private animateCounters(): void {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const initialValues: { [key: string]: number } = {};
    
    this.stats.forEach(stat => {
      initialValues[stat.id] = 0;
    });
    
    this.animatedValues.set(initialValues);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const newValues: { [key: string]: number } = {};
      this.stats.forEach(stat => {
        newValues[stat.id] = Math.floor(stat.value * easeProgress);
      });
      
      this.animatedValues.set(newValues);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  trackByStat(index: number, stat: Stat): string {
    return stat.id;
  }
}
