import { createContext, useContext } from 'react';
import type { PlanetBundle } from '../generator';
import type { RefSite } from '../generator/validate';

export interface BundleContextValue {
  bundle: PlanetBundle;
  /** Reverse index: target id -> every place that references it. */
  referencedBy: Map<string, RefSite[]>;
  /** Navigate to an entity page (null = planet). */
  open: (entityId: string | null) => void;
  /** Switch to another seed (its planet page). */
  goSeed: (seed: string) => void;
  selectedId: string | null;
}

export const BundleContext = createContext<BundleContextValue | null>(null);

export function useBundle(): BundleContextValue {
  const ctx = useContext(BundleContext);
  if (!ctx) throw new Error('useBundle outside BundleContext');
  return ctx;
}

export function buildReverseIndex(sites: RefSite[]): Map<string, RefSite[]> {
  const map = new Map<string, RefSite[]>();
  for (const site of sites) {
    if (site.from === site.id) continue;
    const list = map.get(site.id) ?? [];
    list.push(site);
    map.set(site.id, list);
  }
  return map;
}

/** Owner entity of a historical event id ("event_country_3_2" -> "country_3"). */
export function eventOwner(eventId: string): string {
  return eventId.replace(/^event_/, '').replace(/_\d+$/, '');
}
