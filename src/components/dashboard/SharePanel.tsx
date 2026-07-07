// src/components/dashboard/SharePanel.tsx

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';
import { showToast } from '../../lib/toast';

interface SharePanelProps {
  slug: string;
  shopName: string;
  logoUrl?: string | null;
}

type TabType = 'link' | 'qr' | 'social';

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

export default function SharePanel({ slug, shopName }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const url = `https://dealdoor.co/${slug}`;
  const shareText = `ดูโปรโมชันล่าสุดจาก ${shopName}`;

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      try {
        const dataUrl = await QRCodeLib.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#1C1917', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });

        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate QR:', err);
        showToast('ไม่สามารถสร้าง QR Code ได้', 'error');
      }
    }

    generateQR();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      showToast('คัดลอกลิงก์หน้าร้านแล้ว', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy shop URL:', err);
      showToast('คัดลอกไม่ได้ กรุณาคัดลอกลิงก์เอง', 'error');
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      setActiveTab('social');
      showToast('เบราว์เซอร์นี้ไม่รองรับ Native Share เลือกช่องทางแชร์ด้านล่างได้เลย', 'info');
      return;
    }

    try {
      await navigator.share({
        title: `${shopName} - DealDoor`,
        text: shareText,
        url,
      });
      showToast('เปิดเมนูแชร์แล้ว', 'success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      console.error('Failed to open native share:', err);
      setActiveTab('social');
      showToast('เปิด Native Share ไม่ได้ เลือกช่องทางแชร์ด้านล่างแทนได้ครับ', 'warning');
    }
  };

  const handleDownload = async (format: 'png' | 'svg') => {
    setDownloading(true);

    try {
      if (format === 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const padding = 40;
        const qrSize = 300;
        const totalWidth = qrSize + padding * 2;
        const totalHeight = qrSize + padding * 2 + 80;
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, padding, padding, qrSize, qrSize);
          ctx.fillStyle = '#1C1917';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shopName, totalWidth / 2, qrSize + padding + 30);
          ctx.fillStyle = '#78716C';
          ctx.font = '12px sans-serif';
          ctx.fillText('Powered by DealDoor', totalWidth / 2, qrSize + padding + 55);

          const link = document.createElement('a');
          link.download = `${slug}-qr-code.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('ดาวน์โหลด QR Code แล้ว', 'success');
        };
        img.src = qrDataUrl;
        return;
      }

      const svg = await QRCodeLib.toString(url, {
        type: 'svg',
        width: 400,
        margin: 2,
        color: { dark: '#1C1917', light: '#FFFFFF' },
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${slug}-qr-code.svg`;
      link.href = objectUrl;
      link.click();
      URL.revokeObjectURL(objectUrl);
      showToast('ดาวน์โหลด QR Code แล้ว', 'success');
    } catch (err) {
      console.error('Failed to download QR:', err);
      showToast('ดาวน์โหลด QR Code ไม่สำเร็จ', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    {
      id: 'link',
      label: 'คัดลอกลิงก์',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'qr',
      label: 'QR Code',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      id: 'social',
      label: 'โซเชียล',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="rounded-3xl border border-border/30 bg-card-bg/70 backdrop-blur-md shadow-lg overflow-hidden">
      <div className="p-5 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-secondary">แชร์หน้าร้านของคุณ</h3>
            <p className="text-xs text-text-tertiary font-bold">ส่งลิงก์ให้ลูกค้าผ่านช่องทางต่างๆ</p>
          </div>
        </div>

        <div className="flex gap-1 bg-bg-secondary/60 rounded-xl p-1 border border-border/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-card-bg text-primary shadow-sm border border-border/20'
                  : 'text-text-tertiary hover:text-text-secondary border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {activeTab === 'link' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 min-w-0 flex items-center gap-2 bg-bg-secondary/60 border border-border/20 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-bg-secondary cursor-pointer"
                aria-label="คัดลอกลิงก์หน้าร้าน"
              >
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm font-bold text-secondary truncate">{url}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`h-10 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  copied
                    ? 'bg-success text-white shadow-sm'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>คัดลอก</span>
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/20 bg-bg-secondary/40 text-sm font-bold text-text-secondary hover:bg-bg-secondary/80 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              แชร์ผ่านแอป
            </button>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-2xl border-2 border-border/30 bg-white p-3 shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code สำหรับหน้าร้าน" className="h-40 w-40 sm:h-48 sm:w-48" />
                ) : (
                  <div className="flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center">
                    <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                disabled={downloading || !qrDataUrl}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PNG
              </button>
              <button
                type="button"
                onClick={() => handleDownload('svg')}
                disabled={downloading || !qrDataUrl}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border/20 bg-bg-secondary/40 text-xs font-black text-secondary hover:bg-bg-secondary/80 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                SVG
              </button>
            </div>
            <div className="rounded-xl bg-info-bg/50 border border-info/10 p-3 flex items-start gap-2.5">
              <span className="text-base" aria-hidden="true">QR</span>
              <p className="text-xs text-text-secondary font-bold leading-relaxed">
                พิมพ์ QR Code วางที่โต๊ะอาหารหรือหน้าร้าน ลูกค้าสแกนเพื่อดูดีลได้ทันที
              </p>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-2.5">
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 hover:bg-emerald-50 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#06C755] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.72 1.48 5.15 3.79 6.87-.15.56-.57 2.06-.65 2.38-.1.38.14.38.29.28.11-.08 1.83-1.26 2.57-1.78.82.12 1.67.18 2.57.18 5.52 0 10-3.82 10-8.5S17.52 2 12 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-secondary">แชร์บน LINE</p>
                <p className="text-xs text-text-tertiary font-bold">ส่งให้เพื่อนหรือแชร์บน Timeline</p>
              </div>
              <svg className="h-4 w-4 text-text-tertiary group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-50/50 p-3.5 hover:bg-blue-50 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#1877F2] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-secondary">แชร์บน Facebook</p>
                <p className="text-xs text-text-tertiary font-bold">โพสต์บนหน้าโปรไฟล์หรือกลุ่ม</p>
              </div>
              <svg className="h-4 w-4 text-text-tertiary group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-50/50 p-3.5 hover:bg-sky-50 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-[#1DA1F2] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-secondary">แชร์บน X</p>
                <p className="text-xs text-text-tertiary font-bold">โพสต์พร้อมลิงก์ร้านค้า</p>
              </div>
              <svg className="h-4 w-4 text-text-tertiary group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center gap-3 rounded-xl border border-pink-500/20 bg-pink-50/50 p-3.5 hover:bg-pink-50 transition-all group text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-secondary">คัดลอกสำหรับ Instagram</p>
                <p className="text-xs text-text-tertiary font-bold">นำลิงก์ไปวางใน Bio หรือ Story</p>
              </div>
              <svg className="h-4 w-4 text-text-tertiary group-hover:text-pink-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
