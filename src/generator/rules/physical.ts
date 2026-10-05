import { PLANET_TYPE_TABLE, STANDARD_RADIUS_KM } from '../content/planet';
import type { Planet } from '../types/entities';
import type { AnomalyType, Biome } from '../types/enums';
import { ATMOSPHERE_PRESSURES, SIZE_CLASSES } from '../types/enums';

/**
 * Physical consistency rules, shared by the generator (which records an
 * anomaly whenever a rule is broken) and the validator (which warns when a
 * broken rule has no matching anomaly).
 */
export interface PhysicalRule {
  anomaly: AnomalyType;
  describe: string;
  violated(p: Planet): boolean;
}

export const LIQUID_SEA_BIOMES: ReadonlySet<Biome> = new Set<Biome>(['ocean', 'shallow_sea', 'reef']);

export function hasLiquidWater(p: Pick<Planet, 'biomes'>): boolean {
  return p.biomes.some((b) => LIQUID_SEA_BIOMES.has(b.biome) && b.share > 0);
}

export function pressureIndex(p: Pick<Planet, 'atmosphere'>): number {
  return ATMOSPHERE_PRESSURES.indexOf(p.atmosphere.pressure);
}

export function hasAtmosphere(p: Pick<Planet, 'atmosphere'>): boolean {
  return pressureIndex(p) >= ATMOSPHERE_PRESSURES.indexOf('thin');
}

export function expectedGravity(p: Pick<Planet, 'radius_km' | 'planet_type'>): number {
  return (p.radius_km / STANDARD_RADIUS_KM) * PLANET_TYPE_TABLE[p.planet_type].density;
}

export const PHYSICAL_RULES: PhysicalRule[] = [
  {
    anomaly: 'gravity_mismatch',
    describe: 'Surface gravity is far from what size and density predict',
    violated: (p) => {
      const ratio = p.gravity / expectedGravity(p);
      return ratio < 0.75 || ratio > 1.33;
    },
  },
  {
    anomaly: 'atmosphere_retention',
    describe: 'Atmosphere is too thick for a body this small to hold',
    violated: (p) => {
      const size = SIZE_CLASSES.indexOf(p.size_class);
      const pressure = pressureIndex(p);
      return (size === 0 && pressure >= ATMOSPHERE_PRESSURES.indexOf('standard'))
        || (size === 1 && pressure >= ATMOSPHERE_PRESSURES.indexOf('crushing'));
    },
  },
  {
    anomaly: 'anomalous_liquid_water',
    describe: 'Liquid oceans exist where water should be frozen, boiled away or lost to vacuum',
    violated: (p) => hasLiquidWater(p)
      && (p.temperature_range.mean < -25 || p.temperature_range.mean > 100
        || pressureIndex(p) <= ATMOSPHERE_PRESSURES.indexOf('trace')),
  },
  {
    anomaly: 'life_against_odds',
    describe: 'A complex biosphere thrives without liquid water, air or survivable temperatures',
    violated: (p) => (p.biosphere === 'complex' || p.biosphere === 'lush')
      && (pressureIndex(p) <= ATMOSPHERE_PRESSURES.indexOf('trace')
        || p.temperature_range.mean < -40
        || p.temperature_range.mean > 70
        || !hasLiquidWater(p)),
  },
  {
    anomaly: 'unexplained_oxygen',
    describe: 'Breathable air with no biosphere to produce it',
    violated: (p) => p.atmosphere.composition === 'breathable' && p.biosphere === 'none',
  },
  {
    anomaly: 'climate_mismatch',
    describe: 'Mean temperature is far outside what this planet type implies',
    violated: (p) => {
      const [lo, hi] = PLANET_TYPE_TABLE[p.planet_type].meanTemp;
      return p.temperature_range.mean < lo - 15 || p.temperature_range.mean > hi + 15;
    },
  },
  {
    anomaly: 'rotation_anomaly',
    describe: 'The planet spins faster than it should be able to hold together',
    violated: (p) => !p.tidally_locked && p.day_length_hours < 4,
  },
];

export function violatedRules(p: Planet): PhysicalRule[] {
  return PHYSICAL_RULES.filter((r) => r.violated(p));
}
