// src/components/shared/ImageUpload.tsx

import { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
  type: 'cover' | 'logo' | 'deal' | 'menu';
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const MAX_SIZES = {
  cover: '3MB',
  logo: '1MB',
  deal: '3MB',
  menu: '1MB',
};

const DIMENSIONS = {
  cover: '1280×720',
  logo: '512×512',
  deal: '1280×720',
  menu: '512×512',
};

export default function ImageUpload({
  type,
  currentUrl,
  onUpload,
  label,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentUrl || null);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [currentUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    setError('');
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'อัปโหลดไม่สำเร็จ');
      }

      onUpload(data.data.url);
    } catch (err: any) {
      setError(err.message || 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    setPreview(null);
    onUpload('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isSquare = type === 'logo' || type === 'menu';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-secondary mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed border-border transition-all ${disabled ? '' : 'hover:border-primary cursor-pointer'} ${
          isSquare ? 'aspect-square w-40' : 'aspect-video w-full'
        }`}
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
              </div>
            )}
            {!disabled && <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-text-tertiary">
            <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">{disabled ? 'ไม่มีรูปภาพ' : 'คลิกเพื่อเลือกรูป'}</span>
            {!disabled && <span className="text-xs mt-1">{DIMENSIONS[type]} · สูงสุด {MAX_SIZES[type]}</span>}
          </div>
        )}
      </div>

      {disabled ? <p className="mt-2 text-xs text-text-secondary" role="status">Demo: ปิดการอัปโหลดรูป ใช้รูปตัวอย่างเท่านั้น</p> : <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
