import type { Aesthetic, CultureValue, Custom, Industry, ResourceType, TradeGood } from '../types/enums';
import type { WeightedDef } from './constraints';
import type { NamePattern } from './naming/patterns';

export interface IndustryDef extends WeightedDef {
  goods: TradeGood[];
  /** Resources that make this industry much more likely (x3 each). */
  resources?: ResourceType[];
}

export const INDUSTRY_TABLE: Record<Industry, IndustryDef> = {
  agriculture: { weight: 8, goods: ['grain', 'preserved_food'], resources: ['fertile_soil'], constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  fishing: { weight: 4, goods: ['preserved_food', 'luxury_food'], resources: ['fish'], constraints: { requiresLiquidWater: true, biospheres: ['complex', 'lush', 'exotic'] } },
  mining: { weight: 6, goods: ['iron', 'copper', 'precious_metals', 'rare_earths', 'gemstones'], resources: ['iron', 'copper', 'precious_metals', 'rare_earths', 'gemstones', 'uranium'] },
  forestry: { weight: 3, goods: ['timber'], resources: ['timber'], constraints: { anyBiome: ['temperate_forest', 'rainforest', 'boreal_forest', 'fungal_forest'] } },
  manufacturing: { weight: 5, goods: ['machinery', 'electronics', 'textiles'], constraints: { minTech: 4 } },
  shipbuilding: { weight: 2, goods: ['starship_parts', 'machinery'], constraints: { minTech: 3 } },
  trade: { weight: 6, goods: ['luxury_goods', 'spices'] },
  finance: { weight: 2, goods: ['data'], constraints: { minTech: 4 } },
  tourism: { weight: 2, goods: ['tourism'], constraints: { minTech: 5 } },
  research: { weight: 2, goods: ['data', 'medicine'], constraints: { minTech: 5 } },
  mercenary_work: { weight: 1.5, goods: ['labor', 'weapons'] },
  crafts: { weight: 5, goods: ['crafts', 'art'] },
  herding: { weight: 4, goods: ['livestock', 'textiles'], resources: ['livestock'], constraints: { biospheres: ['complex', 'lush'], maxTech: 7 } },
  energy: { weight: 3, goods: ['fuel', 'fusion_fuel'], resources: ['hydrocarbons', 'helium3', 'deuterium', 'geothermal_energy', 'uranium'], constraints: { minTech: 4 } },
  biotech: { weight: 2, goods: ['bio_compounds', 'medicine'], resources: ['bio_compounds', 'medicinal_flora', 'living_alloy'], constraints: { minTech: 6 } },
  salvage: { weight: 2, goods: ['machinery', 'relics'], resources: ['precursor_relics'] },
  entertainment: { weight: 2, goods: ['art', 'tourism'], constraints: { minTech: 3 } },
  pilgrimage: { weight: 1.5, goods: ['tourism', 'crafts'] },
  smuggling: { weight: 1.5, goods: ['narcotics', 'weapons'] },
  data_services: { weight: 2, goods: ['data', 'electronics'], constraints: { minTech: 6 } },
  arms: { weight: 2, goods: ['weapons'], constraints: { minTech: 2 } },
  textiles: { weight: 3, goods: ['textiles'], resources: ['fibers', 'livestock'] },
  construction: { weight: 3, goods: ['stone', 'machinery'], resources: ['stone'] },
  education: { weight: 1.5, goods: ['data'], constraints: { minTech: 3 } },
  medicine: { weight: 2, goods: ['medicine'], resources: ['medicinal_flora', 'bio_compounds'] },
  relic_hunting: { weight: 1, goods: ['relics', 'exotic_matter'], resources: ['precursor_relics', 'exotic_matter'], constraints: { requiresPrecursors: true } },
};

export interface CultureValueDef {
  weight: number;
  /** Noun used in mottos ("Honor and Iron"). */
  noun: string;
}

export const CULTURE_VALUE_TABLE: Record<CultureValue, CultureValueDef> = {
  honor: { weight: 4, noun: 'Honor' },
  tradition: { weight: 5, noun: 'Tradition' },
  progress: { weight: 3, noun: 'Progress' },
  freedom: { weight: 3, noun: 'Freedom' },
  order: { weight: 3, noun: 'Order' },
  faith: { weight: 4, noun: 'Faith' },
  family: { weight: 4, noun: 'Kin' },
  wealth: { weight: 3, noun: 'Prosperity' },
  knowledge: { weight: 3, noun: 'Knowledge' },
  strength: { weight: 3, noun: 'Strength' },
  harmony: { weight: 2, noun: 'Harmony' },
  community: { weight: 3, noun: 'Unity' },
  independence: { weight: 2, noun: 'Independence' },
  loyalty: { weight: 3, noun: 'Loyalty' },
  justice: { weight: 3, noun: 'Justice' },
  beauty: { weight: 2, noun: 'Beauty' },
  ambition: { weight: 2, noun: 'Ambition' },
  hospitality: { weight: 2, noun: 'Hospitality' },
  survival: { weight: 2, noun: 'Endurance' },
  curiosity: { weight: 2, noun: 'Wonder' },
  discipline: { weight: 2, noun: 'Discipline' },
  compassion: { weight: 2, noun: 'Mercy' },
  glory: { weight: 2, noun: 'Glory' },
  nature: { weight: 2, noun: 'the Living World' },
  craftsmanship: { weight: 2, noun: 'Craft' },
  secrecy: { weight: 1, noun: 'Silence' },
};

export const CUSTOM_TABLE: Record<Custom, WeightedDef> = {
  ritual_greetings: { weight: 4 },
  gift_exchange: { weight: 4 },
  ancestor_shrines: { weight: 3 },
  communal_meals: { weight: 4 },
  blood_oaths: { weight: 2, constraints: { maxTech: 7 } },
  masked_festivals: { weight: 3 },
  storytelling_nights: { weight: 3 },
  pilgrimages: { weight: 2 },
  coming_of_age_trials: { weight: 3 },
  tattooed_lineages: { weight: 2 },
  ritual_duels: { weight: 2 },
  fasting_seasons: { weight: 2 },
  sky_burials: { weight: 1.5, constraints: { requiresAtmosphere: true } },
  name_taboos: { weight: 1.5 },
  guest_right: { weight: 3 },
  song_contests: { weight: 2 },
  tea_ceremonies: { weight: 2, constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  silent_days: { weight: 1.5 },
  star_vigils: { weight: 2 },
  trade_blessings: { weight: 2 },
  beast_bonding: { weight: 1.5, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  debt_ledgers: { weight: 1.5 },
  mourning_colors: { weight: 2 },
  water_sharing: { weight: 2 },
  machine_naming: { weight: 1.5, constraints: { minTech: 5 } },
};

export const AESTHETIC_TABLE: Record<Aesthetic, WeightedDef> = {
  brutalist: { weight: 3, constraints: { minTech: 4 } },
  ornate: { weight: 4 },
  organic: { weight: 3 },
  minimalist: { weight: 3, constraints: { minTech: 3 } },
  gothic: { weight: 2, constraints: { minTech: 2 } },
  crystalline: { weight: 1, constraints: { anyBiome: ['crystal_fields', 'shard_fields', 'glass_plains'] } },
  ramshackle: { weight: 3 },
  industrial: { weight: 3, constraints: { minTech: 4 } },
  pastoral: { weight: 3, constraints: { maxTech: 7 } },
  monumental: { weight: 3 },
  neon: { weight: 2, constraints: { minTech: 6 } },
  nomadic: { weight: 2, constraints: { maxTech: 6 } },
  austere: { weight: 3 },
  baroque: { weight: 2, constraints: { minTech: 2 } },
  biomechanical: { weight: 1, constraints: { minTech: 7 } },
  stilted: { weight: 2 },
  terraced: { weight: 2 },
  ancestral: { weight: 2 },
  salvaged: { weight: 2 },
  luminous: { weight: 1.5, constraints: { minTech: 5 } },
};

// ---------------------------------------------------------------------------
// Country naming and symbols
// ---------------------------------------------------------------------------

/** Country names. {state} is a state noun from the government type. */
export const COUNTRY_NAME_PATTERNS: NamePattern[] = [
  { pattern: '{root}', weight: 5 },
  { pattern: '{state} of {root}', weight: 4 },
  { pattern: '{root} {state}', weight: 2 },
  { pattern: 'The {adjective} {state}', weight: 1 },
  { pattern: '{adjective} {root}', weight: 0.8 },
];

/** Demonym suffixes by the ending of the root (vowel or consonant). */
export const DEMONYM_SUFFIXES = {
  vowel: ['n', 'ns', 'ri', 'th', 'sh'],
  consonant: ['i', 'ian', 'ese', 'ar', 'ite', 'ic', 'en'],
};

export const MOTTO_PATTERNS: NamePattern[] = [
  { pattern: '{value1} and {value2}', weight: 4 },
  { pattern: '{value1} above all', weight: 2 },
  { pattern: 'Through {value1}, {value2}', weight: 3 },
  { pattern: 'In {value1} we endure', weight: 2 },
  { pattern: '{value1}, {value2}, {value3}', weight: 2 },
  { pattern: 'By {value1} alone', weight: 1.5 },
  { pattern: 'Ever {value1}', weight: 1 },
];

export const FLAG_COLORS = [
  'crimson', 'gold', 'white', 'black', 'azure', 'emerald', 'violet', 'silver', 'amber', 'ochre', 'teal',
  'scarlet', 'ivory', 'indigo', 'rust', 'sky blue', 'forest green', 'gray', 'copper', 'rose',
];

export const FLAG_LAYOUTS = [
  'a field of {c1}', 'horizontal bands of {c1} and {c2}', 'vertical bands of {c1} and {c2}', 'a {c1} field split diagonally with {c2}',
  'a {c1} field with a {c2} border', 'quarters of {c1} and {c2}', 'a {c1} field with a {c2} chevron', 'a {c1} disc on {c2}',
  'three stripes of {c1}, {c2} and {c1}', 'a {c1} cross on {c2}',
];

export const FLAG_EMBLEMS: Record<'default' | 'faith' | 'martial' | 'trade' | 'knowledge' | 'nature', string[]> = {
  default: ['star', 'crescent', 'tower', 'key', 'wheel', 'crown', 'circle of stars', 'open hand', 'eye', 'spiral'],
  faith: ['sacred flame', 'radiant eye', 'open book', 'halo', 'twin candles'],
  martial: ['crossed blades', 'fist', 'shield', 'spear', 'helm', 'hound'],
  trade: ['scales', 'coin', 'ship', 'ledger', 'lantern'],
  knowledge: ['quill', 'lens', 'gear', 'compass', 'star chart'],
  nature: ['tree', 'leaf', 'wave', 'mountain', 'beast', 'sun'],
};

export const CURRENCY_NOUNS = ['Mark', 'Crown', 'Shell', 'Bit', 'Scrip', 'Ring', 'Talent', 'Bar', 'Credit', 'Chit', 'Weight', 'Stamp'];

export const CURRENCY_PATTERNS: NamePattern[] = [
  { pattern: '{root}', weight: 4 },
  { pattern: '{root} {coin}', weight: 3 },
  { pattern: '{coin}', weight: 1 },
  { pattern: '{adjective} {coin}', weight: 1 },
];
