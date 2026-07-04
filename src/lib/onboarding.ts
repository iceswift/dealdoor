// src/lib/onboarding.ts

export interface OnboardingState {
  step: number;
  shop: {
    name: string;
    category: string;
    description: string;
    phone: string;
    lineId: string;
    address: string;
  };
  deals: Array<{
    title: string;
    category: string;
    discountText: string;
    endDate: string;
    couponCode?: string;
    claimType: string;
  }>;
}

const STORAGE_KEY = 'dealdoor_onboarding';

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return getDefaultState();
    }
  }

  return getDefaultState();
}

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function clearOnboardingState(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getDefaultState(): OnboardingState {
  return {
    step: 1,
    shop: {
      name: '',
      category: 'cafe',
      description: '',
      phone: '',
      lineId: '',
      address: '',
    },
    deals: [],
  };
}

// Quick deal templates
export const DEAL_TEMPLATES = [
  {
    name: 'Birthday Deal',
    icon: '🎂',
    data: {
      title: 'Birthday Month Free',
      category: 'birthday',
      discountText: 'ฟรี 1 ชิ้น',
      claimType: 'copy_code',
      endDate: getNextMonthEnd(),
    },
  },
  {
    name: 'Student Discount',
    icon: '🎓',
    data: {
      title: 'Student 10% Off',
      category: 'student',
      discountText: 'ลด 10%',
      claimType: 'show_at_shop',
      endDate: getNextMonthEnd(),
    },
  },
  {
    name: 'Monthly Special',
    icon: '📅',
    data: {
      title: 'Monthly Special',
      category: 'monthly',
      discountText: 'ราคาพิเศษ',
      claimType: 'copy_code',
      endDate: getNextMonthEnd(),
    },
  },
  {
    name: 'Flash Sale',
    icon: '⚡',
    data: {
      title: 'Flash Sale',
      category: 'flash',
      discountText: 'ลดพิเศษ',
      claimType: 'copy_code',
      endDate: getWeekEnd(),
    },
  },
];

function getNextMonthEnd(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return nextMonth.toISOString().split('T')[0];
}

function getWeekEnd(): string {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return weekEnd.toISOString().split('T')[0];
}
