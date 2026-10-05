import type { Rng } from '../rng';

export interface Point {
  x: number;
  y: number;
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Well-spread points via best-candidate sampling: each new point is the
 * candidate farthest from all existing points. Deterministic for a given rng.
 */
export function spreadPoints(rng: Rng, n: number, center: Point = { x: 0.5, y: 0.5 }, radius = 0.45, candidates = 12): Point[] {
  const out: Point[] = [];
  const sample = (): Point => {
    const a = rng.float(0, Math.PI * 2);
    const r = radius * Math.sqrt(rng.next());
    return { x: clamp01(center.x + r * Math.cos(a)), y: clamp01(center.y + r * Math.sin(a)) };
  };
  for (let i = 0; i < n; i++) {
    let best = sample();
    if (out.length > 0) {
      let bestD = Math.min(...out.map((p) => dist(p, best)));
      for (let c = 1; c < candidates; c++) {
        const cand = sample();
        const d = Math.min(...out.map((p) => dist(p, cand)));
        if (d > bestD) {
          best = cand;
          bestD = d;
        }
      }
    }
    out.push({ x: round3(best.x), y: round3(best.y) });
  }
  return out;
}

/**
 * Gabriel graph edges: i and j are neighbors when no other point lies inside
 * the circle whose diameter is the segment ij. A cheap stand-in for shared
 * borders between territories around those points.
 */
export function gabrielEdges(points: Point[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const mid = { x: (points[i].x + points[j].x) / 2, y: (points[i].y + points[j].y) / 2 };
      const r = dist(points[i], points[j]) / 2;
      let blocked = false;
      for (let k = 0; k < points.length && !blocked; k++) {
        if (k !== i && k !== j && dist(points[k], mid) < r) blocked = true;
      }
      if (!blocked) edges.push([i, j]);
    }
  }
  return edges;
}

/** Minimum spanning tree edges (Prim). */
export function spanningTree(points: Point[]): [number, number][] {
  if (points.length < 2) return [];
  const inTree = new Set([0]);
  const edges: [number, number][] = [];
  while (inTree.size < points.length) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (const i of inTree) {
      for (let j = 0; j < points.length; j++) {
        if (inTree.has(j)) continue;
        const d = dist(points[i], points[j]);
        if (d < bestD) {
          bestD = d;
          best = [i, j];
        }
      }
    }
    edges.push(best!);
    inTree.add(best![1]);
  }
  return edges;
}

function clamp01(x: number): number {
  return Math.min(0.99, Math.max(0.01, x));
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
