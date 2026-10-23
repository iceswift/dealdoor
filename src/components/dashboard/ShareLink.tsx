// src/components/dashboard/ShareLink.tsx

import { useState } from 'react';
import { useSiteOrigin } from '../../lib/use-site-origin';

interface ShareLinkProps {
  slug: string;
  shopName: string;
}

export default function ShareLink({ slug, shopName }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const origin = useSiteOrigin();
  const url = `${origin}/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shopName} - DealDoor`,
          text: `ดูโปรโมชันล่าสุดจาก ${shopName}`,
          url: url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h3 className="text-sm font-semibold text-secondary">ลิงก์หน้าร้าน</h3>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="input flex-1 bg-bg-secondary text-sm"
        />
        <button
          onClick={handleCopy}
          className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`}
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              คัดลอกแล้ว
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              คัดลอก
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleShare}
          className="btn btn-ghost btn-sm flex-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          แชร์
        </button>
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm flex-1 bg-green-500 text-white hover:bg-green-600"
        >
          LINE
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm flex-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          Facebook
        </a>
      </div>

      <p className="mt-3 text-xs text-text-tertiary">
        แชร์ลิงก์นี้บน LINE, Facebook, Instagram หรือ QR Code
      </p>
    </div>
  );
}
