import { describe, expect, it } from 'vitest';
import { generatePlanet } from '../src/generator';

const SEEDS = Array.from({ length: 200 }, (_, i) => String(i));
const bundles = SEEDS.map((s) => generatePlanet(s));

describe('validation across 200 sequential seeds', () => {
  it('reports zero errors', () => {
    const failures = bundles.flatMap((b) => b.validation
      .filter((i) => i.severity === 'error')
      .map((i) => `seed ${b.seed}: [${i.code}] ${i.entity_ref}: ${i.message}`));
    expect(failures).toEqual([]);
  });

  it('never leaves a physical inconsistency unrecorded', () => {
    const unrecorded = bundles.flatMap((b) => b.validation
      .filter((i) => i.code === 'physical.unrecorded')
      .map((i) => `seed ${b.seed}: ${i.message}`));
    expect(unrecorded).toEqual([]);
  });

  it('reports no settlement, country, history, leadership or NPC warnings', () => {
    const prefixes = ['settlement.', 'country.', 'history.', 'leadership.', 'org.', 'npc.', 'poi.', 'prose.', 'rumor.', 'motive.', 'hook.', 'secret.'];
    const found = bundles.flatMap((b) => b.validation
      .filter((i) => prefixes.some((p) => i.code.startsWith(p)))
      .map((i) => `seed ${b.seed}: [${i.code}] ${i.entity_ref}: ${i.message}`));
    expect(found).toEqual([]);
  });

  it('gives every country 3 to 8 settlements and exactly one capital', () => {
    for (const b of bundles) {
      for (const c of Object.values(b.countries)) {
        const settlements = Object.values(b.settlements).filter((s) => s.country_id === c.id);
        expect(settlements.length).toBeGreaterThanOrEqual(3);
        expect(settlements.length).toBeLessThanOrEqual(8);
        expect(settlements.filter((s) => s.settlement_type === 'capital').map((s) => s.id)).toEqual([c.capital_settlement_id]);
      }
    }
  });

  it('reports no empty required fields', () => {
    const empty = bundles.flatMap((b) => b.validation
      .filter((i) => i.code === 'empty.field')
      .map((i) => `seed ${b.seed}: ${i.entity_ref}: ${i.message}`));
    expect(empty).toEqual([]);
  });
});
