import { useCallback, useEffect, useState } from 'react';

/**
 * Hash routing: #/s/<seed>[/<entityId>]. The seed is in the URL so a planet
 * can be bookmarked and regenerates identically.
 */
export interface Route {
  seed: string;
  entityId: string | null;
}

export function parseHash(hash: string): Route | null {
  const m = hash.replace(/^#/, '').match(/^\/s\/([^/]+)(?:\/([^/]+))?/);
  if (!m) return null;
  return { seed: decodeURIComponent(m[1]), entityId: m[2] ? decodeURIComponent(m[2]) : null };
}

export function formatHash(route: Route): string {
  const base = `#/s/${encodeURIComponent(route.seed)}`;
  return route.entityId ? `${base}/${encodeURIComponent(route.entityId)}` : base;
}

export function randomSeed(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function useRoute(): [Route, (r: Route) => void] {
  const read = () => parseHash(window.location.hash);
  const [route, setRoute] = useState<Route>(() => read() ?? { seed: randomSeed(), entityId: null });

  useEffect(() => {
    if (!read()) window.history.replaceState(null, '', formatHash(route));
    const onChange = () => {
      const r = read();
      if (r) setRoute(r);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback((r: Route) => {
    window.location.hash = formatHash(r);
  }, []);

  return [route, navigate];
}
