import { useEffect, useRef, useState } from 'react';

type LocationPickerProps = {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
};

declare global {
  interface Window {
    L?: any;
    __dealDoorLeafletPromise?: Promise<any>;
  }
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (window.__dealDoorLeafletPromise) return window.__dealDoorLeafletPromise;

  window.__dealDoorLeafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-dealdoor-leaflet]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      stylesheet.dataset.dealdoorLeaflet = 'true';
      document.head.appendChild(stylesheet);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('ไม่สามารถโหลดแผนที่ได้'));
    document.head.appendChild(script);
  });
  return window.__dealDoorLeafletPromise;
}

function validCoordinate(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [message, setMessage] = useState('เลือกตำแหน่งร้านบนแผนที่ หรือลากหมุดให้ตรงหน้าร้าน');
  const [locating, setLocating] = useState(false);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let themeObserver: MutationObserver | null = null;
    void loadLeaflet().then((L) => {
      if (cancelled || !mapElement.current || map.current) return;
      const initial = validCoordinate(latitude, longitude)
        ? [Number(latitude), Number(longitude)]
        : [13.7563, 100.5018];
      const instance = L.map(mapElement.current, { zoomControl: true }).setView(initial, validCoordinate(latitude, longitude) ? 16 : 12);
      const isDark = document.documentElement.classList.contains('dark');
      const mapTileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      const tileLayer = L.tileLayer(mapTileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(instance);
      themeObserver = new MutationObserver(() => {
        const nextUrl = document.documentElement.classList.contains('dark')
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        tileLayer.setUrl(nextUrl);
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      const pin = L.marker(initial, { draggable: true }).addTo(instance);
      const update = (position: { lat: number; lng: number }) => {
        onChangeRef.current(position.lat.toFixed(6), position.lng.toFixed(6));
        setMessage('ตั้งตำแหน่งร้านแล้ว ตรวจสอบให้หมุดอยู่ตรงหน้าร้านก่อนบันทึก');
      };
      instance.on('click', (event: any) => {
        pin.setLatLng(event.latlng);
        update(event.latlng);
      });
      pin.on('dragend', () => update(pin.getLatLng()));
      map.current = instance;
      marker.current = pin;
    }).catch((error: Error) => setMessage(error.message));

    return () => {
      cancelled = true;
      themeObserver?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current || !validCoordinate(latitude, longitude)) return;
    const point = [Number(latitude), Number(longitude)];
    marker.current.setLatLng(point);
    map.current.panTo(point, { animate: true });
  }, [latitude, longitude]);

  const useCurrentLocation = () => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setMessage('เบราว์เซอร์ต้องใช้ HTTPS หรือ localhost และอนุญาต Location เพื่อใช้ตำแหน่งปัจจุบัน');
      return;
    }
    setLocating(true);
    setMessage('กำลังขอตำแหน่งจากอุปกรณ์...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6));
        setMessage(`ใช้ตำแหน่งปัจจุบันแล้ว ความคลาดเคลื่อนประมาณ ${Math.round(position.coords.accuracy)} เมตร`);
        setLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'ยังไม่ได้อนุญาตตำแหน่ง กรุณาอนุญาตจากเบราว์เซอร์แล้วลองใหม่',
          2: 'อุปกรณ์ระบุตำแหน่งไม่ได้ ลองเปิด GPS หรือเชื่อมต่อ Wi-Fi',
          3: 'ใช้เวลาค้นหาตำแหน่งนานเกินไป กรุณาลองใหม่',
        };
        setMessage(messages[error.code] || 'ไม่สามารถหาตำแหน่งปัจจุบันได้');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  return <div className="rounded-2xl border border-border/40 bg-bg p-3">
    <div ref={mapElement} className="h-64 w-full overflow-hidden rounded-xl bg-bg-secondary" aria-label="แผนที่เลือกตำแหน่งร้าน" />
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold leading-relaxed text-text-secondary">{message}</p>
      <button type="button" onClick={useCurrentLocation} disabled={locating} className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-black text-white transition-opacity disabled:opacity-60">{locating ? 'กำลังหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน'}</button>
    </div>
  </div>;
}
