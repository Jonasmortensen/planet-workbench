import type { PlanetBundle, Rumor } from '../generator';
import { PLANET_ID, kindOf } from '../generator';
import { FACT_GROUPS, groupsSeen } from './facts';

/** One known fact group of one entity. */
export interface FactRef {
  entity: string;
  group: string;
}

/** A rumor the player has heard. It is never marked true or false in the player's knowledge. */
export interface HeardRumor {
  rumor: Pick<Rumor, 'subject_ref' | 'claim_type' | 'target_ref'>;
  heard_from: string;
  turn: number;
}

export interface DialogueLogEntry {
  turn: number;
  npc_id: string;
  question: string;
  answer: string;
  /** Facts newly learned on this turn. */
  learned: FactRef[];
}

/**
 * The player's knowledge of one planet: a separate copy alongside the bundle
 * that records what is known, never the data itself. Plain JSON, so it can
 * be saved and loaded. All updates return a new object.
 */
export interface Knowledge {
  version: 1;
  seed: string;
  generator_version: string;
  /** entity id -> known fact groups. An entity is known once it has any group. */
  entities: Record<string, string[]>;
  /** NPCs the player has spoken with. */
  met: string[];
  rumors: HeardRumor[];
  log: DialogueLogEntry[];
  turn: number;
}

export function knows(k: Knowledge, entity: string, group: string): boolean {
  return k.entities[entity]?.includes(group) ?? false;
}

export function isKnown(k: Knowledge, entity: string): boolean {
  return (k.entities[entity]?.length ?? 0) > 0;
}

/** Add facts; returns the new knowledge and the facts that were actually new. */
export function learn(k: Knowledge, facts: readonly FactRef[]): { knowledge: Knowledge; learned: FactRef[] } {
  const entities = { ...k.entities };
  const learned: FactRef[] = [];
  for (const f of facts) {
    const groups = entities[f.entity] ?? [];
    if (groups.includes(f.group)) continue;
    // Knowing anything about an entity implies knowing it exists by name.
    const add = groups.includes('name') || f.group === 'name' ? [f.group] : ['name', f.group];
    for (const g of add) {
      if (!groups.includes(g)) learned.push({ entity: f.entity, group: g });
    }
    entities[f.entity] = [...groups, ...add.filter((g) => !groups.includes(g))];
  }
  return { knowledge: learned.length ? { ...k, entities } : k, learned };
}

const facts = (entity: string, groups: string[]): FactRef[] => groups.map((group) => ({ entity, group }));

/** Fresh knowledge on arriving at a planet: whatever can be seen from orbit. */
export function createKnowledge(b: PlanetBundle): Knowledge {
  const base: Knowledge = {
    version: 1, seed: b.seed, generator_version: b.generator_version, entities: {}, met: [], rumors: [], log: [], turn: 0,
  };
  return learn(base, facts(PLANET_ID, groupsSeen('planet', 'orbit'))).knowledge;
}

/** Everything visible when walking into a settlement: the place, its country's flag and signs, the peoples in its streets. */
export function visibleOnArrival(b: PlanetBundle, settlementId: string): FactRef[] {
  const s = b.settlements[settlementId];
  return [
    ...facts(s.id, groupsSeen('settlement', 'arrival')),
    ...facts(s.country_id, groupsSeen('country', 'arrival')),
    ...s.species.flatMap((x) => facts(x.species_id, groupsSeen('species', 'arrival'))),
  ];
}

/** Everything visible when meeting an NPC: who they are and how they look, plus their settlement. */
export function visibleOnMeeting(b: PlanetBundle, npcId: string): FactRef[] {
  const n = b.npcs[npcId];
  return [
    ...visibleOnArrival(b, n.settlement_id),
    ...facts(n.id, ['name', ...groupsSeen('npc', 'meet')]),
    { entity: n.species_id, group: 'name' },
  ];
}

/** Start talking to an NPC: reveal what is visible and record the meeting. */
export function meet(b: PlanetBundle, k: Knowledge, npcId: string): { knowledge: Knowledge; learned: FactRef[] } {
  const { knowledge, learned } = learn(k, visibleOnMeeting(b, npcId));
  const met = knowledge.met.includes(npcId) ? knowledge.met : [...knowledge.met, npcId];
  return { knowledge: { ...knowledge, met }, learned };
}

/** Pick an NPC to meet at random, preferring ones not met yet. Uses the turn counter so it is reproducible per save. */
export function randomNpc(b: PlanetBundle, k: Knowledge, roll: number): string {
  const all = Object.keys(b.npcs);
  const fresh = all.filter((id) => !k.met.includes(id));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(roll * pool.length) % pool.length];
}

/** Share of all fact groups in the bundle that are known (0..1). */
export function progress(b: PlanetBundle, k: Knowledge): { known: number; total: number } {
  const ids = [
    PLANET_ID, ...Object.keys(b.countries), ...Object.keys(b.settlements), ...Object.keys(b.organizations),
    ...Object.keys(b.npcs), ...Object.keys(b.species), ...Object.keys(b.languages), ...Object.keys(b.religions),
  ];
  let total = 0;
  let known = 0;
  for (const id of ids) {
    const kind = kindOf(id)!;
    total += FACT_GROUPS[kind].length;
    known += k.entities[id]?.length ?? 0;
  }
  return { known, total };
}
