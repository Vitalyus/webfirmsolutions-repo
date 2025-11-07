import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { ServicesComponent } from '../services/services.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    ServicesComponent,
    AboutComponent,
    ContactComponent
  ],
  template: `
    <app-hero id="hero"></app-hero>
    <app-services id="services"></app-services>
    <app-about id="about"></app-about>
    <app-contact id="contact"></app-contact>
  `
})
export class HomeComponent {}