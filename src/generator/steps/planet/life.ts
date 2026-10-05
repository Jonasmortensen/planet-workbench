import { CONFIG } from '../../config';
import { PLANET_TYPE_TABLE, SETTLEMENT_ORIGIN_WEIGHTS } from '../../content';
import type { Rng } from '../../rng';
import { hasAtmosphere, hasLiquidWater } from '../../rules/physical';
import type { Planet } from '../../types/entities';
import { BIOSPHERE_TYPES, SETTLEMENT_ORIGINS, type Biosphere } from '../../types/enums';
import { biased } from '../util';

/** Biosphere weights derived from water, air and temperature. */
function derivedBiosphereWeights(p: Planet): Partial<Record<Biosphere, number>> {
  const liquid = hasLiquidWater(p);
  const air = hasAtmosphere(p);
  const { mean } = p.temperature_range;
  const tempOk = mean >= -25 && mean <= 55;
  const tempGood = mean >= 0 && mean <= 35;
  const comp = p.atmosphere.composition;
  const lifeFriendlyAir = comp === 'breathable' || comp === 'tainted' || comp === 'spore_laden';

  let w: Partial<Record<Biosphere, number>>;
  if (!liquid && !air) w = { none: 8, microbial: 2 };
  else if (!liquid) w = { none: 4, microbial: 4, sparse: 1, exotic: 0.5 };
  else if (!air) w = { none: 3, microbial: 5, sparse: 1 };
  else if (!tempOk) w = { microbial: 4, sparse: 3, exotic: 1, none: 1 };
  else if (tempGood && lifeFriendlyAir) w = { complex: 5, lush: 3, sparse: 2, dying: 0.5, microbial: 0.3 };
  else w = { sparse: 4, complex: 3, microbial: 2, exotic: 1, dying: 0.5, none: 0.3 };

  if (comp === 'exotic') w.exotic = (w.exotic ?? 0.5) * 3;
  // Oxygen-rich air is almost always made by life.
  if (comp === 'breathable' && w.none) w.none *= 0.05;
  return w;
}

export function rollLife(p: Planet, rng: Rng): void {
  const def = PLANET_TYPE_TABLE[p.planet_type];
  const bRng = rng.fork('biosphere');
  if (bRng.chance(CONFIG.deviation.biosphere)) {
    p.biosphere = bRng.pick(BIOSPHERE_TYPES);
  } else {
    // A bias above 1 can introduce a biosphere the conditions alone would not
    // produce (machine worlds grow synthetic ecologies whatever the air).
    const derived = derivedBiosphereWeights(p);
    const bias = def.biosphereBias ?? {};
    const weights = BIOSPHERE_TYPES.map((b) => ({
      value: b,
      weight: ((derived[b] ?? 0) + ((bias[b] ?? 1) > 1 ? 1 : 0)) * (bias[b] ?? 1),
    }));
    p.biosphere = weights.some((w) => w.weight > 0) ? bRng.weighted(weights) : 'microbial';
  }

  const nRng = rng.fork('sapients');
  const rich = ['complex', 'lush', 'exotic', 'synthetic'].includes(p.biosphere);
  const poor = ['sparse', 'dying'].includes(p.biosphere);
  p.native_sapients = rich
    ? nRng.chance(CONFIG.nativeSapientsChance.rich)
    : poor && nRng.chance(CONFIG.nativeSapientsChance.poor);

  const oRng = rng.fork('origin');
  p.settlement_origin = oRng.weighted(biased(
    SETTLEMENT_ORIGINS,
    p.native_sapients ? SETTLEMENT_ORIGIN_WEIGHTS.withNatives : SETTLEMENT_ORIGIN_WEIGHTS.withoutNatives,
  ));
}
