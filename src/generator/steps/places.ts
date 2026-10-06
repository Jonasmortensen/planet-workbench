import { CONFIG } from '../config';
import {
  ABILITY_TREASURE_NAMES, ACCESS_NAMES, ADJECTIVES, INDUSTRY_WORK, INTEL_NAMES, KNOWLEDGE_NAMES, LEVERAGE_NAMES, MAP_NAMES, NOUNS,
  OCCUPATION_TABLE, PHYSICAL_NAME_PATTERNS, POI_TABLE, POSSESSION_TREASURE, RELIC_NAME_PATTERNS, RESOURCE_NAME_PATTERNS,
  SETTLEMENT_TYPE_TABLE, SETTLEMENT_TYPE_WORK, STREET_PATTERNS, TREASURE_EPITHETS, TREASURE_NOUNS, TREASURE_TABLE, WEALTH_NAME_PATTERNS, eligible,
} from '../content';
import type { NamePattern } from '../content/naming/patterns';
import { fillPattern, makeBareName, pickPattern } from '../naming';
import type { Rng } from '../rng';
import {
  GOVERNMENT_SEATS, ORG_SEATS, REASON_PLACES, TREASURES_BY_SIGNIFICANCE, needsSubject, residencesFor,
} from '../rules/places';
import type { Npc, Organization, PlanetBundle, PointOfInterest, Settlement, Treasure, TreasureHolder } from '../types/entities';
import {
  AGE_CATEGORIES, POI_SIGNIFICANCES, POI_TYPES, SOCIAL_RANKS, TREASURE_CATEGORIES, TREASURE_RARITIES, VISIBILITY_LEVELS, WEALTH_LEVELS,
  type LocationReason, type Occupation, type PoiStatus, type PoiType, type TreasureCategory, type TreasureRarity, type Visibility,
} from '../types/enums';
import { PLANET_ID, entityName, kindOf } from '../types/ids';
import { words } from '../render/words';
import { bundleContext } from './context';

/**
 * Pipeline step: places and treasures. Runs after motives, because where
 * someone can be found depends on their secrets, relationships and current
 * events, and treasures are built from those same facts.
 *
 * 1. Every NPC gets a location in their home settlement: usually work or
 *    home, sometimes somewhere surprising that their data explains.
 * 2. Points of interest are created to hold them (or shared); none is empty.
 * 3. Significance follows from the place type, the settlement and who is there.
 * 4. Abandoned and forgotten places lie in the wilds around settlements. Nobody is
 *    there, but they hold treasures of their own, and maps lead to them.
 * 5. Every place gets 1 to 5 treasures; some powerful NPCs carry one or are one.
 *    Maps always lead to a real place.
 */
export function generatePlacesStep(bundle: PlanetBundle, rng: Rng): void {
  const ids = { poi: 0, treasure: 0 };
  const bySettlement = groupBy(Object.values(bundle.npcs), (n) => n.settlement_id);
  for (const s of Object.values(bundle.settlements)) placeNpcs(bundle, rng.fork(`npcs:${s.id}`), s, bySettlement.get(s.id) ?? [], ids);
  const byPoi = groupBy(Object.values(bundle.npcs), (n) => n.location_poi_id);
  for (const poi of Object.values(bundle.pois)) poi.significance = significanceOf(bundle, poi, byPoi.get(poi.id) ?? []);
  const wildNames = new Set<string>();
  for (const s of Object.values(bundle.settlements)) placeWilds(bundle, rng.fork(`wilds:${s.id}`), s, ids, wildNames);

  const t = new TreasureMaker(bundle, ids, byPoi, bySettlement);
  for (const poi of Object.values(bundle.pois)) t.forPoi(rng.fork(`treasures:${poi.id}`), poi);
  for (const n of Object.values(bundle.npcs)) t.forNpc(rng.fork(`carried:${n.id}`), n);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of items) {
    const k = key(x);
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Locations

interface Intent {
  reason: LocationReason;
  /** Acceptable place types, most fitting first. */
  types: PoiType[];
  /** A specific place: someone's home ("home:npc_3"), an organization's seat ("org:org_2"), a business ("own:npc_5"). */
  key?: string;
  owner?: string | null;
  org?: string | null;
  /** Whose home this is, for naming. */
  household?: Npc;
  /** Be wherever this NPC is (bodyguards). */
  follow?: string;
  ref: string | null;
  public: boolean;
}

interface Option { intent: Intent; weight: number }

/** Occupations that run a business of their own. */
const OWNERS: Occupation[] = [
  'innkeeper', 'smith', 'merchant', 'artisan', 'alchemist', 'crime_lord', 'banker', 'physician', 'farmer', 'herder',
  'mechanic', 'beast_tamer',
];
const GUARDS: Occupation[] = ['guard', 'soldier', 'mercenary', 'bounty_hunter', 'assassin'];
/** One of these per settlement is enough. */
const SINGLE: PoiType[] = ['city_hall', 'palace', 'prison', 'spaceport', 'courthouse', 'college', 'citadel', 'embassy', 'docks'];

/** Places in a settlement with hidden depths a map can show the way into. */
const HIDDEN_DEPTHS: PoiType[] = ['crypt', 'ruin', 'mine', 'hideout'];

const isPublic = (o: Organization) => o.visibility !== 'secret' && o.legality !== 'outlawed';
const motiveTarget = (n: Npc) => {
  const m = n.secret;
  return m ? m.target_npc_id ?? m.target_org_id ?? m.target_settlement_id ?? m.target_country_id : null;
};

function placeNpcs(b: PlanetBundle, r: Rng, s: Settlement, locals: Npc[], ids: { poi: number }): void {
  if (locals.length === 0) return;
  const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
  const country = b.countries[s.country_id];
  const ctx = bundleContext(b, { techLevel: country.tech_level, biomes: [s.biome] });
  const allowed = (t: PoiType) => !POI_TABLE[t].wildOnly && POI_TABLE[t].minSize <= size && eligible([t], POI_TABLE, ctx).length > 0;
  const fit = (types: PoiType[]) => types.filter(allowed);
  const localIds = new Set(locals.map((n) => n.id));
  const orgsHere = new Set(s.organizations_present);
  const households = householdsOf(b, locals);

  const homeOf = (n: Npc): Intent => {
    const head = households.get(n.id)!;
    const types = fit(residencesFor(head, size));
    return {
      reason: 'lives_here', key: `home:${head.id}`, owner: head.id, household: head, ref: null, public: true,
      types: types.length ? types : ['hovel'],
    };
  };
  const visitHome = (target: Npc, reason: LocationReason, isPublicVisit: boolean): Intent => ({
    ...homeOf(target), reason, ref: target.id, public: isPublicVisit,
  });
  const orgSeat = (o: Organization, reason: LocationReason, pub: boolean, ref: string | null): Intent | null => {
    const types = fit(isPublic(o) ? ORG_SEATS[o.org_type] : ['hideout', ...ORG_SEATS[o.org_type]]);
    return types.length ? { reason, types, key: `org:${o.id}`, org: o.id, ref, public: pub } : null;
  };
  const venue = (reason: LocationReason, ref: string | null, pub: boolean, types = REASON_PLACES[reason] ?? []): Intent | null => {
    const t = fit(types);
    return t.length ? { reason, types: t, ref, public: pub } : null;
  };

  /** Where they work: a seat of power, their organization, or their trade. */
  const workOf = (n: Npc, nr: Rng): Intent | null => {
    for (const lead of n.leads.filter((l) => l.public)) {
      const seat = lead.entity_type === 'world_government' ? fit(['palace', 'embassy', 'city_hall'])
        : lead.entity_type === 'country' ? fit(['palace', 'citadel', 'city_hall'])
          : lead.entity_type === 'settlement' && lead.entity_id === s.id ? fit([...GOVERNMENT_SEATS[s.governing_body], 'city_hall', 'meeting_hall'])
            : [];
      if (seat.length && (lead.entity_type !== 'country' || b.countries[lead.entity_id].capital_settlement_id === s.id)) {
        return { reason: 'works_here', types: seat, ref: null, public: true };
      }
      if (lead.entity_type === 'organization' && orgsHere.has(lead.entity_id)) {
        const o = orgSeat(b.organizations[lead.entity_id], 'works_here', true, null);
        if (o) return o;
      }
    }
    const publicOrgs = n.organization_ids.map((id) => b.organizations[id]).filter((o) => orgsHere.has(o.id) && isPublic(o));
    if (publicOrgs.length && nr.chance(0.4)) {
      const o = orgSeat(nr.pick(publicOrgs), 'works_here', true, null);
      if (o) return o;
    }
    const types = fit(OCCUPATION_TABLE[n.occupation].pois);
    if (!types.length) return null;
    if (OWNERS.includes(n.occupation) && WEALTH_LEVELS.indexOf(n.wealth_level) >= 2 && nr.chance(CONFIG.places.ownsBusiness)) {
      return { reason: 'owns_it', types, key: `own:${n.id}`, owner: n.id, ref: null, public: true };
    }
    return { reason: 'works_here', types, ref: null, public: true };
  };

  /** Surprising places their data explains, each with the entity that explains it. */
  const surprisesOf = (n: Npc): Option[] => {
    const out: Option[] = [];
    const add = (intent: Intent | null, weight: number) => { if (intent && weight > 0) out.push({ intent, weight }); };
    const local = (id: string | null | undefined) => (id && localIds.has(id) ? b.npcs[id] : null);
    const sec = n.secret;
    const target = motiveTarget(n);

    // Hidden leadership and membership: they are at the hideout.
    for (const lead of n.leads.filter((l) => !l.public && l.entity_type === 'organization' && orgsHere.has(l.entity_id))) {
      add(orgSeat(b.organizations[lead.entity_id], 'secret_meeting', false, lead.entity_id), 4);
    }
    for (const o of n.organization_ids.map((id) => b.organizations[id]).filter((o) => orgsHere.has(o.id) && !isPublic(o))) {
      if (!n.leads.some((l) => l.entity_id === o.id)) add(orgSeat(o, 'secret_meeting', false, o.id), 2);
    }
    if (sec) {
      const t = local(sec.target_npc_id);
      switch (sec.type) {
        case 'affair': if (t) add(visitHome(t, 'visiting_lover', false), 3); break;
        case 'blackmailed': add(venue('secret_meeting', target, false), target ? 2 : 0); break;
        case 'double_agent': add(venue('secret_meeting', target, false, ['embassy', ...REASON_PLACES.secret_meeting!]), target ? 2 : 0); break;
        case 'smuggling': add(venue('secret_meeting', target, false, ['docks', 'warehouse', 'hideout']), target ? 2 : 0); break;
        case 'forbidden_faith': {
          const faith = target ?? n.religion_or_ideology;
          add(venue('worshipping', faith, false, ['crypt', 'shrine', 'hideout']), faith ? 2 : 0);
          break;
        }
        case 'addiction': add(venue(n.wealth_level === 'destitute' ? 'drinking' : 'gambling', target, false), target ? 2 : 0); break;
        case 'crippling_debt': add(venue('gambling', target, true), target ? 2 : 0); break;
        case 'hidden_illness': {
          const healer = locals.find((x) => x.id !== n.id && x.occupation === 'physician');
          add(venue('recovering', target ?? healer?.id ?? null, false), target || healer ? 2 : 0);
          break;
        }
        case 'past_crime': case 'murder': case 'hidden_identity':
          add(venue('hiding', target, false), target ? 1.5 : 0);
          break;
        default: break;
      }
    }
    // Family, lovers and friends in town: at their home.
    for (const rel of n.relationships) {
      const other = local(rel.npc_id);
      if (!other || households.get(other.id) === households.get(n.id)) continue;
      if (['parent', 'child', 'sibling'].includes(rel.type)) add(visitHome(other, 'visiting_family', true), rel.type === 'parent' && other.age_category === 'elder' ? 1.5 : 1);
      else if (rel.type === 'lover') add(visitHome(other, 'visiting_lover', true), 1);
      else if (rel.type === 'friend') add(visitHome(other, 'visiting_friend', true), 0.5);
      else if (rel.type === 'employer' && (GUARDS.includes(n.occupation) || n.role_type === 'guard')) {
        out.push({ intent: { reason: 'guarding', types: [], follow: other.id, ref: other.id, public: true }, weight: 3 });
      } else if (rel.type === 'mentor' && OCCUPATION_TABLE[n.occupation].skills.lore) add(venue('studying', other.id, true), 1);
    }
    // Caught up in a current event: negotiating it out.
    if (n.current_event_involvement) {
      const e = s.current_events.find((x) => x.id === n.current_event_involvement);
      const party = e?.involved_refs.find((x) => x !== n.id && (kindOf(x) !== 'organization' || isPublic(b.organizations[x])));
      if (party) add(venue('negotiating', party, true), 1.5);
    }
    // The devout at worship, fighters at training.
    const faith = n.religion_or_ideology;
    if (faith && !['priest', 'prophet'].includes(n.occupation) && !(sec?.type === 'forbidden_faith')) add(venue('worshipping', faith, true), 0.5);
    if (GUARDS.includes(n.occupation)) {
      const order = n.organization_ids.find((id) => ['military_order', 'mercenary_company'].includes(b.organizations[id].org_type));
      if (order) add(venue('training', order, true), 1);
    }
    // Enemies of whoever runs the town may be in its prison.
    const ruler = s.leader_npc_id;
    if (ruler && ruler !== n.id && n.relationships.some((x) => x.npc_id === ruler && x.type === 'enemy') && n.leads.length === 0) {
      add(venue('imprisoned', ruler, true), 0.6);
    }
    return out;
  };

  // The settlement's signature place (a mining colony's mine, a port's docks): its first worker in a
  // signature trade is found there, at work. Signature places ignore the size minimum.
  const signatureTypes = (Object.entries(SETTLEMENT_TYPE_WORK[s.settlement_type].pois) as [PoiType, number][])
    .sort((a, b) => b[1] - a[1]).map(([t]) => t)
    .filter((t) => eligible([t], POI_TABLE, ctx).length > 0 && !POI_TABLE[t].residence && !POI_TABLE[t].wildOnly);
  const flavorOf = (n: Npc) => [SETTLEMENT_TYPE_WORK[s.settlement_type], ...s.primary_industries.map((i) => INDUSTRY_WORK[i])]
    .reduce((a, f) => a + (f.occupations[n.occupation] ?? 0), 0);
  const signatureWorker = locals.find((n) => n.npc_category === 'notable' && flavorOf(n) > 0);

  // Choose an intent per NPC.
  const intents = new Map<string, Intent>();
  const work = new Map<string, Intent | null>();
  for (const n of locals) {
    const nr = r.fork(n.id);
    if (n === signatureWorker && signatureTypes.length) {
      // Their own trade's places that are signature places come first, then the rest of the signature places.
      const own = OCCUPATION_TABLE[n.occupation].pois.filter((t) => signatureTypes.includes(t));
      const types = [...own, ...signatureTypes.filter((t) => !own.includes(t))];
      const intent: Intent = { reason: 'works_here', types, ref: null, public: true };
      work.set(n.id, intent);
      intents.set(n.id, intent);
      continue;
    }
    const w = workOf(n, nr);
    work.set(n.id, w);
    const surprises = surprisesOf(n);
    const total = surprises.reduce((a, o) => a + o.weight, 0);
    const pS = surprises.length ? Math.min(CONFIG.places.surprising.max, CONFIG.places.surprising.base + CONFIG.places.surprising.perWeight * total) : 0;
    // Those who rule are mostly found at their seat of power; elders and idle nobles stay home more.
    let atWork = CONFIG.places.atWork;
    if (n.leads.some((l) => l.public)) atWork = CONFIG.places.leaderAtWork;
    else {
      if (AGE_CATEGORIES.indexOf(n.age_category) >= AGE_CATEGORIES.indexOf('elder')) atWork -= 0.25;
      if (n.occupation === 'noble') atWork -= 0.3;
    }
    const intent = nr.chance(pS) ? nr.weightedBy(surprises, (o) => o.weight).intent
      : w && nr.chance(atWork) ? w : homeOf(n);
    intents.set(n.id, intent);
  }

  // Realize places: reuse what fits, otherwise open a new one.
  const byKey = new Map<string, PointOfInterest>();
  const here = () => s.poi_ids.map((id) => b.pois[id]);
  const usedNames = new Set<string>();
  const ph = b.languages[s.languages[0]].phonology;

  // Places that suit the settlement: its type (a port's docks), its industries (a mining town's mine) and its districts.
  const flavor = [SETTLEMENT_TYPE_WORK[s.settlement_type], ...s.primary_industries.map((i) => INDUSTRY_WORK[i])];
  const districts = new Set(s.districts.map((d) => d.type));
  const suits = (t: PoiType) => (1 + flavor.reduce((a, f) => a + (f.pois[t] ?? 0), 0))
    * (POI_TABLE[t].districts.some((d) => districts.has(d)) ? 2 : 1);

  const create = (pr: Rng, intent: Intent): PointOfInterest => {
    // The first listed type fits the person best; the settlement's character can still tip the choice.
    const type = pr.weighted(intent.types.map((t, i) => ({ value: t, weight: suits(t) / (i + 1) })));
    const def = POI_TABLE[type];
    const owner = intent.owner ? b.npcs[intent.owner] : null;
    const head = intent.household ?? owner;
    let name = '';
    for (let i = 0; i < 6 && (!name || usedNames.has(name)); i++) {
      const nr = pr.fork(`name:${i}`);
      const root = () => (owner && nr.chance(0.5) ? owner.given_name : makeBareName(ph, nr, 2));
      name = fillPattern(pickPattern(nr, def.namePatterns), {
        adjective: () => nr.pick(ADJECTIVES), noun: () => nr.pick(NOUNS), noun2: () => nr.pick(NOUNS), root,
        family: () => head?.family_name || makeBareName(ph, nr, 2),
        given: () => head?.given_name || makeBareName(ph, nr, 2),
        street: () => fillPattern(pickPattern(nr, STREET_PATTERNS), {
          root: () => makeBareName(ph, nr, 2), adjective: () => nr.pick(ADJECTIVES), noun: () => nr.pick(NOUNS),
        }),
      });
    }
    usedNames.add(name);
    const id = `poi_${ids.poi++}`;
    const poi: PointOfInterest = {
      id, seed: pr.childSeed(id), settlement_id: s.id, near_settlement_id: null, position: null, status: 'in_use', name, type, significance: 'minor',
      owner_npc_id: intent.owner ?? null, organization_id: intent.org ?? null, description: '',
    };
    b.pois[id] = poi;
    s.poi_ids.push(id);
    return poi;
  };

  const realize = (n: Npc, intent: Intent): PointOfInterest | null => {
    if (intent.key && byKey.has(intent.key)) return byKey.get(intent.key)!;
    if (intent.types.length === 0) return null;
    const pr = r.fork(`place:${n.id}`);
    let poi: PointOfInterest | undefined;
    if (intent.key?.startsWith('org:')) {
      // An organization can take over an existing venue of a fitting type.
      const adopt = here().filter((p) => !p.organization_id && !POI_TABLE[p.type].residence && intent.types.includes(p.type));
      if (adopt.length && pr.chance(0.5)) {
        poi = pr.pick(adopt);
        poi.organization_id = intent.org!;
      }
    } else if (!intent.key) {
      const same = here().filter((p) => intent.types.includes(p.type) && !POI_TABLE[p.type].residence);
      if (same.length && (same.some((p) => SINGLE.includes(p.type)) || pr.chance(CONFIG.places.reuseVenue))) poi = pr.pick(same);
    }
    poi ??= create(pr, intent);
    if (intent.key) byKey.set(intent.key, poi);
    if (intent.reason === 'owns_it' && !poi.owner_npc_id) poi.owner_npc_id = n.id;
    return poi;
  };

  const assign = (n: Npc, intent: Intent, poi: PointOfInterest) => {
    n.location_poi_id = poi.id;
    n.location_reason = intent.reason;
    n.location_reason_ref = intent.ref;
    n.location_public = intent.public;
  };

  const followers: Npc[] = [];
  for (const n of locals) {
    const intent = intents.get(n.id)!;
    if (intent.follow) { followers.push(n); continue; }
    const poi = realize(n, intent);
    if (poi) assign(n, intent, poi);
    else {
      const home = homeOf(n);
      assign(n, home, realize(n, home)!);
    }
  }
  // Bodyguards go wherever their employer is; their presence is as public as the employer's.
  for (const n of followers) {
    const intent = intents.get(n.id)!;
    const boss = b.npcs[intent.follow!];
    if (b.pois[boss.location_poi_id]) assign(n, { ...intent, public: boss.location_public }, b.pois[boss.location_poi_id]);
    else { const home = homeOf(n); assign(n, home, realize(n, home)!); }
  }

  // Workplaces: where they work, if that place exists in town.
  for (const n of locals) {
    const w = work.get(n.id);
    if (!w) continue;
    if (n.location_reason === 'works_here' || n.location_reason === 'owns_it') { n.workplace_poi_id = n.location_poi_id; continue; }
    const at = w.key ? byKey.get(w.key) : here().find((p) => w.types.includes(p.type));
    if (at) n.workplace_poi_id = at.id;
  }
}

/** Households: spouses, and parents with young children, share a home. Keyed by NPC id, valued by the head. */
function householdsOf(b: PlanetBundle, locals: Npc[]): Map<string, Npc> {
  const parent = new Map<string, string>(locals.map((n) => [n.id, n.id]));
  const find = (id: string): string => { while (parent.get(id) !== id) id = parent.get(id)!; return id; };
  const young = (n: Npc) => AGE_CATEGORIES.indexOf(n.age_category) <= AGE_CATEGORIES.indexOf('young_adult');
  for (const n of locals) {
    for (const rel of n.relationships) {
      const other = b.npcs[rel.npc_id];
      if (!parent.has(rel.npc_id)) continue;
      const together = rel.type === 'spouse' || (rel.type === 'parent' && young(n)) || (rel.type === 'child' && young(other));
      // Leaders keep their own seat of power; they still share a home.
      if (together) parent.set(find(n.id), find(other.id));
    }
  }
  const groups = new Map<string, Npc[]>();
  for (const n of locals) groups.set(find(n.id), [...(groups.get(find(n.id)) ?? []), n]);
  const standing = (n: Npc) => WEALTH_LEVELS.indexOf(n.wealth_level) * 10 + SOCIAL_RANKS.indexOf(n.social_rank);
  const out = new Map<string, Npc>();
  for (const members of groups.values()) {
    const head = members.reduce((a, c) => (standing(c) > standing(a) || (standing(c) === standing(a) && c.age > a.age) ? c : a));
    for (const m of members) out.set(m.id, head);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Places outside settlements

/** Abandoned and forgotten places in the wilds around a settlement. Nobody is there; maps lead to them. */
function placeWilds(b: PlanetBundle, r: Rng, s: Settlement, ids: { poi: number }, names: Set<string>): void {
  const cfg = CONFIG.places.wild;
  const ruinous = s.settlement_type === 'ruin_town' || s.primary_industries.includes('relic_hunting')
    || s.districts.some((d) => d.type === 'ruins' || d.type === 'necropolis');
  const expected = cfg.base + (ruinous ? cfg.ruinBoost : 0) + (b.planet.precursor_presence !== 'none' ? cfg.precursorBoost : 0);
  const count = Math.floor(expected) + (r.chance(expected % 1) ? 1 : 0);
  if (count === 0) return;
  const options = eligible(POI_TYPES.filter((t) => POI_TABLE[t].wild), POI_TABLE, bundleContext(b, { biomes: [s.biome] }), (_t, d) => d.wild!.weight);
  if (options.length === 0) return;
  const ph = b.languages[s.languages[0]].phonology;
  const clamp = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
  for (let i = 0; i < count; i++) {
    const wr = r.fork(`wild:${i}`);
    const type = wr.weighted(options);
    const def = POI_TABLE[type];
    const status: PoiStatus = wr.chance(def.wild!.forgotten) ? 'forgotten' : 'abandoned';
    let name = '';
    for (let j = 0; j < 6 && (!name || names.has(name)); j++) {
      const nr = wr.fork(`name:${j}`);
      name = fillPattern(pickPattern(nr, def.wild!.namePatterns ?? def.namePatterns), {
        adjective: () => nr.pick(ADJECTIVES), noun: () => nr.pick(NOUNS), noun2: () => nr.pick(NOUNS), root: () => makeBareName(ph, nr, 2),
      });
    }
    names.add(name);
    const angle = wr.next() * Math.PI * 2;
    const distance = cfg.distance[0] + wr.next() * (cfg.distance[1] - cfg.distance[0]);
    const id = `poi_${ids.poi++}`;
    b.pois[id] = {
      id, seed: wr.childSeed(id), settlement_id: null, near_settlement_id: s.id,
      position: { x: clamp(s.position.x + Math.cos(angle) * distance), y: clamp(s.position.y + Math.sin(angle) * distance) },
      status, name, type, significance: POI_SIGNIFICANCES[Math.min(3, def.significance + (wr.chance(cfg.greater) ? 1 : 0))],
      owner_npc_id: null, organization_id: null, description: '',
    };
    s.nearby_poi_ids.push(id);
  }
}

/** Significance from the place type, the settlement's size and the importance of who is there. */
function significanceOf(b: PlanetBundle, poi: PointOfInterest, present: Npc[]): (typeof POI_SIGNIFICANCES)[number] {
  const s = b.settlements[poi.settlement_id!];
  const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
  let sig = POI_TABLE[poi.type].significance;
  // Capitals make their great places greater; hamlets make everything humbler.
  if ((size >= 5 && sig >= 1) || (size === 4 && sig >= 2)) sig += 1;
  if (size <= 1 && sig >= 2) sig -= 1;
  const importance = Math.max(0, ...present.map((n) => {
    if (n.leads.some((l) => l.entity_type === 'world_government' || l.entity_type === 'country')) return 2;
    if (n.leads.length > 0 || SOCIAL_RANKS.indexOf(n.social_rank) >= SOCIAL_RANKS.indexOf('noble')) return 1;
    return 0;
  }));
  if (importance >= 2) sig += 1;
  else if (importance === 1 && sig === 0) sig += 1;
  const org = poi.organization_id ? b.organizations[poi.organization_id] : null;
  if (org && org.headquarters_settlement_id === s.id && org.scope_level === 'planet') sig += 1;
  return POI_SIGNIFICANCES[Math.max(0, Math.min(3, sig))];
}

// ---------------------------------------------------------------------------
// Treasures

interface Draft {
  category: TreasureCategory;
  name: string;
  subjects: string[];
  visibility?: Visibility;
  /** Fact key, so a secret or rumor backs at most one treasure. */
  fact?: string;
  embodied?: boolean;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

class TreasureMaker {
  private used = new Set<string>();
  private names = new Set<string>();

  constructor(
    private b: PlanetBundle,
    private ids: { treasure: number },
    private byPoi: Map<string, Npc[]>,
    private bySettlement: Map<string, Npc[]>,
  ) {
    this.mapTargets = Object.values(b.pois).filter((p) => !p.settlement_id || HIDDEN_DEPTHS.includes(p.type));
  }

  /** The settlement a place is in, or near. */
  private home(poi: PointOfInterest): Settlement {
    return this.b.settlements[(poi.settlement_id ?? poi.near_settlement_id)!];
  }

  /** Places a map can lead to: anywhere in the wilds, or the hidden depths of a settlement. */
  private mapTargets: PointOfInterest[];

  forPoi(r: Rng, poi: PointOfInterest): void {
    const [lo, hi] = TREASURES_BY_SIGNIFICANCE[poi.significance];
    const count = r.int(lo, hi);
    const counts = new Map<TreasureCategory, number>();
    for (let i = 0; i < count; i++) {
      const tr = r.fork(`t:${i}`);
      const weights: Partial<Record<TreasureCategory, number>> = { ...POI_TABLE[poi.type].treasures };
      // Out in the wilds nobody is left to hold secrets, keys or evidence: only what was left behind.
      if (!poi.settlement_id) for (const c of ['intel', 'leverage', 'access'] as const) delete weights[c];
      // Secrets of the people here make the best leverage; a secret organization's seat holds intel.
      else if (this.leverageOptions(poi).some((o) => o.weight >= 4)) weights.leverage = (weights.leverage ?? 0) + 1.5;
      const org = poi.organization_id ? this.b.organizations[poi.organization_id] : null;
      if (org && !isPublic(org)) weights.intel = (weights.intel ?? 0) + 3;
      for (const [c, k] of counts) weights[c] = (weights[c] ?? 0) / (1 + k * 2);
      let draft: Draft | null = null;
      for (let tries = 0; tries < 4 && !draft; tries++) {
        const live = TREASURE_CATEGORIES.filter((c) => (weights[c] ?? 0) > 0);
        if (!live.length) break;
        const c = tr.fork(`c:${tries}`).weightedKeys(live, weights);
        draft = this.draft(tr.fork(`d:${tries}`), c, poi);
        if (!draft) weights[c] = 0;
      }
      draft ??= this.physical(tr, 'wealth', poi);
      counts.set(draft.category, (counts.get(draft.category) ?? 0) + 1);
      this.add(tr, draft, { poi_id: poi.id }, poi);
    }
  }

  forNpc(r: Rng, n: Npc): void {
    const score = this.power(n);
    const p = Math.min(CONFIG.places.npcTreasure.max, CONFIG.places.npcTreasure.base + CONFIG.places.npcTreasure.perScore * score);
    if (score <= 0 || !r.chance(p)) return;
    const poi = this.b.pois[n.location_poi_id];
    const draft = this.carried(r, n, poi);
    if (draft) this.add(r, draft, { npc_id: n.id }, poi);
  }

  /** How likely an NPC is to carry or be a treasure: power, wealth, gifts and knowledge. */
  private power(n: Npc): number {
    let score = 0;
    if (n.leads.some((l) => l.entity_type === 'world_government' || l.entity_type === 'country')) score += 4;
    else if (n.leads.length) score += 2;
    score += Math.max(0, WEALTH_LEVELS.indexOf(n.wealth_level) - 3) * 1.5;
    score += n.special_abilities.length * 2.5;
    if (['scholar', 'archivist', 'spy', 'prophet', 'alchemist'].includes(n.occupation)) score += 1.5;
    if (n.secret?.type === 'relic_possession') score += 6;
    if (n.possessions.some((x) => POSSESSION_TREASURE[x])) score += 0.5;
    return score;
  }

  private carried(r: Rng, n: Npc, poi: PointOfInterest): Draft | null {
    const name = (pattern: string, slots: Record<string, string>) => fillPattern(pattern, Object.fromEntries(Object.entries(slots).map(([k, v]) => [k, () => v])));
    if (n.secret?.type === 'relic_possession') {
      const d = this.physical(r, 'relic', poi);
      return { ...d, visibility: 'secret', subjects: [...d.subjects, ...[motiveTarget(n)].filter((x): x is string => !!x)] };
    }
    const gift = n.special_abilities.find((a) => ABILITY_TREASURE_NAMES[a]);
    if (gift && r.chance(0.7)) {
      return { category: 'knowledge', name: name(ABILITY_TREASURE_NAMES[gift]!, { npc: n.name }), subjects: [n.id], embodied: true, visibility: r.pick<Visibility>(['discreet', 'secret']) };
    }
    if (n.leads.some((l) => l.public && (l.entity_type === 'country' || l.entity_type === 'world_government'))) {
      const lead = n.leads.find((l) => l.public && (l.entity_type === 'country' || l.entity_type === 'world_government'))!;
      const country = lead.entity_type === 'country' ? lead.entity_id : this.b.settlements[n.settlement_id].country_id;
      if (r.chance(0.5)) return { category: 'access', name: fillPattern(pickPattern(r, ACCESS_NAMES.country), { subject: () => entityName(this.b, country) }), subjects: [country], visibility: 'public' };
      return { ...this.physical(r, r.pick<TreasureCategory>(['weapon', 'armor', 'wealth']), poi), visibility: 'public' };
    }
    if (['spy', 'scholar', 'archivist'].includes(n.occupation) && r.chance(0.6)) {
      const pool = n.occupation === 'spy' ? this.leverageOptions(poi, 1) : [];
      if (pool.length) {
        const o = r.weightedBy(pool, (x) => x.weight);
        this.used.add(o.draft.fact!);
        return { ...o.draft, category: 'intel', name: `What ${n.name} Knows About ${entityName(this.b, o.draft.subjects[0])}`, embodied: true };
      }
      const k = this.draft(r, 'knowledge', poi);
      if (k) return { ...k, name: `What ${n.name} Knows of ${entityName(this.b, k.subjects[0])}`, embodied: true };
    }
    const owned = n.possessions.filter((x) => POSSESSION_TREASURE[x]);
    if (owned.length) {
      const c = POSSESSION_TREASURE[r.pick(owned)]!;
      return this.draft(r, c, poi) ?? this.physical(r, 'wealth', poi);
    }
    return this.physical(r, r.pick<TreasureCategory>(['wealth', 'weapon', 'artifact']), poi);
  }

  private add(r: Rng, d: Draft, holder: TreasureHolder, poi: PointOfInterest): void {
    if (d.fact) this.used.add(d.fact);
    // Coined names can collide; number the later ones ("the Ashen Blade II").
    let name = d.name;
    for (let i = 2; this.names.has(name); i++) name = `${d.name} ${ROMAN[i] ?? i}`;
    this.names.add(name);
    const present = this.byPoi.get(poi.id) ?? [];
    const guards = 'poi_id' in holder
      ? present.filter((n) => GUARDS.includes(n.occupation) || ['guard', 'enforcer'].includes(n.role_type))
      : present.filter((n) => n.id !== holder.npc_id && n.relationships.some((x) => x.npc_id === holder.npc_id && x.type === 'employer'));
    const owner = 'poi_id' in holder && poi.owner_npc_id && present.some((n) => n.id === poi.owner_npc_id) ? [poi.owner_npc_id] : [];
    const guardIds = guards.length ? r.sample(guards, Math.min(2, guards.length)).map((n) => n.id) : owner;
    const sigBoost = POI_SIGNIFICANCES.indexOf(poi.significance);
    const rarity = r.weighted<TreasureRarity>(TREASURE_RARITIES.map((x, i) => ({ value: x, weight: [6, 3 + sigBoost * 0.5, 0.3 + sigBoost * 0.6][i] })));
    const org = poi.organization_id ? this.b.organizations[poi.organization_id] : null;
    const vis = TREASURE_TABLE[d.category].visibility;
    // Nothing at a secret seat or a forgotten place is common knowledge.
    const hidden = (org && !isPublic(org)) || poi.status === 'forgotten';
    const visibility = d.visibility ?? r.weighted(VISIBILITY_LEVELS.map((v) => ({
      value: v, weight: (vis[v] ?? 0) * (v === 'public' && hidden ? 0 : 1),
    })).filter((e) => e.weight > 0).concat([{ value: 'secret' as Visibility, weight: 0.01 }]));
    const id = `treasure_${this.ids.treasure++}`;
    const t: Treasure = {
      id, seed: r.childSeed(id), name, category: d.category, rarity, holder, visibility,
      subject_refs: [...new Set(d.subjects)], guarded_by_npc_ids: guardIds, embodied: d.embodied ?? false, description: '',
    };
    this.b.treasures[id] = t;
  }

  /** A treasure of a category, or null if the world offers nothing for it here. */
  private draft(r: Rng, c: TreasureCategory, poi: PointOfInterest): Draft | null {
    const b = this.b;
    const s = this.home(poi);
    const subject = (pattern: NamePattern[], id: string, extra: Record<string, string> = {}) => fillPattern(pickPattern(r, pattern), {
      subject: () => entityName(b, id), epithet: () => r.pick(TREASURE_EPITHETS), ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, () => v])),
    });
    const pickFact = <T extends { fact?: string; weight: number }>(xs: T[]) => {
      const free = xs.filter((x) => !x.fact || !this.used.has(x.fact));
      return free.length ? r.weightedBy(free, (x) => x.weight) : null;
    };
    switch (c) {
      case 'leverage': {
        const o = pickFact(this.leverageOptions(poi).map((x) => ({ ...x, fact: x.draft.fact })));
        return o ? o.draft : null;
      }
      case 'intel': {
        const opts: { id: string; weight: number; fact: string; also?: string }[] = [];
        for (const o of s.organizations_present.map((id) => b.organizations[id])) {
          if (!isPublic(o) || o.true_goal.type !== o.stated_goal.type) opts.push({ id: o.id, weight: o.id === poi.organization_id ? 4 : 1.5, fact: `intel:${o.id}` });
        }
        const rumors = [...s.rumors, ...(this.bySettlement.get(s.id) ?? []).flatMap((n) => n.rumors_about)];
        for (const rm of rumors.filter((x) => x.is_true)) opts.push({ id: rm.subject_ref, also: rm.target_ref ?? undefined, weight: 1, fact: `rumor:${rm.subject_ref}:${rm.claim_type}` });
        const o = pickFact(opts);
        return o ? { category: c, name: subject(INTEL_NAMES, o.id), subjects: [o.id, ...(o.also ? [o.also] : [])], fact: o.fact } : null;
      }
      case 'knowledge': {
        const opts: { id: string; kind: keyof typeof KNOWLEDGE_NAMES; weight: number; fact: string }[] = [];
        for (const rel of s.religions_or_ideologies.slice(0, 2)) opts.push({ id: rel.religion_id, kind: 'religion', weight: ['temple', 'shrine', 'monastery', 'crypt'].includes(poi.type) ? 4 : 1, fact: `know:${rel.religion_id}` });
        for (const sp of s.species.slice(0, 2)) opts.push({ id: sp.species_id, kind: 'species', weight: ['laboratory', 'hospital', 'college'].includes(poi.type) ? 3 : 0.7, fact: `know:${sp.species_id}` });
        opts.push({ id: PLANET_ID, kind: 'planet', weight: b.planet.precursor_presence !== 'none' ? 1.5 : 0.7, fact: `know:planet:${poi.id}` });
        opts.push({ id: s.id, kind: 'settlement', weight: 1, fact: `know:${s.id}` });
        opts.push({ id: s.country_id, kind: 'country', weight: 0.7, fact: `know:${s.country_id}:${poi.id}` });
        for (const o of s.organizations_present) opts.push({ id: o, kind: 'organization', weight: o === poi.organization_id ? 3 : 0.5, fact: `know:${o}` });
        const o = pickFact(opts);
        return o ? { category: c, name: subject(KNOWLEDGE_NAMES[o.kind], o.id), subjects: [o.id], fact: o.fact } : null;
      }
      case 'access': {
        const opts: { id: string; kind: keyof typeof ACCESS_NAMES; weight: number; fact: string }[] = [];
        for (const o of s.organizations_present) opts.push({ id: o, kind: 'organization', weight: o === poi.organization_id ? 4 : 1, fact: `access:${o}` });
        for (const p of s.poi_ids.filter((x) => x !== poi.id)) opts.push({ id: p, kind: 'poi', weight: POI_SIGNIFICANCES.indexOf(b.pois[p].significance) + 0.5, fact: `access:${p}` });
        opts.push({ id: s.id, kind: 'settlement', weight: 1, fact: `access:${s.id}` });
        if (POI_SIGNIFICANCES.indexOf(poi.significance) >= 2) opts.push({ id: s.country_id, kind: 'country', weight: 1, fact: `access:${s.country_id}:${poi.id}` });
        const o = pickFact(opts);
        return o ? { category: c, name: subject(ACCESS_NAMES[o.kind], o.id), subjects: [o.id], fact: o.fact } : null;
      }
      case 'map': {
        // A map leads to a real place: mostly the forgotten places of the wilds, best those nearby.
        const opts = this.mapTargets.filter((p) => p.id !== poi.id).map((p) => ({
          id: p.id, wild: !p.settlement_id, fact: `map:${p.id}`,
          weight: p.settlement_id ? 0.5 : (p.status === 'forgotten' ? 3 : 1.5) * (p.near_settlement_id === s.id ? 2 : 1),
        }));
        const o = pickFact(opts);
        return o ? { category: c, name: subject(MAP_NAMES[o.wild ? 'wild' : 'hidden'], o.id), subjects: [o.id], fact: o.fact } : null;
      }
      default:
        return this.physical(r, c, poi);
    }
  }

  /** Evidence of NPC secrets, weighted toward the people at (or owning) this place. */
  private leverageOptions(poi: PointOfInterest, minWeight = 0): { draft: Draft; weight: number }[] {
    const b = this.b;
    const out: { draft: Draft; weight: number }[] = [];
    for (const n of (poi.settlement_id && this.bySettlement.get(poi.settlement_id)) || []) {
      if (!n.secret || this.used.has(`secret:${n.id}`)) continue;
      const weight = n.location_poi_id === poi.id || poi.owner_npc_id === n.id ? 4
        : poi.organization_id && n.organization_ids.includes(poi.organization_id) ? 2 : 0.5;
      if (weight < minWeight) continue;
      const target = motiveTarget(n);
      const patterns = LEVERAGE_NAMES[n.secret.type].filter((p) => target || !p.pattern.includes('{target}'));
      if (!patterns.length) continue;
      const pattern = patterns.reduce((a, p) => (p.weight > a.weight ? p : a)).pattern;
      out.push({
        weight,
        draft: {
          category: 'leverage', visibility: 'secret', fact: `secret:${n.id}`,
          name: fillPattern(pattern, { npc: () => n.name, target: () => (target ? entityName(b, target) : '') }),
          subjects: [n.id, ...(target ? [target] : [])],
        },
      });
    }
    return out;
  }

  private physical(r: Rng, c: TreasureCategory, poi: PointOfInterest): Draft {
    const b = this.b;
    const s = this.home(poi);
    const tech = b.countries[s.country_id].tech_level;
    // Whatever the precursors left behind is beyond anyone living.
    const band = poi.type === 'precursor_site' || tech > 6 ? 2 : tech > 3 ? 1 : 0;
    const ph = b.languages[s.languages[0]].phonology;
    const owner = poi.owner_npc_id ? b.npcs[poi.owner_npc_id] : null;
    const religion = s.religions_or_ideologies[0]?.religion_id ?? null;
    const base = {
      epithet: () => r.pick(TREASURE_EPITHETS), root: () => makeBareName(ph, r, 2),
      noun: () => r.pick((TREASURE_NOUNS[c] ?? TREASURE_NOUNS.artifact!)[band]),
    };
    if (c === 'resource') {
      const goods = [...s.notable_goods, ...b.planet.resources.map((x) => x.resource)];
      const resource = goods.length ? titleCase(words(r.pick(goods))) : 'Starmetal';
      return { category: c, name: fillPattern(pickPattern(r, RESOURCE_NAME_PATTERNS), { ...base, resource: () => resource }), subjects: [] };
    }
    if (c === 'wealth') {
      return { category: c, name: fillPattern(pickPattern(r, WEALTH_NAME_PATTERNS), { ...base, family: () => owner?.family_name || makeBareName(ph, r, 2) }), subjects: [] };
    }
    if (c === 'relic' && religion) {
      return { category: c, name: fillPattern(pickPattern(r, RELIC_NAME_PATTERNS), { ...base, subject: () => entityName(b, religion) }), subjects: [religion] };
    }
    if (needsSubject(c)) return this.physical(r, 'artifact', poi);
    return { category: c, name: fillPattern(pickPattern(r, PHYSICAL_NAME_PATTERNS), base), subjects: [] };
  }
}
