import type { Rng } from '../rng';

/** Weights restricted to the given keys, multiplied by optional bias multipliers. */
export function biased<K extends string>(
  keys: readonly K[],
  base: Partial<Record<K, number>>,
  bias?: Partial<Record<K, number>>,
): { value: K; weight: number }[] {
  return keys.map((k) => ({ value: k, weight: (base[k] ?? 0) * (bias?.[k] ?? 1) }));
}

/** Weighted pick of a count, where weights[i] is the weight for count i. */
export function pickCount(rng: Rng, weights: readonly number[], max = Infinity): number {
  return rng.weighted(weights.map((w, i) => ({ value: i, weight: i <= max ? w : 0 })));
}

/** Round to n significant digits. */
export function roundSig(x: number, n = 3): number {
  if (x === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(x)));
  const p = Math.pow(10, n - d);
  return Math.round(x * p) / p;
}

export function round(x: number, decimals = 0): number {
  const p = Math.pow(10, decimals);
  return Math.round(x * p) / p;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Index into an ordered scale, clamped. */
export function scaleAt<T>(scale: readonly T[], index: number): T {
  return scale[clamp(Math.round(index), 0, scale.length - 1)];
}
