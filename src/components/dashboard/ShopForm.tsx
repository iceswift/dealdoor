// src/components/dashboard/ShopForm.tsx

import { useState, useEffect } from 'react';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABELS } from '../../lib/constants';
import type { ShopCategory } from '../../lib/constants';
import type { Shop } from '../../../db/schema';
import ImageUpload from '../shared/ImageUpload.tsx';

interface ShopFormProps {
  shop: Shop | null;
  merchantId?: string;
  onSuccess: (shop: Shop) => void;
  onChange?: (data: any) => void;
}

type TabType = 'basic' | 'contact' | 'amenities' | 'branding';

export default function ShopForm({ shop, merchantId, onSuccess, onChange }: ShopFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Basic
    name: '',
    category: 'cafe' as ShopCategory,
    description: '',
    address: '',
    // Contact
    phone: '',
    lineId: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    websiteUrl: '',
    // Payment
    acceptsPromptPay: false,
    acceptsCash: true,
    acceptsCreditCard: false,
    acceptsTrueMoney: false,
    acceptsRabbitLinePay: false,
    paymentNotes: '',
    // Accessibility
    wheelchairAccessible: false,
    strollerAccessible: false,
    seniorFriendlyRestroom: false,
    elevatorAvailable: false,
    brailleMenu: false,
    accessibilityNotes: '',
    // Parking
    freeParking: false,
    paidParking: false,
    motorcycleParking: false,
    evCharging: false,
    nearbyBts: '',
    nearbyMrt: '',
    parkingNotes: '',
    // Pet
    petFriendly: false,
    petMenu: false,
    petWaterBowl: false,
    petNotes: '',
    // Family
    kidsMenu: false,
    highChairs: false,
    playArea: false,
    babyChanging: false,
    familyNotes: '',
    // Branding
    coverImage: '',
    logoImage: '',
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name,
        category: shop.category as ShopCategory,
        description: shop.description || '',
        address: shop.address || '',
        phone: shop.phone || '',
        lineId: shop.lineId || '',
        facebookUrl: shop.facebookUrl || '',
        instagramUrl: shop.instagramUrl || '',
        tiktokUrl: (shop as any).tiktokUrl || '',
        websiteUrl: shop.websiteUrl || '',
        acceptsPromptPay: (shop as any).acceptsPromptPay || false,
        acceptsCash: (shop as any).acceptsCash ?? true,
        acceptsCreditCard: (shop as any).acceptsCreditCard || false,
        acceptsTrueMoney: (shop as any).acceptsTrueMoney || false,
        acceptsRabbitLinePay: (shop as any).acceptsRabbitLinePay || false,
        paymentNotes: (shop as any).paymentNotes || '',
        wheelchairAccessible: (shop as any).wheelchairAccessible || false,
        strollerAccessible: (shop as any).strollerAccessible || false,
        seniorFriendlyRestroom: (shop as any).seniorFriendlyRestroom || false,
        elevatorAvailable: (shop as any).elevatorAvailable || false,
        brailleMenu: (shop as any).brailleMenu || false,
        accessibilityNotes: (shop as any).accessibilityNotes || '',
        freeParking: (shop as any).freeParking || false,
        paidParking: (shop as any).paidParking || false,
        motorcycleParking: (shop as any).motorcycleParking || false,
        evCharging: (shop as any).evCharging || false,
        nearbyBts: (shop as any).nearbyBts || '',
        nearbyMrt: (shop as any).nearbyMrt || '',
        parkingNotes: (shop as any).parkingNotes || '',
        petFriendly: (shop as any).petFriendly || false,
        petMenu: (shop as any).petMenu || false,
        petWaterBowl: (shop as any).petWaterBowl || false,
        petNotes: (shop as any).petNotes || '',
        kidsMenu: (shop as any).kidsMenu || false,
        highChairs: (shop as any).highChairs || false,
        playArea: (shop as any).playArea || false,
        babyChanging: (shop as any).babyChanging || false,
        familyNotes: (shop as any).familyNotes || '',
        coverImage: shop.coverImage || '',
        logoImage: shop.logoImage || '',
      });
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.category) {
      setError('กรุณากรอกชื่อร้านและประเภท');
      return;
    }

    setLoading(true);

    try {
      const url = shop ? `/api/shops/${shop.id}` : '/api/shops';
      const method = shop ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          merchantId: merchantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'เกิดข้อผิดพลาด');
      }

      onSuccess(data.data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic' as TabType, label: 'ข้อมูลพื้นฐาน', icon: '🏪' },
    { id: 'contact' as TabType, label: 'ติดต่อ', icon: '📞' },
    { id: 'amenities' as TabType, label: 'สิ่งอำนวยความสะดวก', icon: '✨' },
    { id: 'branding' as TabType, label: 'รูปภาพ', icon: '🖼️' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-bg-secondary p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-bg text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary">
              ชื่อร้าน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input mt-1"
              placeholder="เช่น Moon Bowl Cafe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">
              ประเภทร้าน <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHOP_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    formData.category === cat
                      ? 'bg-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {SHOP_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">คำอธิบาย</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input mt-1"
              rows={3}
              placeholder="เกี่ยวกับร้านของคุณ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">ที่อยู่</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input mt-1"
              placeholder="ที่อยู่ร้าน"
            />
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary">เบอร์โทร</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input mt-1"
                placeholder="081-234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary">LINE ID</label>
              <input
                type="text"
                value={formData.lineId}
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                className="input mt-1"
                placeholder="@shopname"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary">Facebook</label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="input mt-1"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary">Instagram</label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="input mt-1"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-secondary">TikTok</label>
              <input
                type="url"
                value={formData.tiktokUrl}
                onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                className="input mt-1"
                placeholder="https://tiktok.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary">Website</label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="input mt-1"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Amenities Tab */}
      {activeTab === 'amenities' && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-secondary">💳 ช่องทางชำระเงิน</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { key: 'acceptsPromptPay', label: 'PromptPay', icon: '💳' },
                { key: 'acceptsCash', label: 'เงินสด', icon: '💵' },
                { key: 'acceptsCreditCard', label: 'บัตรเครดิต', icon: '💳' },
                { key: 'acceptsTrueMoney', label: 'TrueMoney', icon: '📱' },
                { key: 'acceptsRabbitLinePay', label: 'Rabbit LINE Pay', icon: '🐰' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span className="text-sm">{item.icon} {item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-secondary">♿ สิ่งอำนวยความสะดวก</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'wheelchairAccessible', label: 'รถเข็นวีลแชร์', icon: '♿' },
                { key: 'strollerAccessible', label: 'รถเข็นเด็ก', icon: '👶' },
                { key: 'seniorFriendlyRestroom', label: 'ห้องน้ำผู้สูงอายุ', icon: '🚻' },
                { key: 'elevatorAvailable', label: 'ลิฟท์', icon: '🛗' },
                { key: 'brailleMenu', label: 'เมนูเบรลล์', icon: '📖' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span className="text-sm">{item.icon} {item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Parking */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-secondary">🅿️ ที่จอดรถ & การเดินทาง</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'freeParking', label: 'ที่จอดรถฟรี', icon: '🅿️' },
                { key: 'paidParking', label: 'ที่จอดรถเสียเงิน', icon: '💰' },
                { key: 'motorcycleParking', label: 'ที่จอดมอเตอร์ไซค์', icon: '🏍️' },
                { key: 'evCharging', label: 'ชาร์จ EV', icon: '⚡' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span className="text-sm">{item.icon} {item.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-text-secondary">BTS ใกล้เคียง</label>
                <input
                  type="text"
                  value={formData.nearbyBts}
                  onChange={(e) => setFormData({ ...formData, nearbyBts: e.target.value })}
                  className="input mt-1"
                  placeholder="เช่น Siam 500m"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary">MRT ใกล้เคียง</label>
                <input
                  type="text"
                  value={formData.nearbyMrt}
                  onChange={(e) => setFormData({ ...formData, nearbyMrt: e.target.value })}
                  className="input mt-1"
                  placeholder="เช่น Lumphini 300m"
                />
              </div>
            </div>
          </div>

          {/* Pet Policy */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-secondary">🐾 นโยบายสัตว์เลี้ยง</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'petFriendly', label: 'นำสัตว์เลี้ยงเข้าได้', icon: '🐾' },
                { key: 'petMenu', label: 'เมนูสัตว์เลี้ยง', icon: '🍖' },
                { key: 'petWaterBowl', label: 'ชามน้ำสำหรับสัตว์', icon: '💧' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span className="text-sm">{item.icon} {item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Family */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-secondary">👶 สิ่งอำนวยความสะดวกสำหรับครอบครัว</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'kidsMenu', label: 'เมนูเด็ก', icon: '🧒' },
                { key: 'highChairs', label: 'เก้าอี้สูง', icon: '🪑' },
                { key: 'playArea', label: 'สนามเด็กเล่น', icon: '🎠' },
                { key: 'babyChanging', label: 'ที่เปลี่ยนผ้าอ้อม', icon: '👶' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span className="text-sm">{item.icon} {item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-4">
          <ImageUpload
            type="cover"
            currentUrl={shop?.coverImage}
            onUpload={(url) => setFormData({ ...formData, coverImage: url })}
            label="รูปปก"
          />
          <ImageUpload
            type="logo"
            currentUrl={shop?.logoImage}
            onUpload={(url) => setFormData({ ...formData, logoImage: url })}
            label="โลโก้"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary min-h-[44px]"
        >
          {loading ? 'กำลังบันทึก...' : shop ? 'บันทึก' : 'สร้างร้าน'}
        </button>
      </div>
    </form>
  );
}
