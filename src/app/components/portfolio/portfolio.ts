import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  selectedCategory = signal<string>('all');

  categories = signal<string[]>(['all', 'web', 'ecommerce', 'landing']);

  projects = signal<Project[]>([
    {
      id: '1',
      title: 'portfolio.projects.ecommerce.title',
      description: 'portfolio.projects.ecommerce.description',
      image: 'https://placehold.co/800x600/667eea/ffffff?text=E-Commerce',
      category: 'ecommerce',
      tags: ['Angular', 'Node.js', 'MongoDB']
    },
    {
      id: '2',
      title: 'portfolio.projects.corporate.title',
      description: 'portfolio.projects.corporate.description',
      image: 'https://placehold.co/800x600/764ba2/ffffff?text=Corporate',
      category: 'web',
      tags: ['React', 'TypeScript']
    },
    {
      id: '3',
      title: 'portfolio.projects.startup.title',
      description: 'portfolio.projects.startup.description',
      image: 'https://placehold.co/800x600/f093fb/ffffff?text=Startup',
      category: 'landing',
      tags: ['WordPress', 'SEO']
    },
    {
      id: '4',
      title: 'portfolio.projects.restaurant.title',
      description: 'portfolio.projects.restaurant.description',
      image: 'https://placehold.co/800x600/06b6d4/ffffff?text=Restaurant',
      category: 'web',
      tags: ['Angular', 'Firebase']
    },
    {
      id: '5',
      title: 'portfolio.projects.saas.title',
      description: 'portfolio.projects.saas.description',
      image: 'https://placehold.co/800x600/ec4899/ffffff?text=SaaS',
      category: 'web',
      tags: ['React', 'Node.js']
    },
    {
      id: '6',
      title: 'portfolio.projects.blog.title',
      description: 'portfolio.projects.blog.description',
      image: 'https://placehold.co/800x600/f59e0b/ffffff?text=Blog',
      category: 'landing',
      tags: ['WordPress']
    }
  ]);

  filteredProjects = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.projects();
    }
    return this.projects().filter(p => p.category === category);
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }
}
