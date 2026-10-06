import { describe, expect, it } from 'vitest';
import {
  POI_SIGNIFICANCES, generatePlanet, isSurprising, npcsAt, treasuresAt, validate, type PlanetBundle,
} from '../src/generator';
import { TREASURES_BY_SIGNIFICANCE, needsSubject } from '../src/generator/rules/places';

const SEEDS = Array.from({ length: 40 }, (_, i) => String(i));
const bundles = SEEDS.map((s) => generatePlanet(s));

describe('places', () => {
  it('puts every NPC somewhere in their home settlement, and someone in every place', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs)) {
        const poi = b.pois[n.location_poi_id];
        expect(poi, `${b.seed} ${n.id}`).toBeDefined();
        expect(poi.settlement_id).toBe(n.settlement_id);
        if (n.workplace_poi_id) expect(b.pois[n.workplace_poi_id].settlement_id).toBe(n.settlement_id);
      }
      for (const poi of Object.values(b.pois)) {
        expect(npcsAt(b, poi.id).length, `${b.seed} ${poi.id}`).toBeGreaterThan(0);
        expect(b.settlements[poi.settlement_id].poi_ids).toContain(poi.id);
      }
    }
  });

  it('explains every surprising location with an entity', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs).filter((x) => isSurprising(x.location_reason))) {
        expect(n.location_reason_ref, `${b.seed} ${n.id} ${n.location_reason}`).not.toBeNull();
      }
    }
  });

  it('sends 20 to 30% of NPCs somewhere surprising', () => {
    const npcs = bundles.flatMap((b) => Object.values(b.npcs));
    const share = npcs.filter((n) => isSurprising(n.location_reason)).length / npcs.length;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.3);
  });

  it('keeps secret meetings secret', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs).filter((x) => x.location_reason === 'secret_meeting')) {
        expect(n.location_public).toBe(false);
      }
    }
  });
});

describe('treasures', () => {
  it('gives every place its own treasures, as many as its significance calls for', () => {
    for (const b of bundles) {
      for (const poi of Object.values(b.pois)) {
        const [lo, hi] = TREASURES_BY_SIGNIFICANCE[poi.significance];
        const n = treasuresAt(b, poi.id).length;
        expect(n, `${b.seed} ${poi.id} ${poi.significance}`).toBeGreaterThanOrEqual(lo);
        expect(n).toBeLessThanOrEqual(hi);
      }
    }
  });

  it('builds leverage from real secrets and names the subject of every fact-based treasure', () => {
    for (const b of bundles) {
      for (const t of Object.values(b.treasures)) {
        if (needsSubject(t.category)) expect(t.subject_refs.length, `${b.seed} ${t.id}`).toBeGreaterThan(0);
        if (t.category === 'leverage') {
          expect(b.npcs[t.subject_refs[0]]?.secret, `${b.seed} ${t.id}`).toBeTruthy();
          expect(t.visibility).toBe('secret');
        }
      }
    }
  });

  it('lets 10 to 20% of NPCs carry or be a treasure, weighted toward the powerful', () => {
    const npcs = bundles.flatMap((b) => Object.values(b.npcs));
    const carriers = new Set(bundles.flatMap((b) => Object.values(b.treasures).flatMap((t) => ('npc_id' in t.holder ? [`${b.seed}:${t.holder.npc_id}`] : []))));
    const share = carriers.size / npcs.length;
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(0.2);
    const rulers = bundles.flatMap((b) => Object.values(b.npcs).filter((n) => n.leads.some((l) => l.entity_type === 'country')).map((n) => `${b.seed}:${n.id}`));
    expect(rulers.filter((id) => carriers.has(id)).length / rulers.length).toBeGreaterThan(share);
  });

  it('gives treasures unique names within a planet', () => {
    for (const b of bundles) {
      const names = Object.values(b.treasures).map((t) => t.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('spreads significance across all levels', () => {
    const sig = new Set(bundles.flatMap((b) => Object.values(b.pois).map((p) => p.significance)));
    expect([...sig].sort()).toEqual([...POI_SIGNIFICANCES].sort());
  });
});

/** Each case breaks a fresh bundle in one way and expects the validator to name it. */
function codesAfter(mutate: (b: PlanetBundle) => void): string[] {
  const b = generatePlanet('7');
  mutate(b);
  return validate(b).map((i) => `${i.severity}:${i.code}`);
}
const firstPoi = (b: PlanetBundle) => Object.values(b.pois)[0];

describe('validator catches broken places and treasures', () => {
  it('flags an empty place', () => {
    expect(codesAfter((b) => {
      const other = Object.values(b.pois).find((p) => p.settlement_id === firstPoi(b).settlement_id && p.id !== firstPoi(b).id)!;
      for (const n of npcsAt(b, firstPoi(b).id)) n.location_poi_id = other.id;
    })).toContain('error:poi.empty');
  });
  it('flags an NPC with no location', () => {
    expect(codesAfter((b) => { Object.values(b.npcs)[0].location_poi_id = 'poi_9999'; })).toContain('error:npc.location');
  });
  it('flags a location in another settlement', () => {
    expect(codesAfter((b) => {
      const n = Object.values(b.npcs)[0];
      n.location_poi_id = Object.values(b.pois).find((p) => p.settlement_id !== n.settlement_id)!.id;
    })).toContain('error:npc.location_settlement');
  });
  it('flags a place without treasures', () => {
    expect(codesAfter((b) => { for (const t of treasuresAt(b, firstPoi(b).id)) delete b.treasures[t.id]; })).toContain('error:poi.treasures');
  });
  it('flags a treasure with no holder', () => {
    expect(codesAfter((b) => { Object.values(b.treasures)[0].holder = { npc_id: 'npc_9999' }; })).toContain('error:treasure.holder');
  });
  it('flags intel or leverage without a subject', () => {
    expect(codesAfter((b) => {
      Object.values(b.treasures).find((x) => x.category === 'intel' || x.category === 'leverage')!.subject_refs = [];
    })).toContain('error:treasure.subject');
  });
  it('warns about an unexplained surprising location and an ill-fitting treasure', () => {
    const codes = codesAfter((b) => {
      Object.values(b.npcs).find((x) => isSurprising(x.location_reason))!.location_reason_ref = null;
      const t = Object.values(b.treasures).find((x) => 'poi_id' in x.holder)!;
      t.category = 'armor';
      if ('poi_id' in t.holder) b.pois[t.holder.poi_id].type = 'shrine';
    });
    expect(codes).toContain('warning:npc.location_reason');
    expect(codes).toContain('warning:treasure.fit');
  });
});
