// src/components/dashboard/QRCodeSection.tsx

import { useState, useRef, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import { useSiteOrigin } from '../../lib/use-site-origin';

interface QRCodeSectionProps {
  slug: string;
  shopName: string;
  logoUrl?: string | null;
}

export default function QRCodeSection({ slug, shopName, logoUrl }: QRCodeSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const origin = useSiteOrigin();
  const shopUrl = `${origin}/${slug}`;

  useEffect(() => {
    generateQR();
  }, [shopUrl]);

  const generateQR = async () => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(shopUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1C1917',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR:', err);
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
          ctx.font = 'bold 18px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shopName, totalWidth / 2, qrSize + padding + 30);

          ctx.fillStyle = '#78716C';
          ctx.font = '12px Inter, sans-serif';
          ctx.fillText('Powered by DealDoor', totalWidth / 2, qrSize + padding + 55);

          const link = document.createElement('a');
          link.download = `${slug}-qr-code.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        img.src = qrDataUrl;
      } else {
        const svg = await QRCodeLib.toString(shopUrl, {
          type: 'svg',
          width: 400,
          margin: 2,
          color: {
            dark: '#1C1917',
            light: '#FFFFFF',
          },
        });

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${slug}-qr-code.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to download QR:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <h3 className="text-sm font-semibold text-secondary">QR Code</h3>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        พิมพ์ QR Code นี้วางที่ร้าน หรือแนบไปกับโปรโมชัน
      </p>

      {/* QR Code Preview */}
      <div className="flex justify-center">
        <div className="rounded-xl border-2 border-border bg-white p-4 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="h-48 w-48 sm:h-56 sm:w-56" />
          ) : (
            <div className="flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center">
              <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Shop URL */}
      <div className="mt-4 rounded-lg bg-bg-secondary p-3 text-center">
        <p className="text-xs text-text-tertiary">ลิงก์หน้าร้าน</p>
        <p className="mt-1 text-sm font-medium text-secondary truncate">{shopUrl}</p>
      </div>

      {/* Download Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => handleDownload('png')}
          disabled={downloading || !qrDataUrl}
          className="btn btn-primary flex-1"
        >
          {downloading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังดาวน์โหลด...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG
            </>
          )}
        </button>
        <button
          onClick={() => handleDownload('svg')}
          disabled={downloading || !qrDataUrl}
          className="btn btn-secondary flex-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          SVG
        </button>
      </div>

      {/* Tips */}
      <div className="mt-4 rounded-xl bg-info-bg p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-info-text">เคล็ดลับ</p>
            <p className="mt-1 text-xs text-info-text opacity-80">
              วาง QR Code ที่เคาน์เตอร์ โต๊ะ หรือป้ายหน้าร้าน ลูกค้าสแกนเพื่อดูโปรโมชันทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
