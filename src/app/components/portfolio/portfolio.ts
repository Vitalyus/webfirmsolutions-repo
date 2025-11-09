import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  image: string;
  icon: string;
}

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  selectedCategory = signal<string>('all');

  categories = ['all', 'web', 'mobile', 'design'];

  projects: Project[] = [
    {
      id: 'ecommerce',
      title: 'E-Commerce Platform',
      description: 'Modern online shopping platform with real-time inventory and payment integration',
      category: 'web',
      tags: ['Angular', 'Node.js', 'MongoDB'],
      image: 'shopping_cart',
      icon: 'shopping_cart'
    },
    {
      id: 'fitness-app',
      title: 'Fitness Tracking App',
      description: 'Mobile application for workout tracking and health monitoring',
      category: 'mobile',
      tags: ['React Native', 'Firebase'],
      image: 'fitness_center',
      icon: 'fitness_center'
    },
    {
      id: 'dashboard',
      title: 'Analytics Dashboard',
      description: 'Real-time data visualization dashboard for business intelligence',
      category: 'web',
      tags: ['React', 'D3.js', 'Python'],
      image: 'analytics',
      icon: 'analytics'
    },
    {
      id: 'design-system',
      title: 'Design System',
      description: 'Comprehensive UI component library and design guidelines',
      category: 'design',
      tags: ['Figma', 'Storybook', 'CSS'],
      image: 'palette',
      icon: 'palette'
    },
    {
      id: 'booking-system',
      title: 'Booking System',
      description: 'Appointment scheduling platform with calendar integration',
      category: 'web',
      tags: ['Vue.js', 'Laravel', 'MySQL'],
      image: 'event',
      icon: 'event'
    },
    {
      id: 'social-app',
      title: 'Social Network',
      description: 'Community platform with real-time messaging and content sharing',
      category: 'mobile',
      tags: ['Flutter', 'Firebase', 'Node.js'],
      image: 'groups',
      icon: 'groups'
    }
  ];

  get filteredProjects() {
    if (this.selectedCategory() === 'all') {
      return this.projects;
    }
    return this.projects.filter(p => p.category === this.selectedCategory());
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  trackByProject(index: number, project: Project): string {
    return project.id;
  }
}
