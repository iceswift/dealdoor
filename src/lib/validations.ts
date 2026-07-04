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
  
  coverImage: z.string().optional(),
  logoImage: z.string().optional(),
  merchantId: z.string().optional(),
});

// ─── Deal Validation ─────────────────────────────────────

export const dealSchema = z.object({
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
