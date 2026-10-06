import { describe, expect, it } from 'vitest';
import { DISPOSITIONS, PLANET_ID, generatePlanet, resolveEntity, type PlanetBundle } from '../src/generator';
import {
  GENERIC_OPTIONS, aboutOption, applyTurn, ask, createKnowledge, findReferral, groupsSeen, isKnown, isPublicOrg, knows, meet,
  npcKnows, randomNpc, type Knowledge,
} from '../src/explore';
import { Rng } from '../src/generator/rng';

const ARTIFACT = /[{}<>[\]]|undefined|null|NaN/;

/** Play a session: meet random NPCs and ask them everything, including about known entities. */
function play(b: PlanetBundle, turns: number, seed: string): { k: Knowledge; answers: string[] } {
  const rng = new Rng(seed);
  let k = createKnowledge(b);
  const answers: string[] = [];
  let npc = randomNpc(b, k, rng.next());
  k = meet(b, k, npc).knowledge;
  for (let i = 0; i < turns; i++) {
    if (rng.chance(0.15)) {
      npc = randomNpc(b, k, rng.next());
      k = meet(b, k, npc).knowledge;
    }
    const knownIds = Object.keys(k.entities);
    const option = rng.chance(0.5) ? rng.pick(GENERIC_OPTIONS) : aboutOption(b, rng.pick(knownIds));
    const turn = ask(b, k, npc, option);
    answers.push(turn.answer);
    k = applyTurn(b, k, turn);
    if (turn.referral && rng.chance(0.7)) {
      npc = turn.referral;
      k = meet(b, k, npc).knowledge;
    }
  }
  return { k, answers };
}

describe('knowledge', () => {
  const b = generatePlanet('22');

  it('starts with only what is visible from orbit', () => {
    const k = createKnowledge(b);
    expect(Object.keys(k.entities)).toEqual([PLANET_ID]);
    expect(k.entities[PLANET_ID].sort()).toEqual(groupsSeen('planet', 'orbit').sort());
    expect(knows(k, PLANET_ID, 'politics')).toBe(false);
  });

  it('meeting an NPC reveals their face and their settlement, but nothing that must be told', () => {
    const npc = Object.values(b.npcs)[10];
    const k = meet(b, createKnowledge(b), npc.id).knowledge;
    const s = b.settlements[npc.settlement_id];
    expect(knows(k, npc.id, 'appearance')).toBe(true);
    expect(knows(k, npc.id, 'role')).toBe(false);
    expect(knows(k, s.id, 'appearance')).toBe(true);
    expect(knows(k, s.id, 'governance')).toBe(false);
    expect(knows(k, s.country_id, 'tech')).toBe(true);
    expect(knows(k, s.country_id, 'government')).toBe(false);
    expect(k.met).toEqual([npc.id]);
  });
});

describe('dialogue', () => {
  it('answers deterministically', () => {
    const b = generatePlanet('7');
    const npc = Object.keys(b.npcs)[0];
    const k = meet(b, createKnowledge(b), npc).knowledge;
    expect(ask(b, k, npc, GENERIC_OPTIONS[1])).toEqual(ask(b, k, npc, GENERIC_OPTIONS[1]));
  });

  for (const seed of ['3', '22', '57', '140']) {
    it(`plays 600 turns on seed ${seed} without errors or leaks`, () => {
      const b = generatePlanet(seed);
      const { k, answers } = play(b, 600, `session-${seed}`);
      for (const a of answers) {
        expect(a.length).toBeGreaterThan(1);
        expect(a).not.toMatch(ARTIFACT);
      }
      for (const [id, groups] of Object.entries(k.entities)) {
        expect(resolveEntity(b, id), id).toBeDefined();
        const o = b.organizations[id];
        // Secret and outlawed organizations can be named in rumors, but never described.
        if (o && !isPublicOrg(o)) expect(groups).toEqual(['name']);
      }
      expect(Object.keys(k.entities).length).toBeGreaterThan(20);
      for (const h of k.rumors) expect(h.rumor).not.toHaveProperty('is_true');
    });
  }

  it('refers the player to someone who actually knows', () => {
    const b = generatePlanet('22');
    let k = createKnowledge(b);
    let tested = 0;
    for (const speaker of Object.values(b.npcs)) {
      if (DISPOSITIONS.indexOf(speaker.disposition_to_outsiders) < 2) continue;
      // An NPC elsewhere that the speaker has never heard of.
      const target = Object.values(b.npcs).find((x) => x.id !== speaker.id && npcKnows(b, speaker, x.id).length === 0);
      if (!target) continue;
      k = meet(b, k, speaker.id).knowledge;
      const turn = ask(b, k, speaker.id, aboutOption(b, target.id));
      expect(turn.referral).toBe(findReferral(b, k, speaker, target.id));
      if (turn.referral) {
        expect(npcKnows(b, b.npcs[turn.referral], target.id).length).toBeGreaterThan(1);
        k = applyTurn(b, k, turn);
        expect(isKnown(k, turn.referral)).toBe(true);
        tested++;
      }
      if (tested >= 10) break;
    }
    expect(tested).toBeGreaterThan(0);
  });

  it('lets hostile NPCs refuse gossip and work', () => {
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      const b = generatePlanet(String(i));
      const hostile = Object.values(b.npcs).find((n) => n.disposition_to_outsiders === 'hostile');
      if (!hostile) continue;
      const k = meet(b, createKnowledge(b), hostile.id).knowledge;
      for (const topic of ['rumors', 'work', 'self'] as const) {
        const t = ask(b, k, hostile.id, GENERIC_OPTIONS.find((o) => o.topic === topic)!);
        expect(t.refused).toBe(true);
        expect(t.reveals).toEqual([]);
      }
      found = true;
    }
    expect(found).toBe(true);
  });

  it('never has an NPC name themself', () => {
    for (const seed of ['7', '22', 'explore']) {
      const b = generatePlanet(seed);
      for (const n of Object.values(b.npcs)) {
        const k = meet(b, createKnowledge(b), n.id).knowledge;
        const home = b.settlements[n.settlement_id];
        const targets = [home.id, home.country_id, PLANET_ID, ...n.organization_ids, ...n.leads.map((l) => l.entity_id)];
        const options = [...GENERIC_OPTIONS, ...targets.map((t) => aboutOption(b, t))];
        for (const o of options) expect(ask(b, k, n.id, o).answer, `${seed} ${n.id} ${o.label}`).not.toContain(n.name);
      }
    }
  });

  it('only shares goals with friendly NPCs', () => {
    const b = generatePlanet('22');
    for (const n of Object.values(b.npcs)) {
      const k = meet(b, createKnowledge(b), n.id).knowledge;
      const t = ask(b, k, n.id, GENERIC_OPTIONS[0]);
      const sharesGoal = t.reveals.some((f) => f.entity === n.id && f.group === 'goal');
      expect(sharesGoal).toBe(DISPOSITIONS.indexOf(n.disposition_to_outsiders) >= DISPOSITIONS.indexOf('friendly'));
    }
  });
});
