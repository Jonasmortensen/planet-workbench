import { describe, expect, it } from 'vitest';
import { generatePlanet, validate, type PlanetBundle } from '../src/generator';

/** Each case breaks a fresh bundle in one way and expects the validator to name it. */
function codesAfter(mutate: (b: PlanetBundle) => void, seed = '7'): string[] {
  const b = generatePlanet(seed);
  mutate(b);
  return validate(b).map((i) => `${i.severity}:${i.code}`);
}

const first = <T,>(record: Record<string, T>): T => Object.values(record)[0];

describe('validator catches broken bundles', () => {
  it('starts from a clean bundle', () => {
    expect(codesAfter(() => {})).toEqual([]);
  });

  it('flags dangling references', () => {
    expect(codesAfter((b) => { first(b.settlements).country_id = 'country_999'; })).toContain('error:ref.missing');
  });

  it('flags an empty leadership slot', () => {
    expect(codesAfter((b) => { first(b.organizations).leader_npc_id = null; })).toContain('error:leadership.empty');
  });

  it('flags an NPC with more than three roles', () => {
    expect(codesAfter((b) => {
      const n = Object.values(b.npcs).find((x) => x.leads.length > 0)!;
      for (let i = 0; i < 3; i++) n.leads.push({ entity_type: 'organization', entity_id: `org_${900 + i}`, public: true });
    })).toContain('error:leadership.too_many');
  });

  it('flags a country with two capitals', () => {
    expect(codesAfter((b) => {
      const c = first(b.countries);
      const other = Object.values(b.settlements).find((s) => s.country_id === c.id && s.settlement_type !== 'capital')!;
      other.settlement_type = 'capital';
    })).toContain('error:country.capital');
  });

  it('flags one-sided relations and relationships', () => {
    expect(codesAfter((b) => {
      const c = Object.values(b.countries).find((x) => x.relations.some((r) => r.target_ref in b.countries))!;
      c.relations.find((r) => r.target_ref in b.countries)!.attitude = 'at_war';
      const n = Object.values(b.npcs).find((x) => x.relationships.length > 0)!;
      n.relationships[0].type = 'parent';
    })).toEqual(expect.arrayContaining(['error:symmetry.relations', 'error:symmetry.relationships']));
  });

  it('flags settlements that outnumber their country', () => {
    expect(codesAfter((b) => {
      const c = first(b.countries);
      c.population = 1;
    })).toContain('error:population.settlements');
  });

  it('flags an organization operating outside its scope', () => {
    expect(codesAfter((b) => {
      const o = Object.values(b.organizations).find((x) => x.scope_level === 'settlement')!;
      const elsewhere = Object.values(b.settlements).find((s) => s.id !== o.home_ref)!;
      o.presence.push({ settlement_id: elsewhere.id, strength: 'minor' });
      elsewhere.organizations_present.push(o.id);
    })).toContain('error:org.scope');
  });

  it('flags a hidden role without a matching secret', () => {
    expect(codesAfter((b) => {
      const n = Object.values(b.npcs).find((x) => x.leads.some((l) => !l.public))!;
      n.secret = null;
    }, '22')).toContain('warning:leadership.secret');
  });

  it('flags a rumor whose truth label contradicts the data', () => {
    expect(codesAfter((b) => {
      const holder = Object.values(b.npcs).find((x) => x.rumors_about.length > 0)!;
      holder.rumors_about[0].is_true = !holder.rumors_about[0].is_true;
    })).toContain('error:rumor.truth');
  });

  it('flags an unrecorded physical inconsistency', () => {
    expect(codesAfter((b) => { b.planet.gravity = 9; b.planet.anomalies = []; })).toContain('warning:physical.unrecorded');
  });

  it('flags template artifacts in prose', () => {
    expect(codesAfter((b) => { b.planet.description = 'A world of {biome}.'; })).toContain('error:prose.artifact');
  });
});
