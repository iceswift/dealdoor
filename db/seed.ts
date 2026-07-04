// db/seed.ts

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, merchants, shops, deals, menuItems } from './schema';
import { createId } from '@paralleldrive/cuid2';
import { hash } from '@node-rs/argon2';

const sqlite = new Database('./db/dev.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF'); // Disable for seeding

const db = drizzle(sqlite);

console.log('🌱 Seeding database...');

// Clear existing data
console.log('  Clearing existing data...');
db.delete(menuItems).run();
db.delete(deals).run();
db.delete(shops).run();
db.delete(merchants).run();
db.delete(users).run();

sqlite.pragma('foreign_keys = ON'); // Re-enable after clearing

// Create test user
console.log('  Creating test user...');
const testUserId = createId();
const testPasswordHash = await hash('password123', {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
});

db.insert(users).values({
  id: testUserId,
  email: 'test@dealdoor.co',
  passwordHash: testPasswordHash,
  name: 'Test Merchant',
  role: 'merchant',
}).run();

// Create merchants
console.log('  Creating merchants...');
const merchant1Id = createId();
const merchant2Id = createId();
const merchant3Id = createId();

db.insert(merchants).values([
  { id: merchant1Id, userId: testUserId, email: 'moon@example.com', name: 'Moon Bowl Owner' },
  { id: merchant2Id, email: 'aroi@example.com', name: 'Aroi Owner' },
  { id: merchant3Id, email: 'glow@example.com', name: 'Glow Owner' },
]).run();

// Create shops
console.log('  Creating shops...');
const shop1Id = createId();
const shop2Id = createId();
const shop3Id = createId();

db.insert(shops).values([
  {
    id: shop1Id,
    merchantId: merchant1Id,
    slug: 'moon-bowl-cafe',
    name: 'Moon Bowl Cafe',
    description: 'คาเฟ่ขนมหวานสไตล์เกาหลี ย่านสยาม',
    category: 'cafe',
    address: '123 ซอยสยามสแควร์ 5 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
    latitude: 13.7466,
    longitude: 100.5348,
    phone: '081-234-5678',
    lineId: '@moonbowlcafe',
    facebookUrl: 'https://facebook.com/moonbowlcafe',
    instagramUrl: 'https://instagram.com/moonbowlcafe',
    openingHours: JSON.stringify({
      mon: '10:00-20:00',
      tue: '10:00-20:00',
      wed: '10:00-20:00',
      thu: '10:00-20:00',
      fri: '10:00-21:00',
      sat: '09:00-21:00',
      sun: '09:00-20:00',
    }),
    isOpen: true,
    tier: 'free',
    maxActiveDeals: 6,
    // Payment
    acceptsPromptPay: true,
    acceptsCash: true,
    acceptsCreditCard: true,
    // Accessibility
    wheelchairAccessible: true,
    strollerAccessible: true,
    // Parking
    freeParking: false,
    paidParking: true,
    nearbyBts: 'Siam 500m',
    // Family
    kidsMenu: true,
    highChairs: true,
  },
  {
    id: shop2Id,
    merchantId: merchant2Id,
    slug: 'aroi-noodle-house',
    name: 'Aroi Noodle House',
    description: 'ร้านก๋วยเตี๋ยวเรือสูตรโบราณ ย่านเยาวราช',
    category: 'restaurant',
    address: '456 ถนนเยาวราช แขวงสัมพันธวงศ์ เขตสัมพันธวงศ์ กรุงเทพฯ 10100',
    latitude: 13.7399,
    longitude: 100.5089,
    phone: '089-876-5432',
    lineId: '@arooodle',
    facebookUrl: 'https://facebook.com/arooodle',
    openingHours: JSON.stringify({
      mon: '08:00-16:00',
      tue: '08:00-16:00',
      wed: '08:00-16:00',
      thu: '08:00-16:00',
      fri: '08:00-16:00',
      sat: '08:00-17:00',
      sun: '08:00-17:00',
    }),
    isOpen: true,
    tier: 'free',
    maxActiveDeals: 6,
    // Payment
    acceptsPromptPay: true,
    acceptsCash: true,
    // Accessibility
    wheelchairAccessible: true,
    seniorFriendlyRestroom: true,
    // Parking
    freeParking: true,
    motorcycleParking: true,
    nearbyMrt: 'Wat Mangkon 200m',
    // Family
    kidsMenu: true,
    highChairs: true,
  },
  {
    id: shop3Id,
    merchantId: merchant3Id,
    slug: 'glow-hair-studio',
    name: 'Glow Hair Studio',
    description: 'ซาลอนสไตล์โมเดิร์น ย่านทองหล่อ',
    category: 'beauty',
    address: '789 ซอยทองหล่อ 10 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    latitude: 13.7307,
    longitude: 100.5867,
    phone: '092-345-6789',
    lineId: '@glowhairstudio',
    facebookUrl: 'https://facebook.com/glowhairstudio',
    instagramUrl: 'https://instagram.com/glowhairstudio',
    websiteUrl: 'https://glowhairstudio.com',
    openingHours: JSON.stringify({
      mon: '10:00-20:00',
      tue: '10:00-20:00',
      wed: '10:00-20:00',
      thu: '10:00-20:00',
      fri: '10:00-21:00',
      sat: '09:00-21:00',
      sun: '09:00-20:00',
    }),
    isOpen: true,
    tier: 'free',
    maxActiveDeals: 6,
    // Payment
    acceptsPromptPay: true,
    acceptsCash: true,
    acceptsCreditCard: true,
    acceptsRabbitLinePay: true,
    // Accessibility
    wheelchairAccessible: true,
    strollerAccessible: true,
    // Pet Policy
    petFriendly: true,
    petWaterBowl: true,
    // Parking
    paidParking: true,
    nearbyBts: 'Thong Lo 800m',
  },
]).run();

// Create deals
console.log('  Creating deals...');

// Moon Bowl deals
const now = new Date();
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

db.insert(deals).values([
  // Moon Bowl deals
  {
    id: createId(),
    shopId: shop1Id,
    title: 'Birthday Month Free Brownie',
    category: 'birthday',
    description: 'ฟรีบราวนี่ 1 ชิ้น เมื่อสั่งเครื่องดื่มใดก็ได้ 1 แก้ว สำหรับเดือนเกิด',
    shortDescription: 'ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม',
    discountText: 'ฟรีบราวนี่ 1 ชิ้น',
    conditions: '• สำหรับเดือนเกิดเท่านั้น\n• แสดงบัตรประชาชน\n• ลูกค้า 1 ท่าน / 1 สิทธิ์\n• ไม่รวมโปรโมชันอื่น',
    couponCode: 'MOONBDAY2025',
    claimType: 'copy_code',
    endDate: in90Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop1Id,
    title: 'Student 10% Off',
    category: 'student',
    description: 'ลด 10% สำหรับนักเรียน/นักศึกษา เมื่อแสดงบัตรนักเรียน/นักศึกษา',
    shortDescription: 'ลด 10% สำหรับนักเรียน',
    discountText: 'ลด 10%',
    conditions: '• แสดงบัตรนักเรียน/นักศึกษา\n• ใช้ได้ทุกวัน\n• ไม่รวมโปรโมชันอื่น',
    claimType: 'show_at_shop',
    endDate: in90Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop1Id,
    title: 'Weekend Coffee Set',
    category: 'monthly',
    description: 'เซตกาแฟวันเสาร์-อาทิตย์ กาแฟ 1 แก้ว + ขนม 1 ชิ้น ราคาพิเศษ ฿159',
    shortDescription: 'เซตกาแฟ + ขนม ฿159',
    discountText: '฿159 (ปกติ ฿220)',
    conditions: '• เฉพาะวันเสาร์-อาทิตย์\n• เลือกเครื่องดื่มเย็นได้\n• เลือกขนมจากเมนูที่ร่วมรายการ',
    couponCode: 'WEEKEND159',
    claimType: 'copy_code',
    endDate: in7Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop1Id,
    title: 'Valentine Dessert Set',
    category: 'special_day',
    description: 'เซตวาเลนไทน์ ขนม 2 ชิ้น + เครื่องดื่ม 2 แก้ว ราคาพิเศษ ฿299',
    shortDescription: 'เซตวาเลนไทน์ ฿299',
    discountText: '฿299 (ปกติ ฿400)',
    conditions: '• เฉพาะวันที่ 14 กุมภาพันธ์\n• จำกัด 50 เซต',
    couponCode: 'VAL2025',
    claimType: 'copy_code',
    endDate: yesterday,
    isActive: false,
  },
  // Aroi deals
  {
    id: createId(),
    shopId: shop2Id,
    title: 'Senior Lunch Deal',
    category: 'senior',
    description: 'ก๋วยเตี๋ยว 1 ชาม + น้ำ 1 แก้ว ราคาพิเศษ ฿69 สำหรับผู้สูงอายุ 60+',
    shortDescription: 'ก๋วยเตี๋ยว + น้ำ ฿69',
    discountText: '฿69 (ปกติ ฿100)',
    conditions: '• อายุ 60+ ปี\n• แสดงบัตรประชาชน\n• เฉพาะวันจันทร์-ศุกร์\n• เวลา 08:00-14:00',
    claimType: 'show_at_shop',
    endDate: in90Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop2Id,
    title: 'Monthly Combo Deal',
    category: 'monthly',
    description: 'ก๋วยเตี๋ยว 2 ชาม + เกี๊ยวทอด 1 จาน + น้ำ 2 แก้ว ราคาพิเศษ ฿199',
    shortDescription: 'เซตคอมโบ ฿199',
    discountText: '฿199 (ปกติ ฿280)',
    conditions: '• ใช้ได้ทุกวัน\n• ไม่รวมโปรโมชันอื่น',
    couponCode: 'AROICOMBO',
    claimType: 'copy_code',
    endDate: in14Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop2Id,
    title: 'Kids Eat Free Sunday',
    category: 'kids',
    description: 'เด็กอายุต่ำกว่า 12 ปี กินฟรี 1 ชาม เมื่อผู้ปกครองสั่ง 2 ชาม',
    shortDescription: 'เด็กกินฟรี วันอาทิตย์',
    discountText: 'ฟรี 1 ชาม',
    conditions: '• เฉพาะวันอาทิตย์\n• เด็กอายุต่ำกว่า 12 ปี\n• ผู้ปกครองสั่ง 2 ชามขึ้นไป',
    claimType: 'show_at_shop',
    endDate: in90Days,
    isActive: true,
  },
  // Glow deals
  {
    id: createId(),
    shopId: shop3Id,
    title: 'First Visit 20% Off',
    category: 'custom',
    description: 'ลด 20% สำหรับลูกค้าใหม่ ทุกบริการ',
    shortDescription: 'ลูกค้าใหม่ ลด 20%',
    discountText: 'ลด 20%',
    conditions: '• สำหรับลูกค้าใหม่เท่านั้น\n• ใช้ได้ 1 ครั้ง\n• ทุกบริการ',
    couponCode: 'GLOW20NEW',
    claimType: 'copy_code',
    endDate: in90Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop3Id,
    title: 'Student Haircut Deal',
    category: 'student',
    description: 'ตัดผม ราคาพิเศษ ฿199 สำหรับนักเรียน/นักศึกษา',
    shortDescription: 'ตัดผมนักเรียน ฿199',
    discountText: '฿199 (ปกติ ฿350)',
    conditions: '• แสดงบัตรนักเรียน/นักศึกษา\n• ตัดผมเท่านั้น\n• ไม่รวมสระไดร์',
    claimType: 'show_at_shop',
    endDate: in30Days,
    isActive: true,
  },
  {
    id: createId(),
    shopId: shop3Id,
    title: "Mother's Day Package",
    category: 'special_day',
    description: 'แพ็กเกจวันแม่ สระ ตัด ไดร์ ทำสี ราคาพิเศษ ฿999',
    shortDescription: 'แพ็กเกจวันแม่ ฿999',
    discountText: '฿999 (ปกติ ฿1,500)',
    conditions: '• เฉพาะวันที่ 12 สิงหาคม\n• จองล่วงหน้า\n• จำกัด 20 คิว',
    couponCode: 'MOM2025',
    claimType: 'copy_code',
    endDate: in30Days,
    isActive: true,
  },
]).run();

// Create menu items for Moon Bowl
console.log('  Creating menu items...');

db.insert(menuItems).values([
  {
    id: createId(),
    shopId: shop1Id,
    name: 'Brownie',
    price: 89,
    description: 'บราวนี่ช็อกโกแลตเข้มข้น',
    sortOrder: 1,
  },
  {
    id: createId(),
    shopId: shop1Id,
    name: 'Matcha Latte',
    price: 120,
    description: 'มัทฉะลาเต้เย็น',
    sortOrder: 2,
  },
  {
    id: createId(),
    shopId: shop1Id,
    name: 'Berry Smoothie',
    price: 130,
    description: 'สมูทตี้เบอร์รี่รวม',
    sortOrder: 3,
  },
  {
    id: createId(),
    shopId: shop1Id,
    name: 'Strawberry Cake',
    price: 150,
    description: 'เค้กสตรอว์เบอร์รี่สด',
    sortOrder: 4,
  },
  {
    id: createId(),
    shopId: shop1Id,
    name: 'Iced Americano',
    price: 95,
    description: 'อเมริกาโน่เย็น',
    sortOrder: 5,
  },
]).run();

console.log('✅ Seed complete!');
console.log(`   - 3 merchants`);
console.log(`   - 3 shops`);
console.log(`   - 10 deals`);
console.log(`   - 5 menu items`);
