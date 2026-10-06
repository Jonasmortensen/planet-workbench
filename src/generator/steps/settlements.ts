import { CONFIG } from '../config';
import {
  ADJECTIVES, AESTHETIC_TABLE, BIOME_TABLE, CUSTOM_TABLE, DEFENSE_TABLE, DISTRICT_NAME_PATTERNS, DISTRICT_TABLE,
  GOVERNING_BODY_TABLE, GOVERNMENT_TABLE, HISTORICAL_EVENT_TABLE, INDUSTRY_TABLE, LINK_TYPE_TABLE,
  MOOD_BY_STABILITY, NICKNAME_NOUNS, NICKNAME_PATTERNS, NOUNS, SETTLEMENT_TYPE_TABLE, TERRAIN_LANDFORMS, eligible,
  type ConstraintContext,
} from '../content';
import { attachSuffix, fillPattern, makeBareName, makePlaceName, pickPattern } from '../naming';
import { normalizeShares, type Rng } from '../rng';
import { hasLiquidWater } from '../rules/physical';
import { settlementTypeProblems, typeAllowsBiome } from '../rules/settlement';
import type {
  Country, District, HistoricalEvent, PlanetBundle, ReligionShare, Settlement, SpeciesShare,
} from '../types/entities';
import {
  AESTHETICS, CORRUPTION_LEVELS, CUSTOMS, DEFENSE_TYPES, DISTRICT_TYPES, EVENT_OUTCOMES, GARRISON_STRENGTHS,
  HISTORICAL_EVENT_TYPES, INDUSTRIES, LAW_LEVELS, LINK_TYPES, MARKET_SIZES, MILITARY_STRENGTHS, MOODS,
  SETTLEMENT_TYPES, SOCIAL_STRUCTURES, STABILITY_LEVELS, WEALTH_LEVELS,
  type Biome, type LinkType, type SettlementType, type Terrain,
} from '../types/enums';
import { makeId } from '../types/ids';
import { bundleContext } from './context';
import { dist, spanningTree, spreadPoints, type Point } from './geometry';
import { biased, clamp, floorSig, scaleAt, shiftScale } from './util';

interface Counters {
  settlement: number;
}

/**
 * Pipeline step 3: settlements. Per country: count, types (capital first),
 * populations within the country's total, then names, districts, points of
 * interest and history. Connections are built once every settlement exists.
 */
export function generateSettlementsStep(bundle: PlanetBundle, rng: Rng): void {
  const counters: Counters = { settlement: 0 };
  const usedNames = new Set<string>();
  for (const country of Object.values(bundle.countries)) {
    buildCountrySettlements(bundle, rng.fork(country.id), country, counters, usedNames);
  }
  connect(bundle, rng.fork('connections'));
}

function settlementCount(rng: Rng, country: Country, countryCount: number): number {
  const [lo, hi] = CONFIG.settlement.perCountry;
  const relativeSize = country.area_share * countryCount;
  const popBonus = clamp(Math.log10(Math.max(10, country.population)) - 7, -1, 2) * 0.7;
  return clamp(Math.round(2.5 + 2.5 * Math.sqrt(relativeSize) + popBonus + rng.normal(0, 0.7)), lo, hi);
}

function buildCountrySettlements(
  bundle: PlanetBundle, rng: Rng, country: Country, counters: Counters, usedNames: Set<string>,
): void {
  const p = bundle.planet;
  const count = settlementCount(rng.fork('count'), country, p.country_count);
  const ctx = bundleContext(bundle, { techLevel: country.tech_level, biomes: country.biomes.map((b) => b.biome) });
  const countryBiomes = country.biomes.map((b) => b.biome);

  // Types: a capital, then a weighted mix the country's tech and biomes allow.
  const typeRng = rng.fork('types');
  const types: SettlementType[] = ['capital'];
  for (let i = 1; i < count; i++) {
    const pool = SETTLEMENT_TYPES.filter((t) => t !== 'capital')
      .filter((t) => countryBiomes.some((b) => settlementTypeProblems(t, b, p, ctx).length === 0))
      .map((t) => ({ value: t, weight: typeWeight(t, country, bundle) }));
    types.push(typeRng.weighted(pool));
  }
  // Big settlement types first so the capital and cities get the central spots.
  const order = types.map((t, i) => ({ t, i })).sort((a, b) => SETTLEMENT_TYPE_TABLE[b.t].size - SETTLEMENT_TYPE_TABLE[a.t].size || a.i - b.i);

  // Positions inside the country's territory.
  const radius = clamp(0.32 * Math.sqrt(country.area_share), 0.03, 0.45);
  const points = spreadPoints(rng.fork('positions'), count, country.center, radius);
  points.sort((a, b) => dist(a, country.center) - dist(b, country.center));

  // Populations: capital and cities take shares of the urban population; the rest use fixed ranges.
  const popRng = rng.fork('population');
  const urban = country.population * CONFIG.settlement.urbanFraction[country.tech_level];
  const pops = order.map(({ t }) => {
    const def = SETTLEMENT_TYPE_TABLE[t].pop;
    return 'urbanShare' in def ? urban * popRng.float(def.urbanShare[0], def.urbanShare[1]) : popRng.float(def.fixed[0], def.fixed[1]);
  });
  // The capital is the largest place unless it is a special form.
  const maxOther = Math.max(0, ...pops.slice(1));
  if (pops[0] < maxOther) pops[0] = maxOther * popRng.float(1.05, 1.6);
  const cap = country.population * 0.95;
  const sum = pops.reduce((a, b) => a + b, 0);
  const scale = sum > cap ? cap / sum : 1;

  const ids: string[] = [];
  order.forEach(({ t }, k) => {
    const id = makeId('settlement', counters.settlement++);
    ids.push(id);
    const s = buildSettlement(bundle, rng.fork(`settlement:${k}`), id, t, country, points[k], Math.max(5, floorSig(pops[k] * scale, 3)), ctx, usedNames);
    bundle.settlements[id] = s;
  });
  country.capital_settlement_id = ids[0];
}

function typeWeight(t: SettlementType, country: Country, bundle: PlanetBundle): number {
  const def = SETTLEMENT_TYPE_TABLE[t];
  let w = def.weight;
  const p = bundle.planet;
  if (t === 'fortress' && STABILITY_LEVELS.indexOf(country.stability) <= 2) w *= 2.5;
  if (t === 'trade_hub' && ['connected', 'hub'].includes(p.galactic_connectivity)) w *= 2;
  if (t === 'orbital_station' && p.galactic_connectivity === 'hub') w *= 2;
  if (t === 'monastery' && country.government_type === 'theocracy') w *= 3;
  if (t === 'underground' && (p.atmosphere.pressure === 'none' || p.atmosphere.pressure === 'trace' || Math.abs(p.temperature_range.mean - 15) > 35)) w *= 4;
  if (t === 'village' && country.tech_level >= 7) w *= 0.3;
  if (t === 'city' && country.tech_level <= 2) w *= 0.4;
  if (t === 'ruin_town' && p.precursor_presence === 'ruins') w *= 2;
  if ((t === 'hive_city') && ['hive_council'].includes(country.government_type)) w *= 3;
  return w;
}

// ---------------------------------------------------------------------------

function buildSettlement(
  bundle: PlanetBundle, rng: Rng, id: string, type: SettlementType, country: Country, position: Point,
  population: number, ctx: ConstraintContext, usedNames: Set<string>,
): Settlement {
  const p = bundle.planet;
  const def = SETTLEMENT_TYPE_TABLE[type];
  const gov = GOVERNMENT_TABLE[country.government_type];
  const size = def.size;

  // Location
  const lRng = rng.fork('location');
  const biomePool = country.biomes
    .filter((b) => typeAllowsBiome(type, b.biome, p))
    .map((b) => ({ value: b.biome, weight: b.share * BIOME_TABLE[b.biome].habitability + 0.01 }));
  const biome: Biome = biomePool.length ? lRng.weighted(biomePool) : country.biomes[0].biome;
  const terrainPool = def.terrains ?? BIOME_TABLE[biome].terrains;
  const terrain: Terrain = lRng.pick(terrainPool);

  // Population mix
  const species = inheritSpecies(rng.fork('species'), country.species);
  const languages = country.languages.filter((lid, i) => i === 0
    || bundle.languages[lid].speaker_species_ids.some((sid) => (species.find((s) => s.species_id === sid)?.share ?? 0) >= 0.05));
  const religions = inheritReligions(rng.fork('religions'), country.religions_or_ideologies);
  const socRng = rng.fork('society');
  const social = socRng.chance(0.75)
    ? socRng.weighted(biased(SOCIAL_STRUCTURES, gov.socialStructures))
    : socRng.pick(SOCIAL_STRUCTURES);

  // Governance
  const govRng = rng.fork('governance');
  const bodyWeights = { ...gov.governingBodies };
  if (type !== 'capital') for (const [k, v] of Object.entries(def.governingBodies)) bodyWeights[k as keyof typeof bodyWeights] = (bodyWeights[k as keyof typeof bodyWeights] ?? 0) * 0.5 + (v ?? 0) * 1.5;
  const body = govRng.weightedKeys(Object.keys(bodyWeights) as (keyof typeof bodyWeights)[], bodyWeights);
  const leaderTitle = govRng.pick(GOVERNING_BODY_TABLE[body].titles);
  const law = shiftScale(govRng, LAW_LEVELS, country.law_level, 0, 0.5);
  const corruptionScore = 2 - (STABILITY_LEVELS.indexOf(country.stability) - 3) * 0.5 - (LAW_LEVELS.indexOf(law) - 2) * 0.3
    + (size >= 4 ? 0.4 : 0) + govRng.normal(0, 0.8);
  const corruption = scaleAt(CORRUPTION_LEVELS, corruptionScore);

  // Economy
  const ecoRng = rng.fork('economy');
  const sizeWealth = type === 'capital' ? 1 : size >= 4 ? 0.5 : size === 1 ? -0.7 : 0;
  const wealth = shiftScale(ecoRng, WEALTH_LEVELS, country.wealth_level, sizeWealth, 0.7);
  const industryPool = eligible(INDUSTRIES, INDUSTRY_TABLE, { ...ctx, biomes: [biome] }, (k, d) => {
    const typeAffinity = def.industries[k] ?? 0;
    const countryAffinity = country.primary_industries.includes(k) ? 2 : 0;
    return (typeAffinity * 2 + countryAffinity + d.weight * 0.15);
  });
  const industries = ecoRng.weightedSample(industryPool, ecoRng.int(1, size >= 4 ? 3 : 2));
  const goodsPool = industries.flatMap((ind) => INDUSTRY_TABLE[ind].goods).map((g) => ({ value: g, weight: 1 }));
  const goods = Array.from(new Set(ecoRng.weightedSample(goodsPool, ecoRng.int(1, 3))));
  const marketSize = MARKET_SIZES[[50, 300, 5000, 100_000, 2_000_000].filter((t) => population >= t).length];

  // Defense
  const dRng = rng.fork('defense');
  const stabilityIdx = STABILITY_LEVELS.indexOf(country.stability);
  const defenseCount = clamp(Math.round((type === 'fortress' ? 3 : size >= 4 ? 2 : 1) + (stabilityIdx <= 2 ? 1 : 0) + dRng.normal(0, 0.7)), 0, 4);
  const defensePool = eligible(DEFENSE_TYPES, DEFENSE_TABLE, ctx, (k, d) => {
    let w = d.weight;
    if (k === 'natural_barrier' && ['mountain', 'cliffside', 'island', 'canyon', 'underground'].includes(terrain)) w *= 4;
    if (k === 'hidden_location' && (terrain === 'underground' || type === 'monastery')) w *= 4;
    if (k === 'orbital_defense' && type !== 'capital' && type !== 'orbital_station') w *= 0.2;
    return w;
  });
  const defenses = dRng.weightedSample(defensePool, defenseCount);
  const garrisonScore = size * 0.6 + (type === 'fortress' ? 2 : 0) + (MILITARY_STRENGTHS.indexOf(country.military_strength) - 2) * 0.4
    + (stabilityIdx <= 2 ? 0.5 : 0) + dRng.normal(0, 0.6) - 0.5;
  const garrison = scaleAt(GARRISON_STRENGTHS, garrisonScore);

  // Names (language of the country)
  const nRng = rng.fork('names');
  const lang = bundle.languages[country.languages[0]];
  const ph = lang.phonology;
  const nameOf = (r: Rng) => fillPattern(pickPattern(r, def.namePatterns), {
    place: () => makePlaceName(ph, r),
    root: () => makeBareName(ph, r),
    suffixed: () => attachSuffix(makeBareName(ph, r), r.pick(ph.place_suffixes)),
    landform: () => r.pick(TERRAIN_LANDFORMS[terrain]),
    adjective: () => r.pick(ADJECTIVES),
    noun: () => r.pick(NOUNS),
  });
  let name = nameOf(nRng);
  for (let attempt = 1; usedNames.has(name) && attempt < 8; attempt++) name = nameOf(nRng.fork(`retry:${attempt}`));
  usedNames.add(name);
  const nickname = fillPattern(pickPattern(nRng, NICKNAME_PATTERNS), {
    adjective: () => nRng.pick(ADJECTIVES),
    epithetNoun: () => nRng.pick(NICKNAME_NOUNS[size]),
    landform: () => nRng.pick(TERRAIN_LANDFORMS[terrain]),
  });

  // Districts
  const disRng = rng.fork('districts');
  const coastal = ['coastal', 'delta', 'island', 'riverside', 'lakeside', 'submerged'].includes(terrain) || type === 'orbital_station' || type === 'port';
  const districtPool = eligible(DISTRICT_TYPES, DISTRICT_TABLE, ctx, (k, d) => {
    if (d.minSize > size) return 0;
    let w = d.weight * (def.districts[k] ?? 1);
    if (k === 'docks' && !coastal) return 0;
    if (k === 'noble_quarter' && ['absolute_monarchy', 'constitutional_monarchy', 'elective_monarchy', 'feudal_realm', 'oligarchy'].includes(country.government_type)) w *= 2.5;
    if (k === 'ruins' && p.precursor_presence !== 'none') w *= 3;
    if (k === 'temple' && religions.length > 0) w *= 1.5;
    return w;
  });
  const [dMin, dMax] = CONFIG.settlement.districts[size];
  const districtTypes = disRng.weightedSample(districtPool, disRng.int(dMin, dMax));
  const districts: District[] = districtTypes.map((dt) => ({
    name: fillPattern(pickPattern(disRng, DISTRICT_NAME_PATTERNS), {
      district: () => disRng.pick(DISTRICT_TABLE[dt].nouns),
      adjective: () => disRng.pick(ADJECTIVES),
      root: () => makeBareName(ph, disRng, 2),
    }),
    type: dt,
    description: '',
  }));

  // Atmosphere
  const aRng = rng.fork('atmosphere');
  const wealthIdx = WEALTH_LEVELS.indexOf(wealth);
  const mood = aRng.weightedBy(MOODS, (m) => {
    let w = MOOD_BY_STABILITY[m]?.[stabilityIdx] ?? 1;
    if (m === 'decadent') w *= wealthIdx >= 4 ? 2.5 : 0.3;
    if (m === 'grim') w *= wealthIdx <= 1 ? 2 : 1;
    if (m === 'fearful') w *= ['high', 'deadly', 'extreme'].includes(p.danger_level) ? 2 : 1;
    if (m === 'pious') w *= country.government_type === 'theocracy' || type === 'monastery' ? 4 : 1;
    if (m === 'militant') w *= type === 'fortress' ? 4 : 1;
    if (m === 'bustling') w *= size >= 3 ? 1.5 : 0.4;
    if (m === 'sleepy') w *= size <= 2 ? 2 : 0.5;
    return w;
  });
  const aesthetic = aRng.chance(0.7)
    ? country.aesthetic
    : aRng.weighted(eligible(AESTHETICS, AESTHETIC_TABLE, { ...ctx, biomes: [biome] }));
  const customs = aRng.sample(country.customs, aRng.int(1, Math.min(2, country.customs.length)));
  if (aRng.chance(0.25)) {
    const local = aRng.weighted(eligible(CUSTOMS, CUSTOM_TABLE, ctx).filter((c) => !customs.includes(c.value)));
    customs.push(local);
  }

  // History
  const history = settlementHistory(rng.fork('history'), id, type, country, bundle);

  return {
    id,
    country_id: country.id,
    seed: rng.seed,
    name,
    nickname,
    settlement_type: type,
    biome,
    terrain,
    position,
    connections: [],
    population,
    species,
    languages,
    religions_or_ideologies: religions,
    social_structure: social,
    leader_title: leaderTitle,
    leader_npc_id: null,
    governing_body: body,
    law_level: law,
    corruption_level: corruption,
    wealth_level: wealth,
    primary_industries: industries,
    notable_goods: goods,
    market_size: marketSize,
    defenses,
    garrison_strength: garrison,
    districts,
    poi_ids: [],
    mood,
    aesthetic,
    local_customs: customs,
    current_events: [],
    organizations_present: [],
    founding_date: history.founding,
    key_events: history.events,
    tagline: '',
    description: '',
    rumors: [],
  };
}

function inheritSpecies(rng: Rng, parent: SpeciesShare[]): SpeciesShare[] {
  const weights = parent.map((s) => s.share * Math.exp(rng.normal(0, 0.3)) * (s.share < 0.08 && rng.chance(0.5) ? 0 : 1));
  if (!weights.some((w) => w > 0)) weights[0] = 1;
  const kept = parent.filter((_, i) => weights[i] > 0);
  const shares = normalizeShares(weights.filter((w) => w > 0));
  return kept.map((s, i) => ({ species_id: s.species_id, share: shares[i] })).sort((a, b) => b.share - a.share);
}

function inheritReligions(rng: Rng, parent: ReligionShare[]): ReligionShare[] {
  if (parent.length === 0) return [];
  const total = parent.reduce((a, r) => a + r.share, 0);
  const weights = parent.map((r) => r.share * Math.exp(rng.normal(0, 0.3)));
  const shares = normalizeShares(weights, Math.round(clamp(total + rng.normal(0, 0.05), 0.2, 1) * 1000) / 1000);
  return parent.map((r, i) => ({ religion_id: r.religion_id, share: shares[i] })).sort((a, b) => b.share - a.share);
}

function settlementHistory(rng: Rng, id: string, type: SettlementType, country: Country, bundle: PlanetBundle): { founding: number; events: HistoricalEvent[] } {
  const colonization = bundle.planet.history.find((e) => e.event_type === 'colonization');
  const floor = colonization ? colonization.date + 1 : country.founding_date - 400;
  // Capitals often predate the country; other places are founded at any time since.
  const founding = type === 'capital'
    ? Math.max(floor, country.founding_date - rng.int(0, 150))
    : Math.max(floor, country.founding_date - (rng.chance(0.3) ? rng.int(0, 200) : 0)) + Math.floor((-3 - country.founding_date) * rng.next() ** 1.3);
  const foundingDate = Math.min(founding, -2);

  const events: HistoricalEvent[] = [{
    id: '', date: foundingDate, event_type: 'founding', involved_refs: [],
    outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE.founding.outcomes)), parent_event_id: null,
  }];
  const target = rng.int(...CONFIG.settlement.keyEvents);
  // Sometimes a country event touched this place.
  const countryEvents = country.key_events.filter((e) => e.event_type !== 'founding' && e.date > foundingDate);
  if (countryEvents.length > 0 && events.length < target && rng.chance(0.5)) {
    const e = rng.pick(countryEvents);
    events.push({
      id: '', date: e.date, event_type: e.event_type, involved_refs: [country.id],
      outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[e.event_type].outcomes)), parent_event_id: e.id,
    });
  }
  while (events.length < target && foundingDate < -2) {
    const t = rng.weighted(HISTORICAL_EVENT_TYPES.map((x) => ({
      value: x,
      weight: HISTORICAL_EVENT_TABLE[x].unique ? 0 : HISTORICAL_EVENT_TABLE[x].weights.settlement ?? 0,
    })));
    const conflict = t === 'war' || t === 'invasion' || t === 'civil_war' || t === 'uprising';
    events.push({
      id: '', date: -rng.int(1, -foundingDate - 1), event_type: t, involved_refs: conflict ? [country.id] : [],
      outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[t].outcomes)), parent_event_id: null,
    });
  }
  events.sort((a, b) => a.date - b.date);
  events.forEach((e, i) => { e.id = `event_${id}_${i}`; });
  return { founding: foundingDate, events };
}

// ---------------------------------------------------------------------------

/**
 * Connections: a spanning tree inside each country plus a few extra short
 * links, then border crossings between neighboring countries. Always symmetric.
 */
function connect(bundle: PlanetBundle, rng: Rng): void {
  const link = (a: Settlement, b: Settlement, r: Rng) => {
    if (a.id === b.id || a.connections.some((c) => c.settlement_id === b.id)) return;
    const type = linkType(a, b, bundle, r);
    a.connections.push({ settlement_id: b.id, link_type: type });
    b.connections.push({ settlement_id: a.id, link_type: type });
  };
  const surface = (s: Settlement) => s.settlement_type !== 'orbital_station';

  for (const country of Object.values(bundle.countries)) {
    const r = rng.fork(country.id);
    const all = Object.values(bundle.settlements).filter((s) => s.country_id === country.id);
    const ground = all.filter(surface);
    const points = ground.map((s) => s.position);
    for (const [i, j] of spanningTree(points)) link(ground[i], ground[j], r);
    for (let i = 0; i < ground.length; i++) {
      for (let j = i + 1; j < ground.length; j++) {
        if (dist(points[i], points[j]) < 0.08 && r.chance(0.3)) link(ground[i], ground[j], r);
      }
    }
    // Orbital stations dock with the capital (or the nearest ground settlement).
    const capital = bundle.settlements[country.capital_settlement_id!];
    for (const st of all.filter((s) => !surface(s))) {
      const anchor = surface(capital) ? capital : ground[0] ?? capital;
      link(st, anchor, r);
    }
  }

  // Border crossings
  for (const country of Object.values(bundle.countries)) {
    for (const nid of country.neighbor_ids) {
      if (nid < country.id) continue;
      const r = rng.fork(`${country.id}:${nid}`);
      const mine = Object.values(bundle.settlements).filter((s) => s.country_id === country.id && surface(s));
      const theirs = Object.values(bundle.settlements).filter((s) => s.country_id === nid && surface(s));
      let best: [Settlement, Settlement] | null = null;
      let bestD = Infinity;
      for (const a of mine) for (const b of theirs) {
        const d = dist(a.position, b.position);
        if (d < bestD) { bestD = d; best = [a, b]; }
      }
      if (best) link(best[0], best[1], r);
    }
  }
}

function linkType(a: Settlement, b: Settlement, bundle: PlanetBundle, rng: Rng): LinkType {
  const p = bundle.planet;
  const tech = Math.min(bundle.countries[a.country_id].tech_level, bundle.countries[b.country_id].tech_level);
  const terrains = [a.terrain, b.terrain];
  if (terrains.includes('orbit')) return tech >= 7 ? 'orbital_shuttle' : 'air_route';
  const water = hasLiquidWater(p);
  return rng.weightedBy(LINK_TYPES, (t) => {
    const d = LINK_TYPE_TABLE[t];
    if (tech < d.minTech || tech > d.maxTech) return 0;
    let w = d.weight;
    if (t === 'orbital_shuttle') return 0;
    if (t === 'portal' && p.precursor_presence !== 'active_tech') return 0;
    if ((t === 'sea_route' || t === 'river') && !water) return 0;
    if (t === 'tunnel' && terrains.some((x) => x === 'underground' || x === 'submerged' || x === 'mountain')) w *= 6;
    if (t === 'sea_route' && terrains.some((x) => x === 'coastal' || x === 'island' || x === 'submerged' || x === 'delta')) w *= 4;
    if (t === 'river' && terrains.some((x) => x === 'riverside' || x === 'delta' || x === 'lakeside')) w *= 4;
    if (t === 'air_route' && terrains.includes('floating')) w *= 6;
    if (t === 'caravan_trail' && [a.biome, b.biome].some((x) => ['desert', 'dunes', 'steppe', 'salt_flats', 'savanna'].includes(x))) w *= 3;
    return w;
  });
}
