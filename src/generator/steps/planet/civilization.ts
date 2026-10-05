import { CONFIG } from '../../config';
import {
  BIOME_TABLE, CONNECTIVITY_BY_ORIGIN, DENSITY_BY_TECH, FACTION_TABLE, HAZARD_TABLE,
  PLANET_TYPE_TABLE, POLITICAL_STRUCTURE_TABLE, RESOURCE_TABLE, TECH_GOODS, TECH_WEIGHTS_BY_ORIGIN,
} from '../../content';
import type { Rng } from '../../rng';
import { isSpacefaring, tradesOffworld } from '../../rules/economy';
import { hasLiquidWater } from '../../rules/physical';
import type { PlanetBundle } from '../../types/entities';
import {
  ABUNDANCE_LEVELS, CONNECTIVITY_LEVELS, DANGER_LEVELS, GALACTIC_FACTIONS, LAW_LEVELS, POLITICAL_STRUCTURES,
  SEVERITY_LEVELS, STABILITY_LEVELS, TRADE_GOODS, WEALTH_LEVELS,
  type LawLevel, type TradeGood,
} from '../../types/enums';
import { biased, clamp, roundSig, scaleAt } from '../util';

export function rollTech(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const minTech = PLANET_TYPE_TABLE[p.planet_type].minTech ?? 0;
  const weights = TECH_WEIGHTS_BY_ORIGIN[p.settlement_origin].map((w, i) => ({ value: i, weight: i >= minTech ? w : 0 }));
  p.tech_level = weights.some((w) => w.weight > 0) ? rng.weighted(weights) : minTech;
}

function techBand(tech: number): 0 | 1 | 2 {
  return tech <= 3 ? 0 : tech <= 6 ? 1 : 2;
}

/** Population, political structure, stability, law and danger. */
export function rollSociety(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const def = PLANET_TYPE_TABLE[p.planet_type];

  // Population
  const popRng = rng.fork('population');
  const area = 4 * Math.PI * p.radius_km * p.radius_km;
  const landBiomes = p.biomes.filter((b) => BIOME_TABLE[b.biome].water !== 'sea');
  const landShare = landBiomes.reduce((a, b) => a + b.share, 0);
  const habitability = landShare > 0
    ? landBiomes.reduce((a, b) => a + b.share * BIOME_TABLE[b.biome].habitability, 0) / landShare
    : 0.05;
  const interior = p.planet_type === 'hollow' ? 2 : 1;
  const seaLiving = p.tech_level >= 6 ? (1 - landShare) * 0.05 : 0;
  const originFactor = p.settlement_origin === 'colonial'
    ? popRng.float(0.01, 0.35)
    : p.settlement_origin === 'lost_colony' ? popRng.float(0.01, 0.2) : 1;
  const mainSpecies = bundle.species[p.species[0].species_id];
  const comfortable = p.temperature_range.mean >= mainSpecies.comfort_temperature[0]
    && p.temperature_range.mean <= mainSpecies.comfort_temperature[1];
  // Peoples who cannot breathe the air live in domes and habitats.
  const breathable = mainSpecies.breathes.includes(p.atmosphere.composition) ? 1 : 0.08;
  const airless = p.atmosphere.pressure === 'none' || p.atmosphere.pressure === 'trace' ? 0.5 : 1;
  const raw = area * (landShare * interior + seaLiving) * habitability
    * DENSITY_BY_TECH[p.tech_level] * (def.populationFactor ?? 1) * originFactor
    * (comfortable ? 1 : 0.3) * breathable * airless * Math.exp(popRng.normal(0, 0.5));
  p.population = Math.max(5000, roundSig(raw, 3));

  // Political structure: tech sets the baseline; small populations rarely fragment.
  const polRng = rng.fork('politics');
  const band = techBand(p.tech_level);
  const structure = polRng.weightedBy(POLITICAL_STRUCTURES, (s) => {
    let w = POLITICAL_STRUCTURE_TABLE[s].weightByTech[band];
    if (p.population < 200_000 && s === 'fragmented') w = 0;
    if (p.population < 200_000 && s === 'federation') w *= 0.3;
    if (p.population < 2_000_000 && s === 'unified') w *= 2;
    if (p.settlement_origin === 'lost_colony' && s === 'fragmented') w *= 1.5;
    return w;
  });
  p.political_structure = structure;
  const [cMin, cMax] = CONFIG.countryCount[structure];
  p.country_count = polRng.int(cMin, cMax);
  p.stability = polRng.weighted(biased(STABILITY_LEVELS, POLITICAL_STRUCTURE_TABLE[structure].stability));
  p.world_government = POLITICAL_STRUCTURE_TABLE[structure].hasWorldGovernment
    ? { name: '', leader_title: '', leader_npc_id: null }
    : null;

  // Law
  const lawBase: Record<LawLevel, number> = { lawless: 0.5, lax: 2, moderate: 4, strict: 3, oppressive: 1, absolute: 0.3 };
  if (structure === 'anarchic') Object.assign(lawBase, { lawless: 6, lax: 3, moderate: 0.5, strict: 0.1, oppressive: 0.1, absolute: 0 });
  if (structure === 'unified') Object.assign(lawBase, { strict: 5, oppressive: 2, absolute: 1 });
  if (structure === 'fragmented') Object.assign(lawBase, { lawless: 2, lax: 4 });
  p.law_level = rng.fork('law').weighted(biased(LAW_LEVELS, lawBase));

  // Danger: hazards, instability and lawlessness.
  const hazardScore = p.hazards.reduce(
    (a, h) => a + HAZARD_TABLE[h.type].danger * (SEVERITY_LEVELS.indexOf(h.severity) + 1) / 2, 0,
  );
  const instability = (STABILITY_LEVELS.length - 1 - STABILITY_LEVELS.indexOf(p.stability)) * 0.4;
  const lawlessness = p.law_level === 'lawless' ? 1 : p.law_level === 'lax' ? 0.4 : 0;
  const score = hazardScore + instability + lawlessness + rng.fork('danger').normal(0, 0.5);
  const thresholds = [1.5, 3, 4.5, 6.5, 8.5];
  p.danger_level = DANGER_LEVELS[thresholds.filter((t) => score >= t).length];
}

/** Galactic connectivity, faction, wealth, exports and imports. */
export function rollEconomy(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;

  const cRng = rng.fork('connectivity');
  const base = CONNECTIVITY_BY_ORIGIN[p.settlement_origin];
  p.galactic_connectivity = cRng.weightedBy(CONNECTIVITY_LEVELS, (c) => {
    let w = base[c] ?? 0;
    if (p.tech_level >= 7 && (c === 'uncontacted' || c === 'quarantined')) w = 0;
    if (p.tech_level >= 7 && c === 'isolated') w *= 0.3;
    if (p.tech_level >= 8 && c === 'hub') w *= 2;
    // Worlds without spaceflight can be known and visited, but are never part of the trade lanes.
    if (!isSpacefaring(p) && (c === 'connected' || c === 'hub')) w = 0;
    return w;
  });
  const connIdx = CONNECTIVITY_LEVELS.indexOf(p.galactic_connectivity);

  const fRng = rng.fork('faction');
  p.faction_allegiance = connIdx === 0
    ? 'none'
    : fRng.weightedBy(GALACTIC_FACTIONS, (f) => (FACTION_TABLE[f].minConnectivity <= connIdx ? FACTION_TABLE[f].weight : 0));

  // Wealth
  const wRng = rng.fork('wealth');
  const resourceScore = p.resources.reduce((a, r) => a + ABUNDANCE_LEVELS.indexOf(r.abundance), 0);
  const wealthScore = p.tech_level * 0.35 + resourceScore * 0.12 + connIdx * 0.35
    + STABILITY_LEVELS.indexOf(p.stability) * 0.25 - 2.2 + wRng.normal(0, 0.7);
  p.wealth_level = scaleAt(WEALTH_LEVELS, clamp(wealthScore, 0, WEALTH_LEVELS.length - 1));

  // Off-world trade needs a contacted, spacefaring people.
  if (!tradesOffworld(p)) {
    p.primary_exports = [];
    p.primary_imports = [];
    return;
  }
  const tRng = rng.fork('trade');
  const exportWeights = new Map<TradeGood, number>();
  const add = (m: Map<TradeGood, number>, g: TradeGood, w: number) => m.set(g, (m.get(g) ?? 0) + w);
  for (const r of p.resources) {
    const a = ABUNDANCE_LEVELS.indexOf(r.abundance);
    if (a >= 2) add(exportWeights, RESOURCE_TABLE[r.resource].good, a * 1.5);
  }
  for (const g of TECH_GOODS[techBand(p.tech_level)]) add(exportWeights, g, 0.8);
  if (p.special_abilities.length > 0 || p.anomalies.length > 0 || p.megastructures.length > 0) add(exportWeights, 'tourism', 0.8);
  const exportsList = tRng.weightedSample([...exportWeights].map(([value, weight]) => ({ value, weight })), tRng.int(...CONFIG.planet.exports));

  const importWeights = new Map<TradeGood, number>();
  const hasResource = (goods: TradeGood[]) => p.resources.some((r) => goods.includes(RESOURCE_TABLE[r.resource].good));
  if (!hasLiquidWater(p) && !hasResource(['fresh_water'])) add(importWeights, 'fresh_water', 4);
  if (['none', 'microbial', 'sparse', 'dying', 'synthetic'].includes(p.biosphere)) {
    add(importWeights, 'grain', 3);
    add(importWeights, 'preserved_food', 3);
  }
  if (p.tech_level < 6) {
    add(importWeights, 'machinery', 2);
    add(importWeights, 'medicine', 2);
    add(importWeights, 'electronics', 1.5);
  } else {
    add(importWeights, 'luxury_goods', 1.5);
    add(importWeights, 'art', 1);
  }
  if (!hasResource(['fuel', 'fusion_fuel'])) add(importWeights, 'fusion_fuel', 2);
  if (p.tech_level >= 6 && !hasResource(['rare_earths'])) add(importWeights, 'rare_earths', 2);
  if (STABILITY_LEVELS.indexOf(p.stability) <= 2) add(importWeights, 'weapons', 2);
  for (const g of TRADE_GOODS) add(importWeights, g, 0.15);
  const importPool = [...importWeights]
    .filter(([g]) => !exportsList.includes(g))
    .map(([value, weight]) => ({ value, weight }));
  p.primary_exports = exportsList;
  p.primary_imports = tRng.weightedSample(importPool, tRng.int(...CONFIG.planet.imports));
}
