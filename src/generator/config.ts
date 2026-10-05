import type { PoliticalStructure } from './types/enums';

/**
 * Generator tuning: counts and probabilities. Content (what values exist and
 * how common they are) lives in content/; this file controls how much of it
 * each planet gets.
 */
export const CONFIG = {
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

  nativeSapientsChance: {
    /** Biosphere complex, lush, exotic or synthetic. */
    rich: 0.45,
    /** Any other biosphere with life. */
    poor: 0.04,
  },
};
