import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Technology {
  name: string;
  icon: string;
  color: string;
  category: string;
}

@Component({
  selector: 'app-technologies',
  imports: [CommonModule, MatIconModule],
  templateUrl: './technologies.html',
  styleUrl: './technologies.scss',
})
export class Technologies {
  technologies: Technology[] = [
    { name: 'Angular', icon: 'code', color: '#DD0031', category: 'frontend' },
    { name: 'React', icon: 'psychology', color: '#61DAFB', category: 'frontend' },
    { name: 'TypeScript', icon: 'terminal', color: '#3178C6', category: 'language' },
    { name: 'Node.js', icon: 'dns', color: '#339933', category: 'backend' },
    { name: 'MongoDB', icon: 'storage', color: '#47A248', category: 'database' },
  ];

  trackByTech(index: number, tech: Technology): string {
    return tech.name;
  }
}
