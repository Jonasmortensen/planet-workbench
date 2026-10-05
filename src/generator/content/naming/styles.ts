import type { LanguageStyle } from '../../types/enums';

type W = Record<string, number>;

/**
 * Phonology templates for each language style. A concrete language is built
 * from a style by sampling and re-weighting these pools (see naming/language.ts),
 * so every language of a style sounds related but distinct.
 *
 * Strings in onsets/nuclei/codas are joined directly; '' means "empty".
 */
export interface NameStyleDef {
  label: string;
  description: string;
  onsets: W;
  nuclei: W;
  codas: W;
  /** Syllables per root word. */
  syllables: Record<number, number>;
  /** Chance a non-final syllable has a coda. */
  codaChance: number;
  /** Chance the final syllable has a coda. */
  finalCodaChance: number;
  /** Chance of an apostrophe between two syllables. */
  apostropheChance: number;
  /** Chance a word repeats one of its syllables ("lalimo"). */
  reduplicationChance: number;
  /** Fraction of onsets/nuclei/codas each language keeps. */
  keep: number;
  placeSuffixes: string[];
  givenFemale: string[];
  givenMale: string[];
  givenNeutral: string[];
  familySuffixes: string[];
  /** Suffix for the language's own name ("Kethric"). */
  languageSuffixes: string[];
  /** How a full name is assembled. */
  nameOrder: 'given_family' | 'family_given' | 'given_only' | 'designation';
}

export const NAME_STYLES: Record<LanguageStyle, NameStyleDef> = {
  harsh: {
    label: 'Harsh',
    description: 'Consonant-heavy with hard stops and clusters.',
    onsets: { k: 4, kr: 3, t: 3, tr: 2, dr: 2, g: 2, gr: 2, v: 2, vr: 1.5, z: 1.5, br: 2, st: 2, sk: 1.5, th: 1, d: 2, b: 2, r: 1, kh: 1 },
    nuclei: { a: 3, o: 3, u: 2, e: 2, i: 1 },
    codas: { k: 3, rk: 2, th: 1.5, x: 1, rn: 1.5, st: 1.5, sk: 1, g: 1.5, r: 2, z: 1, n: 2, d: 1.5, rd: 1, v: 1 },
    syllables: { 1: 1, 2: 6, 3: 3 },
    codaChance: 0.4, finalCodaChance: 0.85, apostropheChance: 0, reduplicationChance: 0, keep: 0.8,
    placeSuffixes: ['orn', 'ask', 'vek', 'drim', 'kar', 'thul', 'gard', 'rok', 'mar', 'zek'],
    givenFemale: ['a', 'ka', 'ra', 've', 'na'],
    givenMale: ['ek', 'or', 'ul', 'an', 'rik'],
    givenNeutral: ['is', 'en', 'o'],
    familySuffixes: ['sk', 'ov', 'arn', 'ek', 'grad', 'vor'],
    languageSuffixes: ['ic', 'ak', 'osk'],
    nameOrder: 'given_family',
  },
  flowing: {
    label: 'Flowing',
    description: 'Vowel-rich, soft consonants and long words.',
    onsets: { '': 3, l: 4, s: 2, n: 3, m: 2, v: 3, th: 2, r: 3, h: 1.5, f: 1, y: 1.5, el: 1, ae: 0.5, c: 1, d: 1, sh: 0.6, ph: 0.5, w: 0.6, g: 0.5 },
    nuclei: { a: 4, e: 4, i: 3, o: 2, u: 1, ae: 1.5, ia: 2, ei: 1.5, ou: 1, ai: 1.5, io: 1 },
    codas: { '': 6, n: 2, l: 2, s: 1, r: 1.5, th: 0.5 },
    syllables: { 2: 3, 3: 5, 4: 2 },
    codaChance: 0.2, finalCodaChance: 0.45, apostropheChance: 0, reduplicationChance: 0, keep: 0.8,
    placeSuffixes: ['iel', 'aria', 'enne', 'ova', 'lis', 'ein', 'ael', 'ion', 'ara', 'ethe'],
    givenFemale: ['a', 'iel', 'ia', 'ene', 'ara', 'wen'],
    givenMale: ['ion', 'el', 'an', 'or', 'ias'],
    givenNeutral: ['ei', 'ae', 'is', 'ys'],
    familySuffixes: ['dell', 'ari', 'oren', 'ane', 'iath', 'iel'],
    languageSuffixes: ['in', 'ai', 'ean'],
    nameOrder: 'given_family',
  },
  clipped: {
    label: 'Clipped',
    description: 'Short, punchy, mostly closed syllables.',
    onsets: { b: 2, d: 2, j: 1.5, k: 2, m: 2, p: 2, t: 2, z: 1, h: 1.5, w: 1.5, s: 2, n: 1.5, f: 1, g: 1.5, l: 1.5, r: 1.5, ch: 1 },
    nuclei: { a: 3, e: 2, i: 2, o: 2.5, u: 2 },
    codas: { b: 1, d: 2, k: 2, m: 1.5, n: 2.5, p: 1.5, t: 2.5, x: 1, ss: 1, z: 1, g: 1, l: 1, sh: 0.8, ck: 0.5 },
    syllables: { 1: 1, 2: 7, 3: 2 },
    codaChance: 0.65, finalCodaChance: 0.9, apostropheChance: 0, reduplicationChance: 0, keep: 0.75,
    placeSuffixes: ['dak', 'pit', 'mun', 'bek', 'sto', 'hold', 'tun', 'gap', 'rax', 'ford'],
    givenFemale: ['a', 'i', 'ie', 'ett'],
    givenMale: ['o', 'ek', 'ad', 'us'],
    givenNeutral: ['', '', 'y', 'ix'],
    familySuffixes: ['er', 'son', 'ick', 'ard', 'em', 'ow'],
    languageSuffixes: ['ish', 'ic', 'an'],
    nameOrder: 'given_family',
  },
  melodic: {
    label: 'Melodic',
    description: 'Open syllables in sing-song rhythms, occasional repetition.',
    onsets: { l: 4, m: 3, n: 3, s: 2, t: 2, r: 2, v: 2, k: 2, d: 1.5, p: 1.5, sh: 1, y: 1, h: 1, w: 1, f: 1, b: 1, ny: 0.6, j: 0.8, z: 0.6 },
    nuclei: { a: 4, i: 3, o: 3, e: 2, u: 2, ai: 0.8, ei: 0.6, ao: 0.4, ia: 0.6, ea: 0.5 },
    codas: { '': 8, n: 2, m: 0.5, l: 0.8, r: 0.6 },
    syllables: { 2: 2, 3: 6, 4: 3 },
    codaChance: 0.12, finalCodaChance: 0.3, apostropheChance: 0, reduplicationChance: 0.15, keep: 0.9,
    placeSuffixes: ['ani', 'elu', 'ino', 'oma', 'ari', 'evo', 'ula', 'ita', 'omi', 'asa'],
    givenFemale: ['a', 'ani', 'ela', 'imi'],
    givenMale: ['o', 'ano', 'eru', 'imo'],
    givenNeutral: ['i', 'u', 'ene'],
    familySuffixes: ['lani', 'mori', 'vasi', 'tolu', 'nami', 'reko'],
    languageSuffixes: ['an', 'ese', 'i'],
    nameOrder: 'family_given',
  },
  guttural: {
    label: 'Guttural',
    description: 'Deep back-of-the-throat sounds, heavy codas.',
    onsets: { gh: 3, kh: 3, g: 2, gr: 2, '': 1.5, r: 1.5, d: 2, b: 2, m: 1.5, zh: 1, dr: 1, hr: 1, ug: 0.5, n: 1 },
    nuclei: { u: 4, o: 4, a: 3, uu: 1, oa: 0.8, e: 0.8, au: 0.6, i: 0.5 },
    codas: { g: 3, gg: 1, kh: 2, rg: 2, m: 2, mm: 0.8, rk: 1.5, n: 1.5, r: 2, d: 2, sh: 1, gh: 1.5, lk: 1 },
    syllables: { 1: 1, 2: 6, 3: 3 },
    codaChance: 0.4, finalCodaChance: 0.9, apostropheChance: 0, reduplicationChance: 0, keep: 0.85,
    placeSuffixes: ['ugg', 'mok', 'dur', 'ghar', 'rum', 'gorth', 'kul', 'mund', 'barr', 'zug'],
    givenFemale: ['a', 'ga', 'ra', 'ush'],
    givenMale: ['ug', 'ok', 'ur', 'gash'],
    givenNeutral: ['um', 'o', 'oth'],
    familySuffixes: ['gor', 'mak', 'durr', 'ghul', 'rak', 'bhor'],
    languageSuffixes: ['ugh', 'ar', 'uk'],
    nameOrder: 'family_given',
  },
  alien: {
    label: 'Alien',
    description: 'Unusual clusters, doubled vowels and apostrophes.',
    onsets: { x: 2, q: 3, zh: 2, tl: 2, k: 1, vh: 1.5, sr: 1, ch: 1, ts: 1.5, hl: 1, kt: 1, mn: 1, '': 1, xh: 1, ng: 1 },
    nuclei: { a: 3, i: 2.5, ii: 0.6, ai: 1, aa: 0.6, y: 2, e: 1.5, o: 1.5, ae: 0.6, uu: 0.6 },
    codas: { '': 3, q: 2, x: 1.5, tl: 1.5, k: 1.5, th: 1, zh: 1, rr: 1, ss: 1, kk: 1, n: 1, ql: 0.5 },
    syllables: { 1: 1, 2: 5, 3: 4 },
    codaChance: 0.3, finalCodaChance: 0.55, apostropheChance: 0.3, reduplicationChance: 0.05, keep: 0.75,
    placeSuffixes: ["'ka", 'ix', "'tl", 'qai', "'yr", 'oq', "'th", 'aax', "'ii", 'tzu'],
    givenFemale: ['ii', 'a', "'ai", 'yl'],
    givenMale: ['ax', 'oq', "'k", 'uu'],
    givenNeutral: ['', "'", 'y', 'ix'],
    familySuffixes: ["'tl", 'qa', "'xa", 'yrr', "'ot", 'kai'],
    languageSuffixes: ["'i", 'aq', "'yn"],
    nameOrder: 'given_family',
  },
  sibilant: {
    label: 'Sibilant',
    description: 'Hissing and whispering sounds, soft endings.',
    onsets: { s: 4, sh: 3, z: 2, zh: 1.5, sr: 1, sl: 1.5, th: 2, ch: 1, h: 1, ss: 1, sv: 1, ys: 0.5, n: 1, l: 1.2, v: 1, f: 0.6, r: 0.8 },
    nuclei: { a: 3, e: 3, i: 3, ee: 1, ia: 1.5, y: 1.5, ai: 1, o: 1 },
    codas: { s: 3, ss: 2, sh: 2, th: 2, z: 1.5, x: 1, n: 1.5, '': 2, l: 1.5, sk: 0.5 },
    syllables: { 2: 7, 3: 3 },
    codaChance: 0.25, finalCodaChance: 0.6, apostropheChance: 0.05, reduplicationChance: 0, keep: 0.75,
    placeSuffixes: ['esh', 'issa', 'ath', 'yss', 'ez', 'ishar', 'esse', 'azh', 'ith', 'shai'],
    givenFemale: ['issa', 'eth', 'ys', 'iel'],
    givenMale: ['ash', 'esz', 'iss', 'oth'],
    givenNeutral: ['is', 'eh', 'ys'],
    familySuffixes: ['sseth', 'ashi', 'ezar', 'issh', 'eth', 'azh'],
    languageSuffixes: ['ish', 'esh', 'ai'],
    nameOrder: 'given_family',
  },
  mechanical: {
    label: 'Mechanical',
    description: 'Clipped roots paired with serial designations.',
    onsets: { k: 3, t: 3, v: 2, x: 2, z: 2, r: 2, n: 2, d: 2, s: 2, p: 1.5, q: 1, c: 1, tr: 1, kr: 1, m: 1.5, l: 1.5 },
    nuclei: { a: 3, e: 3, i: 2, o: 2, y: 1.5, u: 1 },
    codas: { x: 2, n: 3, r: 2, k: 2, t: 2, s: 1.5, v: 1, l: 1, '': 1 },
    syllables: { 1: 1, 2: 6, 3: 3 },
    codaChance: 0.6, finalCodaChance: 0.9, apostropheChance: 0, reduplicationChance: 0, keep: 0.9,
    placeSuffixes: ['-1', '-7', '-9', ' Node', ' Relay', ' Array', ' Prime', '-0', ' Hub', ' Core'],
    givenFemale: [''],
    givenMale: [''],
    givenNeutral: [''],
    familySuffixes: ['-series', '-line', '-mark', '-set'],
    languageSuffixes: ['-code', 'ic', '-tongue'],
    nameOrder: 'designation',
  },
};

/**
 * Substrings that generated words must never contain: real-world words that
 * read badly and names from existing fiction. Checked case-insensitively.
 */
export const NAME_BLOCKLIST = [
  'fuck', 'shit', 'cunt', 'nazi', 'rape', 'nigg', 'fag', 'piss', 'dick', 'cock', 'slut', 'whor', 'kkk',
  'vulcan', 'klingon', 'romulan', 'jedi', 'sith', 'wookie', 'wookiee', 'hobbit', 'dalek', 'krogan', 'asari',
  'turian', 'zerg', 'protoss', 'borg', 'ewok', 'hutt', 'tatooine', 'gondor', 'mordor', 'arrakis',
  'tolkien', 'sauron', 'vader', 'yoda', 'eldar', 'tyranid', 'covenant', 'gallifrey', 'trantor',
  'narnia', 'westeros', 'hyrule', 'azeroth', 'kaled', 'ferengi', 'cardass', 'bajor', 'quarian', 'salarian',
  'female', 'penis', 'anus', 'butt',
];
