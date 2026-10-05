/// <reference lib="webworker" />
import { generatePlanet } from '../../generator';
import { summarize, type PlanetSummary } from './summary';

/** Messages to the worker. */
export interface BatchRequest {
  seeds: string[];
}

/** Messages from the worker. */
export type BatchMessage =
  | { type: 'progress'; done: number; total: number; summary: PlanetSummary }
  | { type: 'done' }
  | { type: 'error'; seed: string; message: string };

/**
 * Generates planets off the main thread so the UI stays responsive.
 * Each planet is summarized here; only the small summary crosses the boundary.
 */
self.onmessage = (e: MessageEvent<BatchRequest>) => {
  const { seeds } = e.data;
  seeds.forEach((seed, i) => {
    try {
      const t0 = performance.now();
      const bundle = generatePlanet(seed);
      const msg: BatchMessage = { type: 'progress', done: i + 1, total: seeds.length, summary: summarize(bundle, performance.now() - t0) };
      self.postMessage(msg);
    } catch (err) {
      const msg: BatchMessage = { type: 'error', seed, message: err instanceof Error ? err.message : String(err) };
      self.postMessage(msg);
    }
  });
  self.postMessage({ type: 'done' } satisfies BatchMessage);
};
