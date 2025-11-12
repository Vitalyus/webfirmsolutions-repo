import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent,
    title: 'Web Development Services | Create Website | Professional Web Design',
    data: {
      description: 'Professional web development services with 9 years experience. Create website, web design, Angular & React experts. 85+ successful projects delivered.',
      keywords: 'web development, create website, web design, build website, professional web development'
    }
  },
  { 
    path: 'services', 
    redirectTo: '', 
    pathMatch: 'full'
  },
  { 
    path: 'portfolio', 
    redirectTo: '', 
    pathMatch: 'full'
  },
  { 
    path: 'about', 
    redirectTo: '', 
    pathMatch: 'full'
  },
  { 
    path: 'contact', 
    redirectTo: '', 
    pathMatch: 'full'
  },
  { 
    path: 'admin', 
    component: AdminComponent,
    title: 'Admin Panel - Web Firm Solutions'
  },
  { 
    path: '404', 
    redirectTo: '',
    pathMatch: 'full'
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];