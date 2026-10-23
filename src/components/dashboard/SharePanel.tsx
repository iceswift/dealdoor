// src/components/dashboard/SharePanel.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { showToast } from '../../lib/toast';
import { getSiteOrigin } from '../../lib/site';

interface SharePanelProps {
  slug: string;
  shopName: string;
  logoUrl?: string | null;
}

type TabType = 'link' | 'qr' | 'social';
type CopyState = 'idle' | 'copied' | 'selected';

const productionOrigin = getSiteOrigin();

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

function getShareOrigin() {
  if (typeof window === 'undefined') return productionOrigin;
  return window.location.origin || productionOrigin;
}

function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer,width=720,height=720');
}

export default function SharePanel({ slug, shopName, logoUrl }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [origin, setOrigin] = useState(productionOrigin);
  const [qrReady, setQrReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(getShareOrigin());
  }, []);

  const url = useMemo(() => `${origin}/${slug}`, [origin, slug]);
  const shareText = `ดูโปรโมชันล่าสุดจาก ${shopName}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedShareText = encodeURIComponent(`${shareText} ${url}`);
  const qrSvgUrl = `/api/qr/${slug}?size=420&style=standard-v1`;

  async function handleCopy() {
    try {
      await copyToClipboard(url);
      setCopyState('copied');
      showToast('คัดลอกลิงก์หน้าร้านแล้ว', 'success');
      window.setTimeout(() => setCopyState('idle'), 2200);
    } catch (err) {
      console.warn('Clipboard permission denied, selecting the shop URL instead:', err);
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
      setCopyState('selected');
      showToast('เลือกข้อความลิงก์ให้แล้ว กด Ctrl+C เพื่อคัดลอกได้เลย', 'info');
      window.setTimeout(() => setCopyState('idle'), 4000);
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      setActiveTab('social');
      showToast('เบราว์เซอร์นี้ไม่รองรับเมนูแชร์ เลือกช่องทางโซเชียลด้านล่างได้เลย', 'info');
      return;
    }

    try {
      await navigator.share({
        title: `${shopName} - DealDoor`,
        text: shareText,
        url,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Failed to open native share:', err);
      setActiveTab('social');
      showToast('เปิดเมนูแชร์ไม่ได้ เลือกช่องทางโซเชียลแทนได้ครับ', 'warning');
    }
  }

  async function handleDownload(format: 'png' | 'svg') {
    if (!qrReady) return;
    setDownloading(true);

    try {
      if (format === 'svg') {
        const response = await fetch(qrSvgUrl);
        if (!response.ok) throw new Error('QR SVG request failed');
        const svg = await response.text();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${slug}-qr-code.svg`;
        link.href = objectUrl;
        link.click();
        URL.revokeObjectURL(objectUrl);
        showToast('ดาวน์โหลด QR Code แล้ว', 'success');
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is unavailable'));
          return;
        }

        const padding = 44;
        const qrSize = 320;
        const totalWidth = qrSize + padding * 2;
        const totalHeight = qrSize + padding * 2 + 92;
        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);

        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, padding, padding, qrSize, qrSize);
          ctx.fillStyle = '#111827';
          ctx.font = '700 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shopName, totalWidth / 2, qrSize + padding + 36);
          ctx.fillStyle = '#64748b';
          ctx.font = '600 13px sans-serif';
          ctx.fillText('Scan to view deals on DealDoor', totalWidth / 2, qrSize + padding + 62);

          const link = document.createElement('a');
          link.download = `${slug}-qr-code.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          resolve();
        };
        img.onerror = () => reject(new Error('QR image failed to load'));
        img.src = qrSvgUrl;
      });

      showToast('ดาวน์โหลด QR Code แล้ว', 'success');
    } catch (err) {
      console.error('Failed to download QR:', err);
      showToast('ดาวน์โหลด QR Code ไม่สำเร็จ', 'error');
    } finally {
      setDownloading(false);
    }
  }

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    { id: 'link', label: 'คัดลอกลิงก์', icon: <LinkIcon /> },
    { id: 'qr', label: 'QR Code', icon: <QrIcon /> },
    { id: 'social', label: 'โซเชียล', icon: <ShareIcon /> },
  ];

  const copyLabel = copyState === 'copied' ? 'คัดลอกแล้ว' : copyState === 'selected' ? 'เลือกแล้ว' : 'คัดลอก';

  return (
    <section className="overflow-hidden rounded-3xl border border-border/30 bg-card-bg/80 shadow-sm">
      <div className="p-5 pb-0">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <ShareIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-secondary">แชร์หน้าร้านของคุณ</h3>
            <p className="text-xs font-bold text-text-tertiary">ส่งลิงก์ให้ลูกค้าผ่านช่องทางต่างๆ</p>
          </div>
        </div>

        <div className="flex gap-1 rounded-2xl border border-border/20 bg-bg-secondary/70 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-black transition ${
                activeTab === tab.id
                  ? 'bg-card-bg text-primary shadow-sm ring-1 ring-border/20'
                  : 'text-text-tertiary hover:bg-card-bg/60 hover:text-secondary'
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
            <div className="flex items-stretch gap-2">
              <div className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border/20 bg-bg-secondary/70 px-3 transition focus-within:border-primary/50 hover:border-primary/30 hover:bg-bg-secondary">
                <LinkIcon className="h-4 w-4 shrink-0 text-primary" />
                <input
                  ref={linkInputRef}
                  readOnly
                  value={url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 truncate bg-transparent text-sm font-black text-secondary outline-none"
                  aria-label="ลิงก์หน้าร้าน"
                />
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-2xl px-4 text-xs font-black text-white transition ${
                  copyState === 'copied'
                    ? 'bg-success'
                    : copyState === 'selected'
                      ? 'bg-info'
                      : 'bg-primary shadow-md shadow-primary/20 hover:bg-primary-hover'
                }`}
              >
                {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
                <span>{copyLabel}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-border/20 bg-bg-secondary/50 text-sm font-black text-text-secondary transition hover:bg-bg-secondary hover:text-secondary"
            >
              <ShareIcon className="h-4 w-4" />
              แชร์ผ่านแอป
            </button>

            <p className="text-center text-[11px] font-bold text-text-tertiary">
              ลิงก์นี้อ้างอิงจากเว็บที่กำลังเปิดอยู่ ตอนทดสอบบน localhost จะเป็นลิงก์ localhost
            </p>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative rounded-3xl border border-border/30 bg-white p-3 shadow-inner">
                <img
                  src={qrSvgUrl}
                  alt={`QR Code สำหรับ ${shopName}`}
                  className={`h-44 w-44 sm:h-52 sm:w-52 ${qrReady ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setQrReady(true)}
                  onError={() => showToast('ไม่สามารถสร้าง QR Code ได้', 'error')}
                />
                {!qrReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                disabled={downloading || !qrReady}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-primary text-xs font-black text-white shadow-md shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DownloadIcon />
                PNG
              </button>
              <button
                type="button"
                onClick={() => handleDownload('svg')}
                disabled={downloading || !qrReady}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-border/30 bg-bg-secondary/60 text-xs font-black text-secondary transition hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DownloadIcon />
                SVG
              </button>
            </div>

            <p className="rounded-2xl border border-info/10 bg-info-bg/40 p-3 text-xs font-bold leading-relaxed text-text-secondary">
              พิมพ์ QR Code วางที่โต๊ะอาหารหรือหน้าร้าน ลูกค้าสแกนเพื่อดูดีลได้ทันที
            </p>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-2.5">
            <SocialButton
              label="แชร์บน LINE"
              hint="เปิด LINE พร้อมข้อความและลิงก์ร้าน"
              colorClass="bg-[#06C755]"
              onClick={() => openShareWindow(`https://line.me/R/msg/text/?${encodedShareText}`)}
            />
            <SocialButton
              label="แชร์บน Facebook"
              hint="โพสต์ลิงก์ร้านบนโปรไฟล์หรือเพจ"
              colorClass="bg-[#1877F2]"
              onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
            />
            <SocialButton
              label="แชร์บน WhatsApp"
              hint="ส่งให้ลูกค้าหรือกลุ่มแชท"
              colorClass="bg-[#25D366]"
              onClick={() => openShareWindow(`https://wa.me/?text=${encodedShareText}`)}
            />
            <SocialButton
              label="แชร์บน X"
              hint="โพสต์พร้อมลิงก์ร้านค้า"
              colorClass="bg-slate-900"
              onClick={() => openShareWindow(`https://twitter.com/intent/tweet?text=${encodedShareText}`)}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-pink-500/20 bg-pink-50/60 p-3 text-left transition hover:bg-pink-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-sm">
                <CopyIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-secondary">คัดลอกสำหรับ Instagram</p>
                <p className="text-xs font-bold text-text-tertiary">นำลิงก์ไปวางใน Bio หรือ Story</p>
              </div>
              <ChevronIcon />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SocialButton({
  label,
  hint,
  colorClass,
  onClick,
}: {
  label: string;
  hint: string;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-border/30 bg-bg-secondary/50 p-3 text-left transition hover:border-primary/20 hover:bg-bg-secondary"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass} text-white shadow-sm`}>
        <ShareIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-secondary">{label}</p>
        <p className="text-xs font-bold text-text-tertiary">{hint}</p>
      </div>
      <ChevronIcon />
    </button>
  );
}

function LinkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function QrIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function ShareIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
