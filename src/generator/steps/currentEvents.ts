import { CURRENT_EVENT_COUNTS, CURRENT_EVENT_TABLE, SETTLEMENT_TYPE_TABLE, meets } from '../content';
import type { Rng } from '../rng';
import type { CurrentEvent, PlanetBundle } from '../types/entities';
import { CURRENT_EVENT_TYPES, STABILITY_LEVELS } from '../types/enums';
import { bundleContext } from './context';

/**
 * Pipeline step 5: current events in each settlement. Runs after
 * organizations so events can involve the organizations present.
 * NPCs add themselves to involved_refs when the notables step assigns them.
 */
export function generateCurrentEventsStep(bundle: PlanetBundle, rng: Rng): void {
  let counter = 0;
  const countries = Object.values(bundle.countries);
  for (const s of Object.values(bundle.settlements)) {
    const r = rng.fork(s.id);
    const country = bundle.countries[s.country_id];
    const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
    const ctx = bundleContext(bundle, { techLevel: country.tech_level, biomes: [s.biome] });
    const unrest = (STABILITY_LEVELS.length - 1 - STABILITY_LEVELS.indexOf(country.stability)) / 2.5 - 1; // -1 secure .. +1 collapsing
    const foreign = countries.filter((c) => c.id !== country.id);
    const pool = CURRENT_EVENT_TYPES.map((t) => {
      const def = CURRENT_EVENT_TABLE[t];
      if (!meets(def.constraints, ctx)) return { value: t, weight: 0 };
      if (def.minSize && size < def.minSize) return { value: t, weight: 0 };
      if (def.foreignCountry && foreign.length === 0) return { value: t, weight: 0 };
      let w = def.weight * (def.moods?.[s.mood] ?? 1);
      if (def.instability) w *= Math.max(0.15, 1 + def.instability * unrest * 0.6);
      return { value: t, weight: w };
    });
    const count = r.int(...CURRENT_EVENT_COUNTS[size]);
    const types = r.weightedSample(pool, count);
    s.current_events = types.map((type): CurrentEvent => {
      const def = CURRENT_EVENT_TABLE[type];
      const er = r.fork(type);
      const refs: string[] = [];
      const orgs = s.organizations_present.map((id) => bundle.organizations[id]);
      const orgPool = orgs.map((o) => ({ value: o.id, weight: def.orgTypes?.includes(o.org_type) ? 3 : 0.5 }));
      refs.push(...er.weightedSample(orgPool, er.int(def.orgCount[0], def.orgCount[1])));
      if (def.foreignCountry) {
        const near = foreign.filter((c) => country.neighbor_ids.includes(c.id));
        refs.push(er.pick(near.length ? near : foreign).id);
      }
      if (type === 'succession_dispute' || type === 'election' || type === 'siege') refs.push(country.id);
      return { id: `cevent_${counter++}`, type, involved_refs: refs };
    });
  }
}
