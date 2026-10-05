import { describe, expect, it } from 'vitest';
import { generatePlanet } from '../src/generator';
import { NPC_GREETINGS } from '../src/generator/content/prose/templates';
import { TemplateError, fill, listOf, render } from '../src/generator/render/engine';
import { Rng } from '../src/generator/rng';
import { allRumors, rumorTruth } from '../src/generator/rules/rumors';
import { DISPOSITIONS, SPEECH_STYLES } from '../src/generator/types';

describe('template engine', () => {
  const ctx = (slots: Record<string, string | undefined>, plural = false) => ({ facts: {}, slots, plural });

  it('fills slots and applies modifiers in order', () => {
    expect(fill('{x|a|cap} town.', ctx({ x: 'ancient' }))).toBe('An ancient town.');
    expect(fill('{x|cap}', ctx({ x: 'tense' }))).toBe('Tense');
    expect(fill('{x|a}', ctx({ x: 'uniform crowd' }))).toBe('a uniform crowd');
  });

  it('drops optional segments whose slots are empty or missing', () => {
    expect(fill('A town[, home of {poi}].', ctx({ poi: '' }))).toBe('A town.');
    expect(fill('A town[, home of {poi}].', ctx({}))).toBe('A town.');
    expect(fill('A town[, home of {poi}].', ctx({ poi: 'the Inn' }))).toBe('A town, home of the Inn.');
  });

  it('agrees verbs with the subject', () => {
    expect(fill('{they} <is/are> here', ctx({ they: 'she' }))).toBe('she is here');
    expect(fill('{they} <is/are> here', ctx({ they: 'they' }, true))).toBe('they are here');
  });

  it('throws on a missing required slot', () => {
    expect(() => fill('Hello {name}', ctx({}))).toThrow(TemplateError);
  });

  it('only picks templates whose facts match', () => {
    const templates = [{ text: 'cold', when: { tone: ['cold'] } }, { text: 'warm', when: { tone: ['warm'] } }];
    for (let i = 0; i < 20; i++) {
      expect(render(new Rng(`t${i}`), templates, { facts: { tone: 'warm' }, slots: {} })).toBe('warm');
    }
    expect(() => render(new Rng('x'), templates, { facts: { tone: 'neutral' }, slots: {} })).toThrow(TemplateError);
  });

  it('lowercases a leading "The" in names mid-sentence', () => {
    expect(fill('They follow {faith}.', ctx({ faith: 'The Old Ways' }))).toBe('They follow the Old Ways.');
    expect(fill('{faith} is old.', ctx({ faith: 'The Old Ways' }))).toBe('The Old Ways is old.');
  });

  it('joins lists naturally', () => {
    expect(listOf(['a'])).toBe('a');
    expect(listOf(['a', 'b'])).toBe('a and b');
    expect(listOf(['a', 'b', 'c'])).toBe('a, b and c');
  });
});

describe('greeting coverage', () => {
  const tone = (d: string) => (['hostile', 'suspicious', 'wary'].includes(d) ? 'cold' : ['neutral', 'curious'].includes(d) ? 'neutral' : 'warm');
  it('has at least two greetings for every speech style and disposition', () => {
    for (const speech of SPEECH_STYLES) {
      for (const d of DISPOSITIONS) {
        const pool = NPC_GREETINGS.filter((t) => !t.when?.category && t.when?.speech?.includes(speech) && t.when?.tone?.includes(tone(d)));
        expect(pool.length, `${speech}/${d}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('story content across 200 seeds', () => {
  const bundles = Array.from({ length: 200 }, (_, i) => generatePlanet(String(i)));

  it('gives every NPC a goal, a fear and 1 to 2 quest hooks that point at real entities', () => {
    for (const b of bundles) {
      for (const n of Object.values(b.npcs)) {
        expect(n.goal).not.toBeNull();
        expect(n.fear).not.toBeNull();
        expect(n.quest_hooks.length).toBeGreaterThanOrEqual(1);
        expect(n.quest_hooks.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('labels rumors true exactly when the data backs them, with a mix of both', () => {
    let truths = 0;
    let lies = 0;
    for (const b of bundles) {
      for (const { rumor } of allRumors(b)) {
        expect(rumor.is_true).toBe(rumorTruth(b, rumor.subject_ref, rumor.claim_type) !== null);
        if (rumor.is_true) truths++; else lies++;
      }
    }
    expect(truths).toBeGreaterThan(500);
    expect(lies).toBeGreaterThan(500);
  });

  it('renders every prose field', () => {
    for (const b of bundles) {
      expect(b.planet.description.length).toBeGreaterThan(100);
      for (const n of Object.values(b.npcs)) {
        for (const text of [n.tagline, n.description, n.backstory, n.sample_greeting]) expect(text.length).toBeGreaterThan(1);
      }
    }
  });

  it('does not repeat the same tagline word for word across most entities', () => {
    const b = bundles[0];
    const taglines = Object.values(b.npcs).map((n) => n.tagline);
    expect(new Set(taglines).size / taglines.length).toBeGreaterThan(0.9);
    const descriptions = Object.values(b.settlements).map((s) => s.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
