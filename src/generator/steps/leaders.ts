import { CONFIG } from '../config';
import { ORG_TYPE_TABLE, SETTLEMENT_TYPE_TABLE } from '../content';
import type { Rng } from '../rng';
import { canReuseLeader, leadEntry, type SlotRef } from '../rules/leadership';
import type { Npc, Organization, PlanetBundle, Settlement } from '../types/entities';
import {
  SOCIAL_RANKS,
  type GoverningBody, type GovernmentType, type Occupation, type OrgType, type PoiType, type SocialRank,
} from '../types/enums';
import { PLANET_ID } from '../types/ids';
import { createNpc, type NpcOptions } from './npcFactory';
import { makeMotive } from './organizations';

const RULER_OCCUPATION: Partial<Record<GovernmentType, Occupation>> = {
  absolute_monarchy: 'noble', constitutional_monarchy: 'noble', elective_monarchy: 'noble', feudal_realm: 'noble',
  theocracy: 'priest', oracle_rule: 'prophet', psionic_conclave: 'scholar', military_junta: 'soldier', dictatorship: 'soldier',
  corporate_state: 'banker', plutocracy: 'banker', merchant_republic: 'merchant', technocracy: 'engineer', meritocracy: 'scholar',
  tribal_confederacy: 'hunter', clan_council: 'herder', gerontocracy: 'judge', raider_kingdom: 'mercenary',
  colonial_administration: 'administrator', ai_administration: 'administrator', oligarchy: 'noble',
};

const BODY_OCCUPATION: Record<GoverningBody, Occupation> = {
  mayor: 'administrator', council: 'administrator', noble_lord: 'noble', military_governor: 'soldier',
  guild_council: 'merchant', elders: 'judge', corporate_board: 'banker', high_priest: 'priest', assembly: 'diplomat',
  warlord: 'mercenary', appointed_administrator: 'administrator', ai_steward: 'engineer', crime_boss: 'crime_lord',
  collective: 'administrator',
};

/** Workplaces leaders usually run, by slot kind or organization type. */
const ORG_POIS: Partial<Record<OrgType, PoiType[]>> = {
  guild: ['guild_hall', 'workshop'], church: ['temple', 'shrine'], corporation: ['shipyard', 'workshop', 'laboratory'],
  criminal_syndicate: ['gambling_den', 'black_market', 'tavern'], secret_society: ['library', 'archive', 'crypt'],
  military_order: ['barracks'], academy: ['library', 'laboratory', 'observatory'], noble_house: ['palace'],
  cult: ['shrine', 'crypt'], mercenary_company: ['barracks', 'tavern'], trade_consortium: ['market', 'docks'],
  monastic_order: ['temple', 'shrine'], explorers_society: ['observatory', 'museum'], mutual_aid_society: ['hospital', 'inn'],
  hacker_collective: ['salvage_yard', 'workshop'], political_party: ['archive', 'theater'],
};

interface Slot extends SlotRef {
  title: string;
  seat: string;
  rank: SocialRank;
  occupation: Occupation;
  familyName?: string;
  pois: PoiType[];
  /** An NPC that must take this slot (theocrat leads the state church, and so on). */
  automatic?: () => Npc | null;
}

function maxRank(a: SocialRank, b: SocialRank): SocialRank {
  return SOCIAL_RANKS.indexOf(a) >= SOCIAL_RANKS.indexOf(b) ? a : b;
}

function settlementRank(s: Settlement): SocialRank {
  const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
  return size >= 4 ? 'elite' : size === 3 ? 'notable' : 'skilled';
}

/**
 * Pipeline steps 6 and 7: leaders, top-down, with leadership overlap.
 * Every slot gets exactly one NPC. Before creating a new NPC, a 10 to 15%
 * roll may reuse an existing leader who fits (see rules/leadership.ts).
 */
export function generateLeadersStep(bundle: PlanetBundle, rng: Rng): void {
  const slots = buildSlots(bundle, rng.fork('slots'));
  const leaders: Npc[] = [];
  for (const slot of slots) {
    const r = rng.fork(`${slot.kind}:${slot.entityId}`);
    let npc = slot.automatic?.() ?? null;
    if (npc && npc.leads.length >= CONFIG.leaders.maxLeads) npc = null;
    if (!npc && r.chance(CONFIG.leaders.overlapChance)) {
      const candidates = leaders.filter((l) => canReuseLeader(bundle, l, slot, slot.seat));
      if (candidates.length > 0) npc = r.pick(candidates);
    }
    if (!npc) {
      const opts: NpcOptions = {
        settlementId: slot.seat, category: 'leader', occupation: slot.occupation, rank: slot.rank, role: 'ruler',
        title: slot.title, familyName: slot.familyName,
      };
      npc = createNpc(bundle, r, opts);
      leaders.push(npc);
      claimWorkplace(bundle, r, npc, slot);
    }
    assign(bundle, r, npc, slot);
  }
}

function assign(bundle: PlanetBundle, rng: Rng, npc: Npc, slot: Slot): void {
  const entry = leadEntry(bundle, slot);
  npc.leads.push(entry);
  npc.npc_category = 'leader';
  npc.role_type = 'ruler';
  npc.social_rank = maxRank(npc.social_rank, slot.rank);
  if (!npc.title_or_epithet || npc.title_or_epithet.startsWith('the ')) npc.title_or_epithet = slot.title;
  if (!entry.public) npc.secret = makeMotive(rng.fork('secret'), 'secret_leadership', { target_org_id: slot.entityId });
  switch (slot.kind) {
    case 'world_government': bundle.planet.world_government!.leader_npc_id = npc.id; break;
    case 'country': bundle.countries[slot.entityId].ruler_npc_id = npc.id; break;
    case 'settlement': bundle.settlements[slot.entityId].leader_npc_id = npc.id; break;
    case 'organization': {
      const o = bundle.organizations[slot.entityId];
      o.leader_npc_id = npc.id;
      if (!o.member_npc_ids.includes(npc.id)) o.member_npc_ids.push(npc.id);
      if (!npc.organization_ids.includes(o.id)) npc.organization_ids.push(o.id);
      break;
    }
  }
}

function claimWorkplace(bundle: PlanetBundle, rng: Rng, npc: Npc, slot: Slot): void {
  const s = bundle.settlements[npc.settlement_id];
  const free = s.points_of_interest.filter((p) => !p.owner_npc_id && slot.pois.includes(p.type));
  if (free.length === 0 || !rng.chance(0.75)) return;
  const poi = rng.pick(free);
  poi.owner_npc_id = npc.id;
  npc.workplace_poi_id = poi.id;
}

function buildSlots(bundle: PlanetBundle, rng: Rng): Slot[] {
  const p = bundle.planet;
  const slots: Slot[] = [];
  const countries = Object.values(bundle.countries);
  const rulerOf = (countryId: string) => () => {
    const id = bundle.countries[countryId].ruler_npc_id;
    return id ? bundle.npcs[id] : null;
  };
  const royalHouse = (countryId: string): Organization | undefined => Object.values(bundle.organizations)
    .find((o) => o.state_role === 'royal_house' && o.home_ref === countryId);

  // 1. World government: seated in the largest capital.
  if (p.world_government) {
    const seat = countries
      .map((c) => bundle.settlements[c.capital_settlement_id!])
      .sort((a, b) => b.population - a.population || a.id.localeCompare(b.id))[0];
    const seatCountry = bundle.countries[seat.country_id];
    slots.push({
      kind: 'world_government', entityId: PLANET_ID, title: p.world_government.leader_title, seat: seat.id,
      rank: 'sovereign', pois: ['palace', 'embassy'],
      occupation: p.political_structure === 'federation' ? 'diplomat' : RULER_OCCUPATION[seatCountry.government_type] ?? 'administrator',
      familyName: p.political_structure === 'unified' ? houseFamily(royalHouse(seatCountry.id)) : undefined,
    });
  }

  // 2. Country rulers live in their capitals. A unified world's single country shares its ruler.
  for (const c of countries) {
    slots.push({
      kind: 'country', entityId: c.id, title: c.ruler_title, seat: c.capital_settlement_id!, rank: 'sovereign',
      occupation: RULER_OCCUPATION[c.government_type] ?? 'administrator', pois: ['palace'],
      familyName: houseFamily(royalHouse(c.id)),
      automatic: p.political_structure === 'unified' && p.world_government
        ? () => (p.world_government!.leader_npc_id ? bundle.npcs[p.world_government!.leader_npc_id] : null)
        : undefined,
    });
  }

  // 3. Settlement leaders.
  for (const s of Object.values(bundle.settlements)) {
    slots.push({
      kind: 'settlement', entityId: s.id, title: s.leader_title, seat: s.id, rank: settlementRank(s),
      occupation: BODY_OCCUPATION[s.governing_body], pois: ['palace', 'archive', 'guild_hall', 'temple', 'barracks'],
    });
  }

  // 4. Organization leaders, top-down by scope. Usually based at headquarters.
  // State organizations come first (right after rulers, see the reorder below) so the
  // ruler still has room for the automatic role.
  const scopeOrder = { planet: 0, country: 1, settlement: 2 };
  const orgs = Object.values(bundle.organizations).sort((a, b) => scopeOrder[a.scope_level] - scopeOrder[b.scope_level] || Number(a.id.split('_')[1]) - Number(b.id.split('_')[1]));
  for (const o of orgs) {
    const r = rng.fork(o.id);
    const def = ORG_TYPE_TABLE[o.org_type];
    const seat = o.presence.length > 1 && !r.chance(CONFIG.leaders.livesAtHeadquarters)
      ? r.pick(o.presence.filter((x) => x.settlement_id !== o.headquarters_settlement_id)).settlement_id
      : o.headquarters_settlement_id;
    const rank: SocialRank = o.org_type === 'noble_house' ? 'noble' : o.scope_level === 'settlement' ? 'notable' : 'elite';
    const automatic = o.state_role !== 'none' && o.home_ref in bundle.countries ? rulerOf(o.home_ref) : undefined;
    slots.push({
      kind: 'organization', entityId: o.id, title: o.leader_title, seat, rank,
      occupation: r.weighted(Object.entries(def.occupations).map(([k, w]) => ({ value: k as Occupation, weight: w ?? 0 }))),
      familyName: o.org_type === 'noble_house' ? houseFamily(o) : undefined,
      pois: ORG_POIS[o.org_type] ?? [],
      automatic,
    });
  }
  // Order: world government, rulers, state organizations, settlements, other organizations.
  const isState = (x: Slot) => x.kind === 'organization' && bundle.organizations[x.entityId].state_role !== 'none';
  const rank = (x: Slot) => (x.kind === 'world_government' ? 0 : x.kind === 'country' ? 1 : isState(x) ? 2 : x.kind === 'settlement' ? 3 : 4);
  return slots.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map(({ x }) => x);
}

function houseFamily(o: Organization | undefined): string | undefined {
  return o && o.name.startsWith('House ') ? o.name.slice('House '.length) : undefined;
}

