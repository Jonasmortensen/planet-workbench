import { LOCATION_REASONS, POI_SIGNIFICANCES, TREASURE_RARITIES, isSurprising, type PlanetBundle } from '../../generator';

/** Compact per-planet facts for batch statistics (small enough to post from a worker). */
export interface PlanetSummary {
  seed: string;
  name: string;
  ms: number;
  planet_type: string;
  political_structure: string;
  settlement_origin: string;
  tech_level: number;
  population: number;
  country_count: number;
  settlement_count: number;
  org_count: number;
  npc_count: number;
  government_types: string[];
  org_types: string[];
  settlement_types: string[];
  /** Leaders holding more than one role. */
  multi_role_leaders: number;
  leaders: number;
  /** Leadership slots filled by reusing an existing leader (excluding automatic combinations). */
  reused_slots: number;
  ordinary_slots: number;
  hidden_roles: number;
  anomalies: number;
  true_rumors: number;
  rumors: number;
  poi_count: number;
  treasure_count: number;
  /** Counts per value, kept as records so large batches stay small. */
  treasure_categories: Record<string, number>;
  treasure_rarities: Record<string, number>;
  /** Number of points of interest holding N treasures of their own, keyed by N. */
  treasures_per_poi: Record<string, number>;
  poi_significances: Record<string, number>;
  /** Places outside settlements, how many are forgotten, and how many of those a map leads to. */
  wild_pois: number;
  forgotten_pois: number;
  forgotten_mapped: number;
  location_reasons: Record<string, number>;
  surprising_npcs: number;
  npcs_carrying: number;
  errors: number;
  warnings: number;
  codes: Record<string, number>;
}

const countBy = (values: string[]) => values.reduce<Record<string, number>>((m, v) => ({ ...m, [v]: (m[v] ?? 0) + 1 }), {});

export function summarize(b: PlanetBundle, ms: number): PlanetSummary {
  const npcs = Object.values(b.npcs);
  const leaders = npcs.filter((n) => n.leads.length > 0);
  const automatic = new Set(Object.values(b.organizations).filter((o) => o.state_role !== 'none').map((o) => o.id));
  if (b.planet.political_structure === 'unified') automatic.add(Object.keys(b.countries)[0]);
  let reused = 0;
  let ordinary = 0;
  for (const n of leaders) {
    const own = n.leads.filter((l) => !automatic.has(l.entity_id));
    ordinary += own.length;
    reused += Math.max(0, own.length - 1);
  }
  const rumors = [
    ...b.planet.rumors,
    ...Object.values(b.countries).flatMap((c) => c.rumors),
    ...Object.values(b.settlements).flatMap((s) => s.rumors),
    ...Object.values(b.organizations).flatMap((o) => o.rumors),
    ...npcs.flatMap((n) => n.rumors_about),
  ];
  const treasures = Object.values(b.treasures);
  const own = new Map<string, number>(Object.keys(b.pois).map((id) => [id, 0]));
  for (const t of treasures) if ('poi_id' in t.holder) own.set(t.holder.poi_id, (own.get(t.holder.poi_id) ?? 0) + 1);
  const carriers = new Set(treasures.flatMap((t) => ('npc_id' in t.holder ? [t.holder.npc_id] : [])));
  const wild = Object.values(b.pois).filter((p) => !p.settlement_id);
  const mapped = new Set(treasures.filter((t) => t.category === 'map').map((t) => t.subject_refs[0]));
  const forgotten = wild.filter((p) => p.status === 'forgotten');
  const codes: Record<string, number> = {};
  for (const v of b.validation) codes[`${v.severity}:${v.code}`] = (codes[`${v.severity}:${v.code}`] ?? 0) + 1;
  return {
    seed: b.seed,
    name: b.planet.name,
    ms,
    planet_type: b.planet.planet_type,
    political_structure: b.planet.political_structure,
    settlement_origin: b.planet.settlement_origin,
    tech_level: b.planet.tech_level,
    population: b.planet.population,
    country_count: Object.keys(b.countries).length,
    settlement_count: Object.keys(b.settlements).length,
    org_count: Object.keys(b.organizations).length,
    npc_count: npcs.length,
    government_types: Object.values(b.countries).map((c) => c.government_type),
    org_types: Object.values(b.organizations).map((o) => o.org_type),
    settlement_types: Object.values(b.settlements).map((s) => s.settlement_type),
    multi_role_leaders: leaders.filter((n) => n.leads.length > 1).length,
    leaders: leaders.length,
    reused_slots: reused,
    ordinary_slots: ordinary,
    hidden_roles: npcs.reduce((a, n) => a + n.leads.filter((l) => !l.public).length, 0),
    anomalies: b.planet.anomalies.length,
    true_rumors: rumors.filter((r) => r.is_true).length,
    rumors: rumors.length,
    poi_count: own.size,
    treasure_count: treasures.length,
    treasure_categories: countBy(treasures.map((t) => t.category)),
    treasure_rarities: countBy(treasures.map((t) => t.rarity)),
    treasures_per_poi: countBy([...own.values()].map(String)),
    poi_significances: countBy(Object.values(b.pois).map((p) => p.significance)),
    wild_pois: wild.length,
    forgotten_pois: forgotten.length,
    forgotten_mapped: forgotten.filter((p) => mapped.has(p.id)).length,
    location_reasons: countBy(npcs.map((n) => n.location_reason)),
    surprising_npcs: npcs.filter((n) => isSurprising(n.location_reason)).length,
    npcs_carrying: carriers.size,
    errors: b.validation.filter((v) => v.severity === 'error').length,
    warnings: b.validation.filter((v) => v.severity === 'warning').length,
    codes,
  };
}

export type Distribution = { key: string; count: number }[];

function tally(values: string[], order?: string[]): Distribution {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  const entries = [...m].map(([key, count]) => ({ key, count }));
  if (order) return entries.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return entries.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** Merge per-planet count records into one distribution. */
function merged(records: Record<string, number>[], order?: readonly string[]): Distribution {
  const m = new Map<string, number>();
  for (const r of records) for (const [k, v] of Object.entries(r)) m.set(k, (m.get(k) ?? 0) + v);
  const entries = [...m].map(([key, count]) => ({ key, count }));
  if (order) return entries.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return entries.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

/** Numeric histogram with integer buckets of the given width, in numeric order. */
function histogram(values: number[], width: number): Distribution {
  if (values.length === 0) return [];
  const lo = Math.floor(Math.min(...values) / width) * width;
  const hi = Math.floor(Math.max(...values) / width) * width;
  const out: Distribution = [];
  for (let b = lo; b <= hi; b += width) {
    out.push({ key: width === 1 ? String(b) : `${b}–${b + width - 1}`, count: values.filter((v) => v >= b && v < b + width).length });
  }
  return out;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface BatchStats {
  planets: number;
  avgMs: number;
  avgNpcs: number;
  avgOrgs: number;
  avgSettlements: number;
  overlapRate: number;
  multiRoleShare: number;
  hiddenRoles: number;
  trueRumorShare: number;
  errors: number;
  warnings: number;
  planetsWithErrors: PlanetSummary[];
  planetTypes: Distribution;
  politicalStructures: Distribution;
  origins: Distribution;
  techLevels: Distribution;
  countryCounts: Distribution;
  npcCounts: Distribution;
  governmentTypes: Distribution;
  orgTypes: Distribution;
  settlementTypes: Distribution;
  issueCodes: Distribution;
  avgPois: number;
  avgTreasures: number;
  treasuresPerPoi: number;
  surprisingShare: number;
  carryingShare: number;
  avgWildPois: number;
  forgottenShare: number;
  forgottenMappedShare: number;
  treasureCategories: Distribution;
  treasureRarities: Distribution;
  treasuresPerPoiDist: Distribution;
  poiSignificances: Distribution;
  locationReasons: Distribution;
}

export function aggregate(rows: PlanetSummary[]): BatchStats {
  const sum = (f: (r: PlanetSummary) => number) => rows.reduce((a, r) => a + f(r), 0);
  const npcWidth = Math.max(10, Math.ceil(Math.max(1, ...rows.map((r) => r.npc_count)) / 12 / 10) * 10);
  const codes: string[] = [];
  for (const r of rows) for (const [k, v] of Object.entries(r.codes)) for (let i = 0; i < v; i++) codes.push(k);
  return {
    planets: rows.length,
    avgMs: avg(rows.map((r) => r.ms)),
    avgNpcs: avg(rows.map((r) => r.npc_count)),
    avgOrgs: avg(rows.map((r) => r.org_count)),
    avgSettlements: avg(rows.map((r) => r.settlement_count)),
    overlapRate: sum((r) => r.reused_slots) / Math.max(1, sum((r) => r.ordinary_slots)),
    multiRoleShare: sum((r) => r.multi_role_leaders) / Math.max(1, sum((r) => r.leaders)),
    hiddenRoles: sum((r) => r.hidden_roles),
    trueRumorShare: sum((r) => r.true_rumors) / Math.max(1, sum((r) => r.rumors)),
    errors: sum((r) => r.errors),
    warnings: sum((r) => r.warnings),
    planetsWithErrors: rows.filter((r) => r.errors > 0),
    planetTypes: tally(rows.map((r) => r.planet_type)),
    politicalStructures: tally(rows.map((r) => r.political_structure), ['unified', 'federation', 'rival_powers', 'fragmented', 'anarchic']),
    origins: tally(rows.map((r) => r.settlement_origin), ['native', 'mixed', 'colonial', 'lost_colony']),
    techLevels: histogram(rows.map((r) => r.tech_level), 1),
    countryCounts: histogram(rows.map((r) => r.country_count), 1),
    npcCounts: histogram(rows.map((r) => r.npc_count), npcWidth),
    governmentTypes: tally(rows.flatMap((r) => r.government_types)),
    orgTypes: tally(rows.flatMap((r) => r.org_types)),
    settlementTypes: tally(rows.flatMap((r) => r.settlement_types)),
    issueCodes: tally(codes),
    avgPois: avg(rows.map((r) => r.poi_count)),
    avgTreasures: avg(rows.map((r) => r.treasure_count)),
    treasuresPerPoi: sum((r) => Object.entries(r.treasures_per_poi).reduce((a, [k, v]) => a + Number(k) * v, 0)) / Math.max(1, sum((r) => r.poi_count)),
    surprisingShare: sum((r) => r.surprising_npcs) / Math.max(1, sum((r) => r.npc_count)),
    carryingShare: sum((r) => r.npcs_carrying) / Math.max(1, sum((r) => r.npc_count)),
    avgWildPois: avg(rows.map((r) => r.wild_pois)),
    forgottenShare: sum((r) => r.forgotten_pois) / Math.max(1, sum((r) => r.wild_pois)),
    forgottenMappedShare: sum((r) => r.forgotten_mapped) / Math.max(1, sum((r) => r.forgotten_pois)),
    treasureCategories: merged(rows.map((r) => r.treasure_categories)),
    treasureRarities: merged(rows.map((r) => r.treasure_rarities), TREASURE_RARITIES),
    treasuresPerPoiDist: merged(rows.map((r) => r.treasures_per_poi)).sort((a, b) => Number(a.key) - Number(b.key)),
    poiSignificances: merged(rows.map((r) => r.poi_significances), POI_SIGNIFICANCES),
    locationReasons: merged(rows.map((r) => r.location_reasons), LOCATION_REASONS),
  };
}
