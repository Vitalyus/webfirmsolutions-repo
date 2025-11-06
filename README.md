# Web Firm Solutions - Angular Version

Proiect Angular 20 bazat pe template-ul HTML existent pentru Web Firm Solutions.

## 🚀 Despre Proiect

Aceasta este versiunea Angular a site-ului Web Firm Solutions, convertită din fișierul HTML original în componente modulare Angular cu funcționalitate completă.

## 📋 Funcționalități

### Componente create:
- **Header Component** - Navigație sticky cu scroll smooth
- **Hero Component** - Secțiune hero cu gradient animat și efecte mouse
- **Services Component** - Grid de servicii cu carduri interactive și animații SVG
- **About Component** - Secțiune despre noi cu animații scroll
- **Contact Component** - Formular de contact cu modal interactiv
- **Footer Component** - Footer simplu cu copyright dinamic

### Funcționalități tehnice:
- ✅ **Standalone Components** - Arhitectura Angular modernă
- ✅ **Responsive Design** - Compatibil cu toate device-urile
- ✅ **Scroll Animations** - Animații on-scroll cu Intersection Observer
- ✅ **Interactive Animations** - Hover effects, mouse tracking, SVG animations
- ✅ **SEO Optimized** - Meta tags, Schema.org, Open Graph
- ✅ **TypeScript** - Type safety și IntelliSense
- ✅ **SCSS Modular** - Stiluri organizate pe componente

## 🛠️ Tehnologii Folosite

- **Angular 20** - Framework principal
- **TypeScript 5.8** - Limbaj de programare
- **SCSS** - Preprocessor CSS
- **RxJS** - Reactive programming
- **Angular CLI** - Tooling și build system

## 📦 Instalare

### Prerequisite:
- Node.js 18+ 
- npm sau yarn
- Angular CLI 20+

### Pași de instalare:

1. **Clonează repository-ul:**
   ```bash
   git clone <repository-url>
   cd webfirmsolutions-angular
   ```

2. **Instalează dependențele:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Pornește serverul de development:**
   ```bash
   npm start
   # sau
   ng serve
   ```

4. **Accesează aplicația:**
   - Local: http://localhost:4200/
   - Network: http://192.168.100.45:4200/

## 🔧 Scripturi Disponibile

```bash
npm start          # Pornește serverul de development
npm run build      # Build pentru producție
npm run watch      # Build în watch mode
npm test           # Rulează testele
ng serve           # Serverul de development cu opțiuni
ng build --prod    # Build optimizat pentru producție
```

## 📁 Structura Proiectului

```
src/
├── app/
│   ├── components/
│   │   ├── header/          # Header cu navigație
│   │   ├── hero/            # Secțiunea hero
│   │   ├── services/        # Grid de servicii
│   │   ├── about/           # Despre noi
│   │   ├── contact/         # Contact cu modal
│   │   └── footer/          # Footer
│   ├── app.component.*      # Componenta rădăcină
│   └── ...
├── assets/                  # Resurse statice
├── styles.scss             # Stiluri globale
├── index.html              # Template HTML principal
└── main.ts                 # Bootstrap Angular
```

## 🎨 Personalizare

### Culori (CSS Variables):
```scss
--primary-blue: #0d6efd;
--primary-purple: #6610f2;
--accent-red: #ff6b6b;
--accent-yellow: #ffc107;
```

### Modificarea conținutului:
- **Servicii**: Editează `services.component.ts`
- **Despre noi**: Modifică `about.component.html`
- **Contact**: Schimbă email-ul în `contact.component.ts`

## 🚀 Deploy

### Build pentru producție:
```bash
ng build --configuration production
```

Fișierele generate vor fi în folderul `dist/webfirmsolutions-angular/`.

### Opțiuni de deploy:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop folderul `dist/`
- **Firebase**: `firebase deploy`
- **GitHub Pages**: Cu GitHub Actions

## 📱 Responsive Design

Proiectul este optimizat pentru:
- 📱 **Mobile**: 320px - 768px
- 📟 **Tablet**: 768px - 1024px  
- 💻 **Desktop**: 1024px+

## 🔍 SEO Features

- ✅ Meta tags complete
- ✅ Open Graph pentru social media
- ✅ Schema.org JSON-LD
- ✅ Canonical URLs
- ✅ Semantic HTML structure

## 🎭 Animații și Efecte

- **Scroll Animations**: Intersection Observer API
- **Hover Effects**: CSS transitions și transforms
- **Mouse Tracking**: Gradient dinamic în hero
- **SVG Animations**: Stroke animations pentru iconuri
- **Modal Animations**: Fade in/out cu backdrop blur

## 💡 Dezvoltare Viitoare

Funcționalități planificate:
- [ ] Integrare cu API backend
- [ ] Contact form cu EmailJS
- [ ] Animații mai complexe cu Angular Animations
- [ ] PWA capabilities
- [ ] Internacionalizare (i18n)
- [ ] Blog section
- [ ] Portfolio showcase

## 🤝 Contribuții

1. Fork proiectul
2. Creează o branch pentru feature (`git checkout -b feature/amazing-feature`)
3. Commit modificările (`git commit -m 'Add amazing feature'`)
4. Push pe branch (`git push origin feature/amazing-feature`)
5. Deschide un Pull Request

## 📄 Licență

Acest proiect este licențiat sub MIT License - vezi fișierul [LICENSE](LICENSE) pentru detalii.

## 📞 Contact

**Web Firm Solutions**
- Email: vitalie.condor@gmail.com
- Website: https://webfirmsolutions.com/

---

### 🎯 Status Proiect: ✅ COMPLET

Proiectul Angular este funcțional și gata pentru dezvoltare ulterioară!

**Versiunea originală HTML** vs **Versiunea Angular**:
- ✅ Toate funcționalitățile portate
- ✅ Componente modulare
- ✅ TypeScript integration
- ✅ Better maintainability
- ✅ Scalable architecture