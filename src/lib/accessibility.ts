// src/lib/accessibility.ts

// ─── ARIA Helpers ────────────────────────────────────────

export function generateId(prefix: string = 'dd'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Focus Trap ──────────────────────────────────────────

export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// ─── Announce to Screen Readers ──────────────────────────

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

// ─── Keyboard Navigation ─────────────────────────────────

export function handleArrowNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): number {
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      newIndex = (currentIndex + 1) % items.length;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      newIndex = (currentIndex - 1 + items.length) % items.length;
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = items.length - 1;
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      onSelect(currentIndex);
      return currentIndex;
    case 'Escape':
      e.preventDefault();
      (e.target as HTMLElement).blur();
      return currentIndex;
  }

  items[newIndex]?.focus();
  return newIndex;
}

// ─── Reduced Motion ──────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

// ─── Color Contrast ──────────────────────────────────────

export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export function meetsWCAGAAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}
