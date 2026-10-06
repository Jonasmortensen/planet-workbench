import type { Npc, Organization, PlanetBundle, Rumor } from '../types/entities';
import { CORRUPTION_LEVELS, MILITARY_STRENGTHS, type RumorClaim, type SecretType } from '../types/enums';
import { kindOf, type EntityKind } from '../types/ids';

/**
 * Rumor truth rules. A rumor is true exactly when the structured data backs
 * it up; this module is the single source of that judgement, used by the
 * motives step (to label rumors) and the validator (to check the labels).
 */

/** Claims that make sense for each kind of subject. */
export const CLAIMS_BY_KIND: Partial<Record<EntityKind, RumorClaim[]>> = {
  planet: ['alien_infiltration', 'buried_ruins', 'forbidden_tech', 'prophecy', 'monster', 'conspiracy', 'secret_weapon', 'curse'],
  country: ['corruption', 'conspiracy', 'secret_weapon', 'assassination_plot', 'lost_heir', 'double_agent', 'smuggling', 'forbidden_tech', 'hidden_wealth'],
  settlement: ['monster', 'haunting', 'curse', 'buried_ruins', 'treasure', 'smuggling', 'cult_activity', 'corruption', 'illness', 'conspiracy'],
  organization: ['conspiracy', 'corruption', 'smuggling', 'cult_activity', 'betrayal', 'forbidden_tech', 'hidden_wealth', 'assassination_plot', 'secret_weapon', 'double_agent'],
  npc: ['affair', 'hidden_identity', 'corruption', 'betrayal', 'impostor', 'lost_heir', 'illness', 'hidden_wealth', 'double_agent', 'cult_activity', 'curse', 'treasure', 'smuggling', 'assassination_plot', 'prophecy', 'conspiracy'],
};

/** Which NPC secrets make which claims true. */
const SECRET_CLAIMS: Partial<Record<SecretType, RumorClaim>> = {
  affair: 'affair', hidden_identity: 'hidden_identity', false_credentials: 'impostor', double_agent: 'double_agent',
  stolen_wealth: 'hidden_wealth', smuggling: 'smuggling', secret_leadership: 'conspiracy', true_loyalty: 'betrayal',
  hidden_illness: 'illness', prophecy_knowledge: 'prophecy', relic_possession: 'treasure', forbidden_faith: 'cult_activity',
  illegitimate_child: 'lost_heir', forbidden_power: 'curse',
};

export interface Truth {
  target: string | null;
}

const hasHazard = (b: PlanetBundle, h: string) => b.planet.hazards.some((x) => x.type === h);
const hasAnomaly = (b: PlanetBundle, types: string[]) => b.planet.anomalies.some((a) => types.includes(a.type));
const hiddenAgenda = (o: Organization) => JSON.stringify(o.stated_goal) !== JSON.stringify(o.true_goal);
const motiveTarget = (m: { target_npc_id: string | null; target_org_id: string | null; target_settlement_id: string | null; target_country_id: string | null }) =>
  m.target_npc_id ?? m.target_org_id ?? m.target_settlement_id ?? m.target_country_id;

function npcTruth(b: PlanetBundle, n: Npc, claim: RumorClaim): Truth | null {
  if (n.secret && SECRET_CLAIMS[n.secret.type] === claim) return { target: motiveTarget(n.secret) };
  switch (claim) {
    case 'corruption': {
      const s = b.settlements[n.settlement_id];
      const leadsHere = n.leads.some((l) => l.entity_id === s.id);
      return leadsHere && CORRUPTION_LEVELS.indexOf(s.corruption_level) >= CORRUPTION_LEVELS.indexOf('high') ? { target: s.id } : null;
    }
    case 'cult_activity': {
      const cult = n.organization_ids.find((o) => b.organizations[o].org_type === 'cult');
      return cult ? { target: cult } : null;
    }
    case 'assassination_plot':
      return n.goal?.type === 'revenge' && n.goal.target_npc_id && n.traits.includes('ruthless') ? { target: n.goal.target_npc_id } : null;
    case 'conspiracy': {
      const secretOrg = n.organization_ids.find((o) => b.organizations[o].visibility === 'secret');
      return secretOrg ? { target: secretOrg } : null;
    }
    default:
      return null;
  }
}

function orgTruth(b: PlanetBundle, o: Organization, claim: RumorClaim): Truth | null {
  const hostile = o.relations.filter((r) => r.attitude === 'hostile' || r.attitude === 'at_war');
  switch (claim) {
    case 'conspiracy':
      return hiddenAgenda(o) ? { target: motiveTarget(o.true_goal) } : null;
    case 'smuggling':
      return o.activities.includes('smuggling') ? { target: null } : null;
    case 'cult_activity':
      return o.org_type === 'cult' ? { target: o.religion_id } : null;
    case 'corruption':
      return o.legality === 'official' && o.activities.some((a) => a === 'extortion' || a === 'lobbying') && ['wealthy', 'opulent'].includes(o.wealth_level) ? { target: null } : null;
    case 'betrayal': {
      const betrayed = o.relations.find((r) => r.reason === 'betrayal');
      return betrayed ? { target: betrayed.target_ref } : null;
    }
    case 'forbidden_tech':
      return o.resources.includes('laboratories') && o.legality !== 'official' ? { target: null } : null;
    case 'hidden_wealth':
      return o.visibility !== 'public' && ['wealthy', 'opulent'].includes(o.wealth_level) ? { target: null } : null;
    case 'assassination_plot': {
      if (!o.activities.includes('assassination')) return null;
      const foe = hostile.find((r) => b.organizations[r.target_ref]?.leader_npc_id);
      return { target: foe ? b.organizations[foe.target_ref].leader_npc_id : null };
    }
    case 'secret_weapon':
      return o.resources.includes('weapons') && ['overthrow', 'secession'].includes(o.true_goal.type) ? { target: motiveTarget(o.true_goal) } : null;
    case 'double_agent': {
      if (!o.activities.includes('espionage')) return null;
      return { target: hostile[0]?.target_ref ?? null };
    }
    default:
      return null;
  }
}

/** Whether a claim about a subject is backed by the data, and what it points at if so. */
export function rumorTruth(b: PlanetBundle, subjectId: string, claim: RumorClaim): Truth | null {
  const kind = kindOf(subjectId);
  if (kind === 'npc') return npcTruth(b, b.npcs[subjectId], claim);
  if (kind === 'organization') return orgTruth(b, b.organizations[subjectId], claim);
  const p = b.planet;
  if (kind === 'planet') {
    switch (claim) {
      case 'alien_infiltration': {
        const hidden = Object.values(b.npcs).find((n) => n.secret?.type === 'offworld_heritage');
        return hidden || p.special_abilities.some((a) => a.type === 'shapeshifting') ? { target: hidden?.id ?? null } : null;
      }
      case 'buried_ruins': return p.precursor_presence !== 'none' ? { target: null } : null;
      case 'forbidden_tech': return p.precursor_presence === 'active_tech' ? { target: null } : null;
      case 'prophecy': {
        const seer = Object.values(b.npcs).find((n) => n.secret?.type === 'prophecy_knowledge');
        return seer ? { target: seer.id } : null;
      }
      case 'monster': return hasHazard(b, 'apex_predators') || hasHazard(b, 'migratory_swarms') ? { target: null } : null;
      case 'conspiracy': {
        const o = Object.values(b.organizations).find((x) => x.scope_level === 'planet' && x.visibility === 'secret' && hiddenAgenda(x));
        return o ? { target: o.id } : null;
      }
      case 'secret_weapon': {
        const m = p.megastructures.find((x) => ['mass_driver', 'world_engine', 'orbital_mirror'].includes(x.type) && x.condition === 'dormant');
        return m ? { target: null } : null;
      }
      case 'curse': return hasAnomaly(b, ['psychic_resonance', 'memory_fog', 'temporal_echoes']) ? { target: null } : null;
      default: return null;
    }
  }
  if (kind === 'country') {
    const c = b.countries[subjectId];
    const settlements = Object.values(b.settlements).filter((s) => s.country_id === c.id);
    const ruler = c.ruler_npc_id ? b.npcs[c.ruler_npc_id] : null;
    switch (claim) {
      case 'corruption': {
        const rotten = settlements.find((s) => s.corruption_level === 'rampant');
        return rotten ? { target: rotten.id } : null;
      }
      case 'conspiracy': {
        const o = Object.values(b.organizations).find((x) => ['overthrow', 'secession'].includes(x.true_goal.type) && x.true_goal.target_country_id === c.id && x.visibility !== 'public');
        return o ? { target: o.id } : null;
      }
      case 'secret_weapon':
        return MILITARY_STRENGTHS.indexOf(c.military_strength) >= MILITARY_STRENGTHS.indexOf('formidable') && c.tech_level >= 6
          && c.relations.some((r) => r.attitude === 'hostile' || r.attitude === 'at_war') ? { target: null } : null;
      case 'assassination_plot': {
        if (!ruler) return null;
        const plotter = Object.values(b.npcs).find((n) => n.goal?.type === 'revenge' && n.goal.target_npc_id === ruler.id);
        return plotter ? { target: ruler.id } : null;
      }
      case 'lost_heir':
        return ruler?.secret?.type === 'illegitimate_child' ? { target: ruler.id } : null;
      case 'double_agent': {
        const spy = Object.values(b.npcs).find((n) => n.secret?.type === 'double_agent' && b.settlements[n.settlement_id].country_id === c.id);
        return spy ? { target: spy.id } : null;
      }
      case 'smuggling': {
        const o = Object.values(b.organizations).find((x) => x.activities.includes('smuggling') && x.presence.some((pr) => b.settlements[pr.settlement_id].country_id === c.id));
        return o ? { target: o.id } : null;
      }
      case 'forbidden_tech': return p.precursor_presence === 'active_tech' && c.tech_level >= 5 ? { target: null } : null;
      case 'hidden_wealth': return ruler?.secret?.type === 'stolen_wealth' ? { target: ruler.id } : null;
      default: return null;
    }
  }
  if (kind === 'settlement') {
    const s = b.settlements[subjectId];
    const orgsHere = s.organizations_present.map((id) => b.organizations[id]);
    switch (claim) {
      case 'monster': return s.current_events.some((e) => e.type === 'monster_sighting') ? { target: null } : null;
      case 'haunting': return hasHazard(b, 'psychic_echoes') || hasAnomaly(b, ['temporal_echoes', 'phantom_signals']) ? { target: null } : null;
      case 'curse': return hasAnomaly(b, ['memory_fog', 'psychic_resonance', 'null_zones']) && s.current_events.some((e) => e.type === 'disappearances') ? { target: null } : null;
      case 'buried_ruins':
        return p.precursor_presence !== 'none' && (s.settlement_type === 'ruin_town' || s.districts.some((d) => d.type === 'ruins'))
          ? { target: null } : null;
      case 'treasure': return s.primary_industries.includes('relic_hunting') ? { target: null } : null;
      case 'smuggling': {
        const o = orgsHere.find((x) => x.activities.includes('smuggling'));
        return o ? { target: o.id } : null;
      }
      case 'cult_activity': {
        const o = orgsHere.find((x) => x.org_type === 'cult');
        return o ? { target: o.id } : s.current_events.some((e) => e.type === 'cult_activity') ? { target: null } : null;
      }
      case 'corruption':
        return CORRUPTION_LEVELS.indexOf(s.corruption_level) >= CORRUPTION_LEVELS.indexOf('high') ? { target: s.leader_npc_id } : null;
      case 'illness': return s.current_events.some((e) => e.type === 'plague') ? { target: null } : null;
      case 'conspiracy': {
        const o = orgsHere.find((x) => x.visibility === 'secret');
        return o ? { target: o.id } : null;
      }
      default: return null;
    }
  }
  return null;
}

/** All rumors in the bundle, with the entity that stores them. */
export function allRumors(b: PlanetBundle): { holder: string; rumor: Rumor }[] {
  const out: { holder: string; rumor: Rumor }[] = [];
  const push = (holder: string, list: Rumor[]) => list.forEach((rumor) => out.push({ holder, rumor }));
  push(b.planet.id, b.planet.rumors);
  for (const c of Object.values(b.countries)) push(c.id, c.rumors);
  for (const s of Object.values(b.settlements)) push(s.id, s.rumors);
  for (const o of Object.values(b.organizations)) push(o.id, o.rumors);
  for (const n of Object.values(b.npcs)) push(n.id, n.rumors_about);
  return out;
}
