import { describe, expect, it } from 'vitest';
import { buildPhonology, makeGivenName, makePersonName, makePlaceName } from '../src/generator/naming';
import { Rng } from '../src/generator/rng';
import { LANGUAGE_STYLES } from '../src/generator/types';

const MAX_DUPLICATE_RATE = 0.03;

function duplicateRate(names: string[]): number {
  return 1 - new Set(names).size / names.length;
}

describe('name generation', () => {
  for (const style of LANGUAGE_STYLES) {
    it(`${style}: 1,000 given names have a low duplicate rate`, () => {
      const rng = new Rng(`names-${style}`);
      const ph = buildPhonology(style, rng.fork('phonology'));
      const names = Array.from({ length: 1000 }, (_, i) => makeGivenName(ph, rng.fork(`n${i}`), i % 2 ? 'female' : 'male'));
      expect(duplicateRate(names)).toBeLessThan(MAX_DUPLICATE_RATE);
    });

    it(`${style}: 1,000 place names have a low duplicate rate`, () => {
      const rng = new Rng(`places-${style}`);
      const ph = buildPhonology(style, rng.fork('phonology'));
      const names = Array.from({ length: 1000 }, (_, i) => makePlaceName(ph, rng.fork(`p${i}`)));
      expect(duplicateRate(names)).toBeLessThan(MAX_DUPLICATE_RATE);
    });

    it(`${style}: full names are capitalized and well-formed`, () => {
      const rng = new Rng(`form-${style}`);
      const ph = buildPhonology(style, rng.fork('phonology'));
      for (let i = 0; i < 200; i++) {
        const n = makePersonName({ style, phonology: ph }, rng.fork(`f${i}`), 'female');
        expect(n.full.length).toBeGreaterThan(1);
        expect(n.full[0]).toMatch(/[A-Z]/);
        expect(n.full).not.toMatch(/'{2}|^'|'$|\s{2}|\{/);
      }
    });
  }

  it('two languages of the same style differ', () => {
    expect(buildPhonology('harsh', new Rng('lang-a'))).not.toEqual(buildPhonology('harsh', new Rng('lang-b')));
  });
});
