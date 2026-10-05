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

  it('reports no empty required fields', () => {
    const empty = bundles.flatMap((b) => b.validation
      .filter((i) => i.code === 'empty.field')
      .map((i) => `seed ${b.seed}: ${i.entity_ref}: ${i.message}`));
    expect(empty).toEqual([]);
  });
});
