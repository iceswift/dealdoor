// src/lib/toast.ts
// Shared toast notification utility

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'success', duration: number = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconPaths: Record<ToastType, string> = {
    success: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />',
    error: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
    warning: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
    info: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-white',
    info: 'bg-info text-white',
  };

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-slide-down ${bgColors[type]}`;
  toast.innerHTML = `
    <svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      ${iconPaths[type]}
    </svg>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).showToast = showToast;
}
