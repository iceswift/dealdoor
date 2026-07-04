// src/components/shared/QRCode.tsx

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCode({ url, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#1A1A2E',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
    }
  }, [url, size]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg" />
    </div>
  );
}
