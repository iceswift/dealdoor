# DealDoor — Accessibility (a11y) Design

---

## 1. Overview

Accessibility ensures DealDoor is usable by everyone, including people with disabilities.

---

## 2. Standards

| Standard | Level | Description |
|----------|-------|-------------|
| WCAG 2.1 | AA | Web Content Accessibility Guidelines |
| ARIA | 1.1 | Accessible Rich Internet Applications |
| Section 508 | - | US federal accessibility (reference) |

---

## 3. Core Principles (POUR)

| Principle | Description | Example |
|-----------|-------------|---------|
| **Perceivable** | Content can be perceived by all users | Alt text, color contrast |
| **Operable** | Interface can be operated by all users | Keyboard navigation |
| **Understandable** | Content and UI are understandable | Clear labels, error messages |
| **Robust** | Content works with assistive technologies | Semantic HTML, ARIA |

---

## 4. Color & Contrast

### 4.1 Color Contrast Ratios

| Element | Ratio | Status |
|---------|-------|--------|
| Body text on white | 15.4:1 | ✅ AAA |
| Secondary text on white | 5.7:1 | ✅ AA |
| Primary on white | 4.6:1 | ✅ AA |
| White on primary | 4.6:1 | ✅ AA |
| Dark mode body text | 14.8:1 | ✅ AAA |
| Dark mode secondary | 5.2:1 | ✅ AA |

### 4.2 Color Independence

```css
/* Never use color alone to convey information */

/* ❌ Bad */
.error { color: red; }

/* ✅ Good */
.error {
  color: var(--color-danger);
  border-left: 3px solid var(--color-danger);
}

.error::before {
  content: "⚠️ ";
}
```

### 4.3 Focus Indicators

```css
/* Visible focus for all interactive elements */

:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Remove default outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 5. Keyboard Navigation

### 5.1 Tab Order

| Element | Tab Order | Focus Visible |
|---------|-----------|---------------|
| Links | Natural flow | Yes |
| Buttons | Natural flow | Yes |
| Form inputs | Natural flow | Yes |
| Modals | Trap focus | Yes |
| Skip link | First element | Yes |

### 5.2 Skip Navigation

```astro
---
// src/components/shared/SkipLink.astro
---

<a href="#main-content" class="skip-link">
  ข้ามไปยังเนื้อหา
</a>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-primary);
    color: white;
    padding: 8px 16px;
    z-index: 100;
    transition: top 0.2s;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

### 5.3 Keyboard Shortcuts

| Shortcut | Action | Page |
|----------|--------|------|
| `Tab` | Move to next element | All |
| `Shift+Tab` | Move to previous element | All |
| `Enter` | Activate link/button | All |
| `Space` | Activate button | All |
| `Escape` | Close modal | Modals |
| `/` | Focus search | Explore |

```typescript
// src/lib/keyboard.ts

export function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Focus search on /
    if (e.key === '/' && !isInputFocused()) {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
    }

    // Close modal on Escape
    if (e.key === 'Escape') {
      closeActiveModal();
    }
  });
}

function isInputFocused(): boolean {
  const active = document.activeElement;
  return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
}
```

---

## 6. Semantic HTML

### 6.1 Heading Hierarchy

```astro
<!-- ✅ Correct heading hierarchy -->
<h1>Shop Name</h1>
  <h2>Current Deals</h2>
    <h3>Deal Title</h3>
  <h2>Menu</h2>
    <h3>Item Name</h3>
  <h2>Shop Information</h2>
```

### 6.2 Landmarks

```astro
<html>
<body>
  <SkipLink />
  <header role="banner">
    <nav aria-label="Main navigation">
      <!-- Navigation -->
    </nav>
  </header>
  
  <main id="main-content">
    <!-- Page content -->
  </main>
  
  <footer role="contentinfo">
    <!-- Footer -->
  </footer>
</body>
</html>
```

### 6.3 Lists

```astro
<!-- ✅ Use semantic lists -->
<ul role="list">
  {deals.map(deal => (
    <li>
      <DealCard deal={deal} />
    </li>
  ))}
</ul>

<!-- ✅ Navigation list -->
<nav aria-label="Categories">
  <ul role="list">
    <li><a href="/explore/cafe">Cafe</a></li>
    <li><a href="/explore/restaurant">Restaurant</a></li>
  </ul>
</nav>
```

---

## 7. Images & Media

### 7.1 Alt Text

```astro
<!-- ✅ Descriptive alt text -->
<img src={shop.coverImage} alt={`${shop.name} cover image`} />

<!-- ✅ Empty alt for decorative images -->
<img src="/decorative-pattern" alt="" role="presentation" />

<!-- ❌ Bad: Missing alt -->
<img src={shop.coverImage} />

<!-- ❌ Bad: Filename as alt -->
<img src="cover.jpg" alt="cover.jpg" />
```

### 7.2 Complex Images

```astro
<!-- For charts or complex images -->
<figure>
  <img src={chartUrl} alt="Bar chart showing monthly deal views" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Monthly deal views: January 150, February 200, March 180
  </figcaption>
</figure>
```

---

## 8. Forms

### 8.1 Labels

```astro
<!-- ✅ Always associate labels with inputs -->
<div>
  <label for="shop-name">ชื่อร้าน</label>
  <input id="shop-name" type="text" required aria-required="true" />
</div>

<!-- ✅ For required fields -->
<div>
  <label for="category">
    ประเภทร้าน <span aria-hidden="true">*</span>
    <span class="sr-only">(จำเป็น)</span>
  </label>
  <select id="category" required aria-required="true">
    <option value="">เลือกประเภท</option>
    <!-- options -->
  </select>
</div>
```

### 8.2 Error Messages

```astro
<div>
  <label for="phone">เบอร์โทร</label>
  <input
    id="phone"
    type="tel"
    aria-invalid={!!error}
    aria-describedby={error ? "phone-error" : undefined}
  />
  {error && (
    <p id="phone-error" role="alert" class="text-red-500 text-sm">
      {error}
    </p>
  )}
</div>
```

### 8.3 Form Groups

```astro
<fieldset>
  <legend>ข้อมูลติดต่อ</legend>
  
  <div>
    <label for="phone">เบอร์โทร</label>
    <input id="phone" type="tel" />
  </div>
  
  <div>
    <label for="line">LINE ID</label>
    <input id="line" type="text" />
  </div>
</fieldset>
```

---

## 9. ARIA Attributes

### 9.1 Common ARIA

```astro
<!-- Button with icon only -->
<button aria-label="แชร์">
  <ShareIcon />
</button>

<!-- Status indicator -->
<span role="status" aria-live="polite">
  {isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
</span>

<!-- Expandable content -->
<button aria-expanded={isOpen} aria-controls="menu-content">
  เมนู
</button>
<div id="menu-content" hidden={!isOpen}>
  <!-- Content -->
</div>

<!-- Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">รายละเอียดดีล</h2>
  <!-- Modal content -->
</div>
```

### 9.2 Live Regions

```astro
<!-- For dynamic content updates -->
<div aria-live="polite" aria-atomic="true">
  {toast && <Toast message={toast.message} />}
</div>

<!-- For search results count -->
<p aria-live="polite">
  พบ {results.length} ผลลัพธ์
</p>
```

---

## 10. Components Accessibility

### 10.1 Deal Card

```astro
<article aria-label={`ดีล: ${deal.title}`}>
  <div>
    <span aria-label={`หมวดหมู่: ${categoryLabel}`}>{categoryLabel}</span>
    <span aria-label={`หมดอายุ: ${formatDate(deal.endDate)}`}>
      {formatDate(deal.endDate)}
    </span>
  </div>
  
  <h3>{deal.title}</h3>
  <p>{deal.shortDescription}</p>
  
  <div>
    <button
      aria-label={`คัดลอกโค้ด ${deal.couponCode}`}
      onClick={handleCopy}
    >
      คัดลอกโค้ด
    </button>
    <button
      aria-label={`แชร์ดีล ${deal.title}`}
      onClick={handleShare}
    >
      แชร์
    </button>
  </div>
</article>
```

### 10.2 Countdown Badge

```astro
<span
  role="timer"
  aria-label={`เหลือ ${daysLeft} วัน`}
  class:list={[badgeClass]}
>
  <span aria-hidden="true">⏰</span>
  เหลือ {daysLeft} วัน
</span>
```

### 10.3 Contact Buttons

```astro
<nav aria-label="ช่องทางติดต่อ">
  <a href={mapUrl} aria-label={`เปิดแผนที่ ${shop.name}`}>
    <span aria-hidden="true">📍</span>
    แผนที่
  </a>
  <a href={lineUrl} aria-label={`ติดต่อ ${shop.name} ผ่าน LINE`}>
    <span aria-hidden="true">💬</span>
    LINE
  </a>
</nav>
```

---

## 11. Reduced Motion

```css
/* Respect user's motion preferences */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 12. Screen Reader Utilities

```css
/* Visually hidden but accessible to screen readers */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 13. Testing Checklist

### Automated Testing

```bash
# Install axe-core for testing
pnpm add -D @axe-core/playwright
```

```typescript
// tests/a11y.spec.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('shop page has no accessibility violations', async ({ page }) => {
  await page.goto('/moon-bowl-cafe');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});
```

### Manual Testing

| Test | Method | Pass |
|------|--------|------|
| Keyboard navigation | Tab through all elements | All reachable |
| Focus visible | Check all focus states | Visible |
| Screen reader | Test with NVDA/VoiceOver | Meaningful |
| Color contrast | Use axe or WAVE | AA compliant |
| Zoom to 200% | Browser zoom | Readable |
| Form errors | Submit invalid forms | Announced |

---

## 14. Accessibility Checklist

### Perceivable
- [ ] All images have alt text
- [ ] Color contrast meets AA (4.5:1)
- [ ] Content is readable at 200% zoom
- [ ] Videos have captions (if applicable)

### Operable
- [ ] All interactive elements are keyboard accessible
- [ ] Focus is visible on all elements
- [ ] No keyboard traps (except modals)
- [ ] Skip navigation link provided

### Understandable
- [ ] Page language is set (`lang="th"`)
- [ ] Labels are associated with inputs
- [ ] Error messages are clear and announced
- [ ] Consistent navigation

### Robust
- [ ] Valid HTML
- [ ] ARIA used correctly
- [ ] Works with screen readers
- [ ] Works without JavaScript (core content)

---

## 15. File Structure

```
src/
├── components/
│   └── shared/
│       └── SkipLink.astro
├── lib/
│   └── keyboard.ts
└── styles/
    └── global.css          # Focus styles, sr-only
```
