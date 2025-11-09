import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { ServicesComponent } from '../services/services.component';
import { WhyChooseUs } from '../why-choose-us/why-choose-us';
import { Technologies } from '../technologies/technologies';
import { Portfolio } from '../portfolio/portfolio';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    ServicesComponent,
    WhyChooseUs,
    Technologies,
    Portfolio,
    AboutComponent,
    ContactComponent
  ],
  template: `
    <app-hero id="hero"></app-hero>
    <app-services id="services"></app-services>
    <app-why-choose-us id="why-choose-us"></app-why-choose-us>
    <app-technologies id="technologies"></app-technologies>
    <app-portfolio id="portfolio"></app-portfolio>
    <app-about id="about"></app-about>
    <app-contact id="contact"></app-contact>
  `
})
export class HomeComponent {}