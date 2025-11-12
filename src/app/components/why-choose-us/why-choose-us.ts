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
    this.addFAQSchema();
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

  /**
   * Add FAQ Schema for SEO rich snippets in Google Search
   */
  private addFAQSchema(): void {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What technologies do you use for web development?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We specialize in Angular, React, TypeScript, and modern JavaScript frameworks. Our tech stack includes Vue.js, Next.js, Node.js, and Express for full-stack solutions. We also work with MongoDB, PostgreSQL, and Firebase for database solutions."
          }
        },
        {
          "@type": "Question",
          "name": "How long does it take to build a website?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A typical business website takes 4-8 weeks from start to finish, depending on complexity and features. Simple landing pages can be delivered in 1-2 weeks, while complex web applications with custom functionality may take 3-6 months. We provide detailed timelines during the consultation phase."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer SEO services with web development?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! All our websites are built with SEO best practices from day one. We include technical SEO optimization, on-page SEO, structured data implementation, meta tag optimization, sitemap generation, and Core Web Vitals optimization as standard in every project."
          }
        },
        {
          "@type": "Question",
          "name": "What is your pricing for web development services?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Projects start from €1,500 for professional landing pages, €3,000-€8,000 for business websites with CMS, and €10,000+ for custom web applications with advanced features. We offer flexible payment plans and provide detailed quotes based on your specific requirements."
          }
        },
        {
          "@type": "Question",
          "name": "Do you provide ongoing support and maintenance?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we offer comprehensive monthly maintenance packages starting from €200/month. This includes regular updates, security patches, performance monitoring, backup management, technical support, and content updates. We also provide emergency support for critical issues."
          }
        },
        {
          "@type": "Question",
          "name": "Can you help with existing website optimization?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely! We offer website audit and optimization services including performance optimization, SEO improvements, security hardening, mobile responsiveness fixes, and UI/UX enhancements. We can work with any technology stack and provide detailed improvement reports."
          }
        },
        {
          "@type": "Question",
          "name": "Do you work with international clients?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we work with clients worldwide. We support 5 languages (English, Romanian, French, German, Ukrainian) and have experience delivering projects across Europe, North America, and other regions. We use modern collaboration tools and maintain clear communication throughout the project."
          }
        },
        {
          "@type": "Question",
          "name": "What makes your web development services unique?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We combine 9 years of professional experience with cutting-edge technologies and proven methodologies. Our focus on performance, SEO, and user experience ensures your website not only looks great but also ranks well in search engines and converts visitors into customers. We've completed 85+ successful projects with 98% client satisfaction."
          }
        }
      ]
    };

    // Check if script already exists
    const existingScript = document.querySelector('script[type="application/ld+json"][data-schema="faq"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'faq');
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);
  }
}
