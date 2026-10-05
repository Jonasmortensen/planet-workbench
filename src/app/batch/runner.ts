import type { BatchMessage, BatchRequest } from './worker';
import type { PlanetSummary } from './summary';

export interface BatchState {
  running: boolean;
  total: number;
  rows: PlanetSummary[];
  failures: { seed: string; message: string }[];
  startedAt: number;
  finishedAt: number | null;
  label: string;
}

const EMPTY: BatchState = { running: false, total: 0, rows: [], failures: [], startedAt: 0, finishedAt: null, label: '' };

/**
 * Keeps one batch run alive across page navigation: the worker and its
 * results live here, and pages subscribe to updates.
 */
class BatchRunner {
  private state: BatchState = EMPTY;
  private worker: Worker | null = null;
  private listeners = new Set<() => void>();

  getState = (): BatchState => this.state;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(next: Partial<BatchState>) {
    this.state = { ...this.state, ...next };
    for (const fn of this.listeners) fn();
  }

  start(seeds: string[], label: string) {
    this.cancel();
    this.set({ ...EMPTY, running: true, total: seeds.length, startedAt: performance.now(), label });
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker = worker;
    // Batch progress updates to keep rendering cheap.
    let pending: PlanetSummary[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      if (pending.length) this.set({ rows: [...this.state.rows, ...pending] });
      pending = [];
    };
    worker.onmessage = (e: MessageEvent<BatchMessage>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        pending.push(msg.summary);
        if (!timer) timer = setTimeout(flush, 120);
      } else if (msg.type === 'error') {
        this.set({ failures: [...this.state.failures, { seed: msg.seed, message: msg.message }] });
      } else {
        flush();
        this.set({ running: false, finishedAt: performance.now() });
        worker.terminate();
        this.worker = null;
      }
    };
    worker.postMessage({ seeds } satisfies BatchRequest);
  }

  cancel() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.set({ running: false, finishedAt: performance.now() });
    }
  }
}

export const batchRunner = new BatchRunner();
