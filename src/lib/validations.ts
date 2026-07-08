// src/lib/validations.ts

import { z } from 'zod';

// ─── Shop Validation ─────────────────────────────────────

export const shopSchema = z.object({
  name: z.string()
    .min(2, 'ชื่อร้านต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อร้านต้องไม่เกิน 50 ตัวอักษร')
    .transform(s => s.trim()),
  
  category: z.enum([
    'restaurant', 'cafe', 'dessert', 'beauty', 
    'clinic', 'retail', 'service', 'other'
  ], {
    errorMap: () => ({ message: 'ประเภทร้านไม่ถูกต้อง' }),
  }),
  
  description: z.string()
    .max(500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  
  address: z.string()
    .max(200, 'ที่อยู่ต้องไม่เกิน 200 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  latitude: z.preprocess(
    (value) => value === undefined || value === '' || value === null ? undefined : Number(value),
    z.number().min(-90, 'Latitude must be at least -90').max(90, 'Latitude must be at most 90').optional()
  ),

  longitude: z.preprocess(
    (value) => value === undefined || value === '' || value === null ? undefined : Number(value),
    z.number().min(-180, 'Longitude must be at least -180').max(180, 'Longitude must be at most 180').optional()
  ),

  openingHours: z.string()
    .max(200, 'เวลาเปิด-ปิดต้องไม่เกิน 200 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),

  isOpen: z.boolean().optional(),
  vacationMode: z.boolean().optional(),
  vacationMessage: z.string()
    .max(160, 'ข้อความหยุดพักร้านต้องไม่เกิน 160 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  vacationUntil: z.preprocess(
    (value) => value === undefined || value === '' || value === null ? undefined : new Date(String(value)),
    z.date().optional()
  ),

  
  phone: z.string()
    .regex(/^[0-9-]{9,12}$/, 'รูปแบบเบอร์โทรไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  
  lineId: z.string()
    .max(30, 'LINE ID ต้องไม่เกิน 30 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  
  facebookUrl: z.string()
    .url('รูปแบบ URL ไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  
  instagramUrl: z.string()
    .url('รูปแบบ URL ไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
  
  websiteUrl: z.string()
    .url('รูปแบบ URL ไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),

  tiktokUrl: z.string()
    .url('รูปแบบ URL ไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),

  acceptsPromptPay: z.boolean().optional(),
  acceptsCash: z.boolean().optional(),
  acceptsCreditCard: z.boolean().optional(),
  acceptsTrueMoney: z.boolean().optional(),
  acceptsRabbitLinePay: z.boolean().optional(),
  paymentNotes: z.string().max(300, 'หมายเหตุการชำระเงินต้องไม่เกิน 300 ตัวอักษร').optional().transform(s => s?.trim() || undefined),

  wheelchairAccessible: z.boolean().optional(),
  strollerAccessible: z.boolean().optional(),
  seniorFriendlyRestroom: z.boolean().optional(),
  elevatorAvailable: z.boolean().optional(),
  brailleMenu: z.boolean().optional(),
  accessibilityNotes: z.string().max(300, 'หมายเหตุสิ่งอำนวยความสะดวกต้องไม่เกิน 300 ตัวอักษร').optional().transform(s => s?.trim() || undefined),

  freeParking: z.boolean().optional(),
  paidParking: z.boolean().optional(),
  motorcycleParking: z.boolean().optional(),
  evCharging: z.boolean().optional(),
  nearbyBts: z.string().max(80, 'BTS ใกล้เคียงต้องไม่เกิน 80 ตัวอักษร').optional().transform(s => s?.trim() || undefined),
  nearbyMrt: z.string().max(80, 'MRT ใกล้เคียงต้องไม่เกิน 80 ตัวอักษร').optional().transform(s => s?.trim() || undefined),
  parkingNotes: z.string().max(300, 'หมายเหตุที่จอดรถต้องไม่เกิน 300 ตัวอักษร').optional().transform(s => s?.trim() || undefined),

  petFriendly: z.boolean().optional(),
  petMenu: z.boolean().optional(),
  petWaterBowl: z.boolean().optional(),
  petNotes: z.string().max(300, 'หมายเหตุสัตว์เลี้ยงต้องไม่เกิน 300 ตัวอักษร').optional().transform(s => s?.trim() || undefined),

  kidsMenu: z.boolean().optional(),
  highChairs: z.boolean().optional(),
  playArea: z.boolean().optional(),
  babyChanging: z.boolean().optional(),
  familyNotes: z.string().max(300, 'หมายเหตุครอบครัวต้องไม่เกิน 300 ตัวอักษร').optional().transform(s => s?.trim() || undefined),
  
  coverImage: z.string().optional(),
  logoImage: z.string().optional(),
  merchantId: z.string().optional(),
});

// ─── Deal Validation ─────────────────────────────────────

const legacyDealSchema = z.object({
  title: z.string()
    .min(2, 'ชื่อดีลต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(100, 'ชื่อดีลต้องไม่เกิน 100 ตัวอักษร')
    .transform(s => s.trim()),
  
  category: z.enum([
    'birthday', 'monthly', 'festival', 'special_day',
    'senior', 'kids', 'student', 'flash', 'custom'
  ], {
    errorMap: () => ({ message: 'หมวดหมู่ไม่ถูกต้อง' }),
  }),
  
  description: z.string()
    .max(1000, 'รายละเอียดต้องไม่เกิน 1000 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  
  shortDescription: z.string()
    .max(200, 'คำอธิบายสั้นต้องไม่เกิน 200 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  
  discountText: z.string()
    .max(100, 'ส่วนลดต้องไม่เกิน 100 ตัวอักษร')
    .transform(s => s.trim()),
  
  conditions: z.string()
    .max(500, 'เงื่อนไขต้องไม่เกิน 500 ตัวอักษร')
    .optional()
    .transform(s => s?.trim() || undefined),
  
  couponCode: z.string()
    .regex(/^[A-Z0-9-]*$/, 'โค้ดต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ ตัวเลข หรือ - เท่านั้น')
    .max(30, 'โค้ดต้องไม่เกิน 30 ตัวอักษร')
    .optional()
    .or(z.literal('')),
  
  claimType: z.enum(['copy_code', 'show_at_shop', 'contact_shop', 'open_line'], {
    errorMap: () => ({ message: 'วิธีรับสิทธิ์ไม่ถูกต้อง' }),
  }),
  
  endDate: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'วันหมดอายุต้องเป็นวันในอนาคต'),
  
  imageUrl: z.string().optional(),
  shopId: z.string().optional(),
});

// ─── User Registration Validation ────────────────────────

export const dealSchema = z.object({
  title: z.string()
    .min(2, 'Deal title must be at least 2 characters')
    .max(100, 'Deal title must be 100 characters or less')
    .transform(s => s.trim()),

  category: z.enum([
    'birthday', 'monthly', 'festival', 'special_day',
    'senior', 'kids', 'student', 'flash', 'custom'
  ], {
    errorMap: () => ({ message: 'Invalid deal category' }),
  }),

  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .transform(s => s?.trim() || undefined),

  shortDescription: z.string()
    .max(200, 'Short summary must be 200 characters or less')
    .optional()
    .transform(s => s?.trim() || undefined),

  discountText: z.string()
    .min(1, 'Please enter the customer benefit')
    .max(100, 'Discount text must be 100 characters or less')
    .transform(s => s.trim()),

  conditions: z.string()
    .max(500, 'Conditions must be 500 characters or less')
    .optional()
    .transform(s => s?.trim() || undefined),

  couponCode: z.string()
    .regex(/^[A-Z0-9-]*$/, 'Coupon code can use A-Z, 0-9, and hyphen only')
    .max(30, 'Coupon code must be 30 characters or less')
    .optional()
    .or(z.literal('')),

  claimType: z.enum(['copy_code', 'show_at_shop', 'contact_shop', 'open_line'], {
    errorMap: () => ({ message: 'Invalid claim method' }),
  }),

  startDate: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      return !isNaN(new Date(val).getTime());
    }, 'Invalid start date'),

  endDate: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'End date must be in the future'),

  imageUrl: z.string().optional(),
  shopId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.claimType === 'copy_code' && !data.couponCode?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['couponCode'],
      message: 'Coupon code is required when the claim method is copy code',
    });
  }

  if (data.startDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'Start date must be before the end date',
      });
    }
  }
});

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    .max(50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร')
    .transform(s => s.trim()),
  
  email: z.string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .transform(s => s.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(100, 'รหัสผ่านต้องไม่เกิน 100 ตัวอักษร'),
});

// ─── User Login Validation ───────────────────────────────

export const loginSchema = z.object({
  email: z.string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .transform(s => s.toLowerCase().trim()),
  
  password: z.string()
    .min(1, 'กรุณากรอกรหัสผ่าน'),
});

// ─── Report Validation ───────────────────────────────────

export const reportSchema = z.object({
  targetType: z.enum(['shop', 'deal'], {
    errorMap: () => ({ message: 'ประเภทไม่ถูกต้อง' }),
  }),
  targetId: z.string().min(1, 'กรุณาระบุรายการ'),
  reason: z.enum(['spam', 'fake', 'offensive', 'scam', 'expired', 'incorrect', 'other'], {
    errorMap: () => ({ message: 'เหตุผลไม่ถูกต้อง' }),
  }),
  description: z.string()
    .max(500, 'รายละเอียดต้องไม่เกิน 500 ตัวอักษร')
    .optional(),
});

// ─── Validation Helper ───────────────────────────────────

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}

