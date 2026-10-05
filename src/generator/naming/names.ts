import { NAME_STYLES } from '../content/naming/styles';
import type { NamePattern } from '../content/naming/patterns';
import type { Rng } from '../rng';
import type { Language, Phonology } from '../types/entities';
import type { Gender, LanguageStyle } from '../types/enums';
import { attachSuffix, makeRoot } from './language';

/** Place name in a language: a root, often with one of the language's place suffixes. */
export function makePlaceName(ph: Phonology, rng: Rng): string {
  if (rng.chance(0.45)) {
    // Suffixed roots stay short: one syllable more than the language's shortest words.
    const shortest = Math.min(...ph.syllables.map((s) => s.value));
    return attachSuffix(makeRoot(ph, rng, { minSyllables: 1, maxSyllables: shortest + 1 }), rng.pick(ph.place_suffixes));
  }
  return makeRoot(ph, rng, { minSyllables: 2, maxSyllables: 4 });
}

export function makeGivenName(ph: Phonology, rng: Rng, gender: Gender): string {
  const endings =
    gender === 'female' ? ph.given_endings_female : gender === 'male' ? ph.given_endings_male : ph.given_endings_neutral;
  if (rng.chance(0.5)) return attachSuffix(makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 2 }), rng.pick(endings));
  return makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 3 });
}

export function makeFamilyName(ph: Phonology, rng: Rng): string {
  if (rng.chance(0.5)) return attachSuffix(makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 2 }), rng.pick(ph.family_suffixes));
  return makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 3 });
}

/** A bare root with no suffix, for compound names ("the {root} Canyon"). */
export function makeBareName(ph: Phonology, rng: Rng, maxSyllables = 3): string {
  return makeRoot(ph, rng, { minSyllables: 1, maxSyllables });
}

export interface PersonName {
  given: string;
  family: string;
  full: string;
}

export function makePersonName(lang: Pick<Language, 'phonology' | 'style'>, rng: Rng, gender: Gender): PersonName {
  const ph = lang.phonology;
  const order = NAME_STYLES[lang.style].nameOrder;
  if (order === 'designation') {
    const given = makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 2 });
    const family = `${makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 2 })}-${rng.int(1, 999)}`;
    return { given, family, full: `${given} ${family}` };
  }
  const given = makeGivenName(ph, rng, gender);
  if (order === 'given_only') return { given, family: '', full: given };
  const family = makeFamilyName(ph, rng);
  return { given, family, full: order === 'family_given' ? `${family} ${given}` : `${given} ${family}` };
}

export function makeLanguageName(ph: Phonology, style: LanguageStyle, rng: Rng): string {
  const root = makeRoot(ph, rng, { minSyllables: 1, maxSyllables: 2 });
  return attachSuffix(root, rng.pick(NAME_STYLES[style].languageSuffixes));
}

/**
 * Fill a "{slot}" pattern. Slot providers are called lazily, only for slots
 * the chosen pattern uses. Unknown slots are left as-is so tests can spot them.
 */
export function fillPattern(pattern: string, slots: Record<string, () => string>): string {
  return pattern.replace(/\{(\w+)\}/g, (match, key: string) => (slots[key] ? slots[key]() : match));
}

export function pickPattern(rng: Rng, patterns: NamePattern[]): string {
  return rng.weighted(patterns.map((p) => ({ value: p.pattern, weight: p.weight })));
}
