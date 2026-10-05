import type { FeatureType, HazardType, ResourceType, TradeGood } from '../types/enums';
import type { WeightedDef } from './constraints';

export interface FeatureDef extends WeightedDef {
  /** Nouns used when naming this feature ("the Weeping {noun}"). */
  nouns: string[];
}

export const FEATURE_TABLE: Record<FeatureType, FeatureDef> = {
  great_canyon: { weight: 6, nouns: ['Canyon', 'Gorge', 'Chasm', 'Cut'] },
  world_mountain: { weight: 4, nouns: ['Peak', 'Spire', 'Mount', 'Pillar'] },
  endless_storm: { weight: 3, nouns: ['Storm', 'Tempest', 'Maelstrom', 'Eye'], constraints: { requiresAtmosphere: true } },
  ring_system: { weight: 3, nouns: ['Rings', 'Halo', 'Girdle', 'Crown'] },
  impact_crater: { weight: 5, nouns: ['Crater', 'Basin', 'Scar', 'Bowl'] },
  bioluminescent_sea: {
    weight: 2, nouns: ['Sea', 'Gulf', 'Shallows', 'Bay'],
    constraints: { requiresLiquidWater: true, biospheres: ['complex', 'lush', 'exotic'] },
  },
  floating_mountains: { weight: 0.8, nouns: ['Drift', 'Heights', 'Skyreach', 'Isles'] },
  singing_dunes: { weight: 2, nouns: ['Dunes', 'Sands', 'Choir', 'Waste'], constraints: { anyBiome: ['dunes', 'desert'] } },
  crystal_spires: { weight: 1, nouns: ['Spires', 'Needles', 'Forest', 'Teeth'] },
  magnetic_vortex: { weight: 1.5, nouns: ['Vortex', 'Pole', 'Knot', 'Compass'] },
  great_rift: { weight: 4, nouns: ['Rift', 'Divide', 'Wound', 'Fault'] },
  inland_sea: { weight: 4, nouns: ['Sea', 'Mere', 'Waters', 'Lake'], constraints: { requiresLiquidWater: true } },
  mega_volcano: { weight: 3, nouns: ['Caldera', 'Forge', 'Mount', 'Furnace'] },
  boiling_lake: { weight: 2, nouns: ['Cauldron', 'Lake', 'Springs', 'Kettle'], constraints: { requiresLiquidWater: true } },
  eternal_glacier: { weight: 3, nouns: ['Glacier', 'Icefall', 'Wall', 'Shelf'], constraints: { anyBiome: ['ice_sheet', 'tundra', 'mountains'] } },
  petrified_forest: { weight: 2, nouns: ['Forest', 'Stonewood', 'Grove', 'Thicket'] },
  sinkhole_field: { weight: 2, nouns: ['Pits', 'Hollows', 'Wells', 'Maw'] },
  world_tree: {
    weight: 1, nouns: ['Tree', 'Root', 'Bough', 'Canopy'],
    constraints: { biospheres: ['complex', 'lush', 'exotic'] },
  },
  aurora_belt: { weight: 3, nouns: ['Lights', 'Veil', 'Banners', 'Curtain'], constraints: { requiresAtmosphere: true } },
  glass_desert: { weight: 1.5, nouns: ['Glass', 'Mirror', 'Shine', 'Waste'] },
  tidal_maze: { weight: 2, nouns: ['Maze', 'Channels', 'Narrows', 'Braids'], constraints: { requiresLiquidWater: true } },
  hanging_waterfalls: { weight: 1.5, nouns: ['Falls', 'Cascade', 'Veils', 'Stair'], constraints: { requiresLiquidWater: true } },
  colossal_fossil: { weight: 1.5, nouns: ['Bones', 'Ribs', 'Skull', 'Spine'], constraints: { biospheres: ['complex', 'lush', 'dying', 'exotic', 'sparse'] } },
  mirror_lake: { weight: 1.5, nouns: ['Mirror', 'Lake', 'Glass', 'Eye'], constraints: { requiresLiquidWater: true } },
  storm_spire: { weight: 1, nouns: ['Spire', 'Rod', 'Needle', 'Lance'], constraints: { requiresAtmosphere: true } },
  abyssal_trench: { weight: 3, nouns: ['Trench', 'Deep', 'Abyss', 'Throat'], constraints: { requiresLiquidWater: true } },
  living_coral_continent: {
    weight: 0.4, nouns: ['Reef', 'Bloom', 'Body', 'Mass'],
    constraints: { requiresLiquidWater: true, biospheres: ['lush', 'exotic'] },
  },
  shattered_moon_debris: { weight: 0.5, nouns: ['Shards', 'Fall', 'Halo', 'Rain'] },
  basalt_columns: { weight: 2.5, nouns: ['Columns', 'Causeway', 'Organ', 'Stair'] },
  geyser_basin: { weight: 2.5, nouns: ['Geysers', 'Basin', 'Vents', 'Fountains'] },
};

export interface ResourceDef extends WeightedDef {
  good: TradeGood;
}

export const RESOURCE_TABLE: Record<ResourceType, ResourceDef> = {
  iron: { weight: 8, good: 'iron' },
  copper: { weight: 6, good: 'copper' },
  rare_earths: { weight: 4, good: 'rare_earths' },
  uranium: { weight: 3, good: 'fusion_fuel' },
  precious_metals: { weight: 3, good: 'precious_metals' },
  gemstones: { weight: 3, good: 'gemstones' },
  hydrocarbons: { weight: 4, good: 'fuel', constraints: { biospheres: ['complex', 'lush', 'dying', 'sparse', 'exotic'] } },
  water_ice: { weight: 4, good: 'fresh_water' },
  fresh_water: { weight: 4, good: 'fresh_water', constraints: { requiresLiquidWater: true } },
  timber: { weight: 6, good: 'timber', constraints: { anyBiome: ['temperate_forest', 'rainforest', 'boreal_forest'] } },
  fertile_soil: {
    weight: 6, good: 'grain',
    constraints: { anyBiome: ['grassland', 'temperate_forest', 'savanna', 'wetland', 'steppe', 'highlands', 'coast'] },
  },
  fish: { weight: 5, good: 'preserved_food', constraints: { requiresLiquidWater: true, biospheres: ['complex', 'lush', 'exotic'] } },
  livestock: { weight: 4, good: 'livestock', constraints: { biospheres: ['complex', 'lush'] } },
  spices: { weight: 2, good: 'spices', constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  medicinal_flora: { weight: 2, good: 'medicine', constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  fibers: { weight: 3, good: 'textiles', constraints: { biospheres: ['complex', 'lush', 'sparse', 'exotic'] } },
  salt: { weight: 3, good: 'salt' },
  volcanic_glass: { weight: 2, good: 'crafts', constraints: { anyBiome: ['volcanic_fields', 'glass_plains', 'ash_wastes'] } },
  helium3: { weight: 2, good: 'fusion_fuel' },
  deuterium: { weight: 2, good: 'fusion_fuel', constraints: { requiresLiquidWater: true } },
  resonant_crystals: { weight: 0.8, good: 'crystals' },
  exotic_matter: { weight: 0.4, good: 'exotic_matter' },
  precursor_relics: { weight: 0.6, good: 'relics', constraints: { requiresPrecursors: true } },
  bio_compounds: { weight: 2, good: 'bio_compounds', constraints: { biospheres: ['complex', 'lush', 'exotic', 'microbial'] } },
  psychoactive_spores: { weight: 0.8, good: 'narcotics', constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  living_alloy: { weight: 0.3, good: 'exotic_matter', constraints: { planetTypes: ['living', 'machine', 'crystal', 'hollow'] } },
  geothermal_energy: { weight: 2, good: 'fuel' },
  stone: { weight: 5, good: 'stone' },
  silicates: { weight: 3, good: 'electronics' },
  rare_gases: { weight: 2, good: 'chemicals', constraints: { requiresAtmosphere: true } },
};

export interface HazardDef extends WeightedDef {
  /** How much this hazard contributes to planet danger (0..3). */
  danger: number;
}

export const HAZARD_TABLE: Record<HazardType, HazardDef> = {
  earthquakes: { weight: 5, danger: 1 },
  volcanism: { weight: 3, danger: 2 },
  superstorms: { weight: 3, danger: 1.5, constraints: { requiresAtmosphere: true } },
  radiation: { weight: 3, danger: 2 },
  toxic_flora: { weight: 2, danger: 1, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  apex_predators: { weight: 3, danger: 2, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  endemic_disease: { weight: 3, danger: 1.5, constraints: { biospheres: ['microbial', 'sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  floods: { weight: 3, danger: 1, constraints: { requiresLiquidWater: true } },
  sandstorms: { weight: 2, danger: 1, constraints: { requiresAtmosphere: true, anyBiome: ['desert', 'dunes', 'badlands', 'salt_flats', 'ash_wastes'] } },
  blizzards: { weight: 2, danger: 1, constraints: { requiresAtmosphere: true, maxMeanTemp: 15 } },
  acid_rain: { weight: 1.5, danger: 1.5, constraints: { requiresAtmosphere: true } },
  meteor_showers: { weight: 2, danger: 1 },
  extreme_tides: { weight: 1.5, danger: 1, constraints: { requiresLiquidWater: true } },
  sinkholes: { weight: 1.5, danger: 1 },
  spore_blooms: { weight: 1, danger: 1.5, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  psychic_echoes: { weight: 0.3, danger: 1.5 },
  feral_machines: { weight: 0.4, danger: 2, constraints: { planetTypes: ['machine', 'ecumenopolis', 'glass', 'ash', 'shattered', 'barren'] } },
  gravity_tides: { weight: 0.4, danger: 2 },
  solar_flares: { weight: 1.5, danger: 1.5 },
  wildfires: { weight: 2, danger: 1, constraints: { requiresAtmosphere: true, biospheres: ['sparse', 'complex', 'lush'] } },
  extreme_cold: { weight: 2, danger: 1.5, constraints: { maxMeanTemp: -5 } },
  extreme_heat: { weight: 2, danger: 1.5, constraints: { minMeanTemp: 30 } },
  crushing_pressure: { weight: 3, danger: 2.5, constraints: { pressures: ['crushing'] } },
  vacuum_exposure: { weight: 3, danger: 2.5, constraints: { pressures: ['none', 'trace'] } },
  migratory_swarms: { weight: 1, danger: 1, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  crystal_growth: { weight: 0.4, danger: 1.5, constraints: { anyBiome: ['crystal_fields', 'shard_fields'] } },
  tectonic_shear: { weight: 0.8, danger: 2 },
};
