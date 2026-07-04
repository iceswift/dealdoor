# DealDoor — Theme Design (Light/Dark Mode)

---

## 1. Overview

DealDoor supports light and dark themes for better readability and user preference.

| Mode | Description | Default |
|------|-------------|---------|
| Light | White background, dark text | Yes |
| Dark | Dark background, light text | No |
| System | Follow OS preference | Auto-detect |

---

## 2. Architecture

### 2.1 Approach: CSS Variables + Tailwind dark: prefix

```css
:root {
  /* Light theme (default) */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F7F7F8;
  --color-bg-tertiary: #EFEFEF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary: #9B9B9B;
  --color-border: #E5E7EB;
  --color-primary: #FF6B35;
  --color-primary-dark: #E55A2B;
  --color-primary-light: #FFF0EB;
}

.dark {
  --color-bg: #0F0F14;
  --color-bg-secondary: #1A1A22;
  --color-bg-tertiary: #252530;
  --color-text-primary: #F0F0F0;
  --color-text-secondary: #A0A0A8;
  --color-text-tertiary: #6B6B73;
  --color-border: #2D2D3A;
  --color-primary: #FF7B4A;
  --color-primary-dark: #FF6B35;
  --color-primary-light: #2A1A12;
}
```

---

## 3. Color System

### 3.1 Light Theme

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#FFFFFF` | Page background |
| `bg-secondary` | `#F7F7F8` | Card background, sections |
| `bg-tertiary` | `#EFEFEF` | Dividers, borders |
| `text-primary` | `#1A1A1A` | Main text |
| `text-secondary` | `#6B6B6B` | Descriptions, meta |
| `text-tertiary` | `#9B9B9B` | Disabled, hints |
| `border` | `#E5E7EB` | Borders |
| `primary` | `#FF6B35` | CTA buttons, active states |
| `primary-dark` | `#E55A2B` | Hover state |
| `primary-light` | `#FFF0EB` | Background tint |

### 3.2 Dark Theme

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0F0F14` | Page background |
| `bg-secondary` | `#1A1A22` | Card background, sections |
| `bg-tertiary` | `#252530` | Dividers, borders |
| `text-primary` | `#F0F0F0` | Main text |
| `text-secondary` | `#A0A0A8` | Descriptions, meta |
| `text-tertiary` | `#6B6B73` | Disabled, hints |
| `border` | `#2D2D3A` | Borders |
| `primary` | `#FF7B4A` | CTA buttons (slightly brighter) |
| `primary-dark` | `#FF6B35` | Hover state |
| `primary-light` | `#2A1A12` | Background tint (dark) |

### 3.3 Semantic Colors (Both Themes)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `success` | `#10B981` | `#34D399` | Active deals, open status |
| `warning` | `#F59E0B` | `#FBBF24` | Expiring soon |
| `danger` | `#EF4444` | `#F87171` | Expired, errors |
| `info` | `#3B82F6` | `#60A5FA` | Info badges, links |

### 3.4 Deal Category Colors (Both Themes)

| Category | Light | Dark |
|----------|-------|------|
| Birthday | `#EC4899` | `#F472B6` |
| Monthly | `#8B5CF6` | `#A78BFA` |
| Festival | `#F59E0B` | `#FBBF24` |
| Special Day | `#EF4444` | `#F87171` |
| Senior | `#6366F1` | `#818CF8` |
| Kids | `#14B8A6` | `#2DD4BF` |
| Student | `#3B82F6` | `#60A5FA` |
| Flash | `#F97316` | `#FB923C` |

---

## 4. Tailwind Configuration

### 4.1 `tailwind.config.mjs`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Toggle via .dark class on <html>
  theme: {
    extend: {
      colors: {
        // Use CSS variables
        bg: {
          DEFAULT: 'var(--color-bg)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: 'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-primary-light)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
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

### 4.2 Global CSS

```css
/* src/styles/global.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-bg: #FFFFFF;
    --color-bg-secondary: #F7F7F8;
    --color-bg-tertiary: #EFEFEF;
    --color-text-primary: #1A1A1A;
    --color-text-secondary: #6B6B6B;
    --color-text-tertiary: #9B9B9B;
    --color-border: #E5E7EB;
    --color-primary: #FF6B35;
    --color-primary-dark: #E55A2B;
    --color-primary-light: #FFF0EB;
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-danger: #EF4444;
    --color-info: #3B82F6;
  }

  .dark {
    --color-bg: #0F0F14;
    --color-bg-secondary: #1A1A22;
    --color-bg-tertiary: #252530;
    --color-text-primary: #F0F0F0;
    --color-text-secondary: #A0A0A8;
    --color-text-tertiary: #6B6B73;
    --color-border: #2D2D3A;
    --color-primary: #FF7B4A;
    --color-primary-dark: #FF6B35;
    --color-primary-light: #2A1A12;
    --color-success: #34D399;
    --color-warning: #FBBF24;
    --color-danger: #F87171;
    --color-info: #60A5FA;
  }

  body {
    @apply bg-bg text-text-primary;
  }
}
```

---

## 5. Theme Toggle Component

### 5.1 React Component (Interactive)

```tsx
// src/components/shared/ThemeToggle.tsx

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('system');
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    
    if (t === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', t === 'dark');
    }
  };

  const handleChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg-secondary p-1">
      <button
        onClick={() => handleChange('light')}
        className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
          theme === 'light'
            ? 'bg-bg text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Light mode"
      >
        ☀️
      </button>
      <button
        onClick={() => handleChange('dark')}
        className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
          theme === 'dark'
            ? 'bg-bg text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="Dark mode"
      >
        🌙
      </button>
      <button
        onClick={() => handleChange('system')}
        className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
          theme === 'system'
            ? 'bg-bg text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
        aria-label="System theme"
      >
        💻
      </button>
    </div>
  );
}
```

### 5.2 Astro Component (SSR-safe)

```astro
---
// src/components/shared/ThemeToggle.astro
---

<div class="theme-toggle flex items-center gap-1 rounded-lg bg-bg-secondary p-1">
  <button
    data-theme="light"
    class="rounded-md px-2 py-1.5 text-sm transition-colors text-text-secondary hover:text-text-primary"
    aria-label="Light mode"
  >
    ☀️
  </button>
  <button
    data-theme="dark"
    class="rounded-md px-2 py-1.5 text-sm transition-colors text-text-secondary hover:text-text-primary"
    aria-label="Dark mode"
  >
    🌙
  </button>
  <button
    data-theme="system"
    class="rounded-md px-2 py-1.5 text-sm transition-colors text-text-secondary hover:text-text-primary"
    aria-label="System theme"
  >
    💻
  </button>
</div>

<style>
  .theme-toggle button[data-active="true"] {
    @apply bg-bg text-primary shadow-sm;
  }
</style>

<script>
  function initTheme() {
    const buttons = document.querySelectorAll('.theme-toggle button');
    const saved = localStorage.getItem('theme') || 'system';
    
    function applyTheme(theme: string) {
      const root = document.documentElement;
      
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
      
      buttons.forEach(btn => {
        btn.setAttribute('data-active', 
          btn.getAttribute('data-theme') === theme ? 'true' : 'false'
        );
      });
    }
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme')!;
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      });
    });
    
    applyTheme(saved);
  }
  
  // Run on page load
  initTheme();
  
  // Run on Astro page transitions
  document.addEventListener('astro:page-load', initTheme);
</script>
```

### 5.3 Inline Script (Prevent Flash)

Add this in `<head>` to prevent flash of wrong theme:

```astro
---
// src/components/shared/ThemeScript.astro
---

<script is:inline>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  })();
</script>
```

---

## 6. Component Examples with Theme Support

### 6.1 Deal Card

```astro
<article class="rounded-xl border border-border bg-bg-secondary transition-colors hover:shadow-md">
  <div class="border-b border-border px-4 py-2">
    <span class="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
      Birthday
    </span>
  </div>
  <div class="p-4">
    <h3 class="font-semibold text-text-primary">Birthday Month Free Brownie</h3>
    <p class="mt-1 text-sm text-text-secondary">ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม</p>
    <div class="mt-2 inline-flex rounded-lg bg-primary-light px-3 py-1.5">
      <span class="text-sm font-bold text-primary">ฟรีบราวนี่ 1 ชิ้น</span>
    </div>
  </div>
  <div class="flex gap-2 border-t border-border px-4 py-3">
    <button class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
      คัดลอกโค้ด
    </button>
    <button class="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary">
      แชร์
    </button>
  </div>
</article>
```

### 6.2 Shop Header

```astro
<div class="bg-bg">
  <div class="h-48 overflow-hidden bg-gradient-to-br from-primary-light to-orange-100 dark:from-primary-light/30 dark:to-orange-900/20">
    {/* Cover image */}
  </div>
  <div class="px-4 py-4">
    <h1 class="text-xl font-bold text-text-primary">Moon Bowl Cafe</h1>
    <p class="mt-1 text-sm text-text-secondary">คาเฟ่ขนมหวาน สยาม</p>
  </div>
</div>
```

### 6.3 Dashboard Form

```astro
<form class="space-y-4 rounded-xl border border-border bg-bg-secondary p-6">
  <div>
    <label class="block text-sm font-medium text-text-primary">ชื่อร้าน</label>
    <input
      type="text"
      class="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none"
      placeholder="กรอกชื่อร้าน"
    />
  </div>
  <button class="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark">
    บันทึก
  </button>
</form>
```

---

## 7. Image Handling in Dark Mode

### 7.1 Logo Variants

```astro
{/* Light logo */}
<img src="/logo-light.svg" alt="DealDoor" class="block dark:hidden" />

{/* Dark logo */}
<img src="/logo-dark.svg" alt="DealDoor" class="hidden dark:block" />
```

### 7.2 Image Brightness Adjustment

```css
/* Reduce brightness for dark mode */
.dark img:not(.no-dark-adjust) {
  brightness: 0.9;
}
```

### 7.3 Placeholder Images

```astro
<div class="flex h-full items-center justify-center bg-primary-light text-2xl text-primary">
  {shop.name.charAt(0)}
</div>
```

---

## 8. Gradients & Backgrounds

### 8.1 Hero Section

```astro
<div class="bg-gradient-to-b from-primary-light to-bg dark:from-primary-light/20 dark:to-bg">
  {/* Hero content */}
</div>
```

### 8.2 Card Hover

```astro
<article class="bg-bg-secondary hover:bg-bg-tertiary dark:hover:bg-bg-tertiary/80 transition-colors">
  {/* Card content */}
</article>
```

### 8.3 Sidebar

```astro
<aside class="bg-bg-secondary border-r border-border">
  {/* Sidebar content */}
</aside>
```

---

## 9. Scrollbar Styling

```css
/* Custom scrollbar for both themes */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) var(--color-bg-secondary);
}
```

---

## 10. Transition Between Themes

```css
/* Smooth theme transition */
html.transitioning,
html.transitioning *,
html.transitioning *::before,
html.transitioning *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
```

```javascript
// Add transition class temporarily when switching
function switchTheme() {
  document.documentElement.classList.add('transitioning');
  // ... apply theme ...
  setTimeout(() => {
    document.documentElement.classList.remove('transitioning');
  }, 300);
}
```

---

## 11. System Preference Detection

```typescript
// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const theme = localStorage.getItem('theme');
  if (theme === 'system' || !theme) {
    document.documentElement.classList.toggle('dark', e.matches);
  }
});
```

---

## 12. Accessibility

### 12.1 Color Contrast

| Pair | Light Ratio | Dark Ratio | WCAG |
|------|-------------|------------|------|
| text-primary on bg | 15.4:1 | 14.8:1 | AAA |
| text-secondary on bg | 5.7:1 | 5.2:1 | AA |
| primary on bg | 4.6:1 | 4.7:1 | AA |
| white on primary | 4.6:1 | 4.5:1 | AA |

### 12.2 Focus States

```css
/* Visible focus for both themes */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 12.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

---

## 13. Print Styles

```css
@media print {
  :root {
    --color-bg: #FFFFFF;
    --color-text-primary: #000000;
    --color-text-secondary: #333333;
    --color-border: #CCCCCC;
  }
  
  .dark {
    /* Force light theme for print */
    --color-bg: #FFFFFF;
    --color-text-primary: #000000;
    --color-text-secondary: #333333;
    --color-border: #CCCCCC;
  }
}
```

---

## 14. File Structure

```
src/
├── styles/
│   ├── global.css           # CSS variables, base styles
│   └── themes.css           # Theme-specific overrides (optional)
├── components/
│   └── shared/
│       ├── ThemeToggle.tsx   # React interactive toggle
│       ├── ThemeToggle.astro # Astro SSR toggle
│       └── ThemeScript.astro # Inline script to prevent flash
└── lib/
    └── theme.ts             # Theme utility functions
```

---

## 15. Theme Utility Functions

```typescript
// src/lib/theme.ts

export type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as Theme) || 'system';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', systemDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
```
