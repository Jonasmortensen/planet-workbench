import { CONFIG } from '../../config';
import {
  BASE_EQUILIBRIUM_K, COMPOSITION_GREENHOUSE, MOON_COUNT_WEIGHTS, MOON_TYPE_TABLE, PLANET_TYPE_TABLE,
  PRESSURE_GREENHOUSE, SEASONALITY_BY_TILT, SIZE_CLASS_TABLE,
} from '../../content';
import type { Rng } from '../../rng';
import type { Planet } from '../../types/entities';
import {
  ATMOSPHERE_COMPOSITIONS, ATMOSPHERE_PRESSURES, MOON_TYPES, PLANET_TYPES, SIZE_CLASSES,
  type AtmospherePressure, type Seasonality,
} from '../../types/enums';
import { expectedGravity } from '../../rules/physical';
import { biased, clamp, pickCount, round } from '../util';

const SPREAD_BY_PRESSURE: Record<AtmospherePressure, number> = {
  none: 6, trace: 4.5, thin: 2, standard: 1, dense: 0.6, crushing: 0.2,
};

const SPREAD_BY_SEASON: Record<Seasonality, number> = {
  none: 0.7, mild: 0.9, moderate: 1, strong: 1.3, extreme: 1.6, erratic: 1.8,
};

/** Hidden stellar parameters; not stored in the bundle (star systems are out of scope). */
export interface StarContext {
  luminosity: number;
}

/**
 * Roll physical traits. Order: type, size, gravity, atmosphere, orbit
 * (solved from the type's target temperature), rotation, seasons,
 * temperature spread, water, moons.
 */
export function rollPhysical(p: Planet, rng: Rng): StarContext {
  // Type
  p.planet_type = rng.fork('type').weightedBy(PLANET_TYPES, (t) => PLANET_TYPE_TABLE[t].weight);
  const def = PLANET_TYPE_TABLE[p.planet_type];

  // Size
  const sizeRng = rng.fork('size');
  const sizeWeights = def.sizes ?? Object.fromEntries(SIZE_CLASSES.map((s) => [s, SIZE_CLASS_TABLE[s].weight]));
  p.size_class = sizeRng.weightedKeys(SIZE_CLASSES, sizeWeights);
  const [rMin, rMax] = SIZE_CLASS_TABLE[p.size_class].radiusKm;
  p.radius_km = Math.round(sizeRng.float(rMin, rMax));

  // Gravity: derived from radius and density, occasionally wildly off.
  const gRng = rng.fork('gravity');
  const expected = expectedGravity(p);
  let gravity = expected * gRng.float(0.92, 1.08);
  if (gRng.chance(CONFIG.deviation.gravity)) {
    gravity = expected * (gRng.chance(0.5) ? gRng.float(0.3, 0.6) : gRng.float(1.6, 2.5));
  }
  p.gravity = round(gravity, 2);

  // Atmosphere: small bodies cannot usually hold thick air.
  const aRng = rng.fork('atmosphere');
  const composition = aRng.weighted(biased(ATMOSPHERE_COMPOSITIONS, def.atmospheres));
  let pressure: AtmospherePressure = 'none';
  if (composition !== 'none') {
    const sizeIdx = SIZE_CLASSES.indexOf(p.size_class);
    const ignoreRetention = aRng.chance(CONFIG.deviation.atmosphereRetention);
    const weights = ATMOSPHERE_PRESSURES.map((pr, i) => {
      let w = pr === 'none' ? 0 : def.pressures[pr] ?? 0;
      if (!ignoreRetention && sizeIdx === 0 && i >= ATMOSPHERE_PRESSURES.indexOf('standard')) w = 0;
      if (!ignoreRetention && sizeIdx === 1 && pr === 'crushing') w = 0;
      return { value: pr, weight: w };
    });
    pressure = weights.some((w) => w.weight > 0) ? aRng.weighted(weights) : sizeIdx === 0 ? 'trace' : 'thin';
  }
  p.atmosphere = { composition, pressure };

  // Orbit: pick a target mean temperature for the type, then solve for insolation.
  const oRng = rng.fork('orbit');
  const target = oRng.float(def.meanTemp[0], def.meanTemp[1]);
  const greenhouse = PRESSURE_GREENHOUSE[pressure] * COMPOSITION_GREENHOUSE[composition];
  const bias = def.tempBias ?? 0;
  const kelvinNeeded = target + 273.15 - greenhouse - bias;
  let insolation = kelvinNeeded > 0 ? Math.pow(kelvinNeeded / BASE_EQUILIBRIUM_K, 4) : 0.02;
  insolation = clamp(insolation, 0.02, 6);
  const mean = BASE_EQUILIBRIUM_K * Math.pow(insolation, 0.25) + greenhouse + bias - 273.15;
  const luminosity = oRng.float(0.3, 2.5);
  const au = Math.sqrt(luminosity / insolation);
  p.insolation = round(insolation, 3);
  p.orbital_distance_au = round(au, 2);
  p.orbital_position = clamp(Math.round(1 + Math.log(au / 0.35) / Math.log(1.6)), 1, 12);
  const starMass = Math.pow(luminosity, 1 / 3.5);
  p.year_length_days = Math.round((365.25 * Math.pow(au, 1.5)) / Math.sqrt(starMass));

  // Rotation
  const rotRng = rng.fork('rotation');
  p.tidally_locked = def.tidallyLocked === true || (insolation > 2.5 && rotRng.chance(0.25)) || rotRng.chance(0.03);
  if (p.tidally_locked) {
    p.day_length_hours = p.year_length_days * 24;
  } else if (rotRng.chance(CONFIG.deviation.rotation)) {
    p.day_length_hours = round(rotRng.float(1.5, 3.8), 1);
  } else {
    p.day_length_hours = round(clamp(Math.exp(rotRng.normal(Math.log(26), 0.5)), 6, 200), 1);
  }

  // Seasons
  const sRng = rng.fork('seasons');
  p.axial_tilt = p.tidally_locked ? round(sRng.float(0, 3), 1) : round(clamp(Math.abs(sRng.normal(20, 15)), 0, 90), 1);
  p.seasonality = SEASONALITY_BY_TILT.find((s) => p.axial_tilt < s.maxTilt)!.value;
  if (!p.tidally_locked && sRng.chance(0.03)) p.seasonality = 'erratic';

  // Water (before spread: oceans moderate climate)
  const wRng = rng.fork('water');
  let water = wRng.float(def.water[0], def.water[1]);
  if (mean > 100 && !wRng.chance(CONFIG.deviation.liquidWater)) water *= 0.05;
  p.water_coverage = round(water, 3);

  // Temperature spread
  const tRng = rng.fork('temperature');
  const spread = 40
    * SPREAD_BY_PRESSURE[pressure]
    * (1 - 0.5 * p.water_coverage)
    * (p.tidally_locked ? 2.5 : 1)
    * SPREAD_BY_SEASON[p.seasonality]
    * tRng.float(0.85, 1.15);
  p.temperature_range = {
    min: Math.round(mean - spread * 0.55),
    mean: Math.round(mean),
    max: Math.round(mean + spread * 0.45),
  };

  // Moons
  const mRng = rng.fork('moons');
  const maxMoons = SIZE_CLASS_TABLE[p.size_class].maxMoons;
  const count = p.planet_type === 'moon_world'
    ? (mRng.chance(0.15) ? 1 : 0)
    : pickCount(mRng, MOON_COUNT_WEIGHTS, maxMoons);
  const planetSize = SIZE_CLASSES.indexOf(p.size_class);
  p.moons = [];
  for (let i = 0; i < count; i++) {
    const r = mRng.fork(`moon:${i}`);
    const type = r.weightedBy(MOON_TYPES, (t) => MOON_TYPE_TABLE[t].weight);
    const sizes = MOON_TYPE_TABLE[type].sizes.filter((s) => SIZE_CLASSES.indexOf(s) < Math.max(1, planetSize));
    p.moons.push({ name: '', size_class: sizes.length ? r.pick(sizes) : 'tiny', moon_type: type });
  }

  return { luminosity };
}
