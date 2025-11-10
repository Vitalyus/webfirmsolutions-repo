import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface Technology {
  name: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-technologies',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './technologies.html',
  styleUrl: './technologies.scss',
})
export class Technologies {
  technologies = signal<Technology[]>([
    {
      name: 'Angular',
      icon: '🅰️',
      color: '#dd0031',
      description: 'technologies.angular.description'
    },
    {
      name: 'React',
      icon: '⚛️',
      color: '#61dafb',
      description: 'technologies.react.description'
    },
    {
      name: 'TypeScript',
      icon: '📘',
      color: '#3178c6',
      description: 'technologies.typescript.description'
    },
    {
      name: 'Node.js',
      icon: '🟢',
      color: '#339933',
      description: 'technologies.nodejs.description'
    },
    {
      name: 'WordPress',
      icon: '📝',
      color: '#21759b',
      description: 'technologies.wordpress.description'
    },
    {
      name: 'MongoDB',
      icon: '🍃',
      color: '#47a248',
      description: 'technologies.mongodb.description'
    }
  ]);
}
