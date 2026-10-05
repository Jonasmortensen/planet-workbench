import {
  ANOMALY_COUNT_WEIGHTS, ANOMALY_TABLE, MEGASTRUCTURE_CONDITION_WEIGHTS, MEGASTRUCTURE_COUNT_WEIGHTS,
  MEGASTRUCTURE_TABLE, PLANET_TYPE_TABLE, PRECURSOR_WEIGHTS, PREVALENCE_WEIGHTS, SPECIAL_ABILITY_COUNT_WEIGHTS,
  SPECIAL_ABILITY_TABLE, eligible,
} from '../../content';
import type { Rng } from '../../rng';
import { violatedRules } from '../../rules/physical';
import type { Anomaly, Planet } from '../../types/entities';
import {
  ANOMALY_TYPES, BUILDERS, CONNECTIVITY_LEVELS, EXPLANATION_KEYS, MEGASTRUCTURE_CONDITIONS, MEGASTRUCTURE_TYPES,
  PRECURSOR_PRESENCE, PREVALENCE_LEVELS, SPECIAL_ABILITY_TYPES,
  type AnomalyType, type Builder, type ExplanationKey,
} from '../../types/enums';
import { biased, pickCount } from '../util';
import { planetContext } from './geography';

export function rollPrecursors(p: Planet, rng: Rng): void {
  const exotic = PLANET_TYPE_TABLE[p.planet_type].exotic;
  p.precursor_presence = rng.weightedBy(PRECURSOR_PRESENCE, (k) => PRECURSOR_WEIGHTS[k] * (exotic && k !== 'none' ? 3 : 1));
}

function explain(p: Planet, rng: Rng, type: AnomalyType): ExplanationKey {
  const weights = ANOMALY_TABLE[type].explanations;
  return rng.weightedBy(EXPLANATION_KEYS, (k) => {
    let w = weights[k] ?? 0;
    // Keep explanations coherent with the rest of the planet.
    if (k === 'precursor_engineering' && p.precursor_presence === 'none') w *= 0.3;
    if (k === 'living_world' && p.planet_type !== 'living') w *= 0.1;
    if (k === 'terraforming' && p.tech_level < 7 && p.settlement_origin === 'native') w *= 0.2;
    return w;
  });
}

/**
 * Anomalies: first every physical rule the planet breaks (so the data never
 * hides its own inconsistencies), then optional flavor anomalies.
 */
export function rollAnomalies(p: Planet, rng: Rng): void {
  const out: Anomaly[] = [];
  for (const rule of violatedRules(p)) {
    out.push({ type: rule.anomaly, explanation_key: explain(p, rng.fork(`physical:${rule.anomaly}`), rule.anomaly) });
  }
  const fRng = rng.fork('flavor');
  const exotic = PLANET_TYPE_TABLE[p.planet_type].exotic;
  const weights = exotic ? ANOMALY_COUNT_WEIGHTS.map((w, i) => (i === 0 ? w * 0.5 : w)) : ANOMALY_COUNT_WEIGHTS;
  const count = pickCount(fRng, weights);
  const pool = eligible(ANOMALY_TYPES, ANOMALY_TABLE, planetContext(p), (_k, d) => (d.physical ? 0 : d.weight));
  for (const type of fRng.weightedSample(pool, count)) {
    out.push({ type, explanation_key: explain(p, fRng.fork(type), type) });
  }
  p.anomalies = out;
}

export function rollMegastructures(p: Planet, rng: Rng): void {
  const count = pickCount(rng, MEGASTRUCTURE_COUNT_WEIGHTS);
  const ctx = planetContext(p);
  const types = rng.weightedSample(eligible(MEGASTRUCTURE_TYPES, MEGASTRUCTURE_TABLE, ctx), count);
  const connected = CONNECTIVITY_LEVELS.indexOf(p.galactic_connectivity) >= CONNECTIVITY_LEVELS.indexOf('connected');
  p.megastructures = types.map((type) => {
    const r = rng.fork(type);
    const def = MEGASTRUCTURE_TABLE[type];
    const builderWeights: Record<Builder, number> = {
      precursors: p.precursor_presence !== 'none' ? 5 : 0,
      natives: p.native_sapients && p.tech_level >= def.minTech ? 4 : 0,
      colonists: p.settlement_origin !== 'native' && p.tech_level >= def.minTech ? 4 : 0,
      offworld_power: connected ? 2 : 0,
      unknown: 1,
    };
    const builder = r.weighted(biased(BUILDERS, builderWeights));
    const condition = r.weighted(biased(MEGASTRUCTURE_CONDITIONS, MEGASTRUCTURE_CONDITION_WEIGHTS[builder]));
    return { type, name: '', condition, builder };
  });
}

export function rollSpecialAbilities(p: Planet, rng: Rng): void {
  const boosted = p.anomalies.some((a) => a.type === 'psychic_resonance') || p.precursor_presence === 'active_tech'
    || PLANET_TYPE_TABLE[p.planet_type].exotic;
  const weights = boosted ? SPECIAL_ABILITY_COUNT_WEIGHTS.map((w, i) => (i === 0 ? w * 0.4 : w)) : SPECIAL_ABILITY_COUNT_WEIGHTS;
  const count = pickCount(rng, weights);
  const types = rng.weightedSample(eligible(SPECIAL_ABILITY_TYPES, SPECIAL_ABILITY_TABLE, planetContext(p)), count);
  p.special_abilities = types.map((type) => ({
    type,
    prevalence: rng.fork(type).weightedBy(PREVALENCE_LEVELS, (k) => PREVALENCE_WEIGHTS[k]),
  }));
}
