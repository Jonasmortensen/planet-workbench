import type { PoliticalStructure } from './types/enums';

/**
 * Generator tuning: counts and probabilities. Content (what values exist and
 * how common they are) lives in content/; this file controls how much of it
 * each planet gets.
 */
export const CONFIG = {
  /** Tech level at which a people can travel and trade between worlds (6 = early spaceflight). */
  spaceflightTech: 6,

  /** Country count range per political structure. */
  countryCount: {
    unified: [1, 1],
    federation: [3, 8],
    rival_powers: [2, 4],
    fragmented: [6, 15],
    anarchic: [4, 12],
  } as Record<PoliticalStructure, [number, number]>,

  planet: {
    historyEvents: [3, 5] as [number, number],
    notableFeatures: [1, 4] as [number, number],
    resources: [3, 6] as [number, number],
    hazards: [1, 4] as [number, number],
    exports: [2, 4] as [number, number],
    imports: [2, 4] as [number, number],
    /** Languages on the planet (before dominance filtering). */
    maxLanguages: 5,
    religions: [1, 4] as [number, number],
  },

  /** Chance that a physical roll ignores its usual constraints (produces an anomaly). */
  deviation: {
    gravity: 0.04,
    atmosphereRetention: 0.04,
    liquidWater: 0.03,
    biosphere: 0.03,
    rotation: 0.01,
  },

  country: {
    biomes: [1, 4] as [number, number],
    values: [2, 3] as [number, number],
    customs: [1, 3] as [number, number],
    industries: [2, 4] as [number, number],
    keyEvents: [2, 4] as [number, number],
    /** Chance a country speaks its own dialect, distinct from the planet's languages. */
    dialectChance: 0.12,
    /** Chance a country has a local faith of its own. */
    localFaithChance: 0.12,
    /** Chance a country's tech level deviates from the planet's. */
    techDeviationChance: 0.15,
    maxLanguages: 10,
    maxReligions: 10,
  },

  settlement: {
    perCountry: [3, 8] as [number, number],
    /** Districts by settlement size (1..5). */
    districts: { 1: [2, 2], 2: [2, 3], 3: [3, 4], 4: [3, 5], 5: [4, 6] } as Record<number, [number, number]>,
    /** Points of interest by settlement size (1..5). */
    pois: { 1: [1, 2], 2: [2, 3], 3: [2, 4], 4: [3, 5], 5: [4, 7] } as Record<number, [number, number]>,
    /** Fraction of a country's population living in its notable settlements, by tech level. */
    urbanFraction: [0.04, 0.06, 0.08, 0.12, 0.25, 0.4, 0.55, 0.65, 0.72, 0.78, 0.82],
    keyEvents: [1, 3] as [number, number],
  },

  leaders: {
    /** Chance to reuse an existing leader for a new leadership slot (spec: 10 to 15%). */
    overlapChance: 0.12,
    /** Maximum leadership roles one NPC can hold. */
    maxLeads: 3,
    /** Chance an organization leader lives in its headquarters. */
    livesAtHeadquarters: 0.85,
    /** Chance a monarchy has a royal noble house. */
    royalHouseChance: 0.8,
  },

  notables: {
    /** Notable NPCs per settlement, by settlement size (1..5). */
    perSettlement: { 1: [1, 2], 2: [2, 3], 3: [2, 4], 4: [3, 6], 5: [4, 8] } as Record<number, [number, number]>,
    joinOrgChance: 0.45,
    ownPoiChance: 0.35,
    workAtPoiChance: 0.2,
    currentEventChance: 0.3,
    epithetChance: 0.3,
  },

  relationships: {
    /** Chance two non-neighboring countries have a relation at all. */
    distantCountryRelation: 0.35,
    /** Target relationships per NPC (soft cap). */
    maxPerNpc: 5,
    familyChance: 0.35,
    leaderLinkChance: 0.5,
    randomLinks: [0, 2] as [number, number],
  },

  /** Rumors per entity. */
  rumors: {
    planet: [2, 4] as [number, number],
    country: [1, 3] as [number, number],
    settlement: [1, 2] as [number, number],
    organization: [1, 2] as [number, number],
    leader: [1, 2] as [number, number],
    notable: [0, 2] as [number, number],
  },

  nativeSapientsChance: {
    /** Biosphere complex, lush, exotic or synthetic. */
    rich: 0.45,
    /** Any other biosphere with life. */
    poor: 0.04,
  },
};
