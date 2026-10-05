import type { ConstraintContext } from '../content';
import type { PlanetBundle } from '../types/entities';
import { planetContext } from './planet/geography';

/** Constraint context for the whole bundle: planet facts plus species body plans and abilities. */
export function bundleContext(bundle: PlanetBundle, extra: Partial<ConstraintContext> = {}): ConstraintContext {
  const p = bundle.planet;
  return {
    ...planetContext(p),
    abilities: p.special_abilities.map((a) => a.type),
    bodyPlans: p.species.map((s) => bundle.species[s.species_id].body_plan),
    connectivity: p.galactic_connectivity,
    ...extra,
  };
}
