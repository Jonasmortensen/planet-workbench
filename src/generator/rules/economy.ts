import { CONFIG } from '../config';
import type { Planet } from '../types/entities';

/**
 * Off-world trade rules, shared by the generator, the renderer and the validator.
 * A planet trades with other worlds only once its own people can fly between them.
 */
export function isSpacefaring(p: Pick<Planet, 'tech_level'>): boolean {
  return p.tech_level >= CONFIG.spaceflightTech;
}

/** Planetary exports and imports exist only for contacted, spacefaring worlds. */
export function tradesOffworld(p: Pick<Planet, 'tech_level' | 'galactic_connectivity'>): boolean {
  return isSpacefaring(p) && p.galactic_connectivity !== 'uncontacted';
}
