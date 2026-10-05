import { describe, expect, it } from 'vitest';
import { generatePlanet } from '../src/generator';

describe('determinism', () => {
  it('generates deeply equal bundles for the same seed', () => {
    for (const seed of ['alpha', 'beta', '12345', 'a long seed with spaces']) {
      expect(generatePlanet(seed)).toEqual(generatePlanet(seed));
    }
  });

  it('generates different planets for different seeds', () => {
    const names = new Set(Array.from({ length: 20 }, (_, i) => generatePlanet(`seed-${i}`).planet.name));
    expect(names.size).toBeGreaterThan(15);
  });
});
