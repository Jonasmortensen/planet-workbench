import { FEAR_PHRASE, GOAL_PHRASE, SECRET_PHRASE } from '../content/prose/lexicon';
import type { Motive, Npc, PlanetBundle } from '../types/entities';
import type { FearType, GoalType, SecretType } from '../types/enums';
import { entityName } from '../types/ids';
import { fill, listOf } from './engine';

/** Small text helpers for renderers. All inputs are structured data; nothing here invents facts. */

export function words(value: string): string {
  return value.replace(/_/g, ' ');
}

export function populationWords(n: number): string {
  const fmt = (x: number) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1).replace(/\.0$/, '') : x.toFixed(2).replace(/\.?0+$/, ''));
  if (n >= 1e12) return `${fmt(n / 1e12)} trillion`;
  if (n >= 1e9) return `${fmt(n / 1e9)} billion`;
  if (n >= 1e6) return `${fmt(n / 1e6)} million`;
  if (n >= 1e4) return `${fmt(n / 1e3)} thousand`;
  return n.toLocaleString('en-US');
}

export function yearsAgo(date: number): string {
  const y = -date;
  if (y <= 1) return 'last year';
  return `${y.toLocaleString('en-US')} years ago`;
}

export function yearsShort(date: number): string {
  const y = -date;
  return y <= 1 ? 'a year' : `${y.toLocaleString('en-US')} years`;
}

export function tempWords(c: number): string {
  return `${c < 0 ? 'minus ' : ''}${Math.abs(c)} degrees`;
}

export interface Pronouns {
  they: string;
  them: string;
  their: string;
  plural: boolean;
}

export function pronounsFor(n: Pick<Npc, 'gender'>): Pronouns {
  if (n.gender === 'female') return { they: 'she', them: 'her', their: 'her', plural: false };
  if (n.gender === 'male') return { they: 'he', them: 'him', their: 'his', plural: false };
  return { they: 'they', them: 'them', their: 'their', plural: true };
}

/** Organizations read as "it". */
export const IT: Pronouns = { they: 'it', them: 'it', their: 'its', plural: false };

function targetName(b: PlanetBundle, m: Motive<string>): string | null {
  const id = m.target_npc_id ?? m.target_org_id ?? m.target_settlement_id ?? m.target_country_id;
  return id ? entityName(b, id) : null;
}

function phrase(b: PlanetBundle, m: Motive<string>, table: { target: string; alone: string }, p: Pronouns): string {
  const target = targetName(b, m);
  return fill(target ? table.target : table.alone, {
    facts: {}, plural: p.plural,
    slots: { target: target ?? '', they: p.they, them: p.them, their: p.their },
  });
}

export function goalPhrase(b: PlanetBundle, m: Motive<GoalType>, p: Pronouns): string {
  return phrase(b, m, GOAL_PHRASE[m.type], p);
}

export function fearPhrase(b: PlanetBundle, m: Motive<FearType>, p: Pronouns): string {
  return phrase(b, m, FEAR_PHRASE[m.type], p);
}

export function secretPhrase(b: PlanetBundle, m: Motive<SecretType>, p: Pronouns): string {
  return phrase(b, m, SECRET_PHRASE[m.type], p);
}

export { listOf };
