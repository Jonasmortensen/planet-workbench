import { CONFIG } from '../config';
import { INDUSTRY_WORK, OCCUPATION_TABLE, ORG_TYPE_TABLE, SETTLEMENT_TYPE_TABLE, SETTLEMENT_TYPE_WORK, eligible } from '../content';
import type { Rng } from '../rng';
import type { Npc, PlanetBundle } from '../types/entities';
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
    // The settlement's signature trades: a mining colony's miners, a port's sailors.
    const ctx = bundleContext(bundle, { techLevel: bundle.countries[s.country_id].tech_level, biomes: [s.biome] });
    const flavor = [SETTLEMENT_TYPE_WORK[s.settlement_type], ...s.primary_industries.map((x) => INDUSTRY_WORK[x])];
    const signature = eligible(OCCUPATIONS, OCCUPATION_TABLE, ctx, (k) => flavor.reduce((a, f) => a + (f.occupations[k] ?? 0), 0));

    for (let i = 0; i < count; i++) {
      const nr = r.fork(`notable:${i}`);

      // The first notable always plies one of the settlement's signature trades.
      const local = i === 0 && signature.length > 0;
      // Otherwise organization first: members take an occupation that fits the organization.
      const orgs = s.organizations_present.map((id) => bundle.organizations[id]);
      const joined = !local && orgs.length > 0 && nr.chance(CONFIG.notables.joinOrgChance)
        ? nr.weightedBy(orgs, (o) => PRESENCE_WEIGHT[o.presence.find((p) => p.settlement_id === s.id)!.strength])
        : null;

      // Where they work and live is decided later, by the places step.
      let occupation: Occupation | undefined;
      if (local) occupation = nr.weighted(signature);
      else if (joined) {
        const occ = Object.entries(ORG_TYPE_TABLE[joined.org_type].occupations).map(([k, w]) => ({ value: k as Occupation, weight: w ?? 0 }));
        occupation = nr.weighted(occ);
      }

      const npc = createNpc(bundle, nr, { settlementId: s.id, category: 'notable', occupation });
      if (joined) {
        npc.organization_ids.push(joined.id);
        joined.member_npc_ids.push(npc.id);
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
