import { useCallback, useEffect, useState } from 'react';
import type { PlanetBundle } from '../../generator';
import {
  applyTurn, ask, createKnowledge, meet, randomNpc, type DialogueOption, type DialogueTurn, type Knowledge,
} from '../../explore';
import { Rng } from '../../generator/rng';

const storageKey = (b: PlanetBundle) => `planet-explorer:v1:${b.seed}:${b.generator_version}`;

function load(b: PlanetBundle): Knowledge {
  try {
    const raw = localStorage.getItem(storageKey(b));
    if (raw) {
      const k = JSON.parse(raw) as Knowledge;
      if (k.version === 1 && k.seed === b.seed && k.generator_version === b.generator_version) return k;
    }
  } catch {
    // Storage may be unavailable (private mode, blocked); fall through to a fresh start.
  }
  return createKnowledge(b);
}

function save(b: PlanetBundle, k: Knowledge) {
  try {
    localStorage.setItem(storageKey(b), JSON.stringify(k));
  } catch {
    // Progress just won't persist.
  }
}

export interface Explorer {
  knowledge: Knowledge;
  /** Meet an NPC (reveals what is visible in their settlement). */
  meetNpc: (npcId: string) => void;
  /** Pick a random NPC to meet; returns their id. */
  meetRandom: () => string;
  talk: (npcId: string, option: DialogueOption) => DialogueTurn;
  reset: () => void;
}

/** Explorer state for one planet, saved in browser storage per seed. */
export function useExplorer(bundle: PlanetBundle): Explorer {
  // The explorer subtree is keyed by seed in App, so this state never outlives its planet.
  const [knowledge, setKnowledge] = useState<Knowledge>(() => load(bundle));
  useEffect(() => save(bundle, knowledge), [bundle, knowledge]);

  const meetNpc = useCallback((npcId: string) => {
    setKnowledge((k) => (bundle.npcs[npcId] && !k.met.includes(npcId) ? meet(bundle, k, npcId).knowledge : k));
  }, [bundle]);

  const meetRandom = useCallback(() => {
    const roll = new Rng(`${bundle.seed}:random-npc:${knowledge.turn}:${knowledge.met.length}`).next();
    const id = randomNpc(bundle, knowledge, roll);
    setKnowledge((k) => meet(bundle, k, id).knowledge);
    return id;
  }, [bundle, knowledge]);

  const talk = useCallback((npcId: string, option: DialogueOption) => {
    const turn = ask(bundle, knowledge, npcId, option);
    setKnowledge((k) => applyTurn(bundle, k, turn));
    return turn;
  }, [bundle, knowledge]);

  const reset = useCallback(() => setKnowledge(createKnowledge(bundle)), [bundle]);

  return { knowledge, meetNpc, meetRandom, talk, reset };
}
