import { CONFIG } from '../config';
import {
  ATTITUDE_THRESHOLDS, GOVERNMENT_FAMILY, ORG_AFFINITY, RELIGION_KIND_TABLE, RELATIONSHIP_NOTE_TABLE, SAME_TYPE_RIVALRY,
} from '../content';
import type { Rng } from '../rng';
import type { Country, Npc, Organization, PlanetBundle, Relation } from '../types/entities';
import {
  RELATIONSHIP_INVERSE, RELATIONSHIP_NOTES, STABILITY_LEVELS,
  type Attitude, type RelationReason, type RelationshipType,
} from '../types/enums';
import { fullName } from './npcFactory';
import { biased } from './util';

/**
 * Pipeline step 9: relationship passes, after every entity exists.
 * Country relations, organization relations (to organizations and
 * countries), then NPC relationships. Everything is written on both sides
 * at once, so symmetry holds by construction.
 */
export function generateRelationshipsStep(bundle: PlanetBundle, rng: Rng): void {
  countryRelations(bundle, rng.fork('countries'));
  orgRelations(bundle, rng.fork('organizations'));
  targetOrgGoals(bundle, rng.fork('org-goals'));
  npcRelationships(bundle, rng.fork('npcs'));
}

// ---------------------------------------------------------------------------
// Scoring helpers

interface Factor {
  score: number;
  reason: RelationReason;
}

function attitudeFor(score: number, warPossible: boolean, warBelow = -2.3): Attitude {
  const hit = ATTITUDE_THRESHOLDS.find((t) => score >= t.min);
  if (hit) return hit.attitude;
  return warPossible && score < warBelow ? 'at_war' : 'hostile';
}

/** Most relations an organization keeps with other organizations. */
const ORG_RELATION_CAP = 6;

/** The factor that best explains the final attitude; falls back when nothing stands out. */
function reasonFor(rng: Rng, factors: Factor[], score: number, fallback: RelationReason[]): RelationReason {
  const aligned = factors.filter((f) => Math.sign(f.score) === Math.sign(score) && Math.abs(f.score) >= 0.3);
  if (aligned.length > 0) return aligned.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0].reason;
  return rng.pick(fallback);
}

function relate(a: { id: string; relations: Relation[] }, b: { id: string; relations: Relation[] }, attitude: Attitude, reason: RelationReason): void {
  a.relations.push({ target_ref: b.id, attitude, reason });
  b.relations.push({ target_ref: a.id, attitude, reason });
}

// ---------------------------------------------------------------------------
// Countries

function countryRelations(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const countries = Object.values(bundle.countries);
  const unstable = STABILITY_LEVELS.indexOf(p.stability) <= 1;
  for (let i = 0; i < countries.length; i++) {
    for (let j = i + 1; j < countries.length; j++) {
      const a = countries[i];
      const b = countries[j];
      const r = rng.fork(`${a.id}:${b.id}`);
      const neighbors = a.neighbor_ids.includes(b.id);
      if (!neighbors && !r.chance(CONFIG.relationships.distantCountryRelation)) continue;

      const factors: Factor[] = [];
      const shared = a.key_events.filter((e) => e.involved_refs.includes(b.id)
        || (e.parent_event_id && b.key_events.some((x) => x.parent_event_id === e.parent_event_id)));
      let warHistory = false;
      for (const e of shared) {
        if (['war', 'invasion', 'civil_war'].includes(e.event_type)) { factors.push({ score: -1.4, reason: 'history' }); warHistory = true; }
        if (['treaty', 'unification'].includes(e.event_type)) factors.push({ score: 1.2, reason: 'alliance_treaty' });
        if (e.event_type === 'schism') factors.push({ score: -0.8, reason: 'religion' });
      }
      const faithA = topFaith(bundle, a);
      const faithB = topFaith(bundle, b);
      if (faithA && faithB) {
        if (faithA.id === faithB.id) factors.push({ score: 0.6, reason: 'religion' });
        else if (faithA.devout && faithB.devout) factors.push({ score: -0.7, reason: 'religion' });
      }
      const sameFamily = GOVERNMENT_FAMILY[a.government_type] === GOVERNMENT_FAMILY[b.government_type];
      factors.push({ score: sameFamily ? 0.4 : -0.4, reason: 'ideology' });
      if (neighbors) factors.push({ score: -0.35, reason: r.chance(0.5) ? 'border_dispute' : 'territorial_claim' });
      if (a.languages[0] === b.languages[0]) factors.push({ score: 0.3, reason: 'cultural_ties' });
      const tradeOverlap = a.exports.some((g) => b.imports.includes(g)) || b.exports.some((g) => a.imports.includes(g));
      if (tradeOverlap) factors.push({ score: 0.4, reason: 'trade' });
      if (a.primary_industries.includes('mining') && b.primary_industries.includes('mining')) factors.push({ score: -0.3, reason: 'resources' });
      if (p.political_structure === 'federation') factors.push({ score: 0.8, reason: 'alliance_treaty' });
      if (unstable) factors.push({ score: -0.8, reason: 'history' });
      const royals = ['absolute_monarchy', 'constitutional_monarchy', 'elective_monarchy', 'feudal_realm'];
      if (royals.includes(a.government_type) && royals.includes(b.government_type) && r.chance(0.4)) factors.push({ score: 0.5, reason: 'marriage' });

      const score = factors.reduce((s, f) => s + f.score, 0) + r.normal(0, 0.7);
      const attitude = attitudeFor(score, neighbors || warHistory);
      relate(a, b, attitude, reasonFor(r, factors, score, ['trade', 'competition', 'history']));
    }
  }
}

function topFaith(bundle: PlanetBundle, c: Country): { id: string; devout: boolean } | null {
  const top = c.religions_or_ideologies[0];
  if (!top) return null;
  const kind = RELIGION_KIND_TABLE[bundle.religions[top.religion_id].kind];
  return { id: top.religion_id, devout: top.share > 0.5 && kind.family !== 'secular' };
}

// ---------------------------------------------------------------------------
// Organizations

function homeCountryId(bundle: PlanetBundle, o: Organization): string | null {
  if (o.scope_level === 'country') return o.home_ref;
  if (o.scope_level === 'settlement') return bundle.settlements[o.home_ref].country_id;
  return null;
}

function orgRelations(bundle: PlanetBundle, rng: Rng): void {
  const orgs = Object.values(bundle.organizations);
  // Organization pairs that operate in the same places. Scores are collected first
  // and the strongest feelings win, so no organization relates to everything.
  const candidates: { a: Organization; b: Organization; score: number; attitude: Attitude; reason: RelationReason }[] = [];
  for (let i = 0; i < orgs.length; i++) {
    for (let j = i + 1; j < orgs.length; j++) {
      const a = orgs[i];
      const b = orgs[j];
      const sharedPlaces = a.presence.filter((x) => b.presence.some((y) => y.settlement_id === x.settlement_id)).length;
      const bothPlanet = a.scope_level === 'planet' && b.scope_level === 'planet';
      if (sharedPlaces === 0 && !bothPlanet) continue;
      const r = rng.fork(`${a.id}:${b.id}`);
      const factors: Factor[] = [];
      for (const aff of ORG_AFFINITY) {
        if ((aff.a === a.org_type && aff.b === b.org_type) || (aff.a === b.org_type && aff.b === a.org_type)) {
          factors.push({ score: aff.score, reason: aff.reason });
        }
      }
      if (a.org_type === b.org_type && SAME_TYPE_RIVALRY[a.org_type]) factors.push(SAME_TYPE_RIVALRY[a.org_type]!);
      if (a.religion_id && b.religion_id) factors.push(a.religion_id === b.religion_id ? { score: 0.9, reason: 'religion' } : { score: -0.9, reason: 'religion' });
      if ((a.legality === 'official') !== (b.legality === 'official') && (a.legality === 'outlawed' || b.legality === 'outlawed')) {
        factors.push({ score: -0.7, reason: 'ideology' });
      }
      const score = factors.reduce((s, f) => s + f.score, 0) + r.normal(0, 0.6);
      // Only notable relations are recorded; most neighbors simply ignore each other.
      if (Math.abs(score) < 0.6) continue;
      const fighters = ['criminal_syndicate', 'rebel_movement', 'military_order', 'mercenary_company', 'cult', 'noble_house'];
      const warPossible = fighters.includes(a.org_type) && fighters.includes(b.org_type);
      candidates.push({ a, b, score, attitude: attitudeFor(score, warPossible, -2.8), reason: reasonFor(r, factors, score, ['competition', 'trade', 'history']) });
    }
  }
  candidates.sort((x, y) => Math.abs(y.score) - Math.abs(x.score) || x.a.id.localeCompare(y.a.id) || x.b.id.localeCompare(y.b.id));
  const count = new Map<string, number>();
  for (const c of candidates) {
    if ((count.get(c.a.id) ?? 0) >= ORG_RELATION_CAP || (count.get(c.b.id) ?? 0) >= ORG_RELATION_CAP) continue;
    relate(c.a, c.b, c.attitude, c.reason);
    count.set(c.a.id, (count.get(c.a.id) ?? 0) + 1);
    count.set(c.b.id, (count.get(c.b.id) ?? 0) + 1);
  }

  // Organizations and countries.
  for (const o of orgs) {
    const r = rng.fork(`country:${o.id}`);
    const home = homeCountryId(bundle, o);
    const targets = home
      ? [home]
      : Array.from(new Set(o.presence.map((x) => bundle.settlements[x.settlement_id].country_id))).slice(0, r.int(1, 3));
    for (const cid of targets) {
      const c = bundle.countries[cid];
      const factors: Factor[] = [];
      if (o.state_role !== 'none' && cid === home) factors.push({ score: 2.5, reason: 'alliance_treaty' });
      factors.push(o.legality === 'official' ? { score: 0.6, reason: 'trade' } : o.legality === 'outlawed' ? { score: -1.6, reason: 'ideology' } : { score: -0.2, reason: 'competition' });
      if (o.org_type === 'rebel_movement') factors.push({ score: -1.5, reason: 'ideology' });
      if (o.org_type === 'political_party' && ['dictatorship', 'military_junta', 'absolute_monarchy'].includes(c.government_type)) factors.push({ score: -1, reason: 'ideology' });
      if (o.religion_id && c.religions_or_ideologies[0]?.religion_id === o.religion_id) factors.push({ score: 0.8, reason: 'religion' });
      if (o.true_goal.target_country_id === cid && ['overthrow', 'secession'].includes(o.true_goal.type)) factors.push({ score: -1.5, reason: 'ideology' });
      const score = factors.reduce((s, f) => s + f.score, 0) + r.normal(0, 0.5);
      if (Math.abs(score) < 0.5 && !r.chance(0.4)) continue;
      relate(o, c, attitudeFor(score, o.org_type === 'rebel_movement'), reasonFor(r, factors, score, ['trade', 'history']));
    }
  }
}

/** Goals that need a rival organization point at one the organization actually opposes. */
function targetOrgGoals(bundle: PlanetBundle, rng: Rng): void {
  for (const o of Object.values(bundle.organizations)) {
    for (const goal of [o.stated_goal, o.true_goal]) {
      if (!['monopoly', 'revenge', 'expand_influence'].includes(goal.type) || goal.target_org_id) continue;
      const foes = o.relations.filter((rel) => rel.target_ref.startsWith('org_') && ['rival', 'hostile', 'at_war'].includes(rel.attitude));
      if (foes.length > 0 && (goal.type !== 'expand_influence' || !goal.target_settlement_id)) {
        goal.target_org_id = rng.fork(`${o.id}:${goal.type}`).pick(foes).target_ref;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// NPCs

/**
 * A relationship entry on A {npc_id: B, type: T} means "B is A's T".
 * The mirror entry on B uses the inverse type (parent <-> child, mentor <-> student,
 * employer <-> employee) and the same note.
 */
function link(rng: Rng, a: Npc, b: Npc, typeOfBForA: RelationshipType): boolean {
  const cap = CONFIG.relationships.maxPerNpc;
  if (a.id === b.id || a.relationships.some((x) => x.npc_id === b.id)) return false;
  if (a.relationships.length >= cap || b.relationships.length >= cap) return false;
  const note = rng.weighted(biased(RELATIONSHIP_NOTES, RELATIONSHIP_NOTE_TABLE[typeOfBForA]));
  a.relationships.push({ npc_id: b.id, type: typeOfBForA, note_key: note });
  b.relationships.push({ npc_id: a.id, type: RELATIONSHIP_INVERSE[typeOfBForA], note_key: note });
  return true;
}

function npcRelationships(bundle: PlanetBundle, rng: Rng): void {
  const npcs = Object.values(bundle.npcs);
  const bySettlement = new Map<string, Npc[]>();
  for (const n of npcs) {
    const list = bySettlement.get(n.settlement_id) ?? [];
    list.push(n);
    bySettlement.set(n.settlement_id, list);
  }
  const lifespan = (n: Npc) => bundle.species[n.species_id].lifespan_years;
  // Heads of noble houses carry the house name; everyone else can take a relative's family name.
  const leadsHouse = (n: Npc) => n.leads.some((l) => l.entity_type === 'organization' && bundle.organizations[l.entity_id].org_type === 'noble_house');
  const canRename = (n: Npc) => !leadsHouse(n) && bundle.languages[n.language_id].style !== 'mechanical' && n.family_name !== '';
  const rename = (n: Npc, family: string) => {
    n.family_name = family;
    n.name = fullName(bundle.languages[n.language_id], n.given_name, n.family_name);
  };
  /** Make two relatives share a family name: the junior one adopts the senior's, or the other way round if the junior is locked. */
  const adoptFamily = (junior: Npc, senior: Npc) => {
    if (junior.language_id !== senior.language_id || !junior.family_name || !senior.family_name) return;
    if (canRename(junior)) rename(junior, senior.family_name);
    else if (canRename(senior)) rename(senior, junior.family_name);
  };

  // Family: same species, same settlement. Ages decide the kind of tie.
  for (const [sid, locals] of bySettlement) {
    const r = rng.fork(`family:${sid}`);
    for (const a of locals) {
      if (!r.chance(CONFIG.relationships.familyChance)) continue;
      const kin = locals.filter((b) => b.id !== a.id && b.species_id === a.species_id && !a.relationships.some((x) => x.npc_id === b.id));
      if (kin.length === 0) continue;
      const b = r.pick(kin);
      const L = lifespan(a);
      const [older, younger] = a.age >= b.age ? [a, b] : [b, a];
      const diff = older.age - younger.age;
      if (diff >= L * 0.2) {
        if (link(r, younger, older, 'parent')) adoptFamily(younger, older);
      } else if (diff <= L * 0.2) {
        const adults = younger.age >= L * 0.17;
        if (adults && r.chance(0.4)) {
          if (link(r, a, b, 'spouse') && r.chance(0.5)) adoptFamily(younger, older);
        } else if (link(r, younger, older, 'sibling')) {
          adoptFamily(younger, older);
        }
      }
    }
  }

  // Organization members and their leaders.
  for (const o of Object.values(bundle.organizations)) {
    if (!o.leader_npc_id) continue;
    const r = rng.fork(`org:${o.id}`);
    const leader = bundle.npcs[o.leader_npc_id];
    for (const mid of o.member_npc_ids) {
      if (mid === leader.id || !r.chance(0.35)) continue;
      const member = bundle.npcs[mid];
      const mentor = leader.age - member.age >= lifespan(leader) * 0.15 && r.chance(0.3);
      link(r, member, leader, mentor ? 'mentor' : 'employer');
    }
  }

  // Notables and local leaders: rivals of the mayor, friends of the guildmaster, and so on.
  const leaders = npcs.filter((n) => n.npc_category === 'leader');
  for (const n of npcs.filter((x) => x.npc_category === 'notable')) {
    const r = rng.fork(`leader-link:${n.id}`);
    if (!r.chance(CONFIG.relationships.leaderLinkChance)) continue;
    const country = bundle.countries[bundle.settlements[n.settlement_id].country_id];
    const local = leaders.filter((l) => l.settlement_id === n.settlement_id || l.id === country.ruler_npc_id);
    if (local.length === 0) continue;
    const l = r.pick(local);
    const sharesOrg = l.leads.some((x) => n.organization_ids.includes(x.entity_id));
    const type = r.weighted(biased(['rival', 'friend', 'enemy', 'lover', 'employer'] as RelationshipType[], {
      rival: 3, friend: 2, enemy: 1.5, lover: 0.4, employer: sharesOrg ? 4 : 0.5,
    }));
    link(r, n, l, type);
  }

  // Mentors: same occupation, clearly older, same settlement.
  for (const [sid, locals] of bySettlement) {
    const r = rng.fork(`mentor:${sid}`);
    for (const a of locals) {
      const teachers = locals.filter((b) => b.occupation === a.occupation && b.age - a.age >= lifespan(b) * 0.15 && b.species_id === a.species_id);
      if (teachers.length > 0 && r.chance(0.3)) link(r, a, r.pick(teachers), 'mentor');
    }
  }

  // Everyday ties: friends, rivals, lovers, enemies. Members of opposed organizations clash.
  for (const [sid, locals] of bySettlement) {
    const r = rng.fork(`random:${sid}`);
    for (const a of locals) {
      const n = r.int(...CONFIG.relationships.randomLinks);
      for (let k = 0; k < n; k++) {
        const others = locals.filter((b) => b.id !== a.id);
        if (others.length === 0) break;
        const b = r.pick(others);
        const opposed = a.organization_ids.some((oa) => bundle.organizations[oa].relations
          .some((rel) => b.organization_ids.includes(rel.target_ref) && ['rival', 'hostile', 'at_war'].includes(rel.attitude)));
        const type = r.weighted(biased(['friend', 'rival', 'lover', 'enemy'] as RelationshipType[], opposed
          ? { friend: 0.5, rival: 4, lover: 0.3, enemy: 4 }
          : { friend: 4, rival: 2.5, lover: 1, enemy: 1 }));
        link(r, a, b, type);
      }
    }
  }
}
