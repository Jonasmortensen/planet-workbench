import type {
  AtmosphereComposition, AtmospherePressure, Biome, Biosphere, FeatureType, HazardType, MoonType,
  PlanetType, ResourceType, SizeClass,
} from '../types/enums';
import type { WeightedDef } from './constraints';

export interface PlanetTypeDef extends WeightedDef {
  /** Strange worlds; rare by weight, tagged for stats and prose. */
  exotic: boolean;
  /** Target mean surface temperature range in °C. The orbit is solved to land here. */
  meanTemp: [number, number];
  /** Water coverage range (liquid or frozen). */
  water: [number, number];
  atmospheres: Partial<Record<AtmosphereComposition, number>>;
  pressures: Partial<Record<AtmospherePressure, number>>;
  /** Bulk density relative to a standard rocky world; gravity scales with it. */
  density: number;
  sizes?: Partial<Record<SizeClass, number>>;
  biomes: Partial<Record<Biome, number>>;
  /** Multipliers applied to the derived biosphere weights. */
  biosphereBias?: Partial<Record<Biosphere, number>>;
  /** Internal heat or other warming in °C, added after the greenhouse effect. */
  tempBias?: number;
  continents?: [number, number];
  tidallyLocked?: boolean;
  /** Lowest tech level a civilization on this world can have (e.g. city worlds). */
  minTech?: number;
  populationFactor?: number;
  hazardBias?: Partial<Record<HazardType, number>>;
  resourceBias?: Partial<Record<ResourceType, number>>;
  featureBias?: Partial<Record<FeatureType, number>>;
}

const BREATHABLE_MIX = { breathable: 8, tainted: 2, inert: 0.5 };
const STANDARD_PRESSURE = { thin: 2, standard: 8, dense: 1 };

export const PLANET_TYPE_TABLE: Record<PlanetType, PlanetTypeDef> = {
  terrestrial: {
    weight: 14, exotic: false, meanTemp: [-5, 28], water: [0.35, 0.8],
    atmospheres: BREATHABLE_MIX, pressures: STANDARD_PRESSURE, density: 1,
    biomes: {
      temperate_forest: 5, grassland: 4, boreal_forest: 3, mountains: 3, coast: 3, desert: 2, tundra: 2,
      wetland: 2, highlands: 2, rainforest: 2, savanna: 2, steppe: 2, ice_sheet: 1, badlands: 1, caverns: 0.5,
    },
  },
  ocean: {
    weight: 8, exotic: false, meanTemp: [0, 32], water: [0.88, 1.0],
    atmospheres: { breathable: 6, tainted: 2, inert: 1, methane: 0.5 }, pressures: STANDARD_PRESSURE, density: 0.95,
    biomes: { coast: 4, reef: 3, shallow_sea: 3, rainforest: 1, wetland: 1, grassland: 1 },
    continents: [0, 3],
    resourceBias: { fish: 4, bio_compounds: 2, deuterium: 3 },
    featureBias: { abyssal_trench: 4, bioluminescent_sea: 3, tidal_maze: 2 },
    hazardBias: { superstorms: 2, extreme_tides: 3, floods: 2 },
  },
  archipelago: {
    weight: 5, exotic: false, meanTemp: [10, 32], water: [0.7, 0.9],
    atmospheres: BREATHABLE_MIX, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { coast: 5, reef: 3, rainforest: 3, shallow_sea: 3, volcanic_fields: 1, grassland: 1, mountains: 1 },
    continents: [8, 40],
    resourceBias: { fish: 3, spices: 2 },
    featureBias: { tidal_maze: 3, mega_volcano: 2 },
    hazardBias: { superstorms: 2, extreme_tides: 2, volcanism: 1.5 },
  },
  desert: {
    weight: 9, exotic: false, meanTemp: [15, 55], water: [0, 0.15],
    atmospheres: { breathable: 4, tainted: 3, inert: 2, toxic: 1 }, pressures: { thin: 4, standard: 5, dense: 1 },
    density: 1,
    biomes: { desert: 6, dunes: 5, badlands: 4, salt_flats: 3, mountains: 2, steppe: 2, caverns: 1, savanna: 1 },
    resourceBias: { salt: 3, precious_metals: 2, hydrocarbons: 2, silicates: 2 },
    featureBias: { singing_dunes: 4, glass_desert: 2, great_canyon: 2 },
    hazardBias: { sandstorms: 5, extreme_heat: 3 },
  },
  arctic: {
    weight: 7, exotic: false, meanTemp: [-60, -8], water: [0.3, 0.9],
    atmospheres: { breathable: 3, tainted: 2, inert: 3, methane: 1 }, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { ice_sheet: 6, tundra: 5, mountains: 3, boreal_forest: 2, caverns: 1, coast: 1 },
    resourceBias: { water_ice: 5, rare_gases: 2, fish: 1 },
    featureBias: { eternal_glacier: 5, aurora_belt: 3 },
    hazardBias: { blizzards: 5, extreme_cold: 5 },
  },
  tundra: {
    weight: 5, exotic: false, meanTemp: [-20, 2], water: [0.2, 0.6],
    atmospheres: BREATHABLE_MIX, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { tundra: 6, boreal_forest: 4, ice_sheet: 3, steppe: 2, wetland: 2, highlands: 2, mountains: 2 },
    resourceBias: { timber: 2, livestock: 2, water_ice: 2 },
    featureBias: { aurora_belt: 3, eternal_glacier: 2 },
    hazardBias: { blizzards: 3, extreme_cold: 3, migratory_swarms: 1 },
  },
  jungle: {
    weight: 6, exotic: false, meanTemp: [22, 38], water: [0.3, 0.7],
    atmospheres: { breathable: 6, tainted: 3, spore_laden: 2 }, pressures: { standard: 6, dense: 4 }, density: 1,
    biomes: { rainforest: 8, wetland: 3, coast: 2, mountains: 1, savanna: 1, highlands: 1, fungal_forest: 0.3 },
    resourceBias: { timber: 3, medicinal_flora: 4, spices: 3, bio_compounds: 3 },
    featureBias: { world_tree: 3, hanging_waterfalls: 3 },
    hazardBias: { toxic_flora: 4, apex_predators: 4, endemic_disease: 3 },
  },
  swamp: {
    weight: 4, exotic: false, meanTemp: [12, 34], water: [0.4, 0.8],
    atmospheres: { breathable: 3, tainted: 4, toxic: 1, spore_laden: 2, methane: 1 }, pressures: STANDARD_PRESSURE,
    density: 1,
    biomes: { wetland: 7, rainforest: 3, toxic_marsh: 2, coast: 2, fungal_forest: 1 },
    resourceBias: { medicinal_flora: 3, bio_compounds: 3, fibers: 2 },
    featureBias: { sinkhole_field: 3, bioluminescent_sea: 1 },
    hazardBias: { endemic_disease: 4, floods: 3, toxic_flora: 2 },
  },
  savanna: {
    weight: 5, exotic: false, meanTemp: [18, 34], water: [0.2, 0.55],
    atmospheres: BREATHABLE_MIX, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { savanna: 7, grassland: 4, desert: 2, badlands: 1, highlands: 1, wetland: 1, coast: 1 },
    resourceBias: { livestock: 4, fertile_soil: 2, fibers: 2 },
    featureBias: { great_rift: 3, colossal_fossil: 2 },
    hazardBias: { wildfires: 4, apex_predators: 3, migratory_swarms: 2 },
  },
  steppe: {
    weight: 4, exotic: false, meanTemp: [-2, 18], water: [0.15, 0.45],
    atmospheres: BREATHABLE_MIX, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { steppe: 7, grassland: 4, highlands: 3, mountains: 2, desert: 1, tundra: 1, badlands: 1 },
    resourceBias: { livestock: 4, iron: 2, stone: 2 },
    featureBias: { inland_sea: 3, basalt_columns: 2 },
    hazardBias: { blizzards: 2, wildfires: 2 },
  },
  mountainous: {
    weight: 5, exotic: false, meanTemp: [-15, 18], water: [0.15, 0.5],
    atmospheres: BREATHABLE_MIX, pressures: { thin: 5, standard: 5 }, density: 1.05,
    biomes: {
      mountains: 8, highlands: 5, boreal_forest: 2, tundra: 2, caverns: 2, temperate_forest: 2, ice_sheet: 1,
      grassland: 1,
    },
    continents: [1, 4],
    resourceBias: { iron: 3, copper: 3, precious_metals: 3, gemstones: 3, stone: 3 },
    featureBias: { world_mountain: 5, great_canyon: 3, hanging_waterfalls: 2 },
    hazardBias: { earthquakes: 3, sinkholes: 1, blizzards: 2 },
  },
  volcanic: {
    weight: 6, exotic: false, meanTemp: [25, 120], water: [0, 0.3],
    atmospheres: { toxic: 4, corrosive: 3, tainted: 2, inert: 1, breathable: 0.5 },
    pressures: { thin: 2, standard: 4, dense: 4, crushing: 1 }, density: 1.15, tempBias: 25,
    biomes: {
      volcanic_fields: 8, ash_wastes: 4, badlands: 3, mountains: 3, caverns: 2, glass_plains: 1, salt_flats: 1,
    },
    resourceBias: { geothermal_energy: 5, volcanic_glass: 4, rare_earths: 3, uranium: 2 },
    featureBias: { mega_volcano: 6, boiling_lake: 4, basalt_columns: 3, geyser_basin: 3 },
    hazardBias: { volcanism: 6, earthquakes: 3, acid_rain: 2, extreme_heat: 3 },
  },
  barren: {
    weight: 9, exotic: false, meanTemp: [-150, 120], water: [0, 0.05],
    atmospheres: { none: 6, inert: 3, toxic: 1 }, pressures: { none: 5, trace: 4, thin: 2 }, density: 1,
    sizes: { tiny: 3, small: 4, medium: 3, large: 1, huge: 0.5 },
    biomes: { badlands: 4, desert: 3, mountains: 3, caverns: 3, salt_flats: 2, glass_plains: 0.5, crystal_fields: 0.3 },
    biosphereBias: { none: 5, microbial: 1, sparse: 0.2, complex: 0.05, lush: 0.02 },
    resourceBias: { iron: 3, uranium: 3, helium3: 4, rare_earths: 3, silicates: 2 },
    featureBias: { impact_crater: 6, great_canyon: 2 },
    hazardBias: { radiation: 4, meteor_showers: 4, vacuum_exposure: 4, extreme_cold: 2 },
  },
  toxic: {
    weight: 6, exotic: false, meanTemp: [10, 90], water: [0, 0.5],
    atmospheres: { toxic: 6, corrosive: 4, methane: 2, spore_laden: 1 }, pressures: { standard: 3, dense: 5, crushing: 2 },
    density: 1,
    biomes: {
      toxic_marsh: 6, badlands: 3, volcanic_fields: 2, desert: 2, fungal_forest: 1, storm_plains: 1, wetland: 1,
    },
    resourceBias: { hydrocarbons: 4, rare_gases: 4, bio_compounds: 2 },
    featureBias: { boiling_lake: 3, endless_storm: 2 },
    hazardBias: { acid_rain: 5, toxic_flora: 2, crushing_pressure: 2 },
  },
  storm: {
    weight: 3, exotic: false, meanTemp: [-10, 40], water: [0.2, 0.8],
    atmospheres: { tainted: 3, breathable: 2, toxic: 2, inert: 2 }, pressures: { standard: 2, dense: 6, crushing: 2 },
    density: 1,
    biomes: { storm_plains: 7, highlands: 2, badlands: 2, coast: 2, grassland: 1, mountains: 1, floating_isles: 0.3 },
    resourceBias: { rare_gases: 3, deuterium: 2 },
    featureBias: { endless_storm: 6, storm_spire: 5, magnetic_vortex: 2 },
    hazardBias: { superstorms: 8, floods: 2 },
  },
  tidally_locked: {
    weight: 4, exotic: false, meanTemp: [-10, 30], water: [0.05, 0.5], tidallyLocked: true,
    atmospheres: { breathable: 3, tainted: 3, inert: 2 }, pressures: { thin: 3, standard: 5, dense: 2 }, density: 1,
    biomes: {
      ice_sheet: 4, desert: 3, tundra: 2, badlands: 2, grassland: 2, steppe: 2, glass_plains: 1, coast: 1, wetland: 1,
    },
    featureBias: { eternal_glacier: 3, glass_desert: 3, endless_storm: 2 },
    hazardBias: { superstorms: 3, extreme_heat: 3, extreme_cold: 3 },
  },
  garden: {
    weight: 2.5, exotic: false, meanTemp: [10, 26], water: [0.4, 0.7],
    atmospheres: { breathable: 10 }, pressures: { standard: 10 }, density: 1,
    biomes: {
      temperate_forest: 5, grassland: 5, rainforest: 3, coast: 3, wetland: 2, highlands: 2, savanna: 2,
      floating_isles: 0.3,
    },
    biosphereBias: { lush: 6, complex: 3, sparse: 0.2 },
    populationFactor: 1.5,
    resourceBias: { fertile_soil: 5, timber: 3, fresh_water: 3, medicinal_flora: 2 },
    featureBias: { world_tree: 2, mirror_lake: 3, hanging_waterfalls: 2 },
  },
  fungal: {
    weight: 2, exotic: false, meanTemp: [5, 35], water: [0.2, 0.6],
    atmospheres: { spore_laden: 6, tainted: 3, breathable: 1 }, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { fungal_forest: 8, caverns: 3, wetland: 2, toxic_marsh: 2, badlands: 1 },
    biosphereBias: { complex: 3, lush: 4, exotic: 2 },
    resourceBias: { psychoactive_spores: 5, bio_compounds: 4, medicinal_flora: 2 },
    featureBias: { world_tree: 2, bioluminescent_sea: 2, sinkhole_field: 2 },
    hazardBias: { spore_blooms: 7, endemic_disease: 2 },
  },
  ash: {
    weight: 2.5, exotic: false, meanTemp: [-30, 40], water: [0, 0.3],
    atmospheres: { tainted: 4, toxic: 3, inert: 2 }, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { ash_wastes: 8, badlands: 3, volcanic_fields: 2, glass_plains: 2, tundra: 1, caverns: 1 },
    biosphereBias: { dying: 4, sparse: 3, microbial: 2, lush: 0.1 },
    resourceBias: { volcanic_glass: 2, rare_earths: 2, precursor_relics: 1 },
    featureBias: { petrified_forest: 4, impact_crater: 2 },
    hazardBias: { acid_rain: 3, radiation: 2, extreme_cold: 2 },
  },
  glass: {
    weight: 1.5, exotic: true, meanTemp: [0, 80], water: [0, 0.2],
    atmospheres: { inert: 4, none: 2, tainted: 2 }, pressures: { trace: 2, thin: 4, standard: 2 }, density: 1,
    biomes: { glass_plains: 8, desert: 3, ash_wastes: 2, badlands: 2, crystal_fields: 1 },
    biosphereBias: { none: 3, microbial: 3, dying: 2, lush: 0.05 },
    resourceBias: { silicates: 4, volcanic_glass: 3, precursor_relics: 2 },
    featureBias: { glass_desert: 6, mirror_lake: 3, impact_crater: 2 },
    hazardBias: { radiation: 4, extreme_heat: 2 },
  },
  moon_world: {
    weight: 4, exotic: false, meanTemp: [-20, 25], water: [0.2, 0.7], tempBias: 5,
    atmospheres: { breathable: 4, tainted: 3, inert: 2, methane: 1 }, pressures: { thin: 4, standard: 5, dense: 1 },
    density: 0.9, sizes: { tiny: 1, small: 4, medium: 3 },
    biomes: {
      boreal_forest: 3, tundra: 3, temperate_forest: 3, grassland: 2, ice_sheet: 2, mountains: 2, coast: 2,
      volcanic_fields: 1,
    },
    featureBias: { ring_system: 8, geyser_basin: 3, aurora_belt: 3 },
    hazardBias: { extreme_tides: 4, radiation: 2, volcanism: 2 },
  },
  ecumenopolis: {
    weight: 1.5, exotic: true, meanTemp: [5, 35], water: [0.05, 0.4], tempBias: 8, minTech: 6,
    atmospheres: { tainted: 5, breathable: 3 }, pressures: STANDARD_PRESSURE, density: 1,
    biomes: { urban_sprawl: 10, machine_wastes: 1, coast: 1 },
    biosphereBias: { sparse: 4, dying: 3, synthetic: 2, lush: 0.05, complex: 0.3 },
    populationFactor: 40,
    resourceBias: { rare_earths: 1, stone: 0.5 },
    featureBias: { storm_spire: 1, abyssal_trench: 1 },
    hazardBias: { endemic_disease: 3, feral_machines: 2 },
  },
  crystal: {
    weight: 1, exotic: true, meanTemp: [-40, 60], water: [0, 0.3],
    atmospheres: { inert: 3, exotic: 3, none: 1, tainted: 1 }, pressures: { trace: 2, thin: 4, standard: 3 },
    density: 0.8,
    biomes: { crystal_fields: 9, caverns: 3, badlands: 2, mountains: 2, glass_plains: 1, shard_fields: 1 },
    biosphereBias: { exotic: 5, none: 2, microbial: 1, lush: 0.1, complex: 0.3 },
    resourceBias: { resonant_crystals: 8, gemstones: 4, silicates: 3 },
    featureBias: { crystal_spires: 8, singing_dunes: 2, mirror_lake: 2 },
    hazardBias: { crystal_growth: 6, radiation: 2, psychic_echoes: 1 },
  },
  hollow: {
    weight: 0.6, exotic: true, meanTemp: [-10, 30], water: [0.1, 0.5], tempBias: 10, density: 0.35,
    atmospheres: { breathable: 4, tainted: 3, inert: 1 }, pressures: STANDARD_PRESSURE,
    sizes: { medium: 2, large: 3, huge: 2 },
    biomes: { caverns: 9, fungal_forest: 3, mountains: 2, temperate_forest: 1, wetland: 1, crystal_fields: 1 },
    resourceBias: { precursor_relics: 3, exotic_matter: 2, gemstones: 2 },
    featureBias: { abyssal_trench: 3, sinkhole_field: 4, floating_mountains: 2 },
    hazardBias: { sinkholes: 4, gravity_tides: 3, earthquakes: 2 },
  },
  shattered: {
    weight: 0.8, exotic: true, meanTemp: [-60, 30], water: [0, 0.3], density: 0.7, continents: [6, 40],
    atmospheres: { none: 2, inert: 3, tainted: 2, breathable: 1 }, pressures: { none: 2, trace: 4, thin: 4 },
    biomes: { shard_fields: 8, badlands: 3, floating_isles: 2, caverns: 2, ice_sheet: 2, mountains: 2 },
    resourceBias: { exotic_matter: 3, iron: 2, helium3: 2, precursor_relics: 2 },
    featureBias: { shattered_moon_debris: 6, floating_mountains: 4, great_rift: 3 },
    hazardBias: { gravity_tides: 5, meteor_showers: 5, tectonic_shear: 5, vacuum_exposure: 3 },
  },
  living: {
    weight: 0.5, exotic: true, meanTemp: [5, 40], water: [0.2, 0.6],
    atmospheres: { breathable: 3, spore_laden: 3, tainted: 2, exotic: 1 }, pressures: STANDARD_PRESSURE, density: 0.9,
    biomes: { flesh_plains: 8, fungal_forest: 2, wetland: 2, rainforest: 2, caverns: 1 },
    biosphereBias: { lush: 6, exotic: 6, complex: 2, none: 0, microbial: 0.2, sparse: 0.2, dying: 0.3 },
    resourceBias: { bio_compounds: 6, living_alloy: 4, medicinal_flora: 2 },
    featureBias: { world_tree: 3, bioluminescent_sea: 2, living_coral_continent: 6 },
    hazardBias: { psychic_echoes: 3, migratory_swarms: 3, earthquakes: 3 },
  },
  machine: {
    weight: 0.5, exotic: true, meanTemp: [-30, 70], water: [0, 0.2], density: 1.3,
    atmospheres: { inert: 4, none: 2, tainted: 2, toxic: 1 }, pressures: { none: 2, trace: 2, thin: 3, standard: 3 },
    biomes: { machine_wastes: 9, urban_sprawl: 2, badlands: 2, glass_plains: 1, caverns: 1 },
    biosphereBias: { synthetic: 12, none: 1, microbial: 0.2 },
    resourceBias: { living_alloy: 5, rare_earths: 3, precursor_relics: 3, exotic_matter: 2 },
    featureBias: { magnetic_vortex: 3, storm_spire: 2 },
    hazardBias: { feral_machines: 7, radiation: 3 },
  },
};

export interface SizeClassDef {
  weight: number;
  radiusKm: [number, number];
  maxMoons: number;
}

export const SIZE_CLASS_TABLE: Record<SizeClass, SizeClassDef> = {
  tiny: { weight: 1, radiusKm: [1200, 2800], maxMoons: 1 },
  small: { weight: 3, radiusKm: [2800, 5000], maxMoons: 2 },
  medium: { weight: 6, radiusKm: [5000, 7500], maxMoons: 3 },
  large: { weight: 3, radiusKm: [7500, 10500], maxMoons: 5 },
  huge: { weight: 1, radiusKm: [10500, 15000], maxMoons: 8 },
};

/** Reference radius for 1.0 g at density 1.0. */
export const STANDARD_RADIUS_KM = 6371;

/** Greenhouse warming in kelvin for each pressure class, before composition multiplier. */
export const PRESSURE_GREENHOUSE: Record<AtmospherePressure, number> = {
  none: 0, trace: 1, thin: 10, standard: 33, dense: 85, crushing: 260,
};

export const COMPOSITION_GREENHOUSE: Record<AtmosphereComposition, number> = {
  none: 0, breathable: 1, tainted: 1.15, toxic: 1.35, corrosive: 1.6, inert: 0.8, methane: 1.5,
  spore_laden: 1.1, exotic: 1.2,
};

/** Equilibrium temperature in kelvin at insolation 1.0 with no atmosphere. */
export const BASE_EQUILIBRIUM_K = 255;

export interface MoonTypeDef extends WeightedDef {
  sizes: SizeClass[];
}

export const MOON_TYPE_TABLE: Record<MoonType, MoonTypeDef> = {
  rocky: { weight: 10, sizes: ['tiny', 'small', 'medium'] },
  icy: { weight: 7, sizes: ['tiny', 'small', 'medium'] },
  volcanic: { weight: 3, sizes: ['small', 'medium'] },
  captured_asteroid: { weight: 7, sizes: ['tiny'] },
  dusty: { weight: 5, sizes: ['tiny', 'small'] },
  oceanic: { weight: 1.5, sizes: ['small', 'medium'] },
  crystalline: { weight: 0.5, sizes: ['tiny', 'small'] },
  artificial: { weight: 0.3, sizes: ['tiny', 'small'] },
  shattered: { weight: 0.6, sizes: ['small', 'medium'] },
  habitable: { weight: 0.8, sizes: ['small', 'medium'] },
  metallic: { weight: 2, sizes: ['tiny', 'small'] },
};

/** Moon count weights, index = number of moons (capped by size class). */
export const MOON_COUNT_WEIGHTS = [3, 4, 3, 2, 1.2, 0.8, 0.5, 0.3, 0.2];

/** Seasonality from axial tilt in degrees (upper bound exclusive). */
export const SEASONALITY_BY_TILT: { maxTilt: number; value: 'none' | 'mild' | 'moderate' | 'strong' | 'extreme' }[] = [
  { maxTilt: 4, value: 'none' },
  { maxTilt: 15, value: 'mild' },
  { maxTilt: 30, value: 'moderate' },
  { maxTilt: 50, value: 'strong' },
  { maxTilt: 91, value: 'extreme' },
];
