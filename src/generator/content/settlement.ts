import type {
  Biome, DefenseType, DistrictType, GoverningBody, Industry, LinkType, Mood, PoiType, SettlementType, Terrain,
} from '../types/enums';
import type { WeightedDef } from './constraints';
import type { NamePattern } from './naming/patterns';

export interface SettlementTypeDef extends WeightedDef {
  /** 1 (hamlet) to 5 (capital). Drives district, POI and NPC counts. */
  size: 1 | 2 | 3 | 4 | 5;
  /**
   * Population: a fixed [min, max] range, or a fraction range of the
   * country's urban population (for capitals and cities).
   */
  pop: { fixed: [number, number] } | { urbanShare: [number, number] };
  /** Biomes this type can be built in. Omitted = any land biome. */
  biomes?: Biome[];
  /** Terrain override; otherwise terrain comes from the biome. */
  terrains?: Terrain[];
  governingBodies: Partial<Record<GoverningBody, number>>;
  industries: Partial<Record<Industry, number>>;
  /** District weight multipliers for this type. */
  districts: Partial<Record<DistrictType, number>>;
  namePatterns: NamePattern[];
}

const FOREST: Biome[] = ['temperate_forest', 'rainforest', 'boreal_forest', 'fungal_forest'];
const SEA: Biome[] = ['ocean', 'shallow_sea', 'reef'];
const HIGH: Biome[] = ['mountains', 'highlands', 'badlands', 'caverns'];

const PLAIN_NAMES: NamePattern[] = [
  { pattern: '{place}', weight: 6 },
  { pattern: '{root} {landform}', weight: 1.5 },
  { pattern: '{adjective} {landform}', weight: 1 },
];

export const SETTLEMENT_TYPE_TABLE: Record<SettlementType, SettlementTypeDef> = {
  capital: {
    weight: 0, size: 5, pop: { urbanShare: [0.12, 0.3] },
    governingBodies: {}, industries: { trade: 3, finance: 2, crafts: 1, manufacturing: 1 },
    districts: { administrative: 4, noble_quarter: 2, market: 2, temple: 1.5, foreign_quarter: 1.5, old_town: 1.5 },
    namePatterns: [{ pattern: '{place}', weight: 8 }, { pattern: '{root} {landform}', weight: 1 }],
  },
  city: {
    weight: 10, size: 4, pop: { urbanShare: [0.03, 0.1] }, constraints: { minTech: 1 },
    governingBodies: {}, industries: { trade: 3, manufacturing: 2, crafts: 2 },
    districts: { market: 2, industrial: 1.5, slums: 1.5, residential: 2 },
    namePatterns: PLAIN_NAMES,
  },
  town: {
    weight: 14, size: 3, pop: { fixed: [2000, 60000] },
    governingBodies: { mayor: 3, council: 2 }, industries: { agriculture: 2, crafts: 2, trade: 2 },
    districts: { market: 2, residential: 2, farmland: 1, artisan: 1.5 },
    namePatterns: PLAIN_NAMES,
  },
  village: {
    weight: 12, size: 1, pop: { fixed: [80, 2500] }, constraints: { maxTech: 8 },
    governingBodies: { elders: 4, mayor: 2 }, industries: { agriculture: 4, herding: 2, fishing: 2, forestry: 1 },
    districts: { farmland: 4, residential: 3, market: 1 },
    namePatterns: [...PLAIN_NAMES, { pattern: '{suffixed}', weight: 2 }],
  },
  outpost: {
    weight: 6, size: 1, pop: { fixed: [20, 600] },
    governingBodies: { appointed_administrator: 3, military_governor: 2 }, industries: { mining: 2, research: 1, trade: 1 },
    districts: { military: 2, warehouse: 2, residential: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{place} Outpost', weight: 2 }, { pattern: '{adjective} {landform} Post', weight: 1 }],
  },
  orbital_station: {
    weight: 4, size: 3, pop: { fixed: [500, 250000] }, constraints: { minTech: 7 }, terrains: ['orbit'],
    governingBodies: { appointed_administrator: 3, corporate_board: 2, council: 1 }, industries: { trade: 3, shipbuilding: 3, research: 2, energy: 1 },
    districts: { spaceport: 5, docks: 2, warehouse: 2, laboratory: 2, residential: 1 },
    namePatterns: [{ pattern: '{place} Station', weight: 3 }, { pattern: '{place} High', weight: 2 }, { pattern: '{adjective} {noun} Station', weight: 1 }],
  },
  floating_city: {
    weight: 2, size: 4, pop: { fixed: [5000, 2000000] }, constraints: { minTech: 6 }, terrains: ['floating'],
    biomes: ['floating_isles', 'storm_plains', 'ocean', 'toxic_marsh', 'shallow_sea', 'ash_wastes'],
    governingBodies: { council: 3, corporate_board: 2 }, industries: { trade: 2, energy: 2, tourism: 2 },
    districts: { gardens: 2, spaceport: 2, docks: 1, entertainment: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{adjective} {noun}', weight: 1 }, { pattern: 'Sky {place}', weight: 1 }],
  },
  underground: {
    weight: 4, size: 3, pop: { fixed: [1000, 500000] }, terrains: ['underground'],
    governingBodies: { council: 2, elders: 2, mayor: 1 }, industries: { mining: 4, crafts: 2, construction: 1 },
    districts: { undercity: 4, industrial: 2, residential: 2, market: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: 'Deep {place}', weight: 1.5 }, { pattern: '{root} Delve', weight: 1 }, { pattern: 'Under-{place}', weight: 0.8 }],
  },
  fortress: {
    weight: 3, size: 2, pop: { fixed: [300, 25000] },
    governingBodies: { military_governor: 6, noble_lord: 2 }, industries: { arms: 3, mercenary_work: 2 },
    districts: { military: 6, market: 1, temple: 1 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: 'Fort {place}', weight: 2 }, { pattern: '{place} Keep', weight: 1.5 }, { pattern: 'the {adjective} Bastion', weight: 1 }],
  },
  port: {
    weight: 6, size: 3, pop: { fixed: [5000, 800000] }, biomes: ['coast', ...SEA], terrains: ['coastal', 'delta', 'island'],
    constraints: { requiresLiquidWater: true },
    governingBodies: { mayor: 2, guild_council: 3, council: 1 }, industries: { fishing: 3, trade: 4, shipbuilding: 2, smuggling: 1 },
    districts: { docks: 6, market: 2, warehouse: 2, foreign_quarter: 1.5, slums: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: 'Port {place}', weight: 2 }, { pattern: '{place} Harbor', weight: 1 }, { pattern: '{adjective} Haven', weight: 0.6 }],
  },
  mining_colony: {
    weight: 4, size: 2, pop: { fixed: [200, 40000] }, biomes: [...HIGH, 'desert', 'volcanic_fields', 'ice_sheet', 'crystal_fields', 'salt_flats', 'machine_wastes', 'shard_fields', 'glass_plains', 'ash_wastes', 'tundra'],
    constraints: { minTech: 3 },
    governingBodies: { corporate_board: 4, appointed_administrator: 2, council: 1 }, industries: { mining: 6, energy: 1, salvage: 1 },
    districts: { industrial: 5, warehouse: 2, residential: 2, slums: 1 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: '{place} Dig', weight: 1 }, { pattern: '{place} Works', weight: 1 }, { pattern: '{adjective} Seam', weight: 0.8 }],
  },
  research_station: {
    weight: 2, size: 1, pop: { fixed: [30, 3000] }, constraints: { minTech: 5 },
    governingBodies: { council: 3, appointed_administrator: 2 }, industries: { research: 6, biotech: 2 },
    districts: { laboratory: 6, residential: 1, academic: 2 },
    namePatterns: [{ pattern: '{place} Station', weight: 2 }, { pattern: '{place} Observatory', weight: 1 }, { pattern: '{place} Institute', weight: 1 }],
  },
  monastery: {
    weight: 2, size: 1, pop: { fixed: [30, 2000] },
    governingBodies: { high_priest: 6 }, industries: { pilgrimage: 3, crafts: 2, agriculture: 1, education: 1 },
    districts: { temple: 6, gardens: 2, farmland: 1, necropolis: 1 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: 'the Cloister of {root}', weight: 1.5 }, { pattern: '{adjective} {noun} Retreat', weight: 1 }],
  },
  nomad_camp: {
    weight: 2, size: 1, pop: { fixed: [100, 6000] }, constraints: { maxTech: 6 },
    biomes: ['steppe', 'desert', 'dunes', 'tundra', 'savanna', 'grassland', 'salt_flats', 'ash_wastes', 'badlands'],
    governingBodies: { elders: 5, warlord: 1 }, industries: { herding: 4, trade: 2, crafts: 1 },
    districts: { residential: 3, market: 2, farmland: 0 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: 'the {adjective} Camp', weight: 1 }, { pattern: '{root} Gathering', weight: 1 }],
  },
  arcology: {
    weight: 2, size: 4, pop: { fixed: [100000, 6000000] }, constraints: { minTech: 7 },
    governingBodies: { corporate_board: 3, ai_steward: 1, council: 2 }, industries: { manufacturing: 2, data_services: 3, finance: 2, entertainment: 2 },
    districts: { residential: 3, gardens: 2, entertainment: 2, administrative: 1, industrial: 1 },
    namePatterns: [{ pattern: '{place} Arcology', weight: 2 }, { pattern: '{place} Spire', weight: 1.5 }, { pattern: '{adjective} Spire', weight: 1 }],
  },
  submerged_city: {
    weight: 3, size: 3, pop: { fixed: [2000, 1000000] }, constraints: { minTech: 5, requiresLiquidWater: true },
    biomes: SEA, terrains: ['submerged'],
    governingBodies: { council: 3, guild_council: 1, mayor: 1 }, industries: { fishing: 3, biotech: 2, energy: 2 },
    districts: { docks: 2, gardens: 2, laboratory: 1, residential: 2 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: '{place} Deep', weight: 1.5 }, { pattern: 'the {adjective} Dome', weight: 1 }],
  },
  trade_hub: {
    weight: 3, size: 3, pop: { fixed: [10000, 2000000] }, constraints: { minTech: 3 },
    governingBodies: { guild_council: 4, council: 1, corporate_board: 1 }, industries: { trade: 6, finance: 2, smuggling: 1 },
    districts: { market: 5, warehouse: 3, foreign_quarter: 3, entertainment: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{place} Exchange', weight: 1 }, { pattern: '{place} Crossing', weight: 1.5 }],
  },
  ruin_town: {
    weight: 2, size: 2, pop: { fixed: [200, 25000] }, constraints: { requiresPrecursors: true },
    governingBodies: { elders: 2, council: 2, crime_boss: 1 }, industries: { salvage: 4, relic_hunting: 3, trade: 1 },
    districts: { ruins: 6, market: 2, residential: 1 },
    namePatterns: [{ pattern: '{place}', weight: 2 }, { pattern: 'Old {place}', weight: 2 }, { pattern: '{place} Ruins', weight: 1 }],
  },
  frontier_camp: {
    weight: 2, size: 1, pop: { fixed: [40, 2500] }, constraints: { origins: ['colonial', 'mixed', 'lost_colony'] },
    governingBodies: { appointed_administrator: 2, mayor: 2, warlord: 1 }, industries: { mining: 2, agriculture: 2, salvage: 1 },
    districts: { residential: 2, warehouse: 2, market: 1 },
    namePatterns: [{ pattern: "{root}'s Landing", weight: 2 }, { pattern: '{place}', weight: 2 }, { pattern: 'Camp {root}', weight: 1 }, { pattern: 'Last {landform}', weight: 1 }],
  },
  hive_city: {
    weight: 3, size: 4, pop: { fixed: [50000, 20000000] }, constraints: { bodyPlans: ['insectoid', 'colonial'] },
    governingBodies: { collective: 6 }, industries: { manufacturing: 3, agriculture: 2, construction: 2 },
    districts: { residential: 4, undercity: 2, industrial: 2, farmland: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{place} Hive', weight: 2 }],
  },
  tree_city: {
    weight: 2, size: 3, pop: { fixed: [2000, 300000] }, biomes: FOREST, constraints: { biospheres: ['complex', 'lush', 'exotic'] },
    governingBodies: { elders: 3, council: 2 }, industries: { forestry: 3, crafts: 3, medicine: 1 },
    districts: { residential: 3, gardens: 3, artisan: 2, temple: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{root} Canopy', weight: 1.5 }, { pattern: 'the {adjective} Bough', weight: 1 }],
  },
  cliff_city: {
    weight: 2, size: 3, pop: { fixed: [2000, 400000] }, biomes: [...HIGH, 'coast'], terrains: ['cliffside', 'canyon'],
    governingBodies: { council: 2, noble_lord: 2, mayor: 1 }, industries: { mining: 2, crafts: 2, trade: 1 },
    districts: { residential: 3, market: 2, temple: 1, old_town: 1 },
    namePatterns: [{ pattern: '{place}', weight: 3 }, { pattern: '{place} Steps', weight: 1 }, { pattern: 'the {adjective} Stair', weight: 1 }],
  },
};

export interface GoverningBodyDef {
  titles: string[];
}

export const GOVERNING_BODY_TABLE: Record<GoverningBody, GoverningBodyDef> = {
  mayor: { titles: ['Mayor', 'Reeve', 'Burgomaster', 'Warden'] },
  council: { titles: ['First Councillor', 'Council Speaker', 'Chair of the Council'] },
  noble_lord: { titles: ['Lord-Governor', 'Liege', 'Margrave', 'Thane'] },
  military_governor: { titles: ['Commandant', 'Castellan', 'Garrison Marshal'] },
  guild_council: { titles: ['Guildmaster-General', 'Master of Guilds', 'First Factor'] },
  elders: { titles: ['Eldest', 'Speaker of Elders', 'Head Elder'] },
  corporate_board: { titles: ['Site Director', 'Board Chair', 'Operations Chief'] },
  high_priest: { titles: ['High Priest', 'Abbot', 'Prior', 'Keeper of the Rite'] },
  assembly: { titles: ['Assembly Speaker', 'Moderator', 'Tribune'] },
  warlord: { titles: ['Warlord', 'Boss', 'Strongarm'] },
  appointed_administrator: { titles: ['Administrator', 'Prefect', 'Overseer', 'Magistrate'] },
  ai_steward: { titles: ['Steward Intelligence', 'Civic Mind', 'Custodian Core'] },
  crime_boss: { titles: ['Boss', 'Kingpin', 'Patron'] },
  collective: { titles: ['Voice of the Collective', 'Consensus Speaker', 'Facilitator'] },
};

export interface LinkTypeDef {
  weight: number;
  minTech: number;
  maxTech: number;
}

export const LINK_TYPE_TABLE: Record<LinkType, LinkTypeDef> = {
  footpath: { weight: 3, minTech: 0, maxTech: 3 },
  road: { weight: 6, minTech: 1, maxTech: 7 },
  river: { weight: 2, minTech: 0, maxTech: 6 },
  rail: { weight: 4, minTech: 4, maxTech: 7 },
  sea_route: { weight: 3, minTech: 1, maxTech: 10 },
  air_route: { weight: 3, minTech: 5, maxTech: 10 },
  orbital_shuttle: { weight: 2, minTech: 7, maxTech: 10 },
  tunnel: { weight: 1.5, minTech: 2, maxTech: 10 },
  caravan_trail: { weight: 3, minTech: 0, maxTech: 5 },
  portal: { weight: 0.3, minTech: 9, maxTech: 10 },
  maglev: { weight: 3, minTech: 7, maxTech: 10 },
};

export const DEFENSE_TABLE: Record<DefenseType, WeightedDef> = {
  walls: { weight: 5, constraints: { maxTech: 7 } },
  moat: { weight: 1.5, constraints: { maxTech: 4 } },
  watchtowers: { weight: 4, constraints: { maxTech: 7 } },
  shield_generator: { weight: 3, constraints: { minTech: 8 } },
  orbital_defense: { weight: 2, constraints: { minTech: 7 } },
  gun_emplacements: { weight: 3, constraints: { minTech: 4 } },
  militia: { weight: 5 },
  minefields: { weight: 1, constraints: { minTech: 4 } },
  natural_barrier: { weight: 3 },
  fortified_gates: { weight: 3, constraints: { maxTech: 8 } },
  drone_patrols: { weight: 3, constraints: { minTech: 7 } },
  psionic_wards: { weight: 1, constraints: { requiresAbility: ['psionics', 'telepathy', 'light_weaving'] } },
  beast_guardians: { weight: 1, constraints: { biospheres: ['complex', 'lush', 'exotic'], maxTech: 7 } },
  hidden_location: { weight: 1 },
};

export interface DistrictDef extends WeightedDef {
  nouns: string[];
  /** Minimum settlement size. */
  minSize: number;
}

export const DISTRICT_TABLE: Record<DistrictType, DistrictDef> = {
  market: { weight: 5, minSize: 1, nouns: ['Market', 'Bazaar', 'Exchange', 'Souk', 'Arcade'] },
  residential: { weight: 5, minSize: 1, nouns: ['Rows', 'Quarter', 'Terraces', 'Commons', 'Blocks'] },
  slums: { weight: 3, minSize: 3, nouns: ['Warrens', 'Sprawl', 'Stacks', 'Shanties', 'Pits'] },
  noble_quarter: { weight: 2, minSize: 3, nouns: ['Heights', 'Crown Quarter', 'High Ward', 'Gardens', 'Palisade'] },
  temple: { weight: 3, minSize: 1, nouns: ['Temple Ward', 'Sanctum', 'Close', 'Holy Quarter'] },
  industrial: { weight: 3, minSize: 2, nouns: ['Works', 'Foundries', 'Mills', 'Yards', 'Forge Ward'], constraints: { minTech: 3 } },
  docks: { weight: 3, minSize: 2, nouns: ['Docks', 'Wharves', 'Quays', 'Moorings'] },
  spaceport: { weight: 2, minSize: 2, nouns: ['Port', 'Landing Field', 'Skydocks', 'Launch Ring'], constraints: { minTech: 6 } },
  military: { weight: 2, minSize: 2, nouns: ['Garrison', 'Barracks Ward', 'Citadel', 'Bastion'] },
  academic: { weight: 2, minSize: 3, nouns: ['Colleges', 'Scholars’ Ward', 'Academy Row', 'Lyceum'], constraints: { minTech: 2 } },
  gardens: { weight: 2, minSize: 2, nouns: ['Gardens', 'Greenway', 'Arbors', 'Groves'] },
  ruins: { weight: 1, minSize: 1, nouns: ['Ruins', 'Old Stones', 'Broken Ward', 'Remnant'] },
  foreign_quarter: { weight: 2, minSize: 3, nouns: ['Foreign Quarter', 'Strangers’ Ward', 'Embassy Row', 'Outlanders’ Rows'] },
  entertainment: { weight: 2, minSize: 3, nouns: ['Pleasure Quarter', 'Lantern Row', 'Revels', 'Strip'] },
  administrative: { weight: 2, minSize: 3, nouns: ['Civic Quarter', 'Ministries', 'Hall Ward', 'Seat'] },
  artisan: { weight: 3, minSize: 2, nouns: ['Crafts Row', 'Workshops', 'Makers’ Quarter', 'Kilns'] },
  undercity: { weight: 1.5, minSize: 3, nouns: ['Undercity', 'Deeps', 'Sublevels', 'Underways'] },
  farmland: { weight: 3, minSize: 1, nouns: ['Fields', 'Steads', 'Terraces', 'Orchards', 'Paddocks'] },
  warehouse: { weight: 2, minSize: 2, nouns: ['Godowns', 'Stores', 'Depots', 'Holds'] },
  necropolis: { weight: 1, minSize: 3, nouns: ['Necropolis', 'Boneyard', 'Silent Ward', 'Tombs'] },
  laboratory: { weight: 1, minSize: 2, nouns: ['Labs', 'Institute', 'Research Ward', 'Test Grounds'], constraints: { minTech: 5 } },
  old_town: { weight: 2, minSize: 3, nouns: ['Old Town', 'First Ward', 'Founders’ Quarter', 'Old Walls'] },
};

export const DISTRICT_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {district}', weight: 3 },
  { pattern: 'the {adjective} {district}', weight: 3 },
  { pattern: '{root} {district}', weight: 3 },
];

export interface PoiDef extends WeightedDef {
  /** Minimum settlement size. */
  minSize: number;
  /** Districts this point of interest is usually found in (x3 weight if present). */
  districts: DistrictType[];
  namePatterns: NamePattern[];
}

const VENUE = (nouns: string[]): NamePattern[] => [
  { pattern: 'The {adjective} {noun}', weight: 4 },
  { pattern: "The {noun} and {noun2}", weight: 2 },
  ...nouns.map((n) => ({ pattern: `{root}'s ${n}`, weight: 1.5 })),
];

export const POI_TABLE: Record<PoiType, PoiDef> = {
  tavern: { weight: 8, minSize: 1, districts: ['market', 'docks', 'residential', 'entertainment', 'slums'], namePatterns: VENUE(['Tavern', 'Taproom', 'Alehouse']) },
  temple: { weight: 5, minSize: 1, districts: ['temple', 'old_town'], namePatterns: [{ pattern: 'Temple of the {adjective} {noun}', weight: 3 }, { pattern: 'the {root} Temple', weight: 2 }, { pattern: 'House of {root}', weight: 1 }] },
  guild_hall: { weight: 4, minSize: 2, districts: ['artisan', 'market', 'industrial'], namePatterns: [{ pattern: 'the {noun} Guildhall', weight: 3 }, { pattern: 'Hall of the {adjective} {noun}', weight: 2 }] },
  ruin: { weight: 2, minSize: 1, districts: ['ruins', 'old_town'], namePatterns: [{ pattern: 'the {adjective} Ruin', weight: 2 }, { pattern: 'the Ruins of {root}', weight: 3 }] },
  spaceport: { weight: 3, minSize: 2, districts: ['spaceport'], constraints: { minTech: 6 }, namePatterns: [{ pattern: '{root} Starport', weight: 3 }, { pattern: 'the {adjective} Landing', weight: 2 }] },
  black_market: { weight: 2, minSize: 2, districts: ['slums', 'undercity', 'docks'], namePatterns: [{ pattern: 'the {adjective} Market', weight: 2 }, { pattern: 'the Underbazaar', weight: 1 }, { pattern: "{root}'s Back Room", weight: 1.5 }] },
  market: { weight: 5, minSize: 1, districts: ['market'], namePatterns: [{ pattern: 'the {adjective} Market', weight: 3 }, { pattern: '{root} Square', weight: 2 }] },
  palace: { weight: 1, minSize: 4, districts: ['noble_quarter', 'administrative'], namePatterns: [{ pattern: 'the {adjective} Palace', weight: 3 }, { pattern: 'the Palace of {root}', weight: 2 }, { pattern: 'the {noun} Seat', weight: 1 }] },
  barracks: { weight: 2, minSize: 2, districts: ['military'], namePatterns: [{ pattern: 'the {adjective} Barracks', weight: 2 }, { pattern: '{root} Garrison', weight: 2 }] },
  library: { weight: 2, minSize: 3, districts: ['academic', 'temple', 'old_town'], namePatterns: [{ pattern: 'the {adjective} Library', weight: 2 }, { pattern: 'the {root} Athenaeum', weight: 1 }] },
  laboratory: { weight: 1.5, minSize: 2, districts: ['laboratory', 'academic'], constraints: { minTech: 5 }, namePatterns: [{ pattern: 'the {root} Laboratory', weight: 2 }, { pattern: '{adjective} {noun} Research', weight: 1 }] },
  hospital: { weight: 2, minSize: 3, districts: ['residential', 'temple', 'academic'], namePatterns: [{ pattern: 'the {adjective} Infirmary', weight: 2 }, { pattern: 'House of Mercy {root}', weight: 1 }, { pattern: '{root} Hospice', weight: 1.5 }] },
  arena: { weight: 1.5, minSize: 3, districts: ['entertainment'], namePatterns: [{ pattern: 'the {adjective} Arena', weight: 2 }, { pattern: 'the {root} Pit', weight: 1.5 }] },
  bathhouse: { weight: 1.5, minSize: 2, districts: ['entertainment', 'residential', 'noble_quarter'], constraints: { requiresLiquidWater: true }, namePatterns: [{ pattern: 'the {adjective} Baths', weight: 2 }, { pattern: '{root} Springs', weight: 1.5 }] },
  workshop: { weight: 4, minSize: 1, districts: ['artisan', 'industrial'], namePatterns: [{ pattern: "{root}'s Workshop", weight: 3 }, { pattern: 'the {adjective} {noun} Works', weight: 1.5 }] },
  shrine: { weight: 3, minSize: 1, districts: ['temple', 'gardens', 'farmland'], namePatterns: [{ pattern: 'the Shrine of the {noun}', weight: 3 }, { pattern: "{root}'s Shrine", weight: 2 }] },
  prison: { weight: 1, minSize: 3, districts: ['military', 'administrative'], namePatterns: [{ pattern: 'the {adjective} Gaol', weight: 2 }, { pattern: '{root} Hold', weight: 2 }] },
  embassy: { weight: 1, minSize: 4, districts: ['foreign_quarter', 'administrative'], namePatterns: [{ pattern: 'the {root} Embassy', weight: 3 }] },
  observatory: { weight: 1, minSize: 2, districts: ['academic', 'temple'], constraints: { minTech: 2 }, namePatterns: [{ pattern: 'the {adjective} Observatory', weight: 2 }, { pattern: '{root} Watch', weight: 1.5 }] },
  museum: { weight: 1, minSize: 3, districts: ['academic', 'old_town', 'administrative'], constraints: { minTech: 4 }, namePatterns: [{ pattern: 'the {root} Collection', weight: 2 }, { pattern: 'the Museum of the {adjective} {noun}', weight: 1.5 }] },
  gambling_den: { weight: 2, minSize: 2, districts: ['entertainment', 'slums', 'docks'], namePatterns: [{ pattern: 'the {adjective} Wheel', weight: 2 }, { pattern: "{root}'s Tables", weight: 2 }, { pattern: 'the {noun} and Dice', weight: 1 }] },
  inn: { weight: 5, minSize: 1, districts: ['market', 'residential', 'foreign_quarter'], namePatterns: VENUE(['Inn', 'Rest', 'Lodge']) },
  docks: { weight: 2, minSize: 2, districts: ['docks'], constraints: { requiresLiquidWater: true }, namePatterns: [{ pattern: '{root} Wharf', weight: 2 }, { pattern: 'the {adjective} Quay', weight: 2 }] },
  monument: { weight: 2, minSize: 2, districts: ['administrative', 'old_town', 'gardens'], namePatterns: [{ pattern: 'the {adjective} Monument', weight: 2 }, { pattern: 'the Statue of {root}', weight: 2 }, { pattern: 'the {noun} Pillar', weight: 1 }] },
  archive: { weight: 1.5, minSize: 3, districts: ['administrative', 'academic'], namePatterns: [{ pattern: 'the {adjective} Archive', weight: 2 }, { pattern: 'the {root} Records', weight: 1 }] },
  shipyard: { weight: 1.5, minSize: 2, districts: ['docks', 'spaceport', 'industrial'], constraints: { minTech: 2 }, namePatterns: [{ pattern: '{root} Yards', weight: 2 }, { pattern: 'the {adjective} Slipway', weight: 1 }] },
  salvage_yard: { weight: 2, minSize: 1, districts: ['industrial', 'slums', 'ruins', 'warehouse'], namePatterns: [{ pattern: "{root}'s Salvage", weight: 2 }, { pattern: 'the {adjective} Scrapyard', weight: 1.5 }] },
  theater: { weight: 1.5, minSize: 3, districts: ['entertainment', 'noble_quarter'], namePatterns: [{ pattern: 'the {adjective} Stage', weight: 2 }, { pattern: 'the {root} Playhouse', weight: 2 }] },
  garden: { weight: 2, minSize: 2, districts: ['gardens', 'noble_quarter'], constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] }, namePatterns: [{ pattern: 'the {adjective} Garden', weight: 2 }, { pattern: "{root}'s Garden", weight: 1.5 }] },
  crypt: { weight: 1.5, minSize: 2, districts: ['necropolis', 'temple', 'old_town'], namePatterns: [{ pattern: 'the Crypt of {root}', weight: 2 }, { pattern: 'the {adjective} Vault', weight: 1.5 }] },
};

export const NICKNAME_PATTERNS: NamePattern[] = [
  { pattern: 'the {adjective} {epithetNoun}', weight: 5 },
  { pattern: 'the {epithetNoun} of the {landform}', weight: 2 },
  { pattern: 'the {adjective} {landform}', weight: 1.5 },
];

/** Nicknames by settlement size (index = size 1..5). */
export const NICKNAME_NOUNS: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: ['Hamlet', 'Hollow', 'Stead', 'Corner', 'Nook', 'Camp'],
  2: ['Hold', 'Gate', 'Watch', 'Post', 'Den'],
  3: ['Town', 'Market', 'Crossing', 'Harbor', 'Hearth'],
  4: ['City', 'Jewel', 'Lantern', 'Furnace', 'Hive'],
  5: ['Crown', 'Throne', 'Heart', 'Jewel', 'Seat', 'Capital'],
};

/** Mood weights by stability index (0 collapsing .. 5 secure); refined in code by wealth and danger. */
export const MOOD_BY_STABILITY: Partial<Record<Mood, number[]>> = {
  bustling: [0.5, 1, 2, 3, 4, 4],
  tense: [4, 4, 3, 3, 1, 0.5],
  festive: [0.2, 0.5, 1, 1.5, 2, 2.5],
  grim: [4, 3, 2, 1, 0.5, 0.3],
  decadent: [0.5, 0.5, 1, 1, 1.5, 2],
  fearful: [4, 3, 2, 1, 0.3, 0.2],
  hopeful: [1, 1.5, 2, 2, 2, 1.5],
  sleepy: [0.2, 0.5, 1, 2, 3, 4],
  militant: [3, 3, 2, 1.5, 1, 0.5],
  pious: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  rowdy: [2, 2, 2, 2, 1.5, 1],
  secretive: [2, 2, 1.5, 1.5, 1, 1],
  mournful: [3, 2, 1.5, 1, 0.5, 0.3],
  defiant: [3, 3, 2, 1, 0.5, 0.2],
  serene: [0.1, 0.2, 0.5, 1, 2, 3],
};

/** Landform words that fit each terrain, for settlement names and nicknames ("the Jewel of the {landform}"). */
export const TERRAIN_LANDFORMS: Record<Terrain, string[]> = {
  flat: ['Flats', 'Plain', 'Expanse', 'Downs', 'Fields', 'Reach'],
  hills: ['Hills', 'Downs', 'Knoll', 'Rise', 'Fells', 'Wold'],
  mountain: ['Peak', 'Crag', 'Tor', 'Spur', 'Heights', 'Pass'],
  valley: ['Vale', 'Dell', 'Hollow', 'Glen', 'Basin', 'Run'],
  coastal: ['Shore', 'Strand', 'Cove', 'Point', 'Sound', 'Bay'],
  riverside: ['Ford', 'Crossing', 'Bend', 'Run', 'Banks', 'Falls'],
  island: ['Isle', 'Atoll', 'Key', 'Shoals', 'Rock', 'Holm'],
  cliffside: ['Cliffs', 'Bluff', 'Scarp', 'Ledge', 'Stair', 'Edge'],
  underground: ['Deep', 'Delve', 'Caverns', 'Hollow', 'Vault', 'Undercroft'],
  floating: ['Drift', 'Skyreach', 'Heights', 'Cloudline', 'Float', 'Span'],
  crater: ['Crater', 'Bowl', 'Basin', 'Rim', 'Scar', 'Ring'],
  plateau: ['Mesa', 'Tableland', 'Shelf', 'Plateau', 'Heights', 'Terrace'],
  canyon: ['Canyon', 'Gorge', 'Gulch', 'Cut', 'Chasm', 'Narrows'],
  lakeside: ['Mere', 'Lake', 'Pools', 'Shore', 'Waters', 'Tarn'],
  delta: ['Delta', 'Mouths', 'Fens', 'Marsh', 'Braids', 'Mire'],
  glacier: ['Ice', 'Glacier', 'Shelf', 'Floe', 'Icefall', 'Rime'],
  orbit: ['High', 'Orbit', 'Ring', 'Anchorage', 'Height', 'Station'],
  submerged: ['Deep', 'Depths', 'Trench', 'Dome', 'Reef', 'Abyss'],
};
