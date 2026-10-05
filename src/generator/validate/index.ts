import { CONFIG } from '../config';
import { PHYSICAL_RULES } from '../rules/physical';
import { settlementTypeProblems } from '../rules/settlement';
import { bundleContext } from '../steps/context';
import type { PlanetBundle, ValidationIssue } from '../types/entities';
import { kindOf, resolveEntity } from '../types/ids';
import { checkLeadership, checkLeadershipFit, checkNpcLinks, checkOrgSymmetry, checkOrganizations, requiredNpcFields } from './people';
import { collectRefs, eventIndex } from './refs';

export { collectRefs, eventIndex } from './refs';
export type { RefSite } from './refs';

type Check = (bundle: PlanetBundle) => ValidationIssue[];

const error = (code: string, entity_ref: string, message: string): ValidationIssue => ({
  severity: 'error', code, entity_ref, message,
});
const warning = (code: string, entity_ref: string, message: string): ValidationIssue => ({
  severity: 'warning', code, entity_ref, message,
});

const nearlyOne = (x: number) => Math.abs(x - 1) <= 0.01;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------------------
// Errors: the generator is broken
// ---------------------------------------------------------------------------

const checkRefs: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const site of collectRefs(bundle)) {
    if (!resolveEntity(bundle, site.id)) {
      issues.push(error('ref.missing', site.from, `${site.field} points to missing entity "${site.id}"`));
    } else if (site.kind && kindOf(site.id) !== site.kind) {
      issues.push(error('ref.kind', site.from, `${site.field} should reference a ${site.kind}, got "${site.id}"`));
    }
  }
  const events = eventIndex(bundle);
  for (const e of events.values()) {
    if (e.parent_event_id && !events.has(e.parent_event_id)) {
      issues.push(error('ref.event', e.id, `parent_event_id points to missing event "${e.parent_event_id}"`));
    }
  }
  return issues;
};

const checkIds: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const maps = [bundle.countries, bundle.settlements, bundle.organizations, bundle.npcs, bundle.species, bundle.languages, bundle.religions];
  for (const map of maps) {
    for (const [key, entity] of Object.entries(map)) {
      if ((entity as { id: string }).id !== key) issues.push(error('id.mismatch', key, `Map key "${key}" does not match entity id`));
    }
  }
  const poiIds = new Set<string>();
  for (const s of Object.values(bundle.settlements)) {
    for (const poi of s.points_of_interest) {
      if (poiIds.has(poi.id)) issues.push(error('id.duplicate', s.id, `Point of interest id "${poi.id}" is used twice`));
      poiIds.add(poi.id);
    }
  }
  return issues;
};

const checkShares: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const holders = [bundle.planet, ...Object.values(bundle.countries), ...Object.values(bundle.settlements)];
  for (const h of holders) {
    if ('biomes' in h) {
      const s = sum(h.biomes.map((b) => b.share));
      if (!nearlyOne(s)) issues.push(error('shares.biomes', h.id, `Biome shares sum to ${s.toFixed(3)}, expected 1`));
    }
    const sp = sum(h.species.map((s) => s.share));
    if (!nearlyOne(sp)) issues.push(error('shares.species', h.id, `Species shares sum to ${sp.toFixed(3)}, expected 1`));
    const religions = 'dominant_religions_or_ideologies' in h ? h.dominant_religions_or_ideologies : h.religions_or_ideologies;
    const rs = sum(religions.map((r) => r.share));
    if (rs > 1.001) issues.push(error('shares.religions', h.id, `Religion shares sum to ${rs.toFixed(3)}, more than 1`));
  }
  const countries = Object.values(bundle.countries);
  if (countries.length > 0) {
    const area = sum(countries.map((c) => c.area_share));
    if (!nearlyOne(area)) issues.push(error('shares.area', bundle.planet.id, `Country area shares sum to ${area.toFixed(3)}, expected 1`));
  }
  return issues;
};

const checkPlanetStructure: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const p = bundle.planet;
  const [cMin, cMax] = CONFIG.countryCount[p.political_structure];
  if (p.country_count < cMin || p.country_count > cMax) {
    issues.push(error('planet.country_count', p.id, `country_count ${p.country_count} outside ${cMin}-${cMax} for ${p.political_structure}`));
  }
  const actual = Object.keys(bundle.countries).length;
  if (actual !== p.country_count) {
    issues.push(error('planet.country_count', p.id, `country_count is ${p.country_count} but the bundle has ${actual} countries`));
  }
  const needsGov = p.political_structure === 'unified' || p.political_structure === 'federation';
  if (needsGov !== (p.world_government !== null)) {
    issues.push(error('planet.world_government', p.id, 'world_government must exist only for unified or federation worlds'));
  }
  if (p.tech_level < 0 || p.tech_level > 10 || !Number.isInteger(p.tech_level)) {
    issues.push(error('planet.tech_level', p.id, `tech_level ${p.tech_level} must be an integer 0-10`));
  }
  if (p.native_sapients !== (p.native_species_id !== null)) {
    issues.push(error('planet.natives', p.id, 'native_sapients and native_species_id disagree'));
  }
  return issues;
};

const checkCapitals: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const c of Object.values(bundle.countries)) {
    const capitals = Object.values(bundle.settlements).filter((s) => s.country_id === c.id && s.settlement_type === 'capital');
    if (capitals.length !== 1) {
      issues.push(error('country.capital', c.id, `Country has ${capitals.length} capitals, expected exactly 1`));
    } else if (c.capital_settlement_id !== capitals[0].id) {
      issues.push(error('country.capital', c.id, `capital_settlement_id is "${c.capital_settlement_id}" but the capital is "${capitals[0].id}"`));
    }
  }
  return issues;
};

const checkSymmetry: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const c of Object.values(bundle.countries)) {
    for (const n of c.neighbor_ids) {
      const other = bundle.countries[n];
      if (other && !other.neighbor_ids.includes(c.id)) {
        issues.push(error('symmetry.neighbors', c.id, `Neighbor ${n} does not list ${c.id} back`));
      }
      if (n === c.id) issues.push(error('symmetry.neighbors', c.id, 'Country lists itself as a neighbor'));
    }
    for (const r of c.relations) {
      const other = bundle.countries[r.target_ref] ?? bundle.organizations[r.target_ref];
      const back = other?.relations.find((x) => x.target_ref === c.id);
      if (other && (!back || back.attitude !== r.attitude)) {
        issues.push(error('symmetry.relations', c.id, `Relation with ${r.target_ref} (${r.attitude}) is not mirrored`));
      }
    }
  }
  for (const s of Object.values(bundle.settlements)) {
    for (const link of s.connections) {
      const other = bundle.settlements[link.settlement_id];
      const back = other?.connections.find((x) => x.settlement_id === s.id);
      if (other && (!back || back.link_type !== link.link_type)) {
        issues.push(error('symmetry.connections', s.id, `Connection to ${link.settlement_id} (${link.link_type}) is not mirrored`));
      }
    }
  }
  return issues;
};

const checkPopulations: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const countries = Object.values(bundle.countries);
  const countryTotal = sum(countries.map((c) => c.population));
  if (countryTotal > bundle.planet.population) {
    issues.push(error('population.countries', bundle.planet.id, `Countries total ${countryTotal.toLocaleString()} exceeds planet population ${bundle.planet.population.toLocaleString()}`));
  }
  for (const c of countries) {
    const total = sum(Object.values(bundle.settlements).filter((s) => s.country_id === c.id).map((s) => s.population));
    if (total > c.population) {
      issues.push(error('population.settlements', c.id, `Settlements total ${total.toLocaleString()} exceeds country population ${c.population.toLocaleString()}`));
    }
  }
  return issues;
};

// ---------------------------------------------------------------------------
// Warnings: worth a look
// ---------------------------------------------------------------------------

const checkPhysical: Check = (bundle) => {
  const p = bundle.planet;
  const recorded = new Set(p.anomalies.map((a) => a.type));
  return PHYSICAL_RULES
    .filter((r) => r.violated(p) && !recorded.has(r.anomaly))
    .map((r) => warning('physical.unrecorded', p.id, `${r.describe}, but no "${r.anomaly}" anomaly is recorded`));
};

const checkSettlements: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const [lo, hi] = CONFIG.settlement.perCountry;
  for (const c of Object.values(bundle.countries)) {
    const settlements = Object.values(bundle.settlements).filter((s) => s.country_id === c.id);
    if (settlements.length < lo || settlements.length > hi) {
      issues.push(warning('country.settlement_count', c.id, `Country has ${settlements.length} settlements, expected ${lo}-${hi}`));
    }
    const ctx = bundleContext(bundle, { techLevel: c.tech_level, biomes: c.biomes.map((b) => b.biome) });
    for (const s of settlements) {
      if (s.settlement_type === 'capital') continue;
      for (const problem of settlementTypeProblems(s.settlement_type, s.biome, bundle.planet, ctx)) {
        issues.push(warning('settlement.type', s.id, problem));
      }
      if (!c.biomes.some((b) => b.biome === s.biome)) {
        issues.push(warning('settlement.biome', s.id, `Biome ${s.biome} is not one of ${c.id}'s biomes`));
      }
    }
    for (const b of c.biomes) {
      if (!bundle.planet.biomes.some((pb) => pb.biome === b.biome)) {
        issues.push(warning('country.biome', c.id, `Biome ${b.biome} does not exist on the planet`));
      }
    }
  }
  const names = new Map<string, string>();
  for (const s of Object.values(bundle.settlements)) {
    if (names.has(s.name)) issues.push(warning('settlement.name_duplicate', s.id, `Name "${s.name}" is also used by ${names.get(s.name)}`));
    names.set(s.name, s.id);
  }
  return issues;
};

const checkHistory: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const p = bundle.planet;
  const [hMin, hMax] = CONFIG.planet.historyEvents;
  if (p.history.length < hMin || p.history.length > hMax) {
    issues.push(warning('planet.history_count', p.id, `History has ${p.history.length} events, expected ${hMin}-${hMax}`));
  }
  const holders = [
    { id: p.id, events: p.history, founding: null as number | null },
    ...Object.values(bundle.countries).map((c) => ({ id: c.id, events: c.key_events, founding: c.founding_date })),
    ...Object.values(bundle.settlements).map((s) => ({ id: s.id, events: s.key_events, founding: s.founding_date })),
    ...Object.values(bundle.organizations).map((o) => ({ id: o.id, events: o.key_events, founding: o.founding_date })),
    ...Object.values(bundle.npcs).map((n) => ({ id: n.id, events: n.key_life_events, founding: -n.age })),
  ];
  for (const h of holders) {
    for (let i = 1; i < h.events.length; i++) {
      if (h.events[i].date < h.events[i - 1].date) issues.push(warning('history.order', h.id, `Events are not in chronological order at ${h.events[i].id}`));
    }
    if (h.founding !== null && h.events.some((e) => e.date < h.founding!)) {
      issues.push(warning('history.before_founding', h.id, 'An event predates the founding date'));
    }
    if (h.events.some((e) => e.date >= 0)) issues.push(warning('history.future', h.id, 'An event is dated in the present or future'));
  }
  return issues;
};

/** Required fields per entity; prose fields are checked once rendering exists (milestone 4). */
const checkEmptyFields: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const empty = (v: unknown) => v === '' || v === null || (Array.isArray(v) && v.length === 0);
  const require = (id: string, fields: [string, unknown][]) => {
    for (const [field, value] of fields) if (empty(value)) issues.push(warning('empty.field', id, `Field "${field}" is empty`));
  };
  const p = bundle.planet;
  require(p.id, [
    ['name', p.name], ['native_name', p.native_name], ['star_system', p.star_system], ['biomes', p.biomes],
    ['species', p.species], ['dominant_languages', p.dominant_languages], ['resources', p.resources], ['history', p.history],
    ...(p.galactic_connectivity !== 'uncontacted' ? [['primary_exports', p.primary_exports], ['primary_imports', p.primary_imports]] as [string, unknown][] : []),
    ...(p.world_government ? [['world_government.name', p.world_government.name]] as [string, unknown][] : []),
  ]);
  p.moons.forEach((m, i) => require(p.id, [[`moons[${i}].name`, m.name]]));
  p.notable_features.forEach((f, i) => require(p.id, [[`notable_features[${i}].name`, f.name]]));
  for (const c of Object.values(bundle.countries)) {
    require(c.id, [
      ['name', c.name], ['demonym', c.demonym], ['motto', c.motto], ['flag_description', c.flag_description],
      ['biomes', c.biomes], ['species', c.species], ['languages', c.languages], ['ruler_title', c.ruler_title],
      ['primary_industries', c.primary_industries], ['exports', c.exports], ['currency_name', c.currency_name],
      ['values', c.values], ['customs', c.customs], ['key_events', c.key_events],
    ]);
  }
  for (const s of Object.values(bundle.settlements)) {
    require(s.id, [
      ['name', s.name], ['nickname', s.nickname], ['species', s.species], ['languages', s.languages],
      ['leader_title', s.leader_title], ['primary_industries', s.primary_industries], ['districts', s.districts],
      ['points_of_interest', s.points_of_interest], ['local_customs', s.local_customs], ['key_events', s.key_events],
    ]);
    s.districts.forEach((d, i) => require(s.id, [[`districts[${i}].name`, d.name]]));
    s.points_of_interest.forEach((poi) => require(s.id, [[`${poi.id}.name`, poi.name]]));
  }
  for (const o of Object.values(bundle.organizations)) {
    require(o.id, [
      ['name', o.name], ['short_name', o.short_name], ['symbol_description', o.symbol_description], ['motto', o.motto],
      ['presence', o.presence], ['activities', o.activities], ['resources', o.resources], ['ranks', o.ranks],
      ['member_npc_ids', o.member_npc_ids], ['key_events', o.key_events],
    ]);
  }
  for (const n of Object.values(bundle.npcs)) require(n.id, requiredNpcFields(n));
  for (const l of Object.values(bundle.languages)) require(l.id, [['name', l.name]]);
  for (const r of Object.values(bundle.religions)) require(r.id, [['name', r.name]]);
  return issues;
};

/** All checks, in report order. Later milestones append to this list. */
export const CHECKS: Check[] = [
  checkIds, checkRefs, checkShares, checkPlanetStructure, checkCapitals, checkSymmetry, checkOrgSymmetry, checkPopulations,
  checkLeadership, checkOrganizations, checkNpcLinks,
  checkPhysical, checkSettlements, checkHistory, checkLeadershipFit, checkEmptyFields,
];

export function validate(bundle: PlanetBundle): ValidationIssue[] {
  return CHECKS.flatMap((check) => check(bundle));
}
