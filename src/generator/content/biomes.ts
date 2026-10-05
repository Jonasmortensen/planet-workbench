import type { Biome, Terrain } from '../types/enums';

export type BiomeWater = 'sea' | 'wet' | 'dry' | 'any';

export interface BiomeDef {
  /** Local temperature range (°C) in which this biome can exist. */
  temp: [number, number];
  /** 'sea' biomes take their share from water coverage; the rest share the land. */
  water: BiomeWater;
  /** 0..1, how well this biome supports dense population. */
  habitability: number;
  /** Frozen water counts as surface water but is not liquid. */
  frozen?: boolean;
  exotic?: boolean;
  /** Typical terrains for settlements in this biome (used from milestone 2). */
  terrains: Terrain[];
}

export const BIOME_TABLE: Record<Biome, BiomeDef> = {
  ocean: { temp: [-2, 95], water: 'sea', habitability: 0.05, terrains: ['submerged', 'island'] },
  shallow_sea: { temp: [0, 95], water: 'sea', habitability: 0.15, terrains: ['submerged', 'island', 'coastal'] },
  reef: { temp: [18, 40], water: 'sea', habitability: 0.2, terrains: ['island', 'submerged', 'coastal'] },
  coast: { temp: [-10, 50], water: 'wet', habitability: 0.95, terrains: ['coastal', 'cliffside', 'delta', 'island'] },
  temperate_forest: { temp: [-5, 25], water: 'wet', habitability: 0.8, terrains: ['valley', 'hills', 'riverside', 'lakeside'] },
  rainforest: { temp: [18, 40], water: 'wet', habitability: 0.55, terrains: ['riverside', 'valley', 'hills', 'delta'] },
  boreal_forest: { temp: [-25, 12], water: 'wet', habitability: 0.5, terrains: ['valley', 'lakeside', 'hills', 'riverside'] },
  grassland: { temp: [-5, 32], water: 'any', habitability: 0.9, terrains: ['flat', 'riverside', 'hills', 'lakeside'] },
  savanna: { temp: [15, 40], water: 'dry', habitability: 0.7, terrains: ['flat', 'riverside', 'hills'] },
  steppe: { temp: [-15, 25], water: 'dry', habitability: 0.6, terrains: ['flat', 'hills', 'plateau', 'riverside'] },
  desert: { temp: [5, 65], water: 'dry', habitability: 0.2, terrains: ['flat', 'canyon', 'crater', 'underground'] },
  dunes: { temp: [5, 65], water: 'dry', habitability: 0.1, terrains: ['flat', 'underground'] },
  badlands: { temp: [-40, 80], water: 'dry', habitability: 0.2, terrains: ['canyon', 'plateau', 'crater', 'cliffside'] },
  salt_flats: { temp: [-10, 70], water: 'dry', habitability: 0.15, terrains: ['flat', 'lakeside', 'crater'] },
  tundra: { temp: [-40, 5], water: 'any', habitability: 0.3, terrains: ['flat', 'hills', 'coastal', 'riverside'] },
  ice_sheet: { temp: [-120, 0], water: 'sea', habitability: 0.05, frozen: true, terrains: ['glacier', 'underground', 'flat'] },
  mountains: { temp: [-50, 40], water: 'any', habitability: 0.35, terrains: ['mountain', 'cliffside', 'valley', 'underground'] },
  highlands: { temp: [-20, 30], water: 'any', habitability: 0.6, terrains: ['plateau', 'hills', 'valley'] },
  wetland: { temp: [0, 40], water: 'wet', habitability: 0.45, terrains: ['delta', 'riverside', 'lakeside', 'flat'] },
  volcanic_fields: { temp: [0, 200], water: 'dry', habitability: 0.15, terrains: ['crater', 'mountain', 'plateau', 'underground'] },
  ash_wastes: { temp: [-40, 90], water: 'dry', habitability: 0.1, terrains: ['flat', 'crater', 'underground'] },
  caverns: { temp: [-60, 100], water: 'any', habitability: 0.4, terrains: ['underground', 'canyon'] },
  crystal_fields: { temp: [-100, 150], water: 'any', habitability: 0.25, exotic: true, terrains: ['flat', 'canyon', 'crater', 'plateau'] },
  fungal_forest: { temp: [0, 40], water: 'wet', habitability: 0.45, exotic: true, terrains: ['valley', 'underground', 'riverside'] },
  toxic_marsh: { temp: [5, 90], water: 'wet', habitability: 0.1, terrains: ['delta', 'flat', 'lakeside'] },
  glass_plains: { temp: [-60, 150], water: 'dry', habitability: 0.15, exotic: true, terrains: ['flat', 'crater', 'underground'] },
  storm_plains: { temp: [-30, 60], water: 'any', habitability: 0.2, terrains: ['flat', 'underground', 'canyon'] },
  floating_isles: { temp: [-30, 50], water: 'any', habitability: 0.35, exotic: true, terrains: ['floating', 'cliffside'] },
  flesh_plains: { temp: [0, 50], water: 'wet', habitability: 0.4, exotic: true, terrains: ['flat', 'valley', 'hills'] },
  machine_wastes: { temp: [-80, 120], water: 'dry', habitability: 0.3, exotic: true, terrains: ['flat', 'underground', 'canyon', 'plateau'] },
  urban_sprawl: { temp: [-30, 60], water: 'any', habitability: 1, terrains: ['flat', 'underground', 'coastal', 'plateau'] },
  shard_fields: { temp: [-120, 100], water: 'dry', habitability: 0.15, exotic: true, terrains: ['floating', 'cliffside', 'crater'] },
};
