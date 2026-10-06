import type { Possession, SecretType, SpecialAbilityType, TreasureCategory, Visibility } from '../types/enums';
import type { NamePattern } from './naming/patterns';

/**
 * Treasures: rare, valuable or dangerous things worth a journey. Physical
 * treasures get coined names; knowledge, intel, leverage, access and maps are
 * built from facts already in the bundle and named after their subjects.
 *
 * Name slots: {epithet} {noun} {root}, and per kind {subject} {npc} {target}
 * {org} {family} {resource} {feature}.
 */
export interface TreasureCategoryDef {
  /** Must name the real entities it is about (subject_refs). */
  needsSubject: boolean;
  /** How widely its existence is known. */
  visibility: Partial<Record<Visibility, number>>;
}

export const TREASURE_TABLE: Record<TreasureCategory, TreasureCategoryDef> = {
  weapon: { needsSubject: false, visibility: { public: 3, discreet: 2, secret: 1 } },
  armor: { needsSubject: false, visibility: { public: 3, discreet: 2, secret: 1 } },
  artifact: { needsSubject: false, visibility: { public: 2, discreet: 2, secret: 2 } },
  technology: { needsSubject: false, visibility: { public: 1, discreet: 2, secret: 2 } },
  resource: { needsSubject: false, visibility: { public: 3, discreet: 2, secret: 1 } },
  wealth: { needsSubject: false, visibility: { public: 2, discreet: 3, secret: 2 } },
  relic: { needsSubject: false, visibility: { public: 4, discreet: 2, secret: 1 } },
  knowledge: { needsSubject: true, visibility: { public: 2, discreet: 3, secret: 2 } },
  intel: { needsSubject: true, visibility: { discreet: 2, secret: 4 } },
  leverage: { needsSubject: true, visibility: { secret: 1 } },
  access: { needsSubject: true, visibility: { public: 1, discreet: 3, secret: 2 } },
  map: { needsSubject: true, visibility: { public: 1, discreet: 3, secret: 2 } },
};

export const TREASURE_EPITHETS = [
  'Ashen', 'Weeping', 'Hollow', 'Ninth', 'Sunforged', 'Silent', 'Crimson', 'Starless', 'Drowned', 'Gilded', 'Black',
  'Pale', 'Shattered', 'Undying', 'Last', 'Thousand-Year', 'Iron', 'Glass', 'Burning', 'Sleeping', 'Widow’s',
  'Oathbound', 'Moonlit', 'Sorrowing', 'Bright', 'Forgotten', 'Twin', 'Hungering', 'Veiled', 'First',
];

/** Physical nouns per category, by tech band: [low (0-3), mid (4-6), high (7+)]. */
export const TREASURE_NOUNS: Partial<Record<TreasureCategory, [string[], string[], string[]]>> = {
  weapon: [
    ['Blade', 'Spear', 'Bow', 'Axe', 'Warhammer', 'Glaive', 'Sling'],
    ['Saber', 'Musket', 'Rapier', 'Carbine', 'Repeater', 'Cutlass'],
    ['Coilgun', 'Monoblade', 'Arc Lance', 'Rail Rifle', 'Plasma Pistol', 'Singing Blade'],
  ],
  armor: [
    ['Hauberk', 'Aegis', 'Helm', 'Shield', 'Scale Coat'],
    ['Cuirass', 'Breastplate', 'Plate Harness', 'Gas Mask'],
    ['Exoshell', 'Aegis Suit', 'Field Harness', 'Ghost Weave', 'Hardsuit'],
  ],
  artifact: [
    ['Orb', 'Lens', 'Idol', 'Prism', 'Cipher Stone', 'Mask', 'Sigil Stone'],
    ['Orb', 'Engine', 'Lens', 'Idol', 'Prism', 'Lattice'],
    ['Engine', 'Lattice', 'Seed', 'Prism', 'Heartstone', 'Gate Shard'],
  ],
  technology: [
    ['Astrolabe', 'Water Clock', 'Loom', 'Lodestone Compass', 'Fire Recipe'],
    ['Difference Engine', 'Prototype Engine', 'Wireless Set', 'Calculating Machine', 'Armored Vehicle'],
    ['Prototype Drive', 'Neural Lattice', 'Quantum Lock', 'Fabricator Core', 'AI Kernel', 'Stealth Skiff'],
  ],
  wealth: [
    ['Hoard', 'Strongbox', 'Treasury', 'Coffer', 'Crown Jewels'],
    ['Strongbox', 'Bearer Bonds', 'Vault', 'Gold Reserve', 'Jewel Case'],
    ['Credit Vault', 'Bearer Shares', 'Data-Locked Fortune', 'Reserve', 'Jewel Case'],
  ],
  relic: [
    ['Reliquary', 'Bones', 'Chalice', 'Crown', 'Shroud', 'Icon', 'Censer'],
    ['Reliquary', 'Bones', 'Chalice', 'Shroud', 'Icon', 'Codex'],
    ['Reliquary', 'Bones', 'Icon', 'Shroud', 'Memory Crystal', 'Codex'],
  ],
};

export const PHYSICAL_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {epithet} {noun}', weight: 4 },
  { pattern: "{root}'s {noun}", weight: 2 },
  { pattern: 'the {noun} of {root}', weight: 2 },
];

export const WEALTH_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {family} {noun}', weight: 3 },
  { pattern: 'the {epithet} {noun}', weight: 2 },
  { pattern: "{root}'s {noun}", weight: 1 },
];

export const RELIC_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {epithet} {noun} of {subject}', weight: 3 },
  { pattern: 'the {noun} of Saint {root}', weight: 2 },
  { pattern: 'the {epithet} {noun}', weight: 1 },
];

export const RESOURCE_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {root} {resource} Hoard', weight: 2 },
  { pattern: 'a Cache of {epithet} {resource}', weight: 2 },
  { pattern: 'the Lost {resource} Shipment', weight: 1 },
  { pattern: 'the {resource} Mother Lode', weight: 1 },
];

/** Leverage: evidence of an NPC's secret. {npc} is the NPC, {target} the secret's target if any. */
export const LEVERAGE_NAMES: Record<SecretType, NamePattern[]> = {
  secret_leadership: [{ pattern: "{npc}'s Letters to {target}", weight: 3 }, { pattern: 'the Oath Roll of {target}', weight: 1 }],
  hidden_identity: [{ pattern: "{npc}'s True Birth Record", weight: 2 }, { pattern: 'the Other Name of {npc}', weight: 1 }],
  affair: [{ pattern: "{npc}'s Love Letters", weight: 2 }, { pattern: "Letters Between {npc} and {target}", weight: 2 }],
  past_crime: [{ pattern: "Proof of {npc}'s Crime", weight: 2 }, { pattern: "the Old Warrant for {npc}", weight: 1 }],
  crippling_debt: [{ pattern: "{npc}'s Notes of Debt", weight: 2 }, { pattern: "the Ledger of {npc}'s Debts", weight: 1 }],
  forbidden_faith: [{ pattern: "{npc}'s Prayer Book", weight: 2 }, { pattern: "{npc}'s Hidden Altar Token", weight: 1 }],
  double_agent: [{ pattern: "{npc}'s Cipher Letters", weight: 2 }, { pattern: "{npc}'s Reports to {target}", weight: 2 }],
  illegitimate_child: [{ pattern: "the Birth Record of {npc}'s Child", weight: 2 }],
  stolen_wealth: [{ pattern: "{npc}'s Second Ledger", weight: 2 }, { pattern: 'the Missing Accounts of {target}', weight: 1 }],
  false_credentials: [{ pattern: "{npc}'s Forged Diplomas", weight: 2 }, { pattern: "the Forger's Receipt", weight: 1 }],
  addiction: [{ pattern: "{npc}'s Supplier's Ledger", weight: 2 }],
  murder: [{ pattern: 'the Bloodied Knife', weight: 1 }, { pattern: "the Witness Statement Against {npc}", weight: 2 }],
  forbidden_power: [{ pattern: "{npc}'s Testing Records", weight: 2 }],
  offworld_heritage: [{ pattern: "{npc}'s Offworld Papers", weight: 2 }],
  cowardice: [{ pattern: "the True Account of {npc}'s Flight", weight: 2 }],
  blackmailed: [{ pattern: 'the Blackmail File on {npc}', weight: 2 }],
  smuggling: [{ pattern: "{npc}'s Cargo Manifests", weight: 2 }, { pattern: "{npc}'s Smuggling Ledger", weight: 1 }],
  true_loyalty: [{ pattern: "{npc}'s Sworn Oath to {target}", weight: 2 }],
  hidden_illness: [{ pattern: "{npc}'s Physician's Notes", weight: 2 }],
  prophecy_knowledge: [{ pattern: "{npc}'s Copy of the Prophecy", weight: 2 }],
  relic_possession: [{ pattern: "the Receipt for {npc}'s Relic", weight: 2 }],
};

/** Intel about an organization, settlement, country or person. */
export const INTEL_NAMES: NamePattern[] = [
  { pattern: 'the Dossier on {subject}', weight: 3 },
  { pattern: 'the {subject} Cipher Book', weight: 2 },
  { pattern: 'Intercepted Orders of {subject}', weight: 2 },
  { pattern: 'the {epithet} Ledger', weight: 1 },
];

export const KNOWLEDGE_NAMES: Record<'religion' | 'species' | 'planet' | 'settlement' | 'organization' | 'country', NamePattern[]> = {
  religion: [{ pattern: 'the {subject} Apocrypha', weight: 3 }, { pattern: 'the {epithet} Codex of {subject}', weight: 2 }],
  species: [{ pattern: 'the Anatomy of the {subject}', weight: 2 }, { pattern: 'the {epithet} Treatise on the {subject}', weight: 2 }],
  planet: [{ pattern: 'the Lost Histories of {subject}', weight: 2 }, { pattern: 'the {epithet} Codex', weight: 2 }, { pattern: 'the Builders’ Records', weight: 1 }],
  settlement: [{ pattern: 'the Founding Chronicle of {subject}', weight: 2 }, { pattern: 'the Plans of Old {subject}', weight: 1 }],
  organization: [{ pattern: 'the Secret History of {subject}', weight: 2 }, { pattern: 'the Rites of {subject}', weight: 1 }],
  country: [{ pattern: 'the Sealed Annals of {subject}', weight: 2 }, { pattern: 'the {epithet} Chronicle of {subject}', weight: 1 }],
};

export const ACCESS_NAMES: Record<'organization' | 'poi' | 'country' | 'settlement', NamePattern[]> = {
  organization: [{ pattern: 'the Signet of {subject}', weight: 2 }, { pattern: 'the Passwords of {subject}', weight: 2 }],
  poi: [{ pattern: 'the Keys to {subject}', weight: 3 }, { pattern: 'the Hidden Door into {subject}', weight: 1 }],
  country: [{ pattern: 'the Royal Writ of {subject}', weight: 2 }, { pattern: 'the Diplomatic Seal of {subject}', weight: 2 }],
  settlement: [{ pattern: 'the Freedom of {subject}', weight: 2 }, { pattern: 'the Seal of {subject}', weight: 2 }],
};

export const MAP_NAMES: Record<'feature' | 'poi' | 'settlement', NamePattern[]> = {
  feature: [{ pattern: 'Coordinates to {feature}', weight: 2 }, { pattern: 'the Way to {feature}', weight: 2 }],
  poi: [{ pattern: 'the Lost Plans of {subject}', weight: 2 }, { pattern: 'the Secret Ways under {subject}', weight: 2 }],
  settlement: [{ pattern: 'the Undercity Charts of {subject}', weight: 2 }, { pattern: 'the Hidden Roads to {subject}', weight: 2 }],
};

/** NPCs who are a treasure because of what they can do or know. */
export const ABILITY_TREASURE_NAMES: Partial<Record<SpecialAbilityType, string>> = {
  precognition: 'the Visions of {npc}', telepathy: 'the Mind of {npc}', psionics: 'the Gift of {npc}',
  void_sight: 'What {npc} Sees in the Void', dream_walking: 'the Dreams of {npc}', technopathy: 'the Machine-Speech of {npc}',
  weather_sense: 'the Storm-Sense of {npc}', beast_speech: 'the Beast-Tongue of {npc}', longevity: 'the Long Memory of {npc}',
};

/** Possessions that make an NPC's treasure, and what kind of treasure it is. */
export const POSSESSION_TREASURE: Partial<Record<Possession, TreasureCategory>> = {
  heirloom_blade: 'weapon', relic_fragment: 'relic', star_charts: 'map', old_map: 'map', encrypted_datacore: 'intel',
  prototype_device: 'technology', ledger_of_debts: 'leverage', family_signet: 'access', jeweled_ornament: 'wealth',
  letter_of_marque: 'access', sacred_text: 'knowledge', hidden_cache: 'wealth',
};
