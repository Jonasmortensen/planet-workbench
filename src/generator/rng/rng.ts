import { cyrb128, deriveSeed } from './hash';

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export interface WeightedEntry<T> {
  value: T;
  weight: number;
}

/**
 * Seeded random stream. Every generator module receives one of these and
 * forks child streams with stable keys so that adding a new roll in one place
 * never shifts the values rolled elsewhere.
 */
export class Rng {
  readonly seed: string;
  private readonly nextFn: () => number;

  constructor(seed: string) {
    this.seed = seed;
    const [a, b, c, d] = cyrb128(seed);
    this.nextFn = sfc32(a, b, c, d);
    for (let i = 0; i < 12; i++) this.nextFn();
  }

  /** Child stream derived from this stream's seed and a key (not its state). */
  fork(key: string): Rng {
    return new Rng(deriveSeed(this.seed, key));
  }

  /** Child seed string, for entities that store their own seed. */
  childSeed(key: string): string {
    return deriveSeed(this.seed, key);
  }

  /** Float in [0, 1). */
  next(): number {
    return this.nextFn();
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + (max - min) * this.nextFn();
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    if (max < min) throw new Error(`Rng.int: max (${max}) < min (${min})`);
    return min + Math.floor(this.nextFn() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.nextFn() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    return items[Math.floor(this.nextFn() * items.length)];
  }

  /** Weighted pick. Entries with weight <= 0 are never chosen. */
  weighted<T>(entries: readonly WeightedEntry<T>[]): T {
    let total = 0;
    for (const e of entries) if (e.weight > 0) total += e.weight;
    if (total <= 0) throw new Error('Rng.weighted: no positive weights');
    let roll = this.nextFn() * total;
    for (const e of entries) {
      if (e.weight <= 0) continue;
      roll -= e.weight;
      if (roll < 0) return e.value;
    }
    // Floating point fallthrough: return the last positive entry.
    for (let i = entries.length - 1; i >= 0; i--) if (entries[i].weight > 0) return entries[i].value;
    throw new Error('unreachable');
  }

  /** Weighted pick over items with a weight accessor. */
  weightedBy<T>(items: readonly T[], weightOf: (item: T) => number): T {
    return this.weighted(items.map((value) => ({ value, weight: weightOf(value) })));
  }

  /** Weighted pick from a record of value -> weight, iterated in the given key order. */
  weightedKeys<K extends string>(keys: readonly K[], weights: Partial<Record<K, number>>): K {
    return this.weighted(keys.map((k) => ({ value: k, weight: weights[k] ?? 0 })));
  }

  /** Fisher-Yates shuffle; returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.nextFn() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** n distinct items, uniform, without replacement. */
  sample<T>(items: readonly T[], n: number): T[] {
    return this.shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));
  }

  /** n distinct items, weighted, without replacement. Returns fewer if not enough positive weights. */
  weightedSample<T>(entries: readonly WeightedEntry<T>[], n: number): T[] {
    const pool = entries.filter((e) => e.weight > 0).slice();
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
      const picked = this.weighted(pool.map((e, i) => ({ value: i, weight: e.weight })));
      out.push(pool[picked].value);
      pool.splice(picked, 1);
    }
    return out;
  }

  /** Standard normal via Box-Muller. */
  normal(mean = 0, sd = 1): number {
    let u = 0;
    while (u === 0) u = this.nextFn();
    const v = this.nextFn();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Normal clamped into [min, max]. */
  normalClamped(mean: number, sd: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, this.normal(mean, sd)));
  }

  /**
   * Split 1.0 into n positive shares. Lower `evenness` gives more uneven splits.
   * Shares are rounded to 3 decimals and always sum to exactly 1.
   */
  shares(n: number, evenness = 1): number[] {
    if (n <= 0) return [];
    const raw: number[] = [];
    for (let i = 0; i < n; i++) raw.push(Math.pow(this.float(0.05, 1), 1 / Math.max(0.05, evenness)));
    return normalizeShares(raw);
  }
}

/** Normalize weights to shares rounded to 3 decimals that sum to exactly 1 (or to `total`). */
export function normalizeShares(weights: readonly number[], total = 1): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const scaled = weights.map((w) => Math.max(0.001, Math.round(((w / sum) * total) * 1000) / 1000));
  const diff = Math.round((total - scaled.reduce((a, b) => a + b, 0)) * 1000) / 1000;
  // Push rounding error onto the largest share.
  let maxIdx = 0;
  for (let i = 1; i < scaled.length; i++) if (scaled[i] > scaled[maxIdx]) maxIdx = i;
  scaled[maxIdx] = Math.round((scaled[maxIdx] + diff) * 1000) / 1000;
  return scaled;
}
