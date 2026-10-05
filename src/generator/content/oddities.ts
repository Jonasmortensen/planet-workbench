import type {
  AnomalyType, Builder, ExplanationKey, MegastructureCondition, MegastructureType, PrecursorPresence,
  Prevalence, SpecialAbilityType,
} from '../types/enums';
import type { WeightedDef } from './constraints';

export interface AnomalyDef extends WeightedDef {
  /**
   * Physical anomalies are never rolled as flavor; they are recorded only when
   * a rule in rules/physical.ts detects the matching inconsistency.
   */
  physical: boolean;
  explanations: Partial<Record<ExplanationKey, number>>;
}

export const ANOMALY_TABLE: Record<AnomalyType, AnomalyDef> = {
  gravity_mismatch: { weight: 0, physical: true, explanations: { precursor_engineering: 3, unknown: 3, natural_rarity: 2, misclassified_data: 1, captured_world: 1 } },
  atmosphere_retention: { weight: 0, physical: true, explanations: { terraforming: 4, precursor_engineering: 3, unknown: 2, living_world: 1 } },
  anomalous_liquid_water: { weight: 0, physical: true, explanations: { natural_rarity: 3, terraforming: 2, precursor_engineering: 2, unknown: 2 } },
  life_against_odds: { weight: 0, physical: true, explanations: { natural_rarity: 3, precursor_engineering: 2, divine_belief: 2, unknown: 3, terraforming: 1 } },
  unexplained_oxygen: { weight: 0, physical: true, explanations: { terraforming: 5, precursor_engineering: 2, unknown: 2, misclassified_data: 1 } },
  climate_mismatch: { weight: 0, physical: true, explanations: { stellar_event: 3, unknown: 2, precursor_engineering: 1, captured_world: 2, natural_rarity: 2 } },
  rotation_anomaly: { weight: 0, physical: true, explanations: { precursor_engineering: 3, unknown: 3, captured_world: 2, ancient_war: 1 } },

  time_dilation_zone: { weight: 1, physical: false, explanations: { dimensional_breach: 3, precursor_engineering: 3, unknown: 3, experimental_accident: 1 } },
  gravity_wells: { weight: 2, physical: false, explanations: { precursor_engineering: 3, natural_rarity: 2, unknown: 3, ancient_war: 1 } },
  psychic_resonance: { weight: 1.5, physical: false, explanations: { living_world: 3, divine_belief: 2, unknown: 3, dimensional_breach: 1 } },
  phantom_signals: { weight: 3, physical: false, explanations: { precursor_engineering: 3, unknown: 4, ancient_war: 2, misclassified_data: 1 } },
  shifting_geography: { weight: 1.5, physical: false, explanations: { living_world: 3, unknown: 3, dimensional_breach: 2 } },
  null_zones: { weight: 2, physical: false, explanations: { precursor_engineering: 3, ancient_war: 3, unknown: 2, experimental_accident: 2 } },
  perpetual_aurora: { weight: 3, physical: false, explanations: { stellar_event: 4, natural_rarity: 3, precursor_engineering: 1 }, constraints: { requiresAtmosphere: true } },
  mirrored_sky: { weight: 1, physical: false, explanations: { dimensional_breach: 3, unknown: 3, divine_belief: 2 }, constraints: { requiresAtmosphere: true } },
  temporal_echoes: { weight: 1, physical: false, explanations: { dimensional_breach: 3, unknown: 3, precursor_engineering: 2 } },
  silent_zones: { weight: 1.5, physical: false, explanations: { unknown: 4, precursor_engineering: 2, natural_rarity: 2 }, constraints: { requiresAtmosphere: true } },
  reversed_rivers: { weight: 1, physical: false, explanations: { unknown: 3, precursor_engineering: 3, living_world: 2 }, constraints: { requiresLiquidWater: true } },
  memory_fog: { weight: 1, physical: false, explanations: { living_world: 2, unknown: 3, experimental_accident: 2, divine_belief: 1 }, constraints: { requiresAtmosphere: true } },
  wandering_lights: { weight: 2.5, physical: false, explanations: { natural_rarity: 3, unknown: 3, divine_belief: 2 } },
  impossible_geometry: { weight: 0.6, physical: false, explanations: { dimensional_breach: 4, precursor_engineering: 3, unknown: 2 } },
  artificial_daylight: { weight: 0.8, physical: false, explanations: { precursor_engineering: 5, terraforming: 2, unknown: 1 } },
  spontaneous_growth: { weight: 1, physical: false, explanations: { living_world: 3, experimental_accident: 3, unknown: 2 } },
  dead_satellites: { weight: 2, physical: false, explanations: { ancient_war: 5, precursor_engineering: 2, unknown: 2 } },
};

export const ANOMALY_COUNT_WEIGHTS = [70, 22, 7, 1];

export const PRECURSOR_WEIGHTS: Record<PrecursorPresence, number> = { none: 75, ruins: 20, active_tech: 5 };

export interface MegastructureDef extends WeightedDef {
  nouns: string[];
  /** Minimum tech level for natives or colonists to have built it. */
  minTech: number;
}

export const MEGASTRUCTURE_TABLE: Record<MegastructureType, MegastructureDef> = {
  space_elevator: { weight: 4, minTech: 7, nouns: ['Tether', 'Ladder', 'Spindle', 'Thread'] },
  orbital_ring: { weight: 2, minTech: 8, nouns: ['Ring', 'Halo', 'Girdle', 'Crown'] },
  planetary_shield: { weight: 1.5, minTech: 9, nouns: ['Aegis', 'Shroud', 'Dome', 'Veil'] },
  weather_engine: { weight: 2, minTech: 8, nouns: ['Engine', 'Lungs', 'Bellows', 'Orrery'] },
  world_engine: { weight: 0.5, minTech: 10, nouns: ['Engine', 'Drive', 'Heart', 'Thruster'] },
  great_wall: { weight: 3, minTech: 2, nouns: ['Wall', 'Rampart', 'Barrier', 'Bulwark'] },
  arcology_spire: { weight: 3, minTech: 6, nouns: ['Spire', 'Arcology', 'Stack', 'Hive'] },
  colossal_statue: { weight: 3, minTech: 1, nouns: ['Colossus', 'Watcher', 'Giant', 'Sentinel'] },
  terraforming_spire: { weight: 2, minTech: 8, nouns: ['Spire', 'Seeder', 'Breather', 'Tower'] },
  core_tap: { weight: 1, minTech: 9, nouns: ['Tap', 'Well', 'Bore', 'Root'] },
  mass_driver: { weight: 2, minTech: 7, nouns: ['Driver', 'Cannon', 'Rail', 'Sling'] },
  sky_bridge: { weight: 1.5, minTech: 7, nouns: ['Bridge', 'Span', 'Arch', 'Causeway'] },
  grounded_ark: { weight: 2, minTech: 8, nouns: ['Ark', 'Hull', 'Vessel', 'Wreck'] },
  portal_gate: { weight: 0.5, minTech: 10, nouns: ['Gate', 'Door', 'Threshold', 'Arch'] },
  signal_beacon: { weight: 2, minTech: 6, nouns: ['Beacon', 'Voice', 'Lighthouse', 'Call'] },
  tidal_dam: { weight: 1.5, minTech: 5, nouns: ['Dam', 'Weir', 'Barrage', 'Floodgate'], constraints: { requiresLiquidWater: true } },
  sunshade: { weight: 1, minTech: 9, nouns: ['Shade', 'Parasol', 'Eclipse', 'Lid'] },
  data_vault: { weight: 1.5, minTech: 7, nouns: ['Vault', 'Archive', 'Library', 'Memory'] },
  orbital_mirror: { weight: 1.5, minTech: 8, nouns: ['Mirror', 'Lens', 'Glass', 'Eye'] },
};

export const MEGASTRUCTURE_CONDITION_WEIGHTS: Record<Builder, Partial<Record<MegastructureCondition, number>>> = {
  precursors: { ruined: 4, dormant: 4, damaged: 2, active: 1, pristine: 0.5 },
  natives: { active: 4, pristine: 2, damaged: 2, ruined: 1, dormant: 1 },
  colonists: { active: 5, pristine: 2, damaged: 2, dormant: 1 },
  offworld_power: { active: 4, pristine: 2, dormant: 2, damaged: 1 },
  unknown: { dormant: 4, ruined: 3, active: 1, damaged: 2 },
};

/** Chance of 0, 1, 2 megastructures. */
export const MEGASTRUCTURE_COUNT_WEIGHTS = [85, 12, 3];

export const SPECIAL_ABILITY_TABLE: Record<SpecialAbilityType, WeightedDef> = {
  psionics: { weight: 4 },
  precognition: { weight: 2 },
  telepathy: { weight: 3 },
  biokinesis: { weight: 1.5, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  technopathy: { weight: 1.5, constraints: { minTech: 5 } },
  empathic_bonding: { weight: 2 },
  weather_sense: { weight: 2, constraints: { requiresAtmosphere: true } },
  beast_speech: { weight: 2, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  longevity: { weight: 2 },
  regeneration: { weight: 1.5 },
  shapeshifting: { weight: 0.6 },
  dream_walking: { weight: 1.5 },
  gravity_shaping: { weight: 0.8 },
  light_weaving: { weight: 0.8 },
  void_sight: { weight: 1 },
};

/** Chance of 0, 1, 2 special abilities. */
export const SPECIAL_ABILITY_COUNT_WEIGHTS = [88, 10, 2];

export const PREVALENCE_WEIGHTS: Record<Prevalence, number> = { rare: 6, uncommon: 3, common: 1.2, universal: 0.3 };
