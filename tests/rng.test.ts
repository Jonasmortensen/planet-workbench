import { describe, expect, it } from 'vitest';
import { Rng, deriveSeed, hashHex, normalizeShares } from '../src/generator/rng';

describe('hash', () => {
  it('is stable and sensitive to input', () => {
    expect(hashHex('abc')).toBe(hashHex('abc'));
    expect(hashHex('abc')).not.toBe(hashHex('abd'));
    expect(hashHex('')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('derives child seeds from parent and key only', () => {
    expect(deriveSeed('p', 'k')).toBe(deriveSeed('p', 'k'));
    expect(deriveSeed('p', 'k1')).not.toBe(deriveSeed('p', 'k2'));
  });
});

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng('seed');
    const b = new Rng('seed');
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng('seed-a');
    const b = new Rng('seed-b');
    const sa = Array.from({ length: 10 }, () => a.next());
    const sb = Array.from({ length: 10 }, () => b.next());
    expect(sa).not.toEqual(sb);
  });

  it('forks independently of consumed state', () => {
    const a = new Rng('seed');
    const b = new Rng('seed');
    for (let i = 0; i < 50; i++) b.next();
    expect(a.fork('child').next()).toBe(b.fork('child').next());
  });

  it('next() stays in [0, 1)', () => {
    const r = new Rng('range');
    for (let i = 0; i < 10000; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int() is inclusive and covers the whole range', () => {
    const r = new Rng('int');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const x = r.int(3, 7);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThanOrEqual(7);
      seen.add(x);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
    expect(() => r.int(5, 4)).toThrow();
  });

  it('weighted() respects weights and never picks zero weights', () => {
    const r = new Rng('weighted');
    const counts = { a: 0, b: 0, c: 0 };
    const entries = [
      { value: 'a' as const, weight: 1 },
      { value: 'b' as const, weight: 3 },
      { value: 'c' as const, weight: 0 },
    ];
    for (let i = 0; i < 20000; i++) counts[r.weighted(entries)]++;
    expect(counts.c).toBe(0);
    expect(counts.b / counts.a).toBeGreaterThan(2.6);
    expect(counts.b / counts.a).toBeLessThan(3.4);
    expect(() => r.weighted([{ value: 'x', weight: 0 }])).toThrow();
  });

  it('shuffle() is a permutation and does not mutate its input', () => {
    const r = new Rng('shuffle');
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = r.shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('sample() and weightedSample() return distinct items', () => {
    const r = new Rng('sample');
    expect(new Set(r.sample([1, 2, 3, 4, 5], 3)).size).toBe(3);
    const w = r.weightedSample([{ value: 'a', weight: 1 }, { value: 'b', weight: 2 }, { value: 'c', weight: 0 }], 5);
    expect([...w].sort()).toEqual(['a', 'b']);
  });

  it('shares() are positive and sum to exactly 1', () => {
    const r = new Rng('shares');
    for (let n = 1; n <= 10; n++) {
      const s = r.shares(n);
      expect(s).toHaveLength(n);
      expect(Math.round(s.reduce((a, b) => a + b, 0) * 1000)).toBe(1000);
      s.forEach((x) => expect(x).toBeGreaterThan(0));
    }
  });

  it('normalizeShares() honors a custom total', () => {
    const s = normalizeShares([1, 1, 2], 0.6);
    expect(Math.round(s.reduce((a, b) => a + b, 0) * 1000)).toBe(600);
  });
});
