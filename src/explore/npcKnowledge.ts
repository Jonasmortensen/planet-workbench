import type { Npc, Organization, PlanetBundle } from '../generator';
import { PLANET_ID, kindOf } from '../generator';

/**
 * What an NPC can tell the player about an entity, as fact groups.
 * NPCs know most about their own settlement, a fair amount about their
 * country, and general knowledge of the planet shaped by their occupation.
 * Secrets never appear here: no NPC reveals a secret organization, a hidden
 * leadership role or anyone's secret.
 */

const LEARNED = ['scholar', 'archivist', 'priest', 'prophet', 'judge', 'diplomat', 'explorer', 'alchemist', 'physician'];
const TRADERS = ['merchant', 'banker', 'pilot', 'smuggler', 'courier', 'sailor', 'innkeeper'];
const MARTIAL = ['soldier', 'guard', 'mercenary', 'bounty_hunter'];
const OUTDOORS = ['hunter', 'herder', 'farmer', 'fisher', 'explorer', 'beast_tamer', 'scavenger', 'miner'];
const CLOSE = ['parent', 'child', 'sibling', 'spouse', 'friend', 'lover', 'mentor', 'student'];

/** Organizations anyone may talk about. */
export function isPublicOrg(o: Organization): boolean {
  return o.visibility !== 'secret' && o.legality !== 'outlawed';
}

function isLeaderish(n: Npc): boolean {
  return n.leads.some((l) => l.public) || ['elite', 'noble', 'sovereign'].includes(n.social_rank);
}

const isLearned = (n: Npc) => LEARNED.includes(n.occupation) || ['elder', 'ancient'].includes(n.age_category);

/** Hideouts and the seats of secret or outlawed organizations are not visible from the street. */
export function poiInPlainSight(b: PlanetBundle, poiId: string): boolean {
  const p = b.pois[poiId];
  const org = p?.organization_id ? b.organizations[p.organization_id] : null;
  return !!p && p.type !== 'hideout' && (!org || isPublicOrg(org));
}

export function npcKnows(b: PlanetBundle, n: Npc, entityId: string): string[] {
  const home = b.settlements[n.settlement_id];
  const country = b.countries[home.country_id];
  const set = new Set<string>();
  const add = (...groups: string[]) => groups.forEach((g) => set.add(g));

  switch (kindOf(entityId)) {
    case 'planet': {
      add('name', 'politics', 'population', 'faiths_languages', 'species_mix');
      if (isLearned(n)) add('history', 'oddities', 'features');
      if (TRADERS.includes(n.occupation) || isLeaderish(n)) add('economy', 'galactic', 'resources');
      if (OUTDOORS.includes(n.occupation)) add('hazards', 'resources', 'features');
      break;
    }
    case 'country': {
      const c = b.countries[entityId];
      add('name');
      if (c.id === country.id) {
        add('flag', 'tech', 'territory', 'population', 'government', 'ruler', 'economy', 'culture');
        if (isLearned(n) || isLeaderish(n)) add('history');
        if (MARTIAL.includes(n.occupation) || isLeaderish(n)) add('military');
        if (isLeaderish(n) || ['diplomat', 'merchant', 'banker', 'spy'].includes(n.occupation)) add('relations');
      } else if (country.relations.some((r) => r.target_ref === c.id) || country.neighbor_ids.includes(c.id)) {
        add('government', 'ruler', 'flag');
        if (isLeaderish(n) || TRADERS.includes(n.occupation)) add('economy');
      }
      break;
    }
    case 'settlement': {
      const s = b.settlements[entityId];
      if (s.id === home.id) {
        add('name', 'appearance', 'people', 'connections', 'faiths', 'governance', 'economy', 'events', 'organizations', 'history');
      } else if (home.connections.some((c) => c.settlement_id === s.id) || s.country_id === home.country_id) {
        add('name', 'appearance', 'people', 'governance');
        if (TRADERS.includes(n.occupation)) add('economy', 'connections');
      } else if (s.settlement_type === 'capital') {
        add('name');
      }
      break;
    }
    case 'organization': {
      const o = b.organizations[entityId];
      if (!isPublicOrg(o)) break;
      if (n.organization_ids.includes(o.id)) {
        add('name', 'purpose', 'scope', 'leadership', 'status', 'relations', 'members', 'history');
      } else if (o.presence.some((p) => p.settlement_id === home.id)) {
        add('name', 'purpose', 'scope', 'leadership');
      } else if (o.scope_level === 'planet' || (o.scope_level === 'country' && o.home_ref === country.id)) {
        add('name');
        if (isLearned(n) || TRADERS.includes(n.occupation) || isLeaderish(n)) add('purpose', 'scope');
      }
      break;
    }
    case 'npc': {
      const x = b.npcs[entityId];
      if (x.id === n.id) {
        add('name', 'appearance', 'role', 'personality', 'history', 'affiliations', 'relationships');
        break;
      }
      const rel = n.relationships.find((r) => r.npc_id === x.id);
      if (rel) {
        add('name', 'role', 'appearance', 'affiliations');
        if (CLOSE.includes(rel.type)) add('personality');
      }
      if (x.settlement_id === home.id) add('name', 'role');
      // Neighbors and friends know where someone can usually be found, if it is no secret.
      if ((x.settlement_id === home.id || rel) && x.location_public && poiInPlainSight(b, x.location_poi_id)) add('location');
      const publicLeads = x.leads.filter((l) => l.public).map((l) => l.entity_id);
      if (publicLeads.includes(home.id) || publicLeads.includes(country.id) || publicLeads.includes(PLANET_ID)
        || publicLeads.some((id) => home.organizations_present.includes(id))) add('name', 'role');
      if (x.occupation === n.occupation && home.connections.some((c) => c.settlement_id === x.settlement_id)) add('name', 'role');
      break;
    }
    case 'species': {
      const sp = b.species[entityId];
      if (b.planet.species.some((s) => s.species_id === sp.id)) add('name');
      if (sp.id === n.species_id || isLearned(n)) add('name', 'biology');
      break;
    }
    case 'religion': {
      const r = b.religions[entityId];
      const local = home.religions_or_ideologies.some((x) => x.religion_id === r.id);
      if (local) add('name');
      if (n.religion_or_ideology === r.id || ['priest', 'prophet', 'scholar'].includes(n.occupation)) add('name', 'details');
      break;
    }
    case 'language': {
      const l = b.languages[entityId];
      if (home.languages.includes(l.id)) add('name');
      if (n.language_id === l.id) add('name', 'details');
      break;
    }
  }
  return [...set];
}
