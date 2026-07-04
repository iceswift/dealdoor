# DealDoor — Technical Architecture

---

## 1. Tech Stack Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Astro | 4.x | Static/SSR hybrid, island architecture |
| UI Library | React | 18.x | Interactive components (dashboard, modals) |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Database | SQLite | 3.x | Local file-based database |
| ORM | Drizzle ORM | 0.x | Type-safe SQL queries |
| DB Admin | Drizzle Studio | - | Visual database browser |
| Migrations | Drizzle Kit | 0.x | Schema migrations |
| Package Manager | pnpm | 9.x | Fast, disk-efficient |
| Runtime | Node.js | 20.x | Server-side rendering |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Landing  │  │Shop Page │  │ Explore  │  │Dashboard │   │
│  │ (Static) │  │  (SSR)   │  │  (SSR)   │  │  (CSR)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│        │             │             │             │           │
│        └─────────────┴─────────────┴─────────────┘           │
│                          │                                   │
│                    Astro Islands                              │
│                   (React hydration)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Astro Server (Node)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Astro Middleware                     │   │
│  │           (routing, SSR, API routes)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Drizzle ORM                         │   │
│  │              (query builder, type safety)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    SQLite Database                     │   │
│  │                    (dev.db file)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Rendering Strategy

| Page | Strategy | Reason |
|------|----------|--------|
| Landing (`/`) | Static (SSG) | No dynamic data, fast load |
| Shop Page (`/[slug]`) | SSR | Dynamic data, SEO important |
| Explore (`/explore`) | SSR | Dynamic data, SEO important |
| Dashboard (`/dashboard`) | CSR (Astro + React island) | Interactive, no SEO needed |

### 3.1 Astro Island Architecture

```astro
---
// Shop page uses SSR for SEO
export const prerender = false;

import ShopHeader from '../components/shop/ShopHeader.astro';
import DealCard from '../components/shop/DealCard.astro';
import DealDetailModal from '../components/shop/DealDetailModal.tsx'; // React island
import ContactButtons from '../components/shop/ContactButtons.tsx'; // React island
---

<ShopLayout title={shop.name}>
  <ShopHeader shop={shop} />
  
  <!-- Static deal cards -->
  {deals.map(deal => (
    <DealCard deal={deal} />
  ))}
  
  <!-- React island for interactive modal -->
  <DealDetailModal client:visible deals={deals} />
  
  <!-- React island for interactive buttons -->
  <ContactButtons client:visible shop={shop} />
</ShopLayout>
```

---

## 4. Project Structure

```
dealdoor/
├── public/
│   ├── images/                    # Static images
│   │   ├── shops/                 # Shop covers & logos
│   │   ├── deals/                 # Deal images
│   │   └── menu/                  # Menu item images
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── pages/
│   │   ├── index.astro            # Landing page
│   │   ├── explore/
│   │   │   ├── index.astro        # Explore all
│   │   │   └── [category].astro   # Explore by category
│   │   ├── [slug].astro           # Shop page (dynamic)
│   │   └── dashboard/
│   │       ├── index.astro        # Dashboard home
│   │       ├── deals.astro        # Deal management
│   │       ├── menu.astro         # Menu management
│   │       ├── settings.astro     # Shop settings
│   │       └── preview.astro      # Page preview
│   ├── components/
│   │   ├── shop/
│   │   │   ├── ShopHeader.astro
│   │   │   ├── DealCard.astro
│   │   │   ├── DealDetailModal.tsx
│   │   │   ├── MenuList.astro
│   │   │   ├── ShopInfo.astro
│   │   │   ├── MapPreview.astro
│   │   │   └── ContactButtons.tsx
│   │   ├── explore/
│   │   │   ├── ExploreFeed.astro
│   │   │   ├── CategoryChips.astro
│   │   │   ├── SearchBar.tsx
│   │   │   └── ExpiringSoon.astro
│   │   ├── dashboard/
│   │   │   ├── ShopForm.tsx
│   │   │   ├── DealForm.tsx
│   │   │   ├── DealList.tsx
│   │   │   ├── MenuForm.tsx
│   │   │   └── ShareLink.tsx
│   │   └── shared/
│   │       ├── Header.astro
│   │       ├── Footer.astro
│   │       ├── CountdownBadge.astro
│   │       ├── CategoryBadge.astro
│   │       ├── ThemeToggle.tsx     # Light/dark toggle
│   │       ├── ThemeScript.astro   # Prevent flash
│   │       ├── LangSwitcher.tsx    # Language switcher
│   │       ├── Toast.tsx
│   │       └── Skeleton.astro
│   ├── i18n/                       # Internationalization
│   │   ├── index.ts                # i18n config & helpers
│   │   ├── th/                     # Thai translations
│   │   │   ├── common.json
│   │   │   ├── shop.json
│   │   │   ├── deal.json
│   │   │   ├── dashboard.json
│   │   │   └── explore.json
│   │   └── en/                     # English translations
│   │       ├── common.json
│   │       ├── shop.json
│   │       ├── deal.json
│   │       ├── dashboard.json
│   │       └── explore.json
│   ├── layouts/
│   │   ├── BaseLayout.astro       # Root HTML layout
│   │   ├── ShopLayout.astro       # Shop page layout
│   │   └── DashboardLayout.astro  # Dashboard layout
│   ├── lib/
│   │   ├── db.ts                  # Drizzle client
│   │   ├── queries.ts             # Database queries
│   │   ├── utils.ts               # Utility functions
│   │   ├── constants.ts           # Constants & enums
│   │   ├── theme.ts               # Theme utilities
│   │   └── mock-data.ts           # Mock data for prototype
│   └── styles/
│       └── global.css             # Global styles + CSS variables
├── db/
│   ├── schema.ts                  # Drizzle schema
│   ├── seed.ts                    # Seed script
│   └── dev.db                     # SQLite database file
├── drizzle/
│   └── migrations/                # Auto-generated
├── drizzle.config.ts              # Drizzle Kit config
├── astro.config.ts                # Astro config (with i18n)
├── tailwind.config.mjs            # Tailwind config (with dark mode)
├── tsconfig.json                  # TypeScript config
├── package.json
└── pnpm-lock.yaml
```

---

## 5. Configuration Files

### 5.1 `package.json`

```json
{
  "name": "dealdoor",
  "type": "module",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "@astrojs/react": "^3.6.0",
    "@astrojs/tailwind": "^5.1.0",
    "@astrojs/node": "^8.3.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "drizzle-orm": "^0.33.0",
    "better-sqlite3": "^11.3.0",
    "@paralleldrive/cuid2": "^2.2.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.0",
    "drizzle-kit": "^0.24.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0"
  }
}
```

### 5.2 `astro.config.ts`

```typescript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [
    react(),
    tailwind(),
  ],
  output: 'hybrid',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    optimizeDeps: {
      exclude: ['better-sqlite3'],
    },
  },
});
```

### 5.3 `tailwind.config.mjs`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E55A2B',
          light: '#FFF0EB',
        },
        secondary: {
          DEFAULT: '#1A1A2E',
          light: '#2D2D44',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'shop': '480px',
      },
    },
  },
  plugins: [],
};
```

### 5.4 `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './db/dev.db',
  },
});
```

---

## 6. Database Connection

```typescript
// src/lib/db.ts

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../db/schema';

const sqlite = new Database('./db/dev.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
```

---

## 7. Environment Variables

```env
# .env

# Database
DATABASE_URL=./db/dev.db

# Site
SITE_URL=https://dealdoor.co
PUBLIC_SITE_URL=https://dealdoor.co

# Astro
ASTRO_OUTPUT=hybrid
```

---

## 8. Deployment Strategy

### Phase 1: MVP (Local / VPS)

```
┌─────────────────────────────┐
│      Node.js Server         │
│  ┌───────────────────────┐  │
│  │    Astro SSR App      │  │
│  │    (port 4321)        │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │    SQLite (dev.db)    │  │
│  │    (local file)       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Options:**
- Render.com
- Railway.app
- Fly.io
- VPS (DigitalOcean, Linode)

### Phase 2: Growth (Cloud)

```
┌─────────────────────────────┐
│    Cloudflare Workers       │
│  ┌───────────────────────┐  │
│  │    Astro SSR App      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │    Cloudflare D1      │  │
│  │    (SQLite edge)      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Or:**
```
┌─────────────────────────────┐
│    Vercel / Netlify         │
│  ┌───────────────────────┐  │
│  │    Astro SSR App      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │    Turso (SQLite)     │  │
│  │    or Supabase        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 9. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FCP | < 1.5s | First Contentful Paint |
| LCP | < 2.5s | Largest Contentful Paint |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTI | < 3.5s | Time to Interactive |
| Bundle Size | < 100KB | JS shipped to client |

---

## 10. Caching Strategy

| Resource | Strategy | Duration |
|----------|----------|----------|
| Static assets | Cache-Control: immutable | 1 year |
| Shop page | SSR, CDN cache | 5 minutes |
| Explore page | SSR, CDN cache | 1 minute |
| Dashboard | No cache | 0 |
| API responses | No cache | 0 |

---

## 11. Security Considerations

### MVP (Prototype)
- No authentication (dashboard accessible directly)
- No user input sanitization needed (mock data only)
- No CORS issues (same origin)

### Future
- Add authentication (Lucia Auth or Clerk)
- Input sanitization for all user-provided content
- CSRF protection for forms
- Rate limiting for API routes
- Content Security Policy headers

---

## 12. Monitoring & Analytics (Future)

| Tool | Purpose |
|------|---------|
| Plausible / Umami | Privacy-friendly analytics |
| Sentry | Error tracking |
| UptimeRobot | Uptime monitoring |

---

## 13. Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio

# Build for production
pnpm build

# Preview production build
pnpm preview
```
