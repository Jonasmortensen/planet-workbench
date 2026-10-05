import { CONFIG } from '../config';
import {
  ADJECTIVES, AESTHETIC_TABLE, BIOME_TABLE, COUNTRY_NAME_PATTERNS, CULTURE_VALUE_TABLE, CURRENCY_NOUNS, CURRENCY_PATTERNS,
  CUSTOM_TABLE, DEMONYM_SUFFIXES, FEATURE_NAME_PATTERNS, FEATURE_TABLE, FLAG_COLORS, FLAG_EMBLEMS, FLAG_LAYOUTS,
  GOVERNMENT_TABLE, HISTORICAL_EVENT_TABLE, INDUSTRY_TABLE, MILITARY_DOCTRINE_TABLE, MOTTO_PATTERNS, RELIGION_KIND_TABLE,
  eligible,
} from '../content';
import { attachSuffix, fillPattern, makeBareName, makePlaceName, makeRoot, pickPattern } from '../naming';
import { normalizeShares, type Rng } from '../rng';
import { isSettleableLand, planetHasLand } from '../rules/settlement';
import type {
  BiomeShare, Country, HistoricalEvent, Language, NotableFeature, PlanetBundle, ReligionShare, SpeciesShare,
} from '../types/entities';
import {
  AESTHETICS, CULTURE_VALUES, CUSTOMS, EVENT_OUTCOMES, FEATURE_TYPES, FREEDOM_LEVELS, GOVERNMENT_TYPES,
  HISTORICAL_EVENT_TYPES, INDUSTRIES, LAW_LEVELS, MILITARY_DOCTRINES, MILITARY_STRENGTHS, RELIGION_KINDS,
  STABILITY_LEVELS, TRADE_GOODS, WEALTH_LEVELS,
  type CultureValue, type HistoricalEventType, type TradeGood,
} from '../types/enums';
import { PLANET_ID, makeId } from '../types/ids';
import { bundleContext } from './context';
import { gabrielEdges, spreadPoints } from './geometry';
import { addLanguage, addReligion } from './planet/peoples';
import { biased, clamp, floorSig, scaleAt, shiftScale } from './util';

/** Event types that pull several countries in when they happen planet-wide. */
const MULTI_COUNTRY_EVENTS: HistoricalEventType[] = ['war', 'invasion', 'treaty', 'unification', 'schism'];
const SINGLE_COUNTRY_EVENTS: HistoricalEventType[] = [
  'civil_war', 'revolution', 'secession', 'golden_age', 'renaissance', 'plague', 'famine', 'disaster', 'migration',
  'uprising', 'persecution', 'trade_boom', 'cataclysm', 'awakening', 'discovery', 'reform', 'exodus', 'miracle',
];

/**
 * Pipeline step 2: countries. Territory layout first (centers, shares,
 * neighbors), then each country inherits planet defaults with occasional
 * deviation, then populations are allocated and planet history is linked.
 */
export function generateCountriesStep(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const n = p.country_count;

  // Territory layout
  const geo = rng.fork('layout');
  const centers = spreadPoints(geo.fork('centers'), n);
  const evenness = p.political_structure === 'rival_powers' ? 1.6 : p.political_structure === 'fragmented' ? 0.7 : 1;
  const areaShares = geo.fork('shares').shares(n, evenness);
  const neighborSets = centers.map(() => new Set<number>());
  const edgeRng = geo.fork('edges');
  for (const [a, b] of gabrielEdges(centers)) {
    // Seas separate some territories on watery worlds.
    if (edgeRng.chance(p.water_coverage * 0.5)) continue;
    neighborSets[a].add(b);
    neighborSets[b].add(a);
  }

  const ids = centers.map((_, i) => makeId('country', i));
  for (let i = 0; i < n; i++) {
    const country = buildCountry(bundle, rng.fork(ids[i]), ids[i], areaShares[i], centers[i]);
    country.neighbor_ids = [...neighborSets[i]].sort((a, b) => a - b).map((j) => ids[j]);
    bundle.countries[country.id] = country;
  }

  allocatePopulation(bundle, rng.fork('population'));
  distributeFeatures(bundle, rng.fork('features'));
  linkHistory(bundle, rng.fork('history'));
}

// ---------------------------------------------------------------------------

function buildCountry(bundle: PlanetBundle, rng: Rng, id: string, areaShare: number, center: { x: number; y: number }): Country {
  const p = bundle.planet;
  const unified = p.country_count === 1;

  // Territory biomes: a subset of the planet's, weighted by planet share.
  const bRng = rng.fork('biomes');
  let biomes: BiomeShare[];
  if (unified) {
    biomes = p.biomes.map((b) => ({ ...b }));
  } else {
    const hasLand = planetHasLand(p);
    const pool = p.biomes.filter((b) => !hasLand || isSettleableLand(b.biome)).map((b) => ({ value: b.biome, weight: b.share }));
    const chosen = bRng.weightedSample(pool, bRng.int(...CONFIG.country.biomes));
    const sea = p.biomes.find((b) => !isSettleableLand(b.biome) && !chosen.includes(b.biome));
    if (hasLand && sea && bRng.chance(0.2 + 0.6 * p.water_coverage)) chosen.push(sea.biome);
    const weights = chosen.map((b) => (p.biomes.find((x) => x.biome === b)?.share ?? 0.1) * bRng.float(0.5, 1.5));
    const shares = normalizeShares(weights);
    biomes = chosen.map((b, i) => ({ biome: b, share: shares[i] })).sort((a, b) => b.share - a.share);
  }

  // Peoples: inherit planet mix, with deviation.
  const species = inheritSpecies(rng.fork('species'), p.species);
  const languages = countryLanguages(bundle, rng.fork('languages'), species);
  const lang = bundle.languages[languages[0]];
  const religions = inheritReligions(bundle, rng.fork('religions'), lang);

  // Tech
  const tRng = rng.fork('tech');
  let tech = p.tech_level;
  if (!unified && tRng.chance(CONFIG.country.techDeviationChance)) tech = clamp(tech + tRng.pick([-2, -1, -1, 1]), 0, 10);

  const ctx = bundleContext(bundle, { techLevel: tech, biomes: biomes.map((b) => b.biome) });

  // Government
  const gRng = rng.fork('government');
  const topReligion = religions[0] ? bundle.religions[religions[0].religion_id] : null;
  const devout = topReligion !== null && religions[0].share > 0.55 && RELIGION_KIND_TABLE[topReligion.kind].family !== 'secular';
  const govPool = eligible(GOVERNMENT_TYPES, GOVERNMENT_TABLE, ctx, (g, d) => {
    let w = d.weight * (d.structures[p.political_structure] ?? 1) * (d.origins?.[p.settlement_origin] ?? 1);
    if (g === 'theocracy' && devout) w *= 1.6;
    if (g === 'hive_council' || g === 'ai_administration') w *= 2;
    return w;
  });
  const government = gRng.weighted(govPool);
  const gov = GOVERNMENT_TABLE[government];

  // Order and freedom
  const oRng = rng.fork('order');
  const stability = shiftScale(oRng, STABILITY_LEVELS, p.stability, gov.stability, 0.8);
  const law = shiftScale(oRng, LAW_LEVELS, p.law_level, gov.law * 0.6, 0.6);
  const lawIdx = LAW_LEVELS.indexOf(law);
  const freedom = scaleAt(FREEDOM_LEVELS, 3 - (lawIdx - 2) * 0.6 + gov.freedom * 0.7 + oRng.normal(0, 0.5));

  // Economy
  const eRng = rng.fork('economy');
  const wealth = shiftScale(eRng, WEALTH_LEVELS, p.wealth_level, 0, 0.8);
  const industryPool = eligible(INDUSTRIES, INDUSTRY_TABLE, ctx, (_k, d) => {
    const matches = (d.resources ?? []).filter((r) => p.resources.some((pr) => pr.resource === r)).length;
    return d.weight * Math.pow(3, matches);
  });
  const industries = eRng.weightedSample(industryPool, eRng.int(...CONFIG.country.industries));
  const exportWeights = new Map<TradeGood, number>();
  for (const g of p.primary_exports) exportWeights.set(g, 2);
  for (const ind of industries) for (const g of INDUSTRY_TABLE[ind].goods) exportWeights.set(g, (exportWeights.get(g) ?? 0) + 1.5);
  const exports = eRng.weightedSample([...exportWeights].map(([value, weight]) => ({ value, weight })), eRng.int(2, 3));
  const importPool = TRADE_GOODS.filter((g) => !exports.includes(g))
    .map((g) => ({ value: g, weight: p.primary_imports.includes(g) ? 4 : 0.3 }));
  const imports = eRng.weightedSample(importPool, eRng.int(1, 3));

  // Military
  const mRng = rng.fork('military');
  const doctrine = mRng.weighted(eligible(MILITARY_DOCTRINES, MILITARY_DOCTRINE_TABLE, ctx, (k, d) => {
    let w = d.weight;
    if (k === 'pacifist' && topReligion?.tenets.includes('pacifism')) w *= 6;
    if (k === 'feudal_levy' && government === 'feudal_realm') w *= 4;
    if (k === 'psionic_corps' && government === 'psionic_conclave') w *= 4;
    return w;
  }));
  // Strength depends on population, which is allocated later; store a provisional score here.
  const militaryScore = WEALTH_LEVELS.indexOf(wealth) * 0.3 + tech * 0.15 + mRng.normal(0, 0.6);

  // Culture
  const cRng = rng.fork('culture');
  const valueWeights = CULTURE_VALUES.map((v) => ({
    value: v,
    weight: CULTURE_VALUE_TABLE[v].weight * (1 + (gov.values[v] ?? 0)) * (v === 'faith' && devout ? 3 : 1),
  }));
  const values = cRng.weightedSample(valueWeights, cRng.int(...CONFIG.country.values));
  const customs = cRng.weightedSample(eligible(CUSTOMS, CUSTOM_TABLE, ctx), cRng.int(...CONFIG.country.customs));
  const aesthetic = cRng.weighted(eligible(AESTHETICS, AESTHETIC_TABLE, ctx));

  // Names and symbols
  const nRng = rng.fork('names');
  const ph = lang.phonology;
  const root = makePlaceName(ph, nRng.fork('root'));
  const name = unified && p.world_government
    ? p.world_government.name
    : fillPattern(pickPattern(nRng, COUNTRY_NAME_PATTERNS), {
      root: () => root,
      state: () => nRng.pick(gov.stateNouns),
      adjective: () => nRng.pick(ADJECTIVES),
    });
  const demonym = makeDemonym(nRng.fork('demonym'), root);
  const motto = makeMotto(nRng.fork('motto'), values);
  const flag = makeFlag(nRng.fork('flag'), values, government);
  const currency = fillPattern(pickPattern(nRng, CURRENCY_PATTERNS), {
    root: () => makeRoot(ph, nRng, { minSyllables: 1, maxSyllables: 2 }),
    coin: () => nRng.pick(CURRENCY_NOUNS),
    adjective: () => nRng.pick(ADJECTIVES),
  });

  return {
    id,
    planet_id: PLANET_ID,
    seed: rng.seed,
    name,
    demonym,
    flag_description: flag,
    motto,
    area_share: areaShare,
    center,
    biomes,
    capital_settlement_id: null,
    neighbor_ids: [],
    notable_features: [],
    population: 0,
    species,
    languages,
    religions_or_ideologies: religions,
    government_type: government,
    ruler_title: gRng.pick(gov.rulerTitles),
    ruler_npc_id: null,
    stability,
    law_level: law,
    freedom_level: freedom,
    wealth_level: wealth,
    tech_level: tech,
    primary_industries: industries,
    exports,
    imports,
    currency_name: currency,
    // Provisional; finalized in allocatePopulation once populations are known.
    military_strength: scaleAt(MILITARY_STRENGTHS, militaryScore),
    military_doctrine: doctrine,
    relations: [],
    values,
    customs,
    aesthetic,
    founding_date: 0,
    key_events: [],
    tagline: '',
    description: '',
    rumors: [],
  };
}

function inheritSpecies(rng: Rng, planetSpecies: SpeciesShare[]): SpeciesShare[] {
  const boosted = planetSpecies.length > 1 && rng.chance(0.15) ? rng.pick(planetSpecies).species_id : null;
  const weights = planetSpecies.map((s) => {
    let w = s.share * Math.exp(rng.normal(0, 0.4));
    if (s.species_id === boosted) w *= 4;
    // Small minorities are often absent from a given country.
    if (s.share < 0.1 && rng.chance(0.4)) w = 0;
    return w;
  });
  if (!weights.some((w) => w > 0)) weights[0] = 1;
  const kept = planetSpecies.filter((_, i) => weights[i] > 0);
  const shares = normalizeShares(weights.filter((w) => w > 0));
  return kept.map((s, i) => ({ species_id: s.species_id, share: shares[i] })).sort((a, b) => b.share - a.share);
}

/** Languages whose speakers live here, most-spoken first; sometimes a local dialect of its own. */
function countryLanguages(bundle: PlanetBundle, rng: Rng, species: SpeciesShare[]): string[] {
  const all = Object.values(bundle.languages);
  const share = (sid: string) => species.find((s) => s.species_id === sid)?.share ?? 0;
  const weight = (l: Language) => l.speaker_species_ids.reduce((a, sid) => a + share(sid), 0)
    * (bundle.planet.dominant_languages.includes(l.id) ? 1.5 : 1) * (l.origin === 'creole' ? 0.5 : 1);
  const ranked = all
    .map((l) => ({ id: l.id, w: weight(l) * rng.float(0.7, 1.3) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w || a.id.localeCompare(b.id));
  const chosen = ranked.filter((x, i) => i === 0 || (i < 3 && x.w >= 0.12)).map((x) => x.id);
  if (rng.chance(CONFIG.country.dialectChance) && all.length < CONFIG.country.maxLanguages) {
    const parent = bundle.languages[chosen[0]];
    const dialect = addLanguage(bundle, rng.fork('dialect'), parent.style, parent.origin, [species[0].species_id]);
    chosen.unshift(dialect.id);
  }
  return chosen;
}

function inheritReligions(bundle: PlanetBundle, rng: Rng, lang: Language): ReligionShare[] {
  const planetShares = bundle.planet.dominant_religions_or_ideologies;
  const affiliated = clamp(planetShares.reduce((a, r) => a + r.share, 0) + rng.normal(0, 0.08), 0.3, 1);
  const entries = planetShares
    .map((r) => ({ id: r.religion_id, w: r.share * Math.exp(rng.normal(0, 0.5)) }))
    .filter((r) => r.w > 0.03 || rng.chance(0.5));
  if (rng.chance(CONFIG.country.localFaithChance) && Object.keys(bundle.religions).length < CONFIG.country.maxReligions) {
    const kinds = eligible(RELIGION_KINDS, RELIGION_KIND_TABLE, bundleContext(bundle));
    const faith = addReligion(bundle, rng.fork('local-faith'), rng.weighted(kinds), lang);
    entries.push({ id: faith.id, w: rng.float(0.2, 0.7) });
  }
  if (entries.length === 0) return [];
  const shares = normalizeShares(entries.map((e) => e.w), Math.round(affiliated * 1000) / 1000);
  return entries.map((e, i) => ({ religion_id: e.id, share: shares[i] })).sort((a, b) => b.share - a.share);
}

function makeDemonym(rng: Rng, root: string): string {
  const base = root.split(/[ \-]/)[0].replace(/'$/, '');
  const vowelEnd = /[aeiouy]$/i.test(base);
  return attachSuffix(base, rng.pick(vowelEnd ? DEMONYM_SUFFIXES.vowel : DEMONYM_SUFFIXES.consonant));
}

function makeMotto(rng: Rng, values: CultureValue[]): string {
  const nouns = values.map((v) => CULTURE_VALUE_TABLE[v].noun);
  const patterns = MOTTO_PATTERNS.filter((pt) => !(pt.pattern.includes('{value3}') && nouns.length < 3));
  const text = fillPattern(pickPattern(rng, patterns), {
    value1: () => nouns[0],
    value2: () => nouns[1] ?? nouns[0],
    value3: () => nouns[2] ?? nouns[0],
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function makeFlag(rng: Rng, values: CultureValue[], government: Country['government_type']): string {
  const [c1, c2] = rng.sample(FLAG_COLORS, 2);
  const layout = fillPattern(rng.pick(FLAG_LAYOUTS), { c1: () => c1, c2: () => c2 });
  const family: keyof typeof FLAG_EMBLEMS =
    values.includes('faith') || government === 'theocracy' ? 'faith'
      : values.some((v) => v === 'strength' || v === 'glory') || government === 'military_junta' ? 'martial'
        : values.includes('wealth') ? 'trade'
          : values.some((v) => v === 'knowledge' || v === 'progress') ? 'knowledge'
            : values.includes('nature') ? 'nature' : 'default';
  const emblemColor = rng.pick(FLAG_COLORS.filter((c) => c !== c1 && c !== c2));
  const article = /^[aeiou]/i.test(emblemColor) ? 'an' : 'a';
  return `${layout.charAt(0).toUpperCase() + layout.slice(1)}, bearing ${article} ${emblemColor} ${rng.pick(FLAG_EMBLEMS[family])}`;
}

// ---------------------------------------------------------------------------

/** Split the planet population across countries by area and habitability. Countries never exceed the planet. */
function allocatePopulation(bundle: PlanetBundle, rng: Rng): void {
  const countries = Object.values(bundle.countries);
  const total = Math.floor(bundle.planet.population * rng.float(0.9, 0.99));
  const weights = countries.map((c) => {
    const hab = c.biomes.reduce((a, b) => a + b.share * BIOME_TABLE[b.biome].habitability, 0);
    return c.area_share * Math.max(0.05, hab) * rng.float(0.6, 1.4);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  countries.forEach((c, i) => {
    c.population = Math.max(100, floorSig((total * weights[i]) / sum, 3));
    const score = (Math.log10(c.population) - 4) * 0.45
      + WEALTH_LEVELS.indexOf(c.wealth_level) * 0.3 + c.tech_level * 0.12 + rng.normal(0, 0.5);
    c.military_strength = scaleAt(MILITARY_STRENGTHS, clamp(score * MILITARY_DOCTRINE_TABLE[c.military_doctrine].strength, 0, 5));
  });
  // Guard against tiny planets where the 100-person floor overshoots.
  const allocated = countries.reduce((a, c) => a + c.population, 0);
  if (allocated > bundle.planet.population) {
    for (const c of countries) c.population = Math.floor((c.population * bundle.planet.population) / allocated);
  }
}

/** Planet-level features each belong to one country; some countries have a local feature of their own. */
function distributeFeatures(bundle: PlanetBundle, rng: Rng): void {
  const countries = Object.values(bundle.countries);
  bundle.planet.notable_features.forEach((f, i) => {
    const r = rng.fork(`planet-feature:${i}`);
    if (countries.length > 1 && !r.chance(0.75)) return;
    const owner = r.weightedBy(countries, (c) => c.area_share);
    owner.notable_features.push({ ...f });
  });
  for (const c of countries) {
    const r = rng.fork(c.id);
    if (!r.chance(0.35)) continue;
    const pool = eligible(FEATURE_TYPES, FEATURE_TABLE, bundleContext(bundle, { biomes: c.biomes.map((b) => b.biome) }));
    const type = r.weighted(pool);
    const ph = bundle.languages[c.languages[0]].phonology;
    const feature: NotableFeature = {
      type,
      name: fillPattern(pickPattern(r, FEATURE_NAME_PATTERNS), {
        root: () => makeBareName(ph, r),
        feature: () => r.pick(FEATURE_TABLE[type].nouns),
        adjective: () => r.pick(ADJECTIVES),
      }),
    };
    c.notable_features.push(feature);
  }
}

/**
 * Founding dates and key events. Planet events after a country's founding
 * pull in the countries involved; each involved country gets a key event
 * pointing at the planet event via parent_event_id.
 */
function linkHistory(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const countries = Object.values(bundle.countries);
  const colonization = p.history.find((e) => e.event_type === 'colonization');
  const earliest = colonization ? colonization.date + 1 : (p.history[0]?.date ?? -1000) - rng.int(50, 600);
  const unification = [...p.history].reverse().find((e) => e.event_type === 'unification');

  for (const c of countries) {
    const r = rng.fork(`founding:${c.id}`);
    if (countries.length === 1 && unification) c.founding_date = unification.date;
    else c.founding_date = earliest + Math.floor((-10 - earliest) * Math.pow(r.next(), 1.6));
  }

  const linked = new Map<string, HistoricalEvent[]>(countries.map((c) => [c.id, []]));
  for (const e of p.history) {
    const r = rng.fork(`link:${e.id}`);
    const available = countries.filter((c) => c.founding_date < e.date);
    let count = 0;
    if (MULTI_COUNTRY_EVENTS.includes(e.event_type)) count = available.length >= 2 ? Math.min(available.length, e.event_type === 'unification' ? r.int(2, 5) : r.int(2, 3)) : 0;
    else if (SINGLE_COUNTRY_EVENTS.includes(e.event_type)) count = Math.min(available.length, r.int(1, 2));
    if (count === 0) continue;
    const involved = r.sample(available, count);
    e.involved_refs = Array.from(new Set([...e.involved_refs, ...involved.map((c) => c.id)]));
    for (const c of involved) {
      linked.get(c.id)!.push({
        id: '',
        date: e.date,
        event_type: e.event_type,
        involved_refs: e.involved_refs.filter((ref) => ref !== c.id),
        outcome: r.fork(c.id).weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[e.event_type].outcomes)),
        parent_event_id: e.id,
      });
    }
  }

  for (const c of countries) {
    const r = rng.fork(`events:${c.id}`);
    const target = r.int(...CONFIG.country.keyEvents);
    const founding: HistoricalEvent = {
      id: '', date: c.founding_date, event_type: 'founding', involved_refs: [],
      outcome: r.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE.founding.outcomes)), parent_event_id: null,
    };
    // Keep the most recent linked events if there are too many.
    const fromPlanet = linked.get(c.id)!.slice(-(target - 1));
    const own: HistoricalEvent[] = [];
    while (1 + fromPlanet.length + own.length < target && c.founding_date < -2) {
      const type = r.weighted(HISTORICAL_EVENT_TYPES.map((t) => ({
        value: t,
        weight: HISTORICAL_EVENT_TABLE[t].unique ? 0 : HISTORICAL_EVENT_TABLE[t].weights.country ?? 0,
      })));
      const date = -r.int(1, -c.founding_date - 1);
      // Wars and treaties need a counterpart that existed at the time: a neighbor if possible.
      const existing = countries.filter((o) => o.id !== c.id && o.founding_date < date);
      const near = existing.filter((o) => c.neighbor_ids.includes(o.id));
      const partner = near.length ? r.pick(near) : existing.length ? r.pick(existing) : null;
      const multi = MULTI_COUNTRY_EVENTS.includes(type);
      const eventType: HistoricalEventType = multi && !partner ? (type === 'war' || type === 'invasion' ? 'civil_war' : 'reform') : type;
      own.push({
        id: '',
        date,
        event_type: eventType,
        involved_refs: multi && partner ? [partner.id] : [],
        outcome: r.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[eventType].outcomes)),
        parent_event_id: null,
      });
    }
    const events = [founding, ...fromPlanet, ...own].sort((a, b) => a.date - b.date);
    events.forEach((e, i) => { e.id = `event_${c.id}_${i}`; });
    c.key_events = events;
  }
}
