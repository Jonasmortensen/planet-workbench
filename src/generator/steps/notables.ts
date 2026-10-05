import { CONFIG } from '../config';
import { OCCUPATION_TABLE, ORG_TYPE_TABLE, SETTLEMENT_TYPE_TABLE, eligible } from '../content';
import type { Rng } from '../rng';
import type { Npc, PlanetBundle, PointOfInterest } from '../types/entities';
import { OCCUPATIONS, type Occupation } from '../types/enums';
import { bundleContext } from './context';
import { createNpc } from './npcFactory';

const PRESENCE_WEIGHT = { minor: 1, established: 2, dominant: 3 };

/**
 * Pipeline step 8: notable NPCs. Per settlement, 1 to 2 in a village up to
 * 4 to 8 in a capital. Some join organizations present, some own or work at
 * points of interest, some are caught up in current events.
 */
export function generateNotablesStep(bundle: PlanetBundle, rng: Rng): void {
  for (const s of Object.values(bundle.settlements)) {
    const r = rng.fork(s.id);
    const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
    const count = r.int(...CONFIG.notables.perSettlement[size]);
    const ctx = bundleContext(bundle, { techLevel: bundle.countries[s.country_id].tech_level, biomes: [s.biome] });
    const occupationsFor = (pred: (o: Occupation) => boolean) => eligible(OCCUPATIONS, OCCUPATION_TABLE, ctx).filter((x) => pred(x.value));

    for (let i = 0; i < count; i++) {
      const nr = r.fork(`notable:${i}`);

      // Organization first: members take an occupation that fits the organization.
      const orgs = s.organizations_present.map((id) => bundle.organizations[id]);
      const joined = orgs.length > 0 && nr.chance(CONFIG.notables.joinOrgChance)
        ? nr.weightedBy(orgs, (o) => PRESENCE_WEIGHT[o.presence.find((p) => p.settlement_id === s.id)!.strength])
        : null;

      // Otherwise maybe the owner of an unowned point of interest.
      let owned: PointOfInterest | null = null;
      let occupation: Occupation | undefined;
      if (joined) {
        const occ = Object.entries(ORG_TYPE_TABLE[joined.org_type].occupations).map(([k, w]) => ({ value: k as Occupation, weight: w ?? 0 }));
        occupation = nr.weighted(occ);
      } else if (nr.chance(CONFIG.notables.ownPoiChance)) {
        const free = s.points_of_interest.filter((p) => !p.owner_npc_id);
        const candidates = free.filter((p) => occupationsFor((o) => OCCUPATION_TABLE[o].pois.includes(p.type)).length > 0);
        if (candidates.length > 0) {
          owned = nr.pick(candidates);
          occupation = nr.weighted(occupationsFor((o) => OCCUPATION_TABLE[o].pois.includes(owned!.type)));
        }
      }

      const npc = createNpc(bundle, nr, { settlementId: s.id, category: 'notable', occupation });
      if (joined) {
        npc.organization_ids.push(joined.id);
        joined.member_npc_ids.push(npc.id);
      }
      if (owned) {
        owned.owner_npc_id = npc.id;
        npc.workplace_poi_id = owned.id;
      } else if (nr.chance(CONFIG.notables.workAtPoiChance)) {
        const fits = s.points_of_interest.filter((p) => OCCUPATION_TABLE[npc.occupation].pois.includes(p.type));
        if (fits.length > 0) npc.workplace_poi_id = nr.pick(fits).id;
      }
      involveInEvent(bundle, nr, npc);
    }
  }
}

function involveInEvent(bundle: PlanetBundle, rng: Rng, npc: Npc): void {
  const s = bundle.settlements[npc.settlement_id];
  if (s.current_events.length === 0 || !rng.chance(CONFIG.notables.currentEventChance)) return;
  // Prefer events that involve one of the NPC's organizations.
  const event = rng.weightedBy(s.current_events, (e) => (e.involved_refs.some((ref) => npc.organization_ids.includes(ref)) ? 4 : 1));
  npc.current_event_involvement = event.id;
  event.involved_refs.push(npc.id);
}
