import type { Template, TemplateGroups } from '../content/prose/templates';
import type { Rng } from '../rng';

/**
 * Template engine shared by all prose fields (and, later, dialogue lines).
 *
 *   {slot}          slot value; a missing slot is an error so broken templates fail tests
 *   {slot|a|cap}    modifiers, applied left to right: a (a/an), cap, lower
 *   [ ... ]         optional segment, dropped if any slot inside is missing or empty
 *   <sing/plur>     verb agreement with the subject (plural for "they")
 *   when            facts that must match for a template to be eligible
 */
export interface RenderContext {
  facts: Record<string, string>;
  slots: Record<string, string | undefined>;
  plural?: boolean;
}

export class TemplateError extends Error {}

function eligible(templates: readonly Template[], facts: Record<string, string>): Template[] {
  return templates.filter((t) => !t.when || Object.entries(t.when).every(([k, vals]) => vals.includes(facts[k])));
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) && !/^(uni|use|eu|one)/i.test(word) ? `an ${word}` : `a ${word}`;
}

function applyModifiers(value: string, mods: string[]): string {
  let v = value;
  for (const m of mods) {
    if (m === 'a') v = article(v);
    else if (m === 'cap') v = v.charAt(0).toUpperCase() + v.slice(1);
    else if (m === 'lower') v = v.charAt(0).toLowerCase() + v.slice(1);
    else throw new TemplateError(`Unknown modifier |${m}`);
  }
  return v;
}

const SLOT = /\{(\w+)((?:\|\w+)*)\}/g;

function present(ctx: RenderContext, name: string): boolean {
  const v = ctx.slots[name];
  return v !== undefined && v !== '';
}

/** Fill one template string. */
export function fill(text: string, ctx: RenderContext): string {
  // Optional segments (no nesting).
  let out = text.replace(/\[([^[\]]*)\]/g, (_m, inner: string) => {
    const names = [...inner.matchAll(SLOT)].map((m) => m[1]);
    return names.every((n) => present(ctx, n)) ? inner : '';
  });
  out = out.replace(/<([^/<>]*)\/([^/<>]*)>/g, (_m, sing: string, plur: string) => (ctx.plural ? plur : sing));
  out = out.replace(SLOT, (_m, name: string, modStr: string) => {
    const v = ctx.slots[name];
    if (v === undefined) throw new TemplateError(`Missing slot {${name}} in "${text}"`);
    return applyModifiers(v, modStr ? modStr.slice(1).split('|') : []);
  });
  return tidy(out);
}

/** Collapse doubled spaces and stray punctuation left by dropped segments. */
export function tidy(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/([.!?])\s*\./g, '$1')
    // Names like "The Ashen Hall" read "the Ashen Hall" mid-sentence.
    .replace(/([^.!?:“"\s]\s)The (?=[A-Z])/g, '$1the ')
    .trim();
}

/** Pick one eligible template by weight and fill it. */
export function render(rng: Rng, templates: readonly Template[], ctx: RenderContext): string {
  const pool = eligible(templates, ctx.facts);
  if (pool.length === 0) throw new TemplateError(`No eligible template for facts ${JSON.stringify(ctx.facts)}`);
  const t = rng.weighted(pool.map((x) => ({ value: x, weight: x.weight ?? 1 })));
  return fill(t.text, ctx);
}

/** Render each sentence group and join the non-empty sentences into a paragraph. */
export function renderGroups(rng: Rng, groups: TemplateGroups, ctx: RenderContext): string {
  return groups
    .map((g, i) => render(rng.fork(`group:${i}`), g, ctx))
    .filter((s) => s.length > 0)
    .join(' ');
}

/** Join items as natural-language lists: "a", "a and b", "a, b and c". */
export function listOf(items: readonly string[]): string {
  const xs = items.filter((x) => x);
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
