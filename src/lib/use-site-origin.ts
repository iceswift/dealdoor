import { useEffect, useState } from 'react';
import { getSiteOrigin } from './site';

export function useSiteOrigin() {
  const [origin, setOrigin] = useState(getSiteOrigin);
  useEffect(() => { setOrigin(window.location.origin); }, []);
  return origin;
}
