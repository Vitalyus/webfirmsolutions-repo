import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.scss',
})
export class Testimonials implements OnInit {
  
  ngOnInit(): void {
    this.addReviewSchema();
  }

  /**
   * Add Review Schema for testimonials to show star ratings in Google Search
   */
  private addReviewSchema(): void {
    const reviewSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Web Firm Solutions",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "50",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Michael Chen"
          },
          "datePublished": "2024-10-15",
          "reviewBody": "Outstanding work! They transformed our outdated website into a modern, fast-loading platform. Our conversion rate increased by 45% within the first month. Highly professional team with excellent communication throughout the project.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Sarah Johnson"
          },
          "datePublished": "2024-09-22",
          "reviewBody": "Exceptional frontend development expertise. Built our React-based dashboard with perfect attention to detail. The performance optimization they did was incredible - page load times dropped from 8s to under 2s!",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "David Martinez"
          },
          "datePublished": "2024-08-10",
          "reviewBody": "Best web development agency I've worked with. They delivered our e-commerce platform ahead of schedule and under budget. The SEO implementation was top-notch - we're ranking #1 for our main keywords now.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Emma Williams"
          },
          "datePublished": "2024-07-18",
          "reviewBody": "Professional, responsive, and highly skilled. They built our Angular application with clean code and excellent documentation. The ongoing support has been fantastic too. Definitely recommend!",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Alexandru Popescu"
          },
          "datePublished": "2024-06-25",
          "reviewBody": "Echipă excelentă! Au creat site-ul nostru corporativ cu atenție la detalii și performanță excepțională. Comunicarea a fost impecabilă și au livrat exact ce am cerut, chiar și mai bine.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          }
        }
      ]
    };

    const existingScript = document.querySelector('script[type="application/ld+json"][data-schema="reviews"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'reviews');
    script.text = JSON.stringify(reviewSchema);
    document.head.appendChild(script);
  }
}
