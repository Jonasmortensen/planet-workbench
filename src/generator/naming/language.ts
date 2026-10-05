import { NAME_BLOCKLIST, NAME_STYLES } from '../content/naming/styles';
import type { Rng } from '../rng';
import type { Phonology } from '../types/entities';
import type { LanguageStyle } from '../types/enums';

type Weighted<T> = { value: T; weight: number };

function samplePool(rng: Rng, pool: Record<string, number>, keep: number, minKeep: number): Weighted<string>[] {
  const entries = Object.entries(pool).map(([value, weight]) => ({ value, weight }));
  let kept = entries.filter(() => rng.chance(keep));
  if (kept.length < minKeep) kept = rng.shuffle(entries).slice(0, Math.min(minKeep, entries.length));
  // Keep the "empty" option whenever the style has one, so open syllables stay possible.
  const empty = entries.find((e) => e.value === '');
  if (empty && !kept.some((e) => e.value === '')) kept.push(empty);
  return kept.map((e) => ({ value: e.value, weight: Math.round(e.weight * rng.float(0.6, 1.6) * 100) / 100 }));
}

/**
 * Build a concrete phonology from a style. Two languages of the same style
 * share sound inventory tendencies but differ in which sounds they favor,
 * their syllable shapes and their suffixes.
 */
export function buildPhonology(style: LanguageStyle, rng: Rng): Phonology {
  const def = NAME_STYLES[style];
  const jitter = (v: number) => Math.min(1, Math.max(0, Math.round((v + rng.float(-0.1, 0.1)) * 100) / 100));
  return {
    onsets: samplePool(rng, def.onsets, def.keep, 5),
    nuclei: samplePool(rng, def.nuclei, def.keep, 3),
    codas: samplePool(rng, def.codas, def.keep, 3),
    syllables: Object.entries(def.syllables).map(([n, w]) => ({ value: Number(n), weight: w * rng.float(0.6, 1.4) })),
    coda_chance: jitter(def.codaChance),
    final_coda_chance: jitter(def.finalCodaChance),
    apostrophe_chance: def.apostropheChance > 0 ? jitter(def.apostropheChance) : 0,
    reduplication_chance: def.reduplicationChance > 0 ? jitter(def.reduplicationChance) : 0,
    place_suffixes: rng.sample(def.placeSuffixes, 3),
    given_endings_female: rng.sample(def.givenFemale, 2),
    given_endings_male: rng.sample(def.givenMale, 2),
    given_endings_neutral: rng.sample(def.givenNeutral, 2),
    family_suffixes: rng.sample(def.familySuffixes, 3),
  };
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

function cleanup(word: string): string {
  let w = word.toLowerCase();
  // No more than two identical letters in a row.
  w = w.replace(/(.)\1{2,}/g, '$1$1');
  // No more than three vowels in a row.
  w = w.replace(/([aeiouy]{3})[aeiouy]+/g, '$1');
  // Apostrophes: never leading/trailing, never doubled, never next to another apostrophe.
  w = w.replace(/'+/g, "'").replace(/^'+|'+$/g, '');
  return w;
}

function capitalize(w: string): string {
  return w.length === 0 ? w : w[0].toUpperCase() + w.slice(1);
}

export function isBlocked(word: string): boolean {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  return NAME_BLOCKLIST.some((b) => lower.includes(b));
}

export interface RootOptions {
  minSyllables?: number;
  maxSyllables?: number;
}

/** A capitalized word built from the phonology. */
export function makeRoot(ph: Phonology, rng: Rng, opts: RootOptions = {}): string {
  const min = opts.minSyllables ?? 1;
  const max = opts.maxSyllables ?? 4;
  for (let attempt = 0; attempt < 30; attempt++) {
    const n = Math.min(max, Math.max(min, rng.weighted(ph.syllables)));
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const onset = rng.weighted(ph.onsets);
      const nucleus = rng.weighted(ph.nuclei);
      const coda = rng.chance(last ? ph.final_coda_chance : ph.coda_chance) ? rng.weighted(ph.codas) : '';
      parts.push(onset + nucleus + coda);
    }
    // Reduplication ("lalimo") only in longer words; "lili" would collide constantly.
    if (n >= 3 && rng.chance(ph.reduplication_chance)) parts[1] = parts[0];
    let word = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const sep = rng.chance(ph.apostrophe_chance) ? "'" : '';
      word += sep + parts[i];
    }
    word = cleanup(word);
    if (word.replace(/'/g, '').length < 2) continue;
    if (isBlocked(word)) continue;
    return capitalize(word);
  }
  // Extremely unlikely: fall back to a plain syllable pair.
  return capitalize(cleanup(rng.weighted(ph.onsets) + rng.weighted(ph.nuclei) + rng.weighted(ph.nuclei)));
}

/** Join a root and a suffix without awkward vowel or letter collisions. */
export function attachSuffix(root: string, suffix: string): string {
  if (!suffix) return root;
  if (/^[ \-']/.test(suffix)) return root + suffix;
  const last = root[root.length - 1].toLowerCase();
  const first = suffix[0].toLowerCase();
  if (VOWELS.has(last) && VOWELS.has(first)) return root.slice(0, -1) + suffix;
  if (last === first) return root + suffix.slice(1);
  return root + suffix;
}
