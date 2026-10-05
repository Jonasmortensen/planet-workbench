import { CONFIG } from '../../config';
import {
  BIOME_TABLE, FEATURE_TABLE, HAZARD_TABLE, PLANET_TYPE_TABLE, RESOURCE_TABLE, eligible,
  type ConstraintContext,
} from '../../content';
import { normalizeShares, type Rng } from '../../rng';
import { hasAtmosphere, hasLiquidWater } from '../../rules/physical';
import type { BiomeShare, Planet } from '../../types/entities';
import {
  ABUNDANCE_LEVELS, BIOMES, FEATURE_TYPES, HAZARD_TYPES, RESOURCE_TYPES, SEVERITY_LEVELS, SIZE_CLASSES,
  type Biome,
} from '../../types/enums';

/** Assign biome shares and continent count. Sea biomes take the water share; land biomes split the rest. */
export function rollBiomes(p: Planet, rng: Rng): void {
  const def = PLANET_TYPE_TABLE[p.planet_type];
  const { min, mean, max } = p.temperature_range;
  const water = p.water_coverage;
  // Without real air pressure, surface water can only exist as ice.
  const airless = p.atmosphere.pressure === 'none' || p.atmosphere.pressure === 'trace';
  const liquidState = water < 0.005 ? 'none' : mean < -20 || airless ? 'frozen' : mean > 100 ? 'boiled' : 'liquid';
  const deviate = rng.fork('water-deviation').chance(CONFIG.deviation.liquidWater);
  const liquid = liquidState === 'liquid' || (deviate && liquidState !== 'none');

  const shares: { biome: Biome; weight: number }[] = [];

  // Sea biomes
  if (water >= 0.005) {
    if (liquid) {
      const iceFraction = clamp01((-min - 10) / 80) * 0.5;
      const ice = water * iceFraction;
      const open = water - ice;
      const sRng = rng.fork('sea');
      const reefFraction = mean > 18 ? sRng.float(0.03, 0.15) : 0;
      const shallowFraction = sRng.float(0.08, 0.3);
      shares.push({ biome: 'ocean', weight: open * (1 - reefFraction - shallowFraction) });
      shares.push({ biome: 'shallow_sea', weight: open * shallowFraction });
      if (reefFraction > 0) shares.push({ biome: 'reef', weight: open * reefFraction });
      if (ice > 0.005) shares.push({ biome: 'ice_sheet', weight: ice });
    } else if (liquidState === 'frozen') {
      shares.push({ biome: 'ice_sheet', weight: water });
    }
    // 'boiled' water with no deviation was already reduced to near zero in rollPhysical.
  }

  // Land biomes
  const land = 1 - shares.reduce((a, s) => a + s.weight, 0);
  const lRng = rng.fork('land');
  const candidates = BIOMES.filter((b) => {
    const bd = BIOME_TABLE[b];
    if (bd.water === 'sea') return false;
    if ((def.biomes[b] ?? 0) <= 0) return false;
    if (bd.water === 'wet' && !liquid) return false;
    return bd.temp[0] <= max && bd.temp[1] >= min;
  });
  if (land > 0.005) {
    let pool = candidates.map((b) => ({ value: b, weight: def.biomes[b]! }));
    if (pool.length === 0) {
      // Nothing fits the climate: fall back to the type's most typical dry biome.
      const fallback = BIOMES.filter((b) => BIOME_TABLE[b].water !== 'sea' && BIOME_TABLE[b].water !== 'wet')
        .sort((a, b) => (def.biomes[b] ?? 0) - (def.biomes[a] ?? 0))[0];
      pool = [{ value: fallback, weight: 1 }];
    }
    const n = Math.min(pool.length, lRng.int(2, 6));
    const chosen = lRng.weightedSample(pool, n);
    const weights = chosen.map((b) => (def.biomes[b] ?? 1) * lRng.float(0.3, 1.6));
    const landShares = normalizeShares(weights, land);
    chosen.forEach((b, i) => shares.push({ biome: b, weight: landShares[i] }));
  }

  const normalized = normalizeShares(shares.map((s) => s.weight));
  p.biomes = shares
    .map((s, i): BiomeShare => ({ biome: s.biome, share: normalized[i] }))
    .filter((b) => b.share > 0)
    .sort((a, b) => b.share - a.share);

  // Continents
  const cRng = rng.fork('continents');
  if (def.continents) p.continent_count = cRng.int(def.continents[0], def.continents[1]);
  else if (water < 0.15) p.continent_count = 1;
  else if (water < 0.4) p.continent_count = cRng.int(1, 4);
  else if (water < 0.85) p.continent_count = cRng.int(2, 9);
  else p.continent_count = cRng.int(0, 4);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function planetContext(p: Planet, extra: Partial<ConstraintContext> = {}): ConstraintContext {
  return {
    planetType: p.planet_type,
    biomes: p.biomes.map((b) => b.biome),
    hasAtmosphere: hasAtmosphere(p),
    pressure: p.atmosphere.pressure,
    liquidWater: hasLiquidWater(p),
    biosphere: p.biosphere,
    meanTemp: p.temperature_range.mean,
    sizeIndex: SIZE_CLASSES.indexOf(p.size_class),
    natives: p.native_sapients,
    colonists: p.settlement_origin !== 'native',
    origin: p.settlement_origin,
    precursors: p.precursor_presence !== 'none',
    techLevel: p.tech_level,
    ...extra,
  };
}

/** Resources, hazards and notable features (names are filled in by the naming pass). */
export function rollGeographyDetails(p: Planet, rng: Rng): void {
  const def = PLANET_TYPE_TABLE[p.planet_type];
  const ctx = planetContext(p);

  const rRng = rng.fork('resources');
  const resourcePool = eligible(RESOURCE_TYPES, RESOURCE_TABLE, ctx, (k, d) => d.weight * (def.resourceBias?.[k] ?? 1));
  const resources = rRng.weightedSample(resourcePool, rRng.int(...CONFIG.planet.resources));
  p.resources = resources.map((resource) => {
    const boosted = (def.resourceBias?.[resource] ?? 1) > 1;
    const abundance = rRng.weighted(ABUNDANCE_LEVELS.map((a, i) => ({
      value: a,
      weight: [2, 4, 3, 1.5][i] * (boosted && i >= 2 ? 2 : 1),
    })));
    return { resource, abundance };
  });

  const hRng = rng.fork('hazards');
  const hazardPool = eligible(HAZARD_TYPES, HAZARD_TABLE, ctx, (k, d) => d.weight * (def.hazardBias?.[k] ?? 1));
  const hazards = hRng.weightedSample(hazardPool, hRng.int(...CONFIG.planet.hazards));
  p.hazards = hazards.map((type) => ({
    type,
    severity: hRng.weighted(SEVERITY_LEVELS.map((s, i) => ({ value: s, weight: [4, 4, 2, 0.5][i] }))),
  }));

  const fRng = rng.fork('features');
  const featurePool = eligible(FEATURE_TYPES, FEATURE_TABLE, ctx, (k, d) => d.weight * (def.featureBias?.[k] ?? 1));
  const features = fRng.weightedSample(featurePool, fRng.int(...CONFIG.planet.notableFeatures));
  p.notable_features = features.map((type) => ({ type, name: '' }));
}
