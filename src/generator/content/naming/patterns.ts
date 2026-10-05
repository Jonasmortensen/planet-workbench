/**
 * Naming patterns. Slots:
 *   {root}       a word generated from the relevant language
 *   {Root2}      a second generated word
 *   {adjective}  from ADJECTIVES
 *   {noun}       from NOUNS
 *   {landform}   from LANDFORMS
 *   {feature}    a feature-specific noun (FEATURE_TABLE nouns)
 *   {gov}        government noun
 *   {epithet}    from EPITHETS
 *   {name}       an already generated name
 *   {numeral}    roman numeral
 * Each pattern has a weight.
 */
export interface NamePattern {
  pattern: string;
  weight: number;
}

export const PLANET_NAME_PATTERNS: NamePattern[] = [
  { pattern: '{root}', weight: 10 },
  { pattern: '{system} {numeral}', weight: 3 },
  { pattern: 'New {root}', weight: 1 },
  { pattern: '{root} {numeral}', weight: 1 },
  { pattern: "{root}'s World", weight: 0.6 },
  { pattern: '{adjective} {root}', weight: 0.6 },
];

export const STAR_SYSTEM_PATTERNS: NamePattern[] = [
  { pattern: '{root}', weight: 8 },
  { pattern: '{root} Major', weight: 1 },
  { pattern: '{root} Minor', weight: 1 },
  { pattern: '{adjective} {root}', weight: 1 },
];

export const FEATURE_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {adjective} {feature}', weight: 5 },
  { pattern: 'the {root} {feature}', weight: 5 },
  { pattern: 'the {feature} of {root}', weight: 3 },
  { pattern: '{root}', weight: 1 },
  { pattern: "{root}'s {feature}", weight: 2 },
];

export const MOON_NAME_PATTERNS: NamePattern[] = [
  { pattern: '{root}', weight: 8 },
  { pattern: 'the {adjective} Moon', weight: 1 },
  { pattern: '{adjective} {root}', weight: 1 },
];

export const WORLD_GOVERNMENT_PATTERNS: NamePattern[] = [
  { pattern: '{native} {gov}', weight: 5 },
  { pattern: 'The {gov} of {native}', weight: 4 },
  { pattern: 'The {adjective} {gov}', weight: 2 },
  { pattern: 'United {gov} of {native}', weight: 1.5 },
];

export const MEGASTRUCTURE_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {adjective} {mega}', weight: 4 },
  { pattern: 'the {root} {mega}', weight: 4 },
  { pattern: '{root}', weight: 1 },
  { pattern: "{root}'s {mega}", weight: 1 },
];

export const RELIGION_NAME_PATTERNS: Record<'theistic' | 'mystic' | 'secular' | 'folk', NamePattern[]> = {
  theistic: [
    { pattern: 'The Faith of {focus}', weight: 4 },
    { pattern: 'Church of the {adjective} {noun}', weight: 3 },
    { pattern: 'Children of {focus}', weight: 2 },
    { pattern: 'The {focus} Covenant', weight: 2 },
    { pattern: '{focus}ism', weight: 1.5 },
  ],
  mystic: [
    { pattern: 'The {adjective} Path', weight: 3 },
    { pattern: 'The Way of the {noun}', weight: 3 },
    { pattern: 'The {root} Mysteries', weight: 2 },
    { pattern: 'Seekers of the {adjective} {noun}', weight: 1.5 },
  ],
  secular: [
    { pattern: 'The {root} Doctrine', weight: 3 },
    { pattern: '{adjective} {noun} Thought', weight: 2 },
    { pattern: 'The {noun} Principles', weight: 2 },
    { pattern: '{root}ism', weight: 2 },
    { pattern: 'The {adjective} Manifesto', weight: 1 },
  ],
  folk: [
    { pattern: 'The Old Ways', weight: 1 },
    { pattern: 'The {root} Rites', weight: 3 },
    { pattern: 'The Speaking of the {noun}', weight: 2 },
    { pattern: 'The {adjective} Hearth', weight: 2 },
  ],
};
