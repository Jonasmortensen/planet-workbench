import { describe, expect, it } from 'vitest';
import { generatePlanet, type Npc, type PlanetBundle } from '../src/generator';
import { SETTLEMENT_TYPE_TABLE } from '../src/generator/content';
import {
  canReuseLeader, isHiddenSlot, livesNear, scopesCompatible, slotTier, type SlotRef,
} from '../src/generator/rules/leadership';

const bundles = Array.from({ length: 200 }, (_, i) => generatePlanet(String(i)));
const fake = (leads: Npc['leads'], settlement_id: string): Npc => ({ leads, settlement_id } as Npc);

function findBundle(pred: (b: PlanetBundle) => boolean): PlanetBundle {
  const b = bundles.find(pred);
  if (!b) throw new Error('no bundle matches');
  return b;
}

describe('leadership overlap rules', () => {
  it('ranks slot tiers from village to world government', () => {
    const b = findBundle((x) => x.planet.world_government !== null);
    const village = Object.values(b.settlements).find((s) => SETTLEMENT_TYPE_TABLE[s.settlement_type].size === 1);
    expect(slotTier(b, { kind: 'world_government', entityId: 'planet' })).toBe(5);
    expect(slotTier(b, { kind: 'country', entityId: Object.keys(b.countries)[0] })).toBe(4);
    if (village) expect(slotTier(b, { kind: 'settlement', entityId: village.id })).toBe(1);
  });

  it('never lets a village leader take a planet-wide organization', () => {
    const b = findBundle((x) => Object.values(x.organizations).some((o) => o.scope_level === 'planet')
      && Object.values(x.settlements).some((s) => SETTLEMENT_TYPE_TABLE[s.settlement_type].size <= 2));
    const village = Object.values(b.settlements).find((s) => SETTLEMENT_TYPE_TABLE[s.settlement_type].size <= 2)!;
    const planetOrg = Object.values(b.organizations).find((o) => o.scope_level === 'planet')!;
    const mayor = fake([{ entity_type: 'settlement', entity_id: village.id, public: true }], village.id);
    expect(scopesCompatible(b, mayor, { kind: 'organization', entityId: planetOrg.id })).toBe(false);
  });

  it('lets a capital leader take a country-scope organization', () => {
    const b = findBundle((x) => Object.values(x.organizations).some((o) => o.scope_level === 'country'));
    const org = Object.values(b.organizations).find((o) => o.scope_level === 'country')!;
    const capital = b.countries[org.home_ref].capital_settlement_id!;
    const mayor = fake([{ entity_type: 'settlement', entity_id: capital, public: true }], capital);
    expect(scopesCompatible(b, mayor, { kind: 'organization', entityId: org.id })).toBe(true);
  });

  it('rejects candidates with three roles, far away, a second settlement or a second hidden role', () => {
    const b = findBundle((x) => Object.values(x.organizations).some((o) => isHiddenSlot(x, { kind: 'organization', entityId: o.id }) && o.scope_level === 'settlement')
      && Object.keys(x.settlements).length > 4);
    const hiddenOrg = Object.values(b.organizations).find((o) => o.scope_level === 'settlement' && isHiddenSlot(b, { kind: 'organization', entityId: o.id }))!;
    const home = hiddenOrg.home_ref;
    const slot: SlotRef = { kind: 'organization', entityId: hiddenOrg.id };
    const ok = fake([{ entity_type: 'settlement', entity_id: home, public: true }], home);
    expect(canReuseLeader(b, ok, slot, home)).toBe(true);

    const full = fake([
      { entity_type: 'settlement', entity_id: home, public: true },
      { entity_type: 'organization', entity_id: 'org_x', public: true },
      { entity_type: 'organization', entity_id: 'org_y', public: true },
    ], home);
    expect(canReuseLeader(b, { ...full, leads: full.leads.slice(0, 1) } as Npc, slot, home)).toBe(true);
    expect(canReuseLeader(b, full, slot, home)).toBe(false);

    const far = Object.values(b.settlements).find((s) => !livesNear(b, { settlement_id: s.id }, home))!;
    expect(canReuseLeader(b, fake([{ entity_type: 'settlement', entity_id: far.id, public: true }], far.id), slot, home)).toBe(false);

    const otherSecret = Object.values(b.organizations).find((o) => o.id !== hiddenOrg.id && isHiddenSlot(b, { kind: 'organization', entityId: o.id }));
    if (otherSecret) {
      const spy = fake([{ entity_type: 'organization', entity_id: otherSecret.id, public: false }], home);
      expect(canReuseLeader(b, spy, slot, home)).toBe(false);
    }

    const otherTown = Object.values(b.settlements).find((s) => s.id !== home)!;
    const mayorElsewhere = fake([{ entity_type: 'settlement', entity_id: otherTown.id, public: true }], home);
    expect(canReuseLeader(b, mayorElsewhere, { kind: 'settlement', entityId: home }, home)).toBe(false);
  });
});

describe('leadership in generated planets', () => {
  it('fills every slot and never exceeds three roles', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs)) expect(n.leads.length).toBeLessThanOrEqual(3);
      for (const c of Object.values(b.countries)) expect(c.ruler_npc_id).not.toBeNull();
      for (const s of Object.values(b.settlements)) expect(s.leader_npc_id).not.toBeNull();
      for (const o of Object.values(b.organizations)) expect(o.leader_npc_id).not.toBeNull();
      if (b.planet.world_government) expect(b.planet.world_government.leader_npc_id).not.toBeNull();
    }
  });

  it('applies the automatic combinations', () => {
    let checked = 0;
    for (const b of bundles) {
      for (const o of Object.values(b.organizations).filter((x) => x.state_role !== 'none')) {
        const country = b.countries[o.home_ref];
        expect(o.leader_npc_id).toBe(country.ruler_npc_id);
        checked++;
      }
      if (b.planet.political_structure === 'unified') {
        expect(b.planet.world_government!.leader_npc_id).toBe(Object.values(b.countries)[0].ruler_npc_id);
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('records every hidden role as a secret', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs)) {
        const hidden = n.leads.filter((l) => !l.public);
        expect(hidden.length).toBeLessThanOrEqual(1);
        if (hidden.length === 1) {
          expect(n.secret?.type).toBe('secret_leadership');
          expect(n.secret?.target_org_id).toBe(hidden[0].entity_id);
        }
      }
    }
  });

  it('reuses leaders for roughly 10 to 15% of non-automatic slots', () => {
    let slots = 0;
    let reused = 0;
    for (const b of bundles) {
      const automatic = new Set(Object.values(b.organizations).filter((o) => o.state_role !== 'none').map((o) => o.id));
      if (b.planet.political_structure === 'unified') automatic.add(Object.keys(b.countries)[0]);
      for (const n of Object.values(b.npcs)) {
        const ordinary = n.leads.filter((l) => !automatic.has(l.entity_id));
        slots += ordinary.length;
        reused += Math.max(0, ordinary.length - 1);
      }
    }
    const rate = reused / slots;
    expect(rate).toBeGreaterThan(0.04);
    expect(rate).toBeLessThan(0.16);
  });
});
