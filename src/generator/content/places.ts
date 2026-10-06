import type { DistrictType, Industry, Occupation, PoiType, SettlementType, TreasureCategory } from '../types/enums';
import type { WeightedDef } from './constraints';
import type { NamePattern } from './naming/patterns';

/**
 * Points of interest. They are created to hold NPCs (steps/places.ts), so a
 * type only appears where someone works, lives or turns up.
 *
 * Name slots: {adjective} {noun} {noun2} {root}, and for residences
 * {family} (family name, or a coined root), {given} and {street}.
 */
export interface PoiDef extends WeightedDef {
  /** Minimum settlement size (1 hamlet .. 5 capital). */
  minSize: number;
  /** Districts this point of interest is usually found in. */
  districts: DistrictType[];
  /** Base significance, an index into POI_SIGNIFICANCES (minor .. landmark). */
  significance: number;
  /** A home rather than a venue: NPCs live here. */
  residence?: boolean;
  /** Treasure categories that fit here, weighted. Others still appear through world facts (intel, leverage). */
  treasures: Partial<Record<TreasureCategory, number>>;
  namePatterns: NamePattern[];
}

const VENUE = (nouns: string[]): NamePattern[] => [
  { pattern: 'The {adjective} {noun}', weight: 4 },
  { pattern: 'The {noun} and {noun2}', weight: 2 },
  ...nouns.map((n) => ({ pattern: `{root}'s ${n}`, weight: 1.5 })),
];

const P = (pattern: string, weight = 1): NamePattern => ({ pattern, weight });

export const POI_TABLE: Record<PoiType, PoiDef> = {
  tavern: { weight: 8, minSize: 1, significance: 0, districts: ['market', 'docks', 'residential', 'entertainment', 'slums'], treasures: { intel: 3, wealth: 1, map: 1 }, namePatterns: VENUE(['Tavern', 'Taproom', 'Alehouse']) },
  temple: { weight: 5, minSize: 1, significance: 1, districts: ['temple', 'old_town'], treasures: { relic: 5, knowledge: 3, wealth: 1, artifact: 1 }, namePatterns: [P('Temple of the {adjective} {noun}', 3), P('the {root} Temple', 2), P('House of {root}')] },
  guild_hall: { weight: 4, minSize: 2, significance: 1, districts: ['artisan', 'market', 'industrial'], treasures: { wealth: 3, knowledge: 2, access: 2, technology: 1 }, namePatterns: [P('the {noun} Guildhall', 3), P('Hall of the {adjective} {noun}', 2)] },
  ruin: { weight: 2, minSize: 1, significance: 1, districts: ['ruins', 'old_town'], treasures: { artifact: 5, relic: 2, map: 2, technology: 1, weapon: 1 }, namePatterns: [P('the {adjective} Ruin', 2), P('the Ruins of {root}', 3)] },
  spaceport: { weight: 3, minSize: 2, significance: 2, districts: ['spaceport'], constraints: { minTech: 6 }, treasures: { technology: 3, map: 3, resource: 2, access: 2 }, namePatterns: [P('{root} Starport', 3), P('the {adjective} Landing', 2)] },
  black_market: { weight: 2, minSize: 2, significance: 1, districts: ['slums', 'undercity', 'docks'], treasures: { weapon: 3, technology: 2, resource: 2, intel: 2, artifact: 1 }, namePatterns: [P('the {adjective} Market', 2), P('the Underbazaar'), P("{root}'s Back Room", 1.5)] },
  market: { weight: 5, minSize: 1, significance: 1, districts: ['market'], treasures: { resource: 4, wealth: 2, artifact: 1 }, namePatterns: [P('the {adjective} Market', 3), P('{root} Square', 2)] },
  palace: { weight: 1, minSize: 3, significance: 3, districts: ['noble_quarter', 'administrative'], treasures: { wealth: 4, artifact: 2, leverage: 2, access: 2, armor: 1, weapon: 1 }, namePatterns: [P('the {adjective} Palace', 3), P('the Palace of {root}', 2), P('the {noun} Seat')] },
  barracks: { weight: 2, minSize: 2, significance: 1, districts: ['military'], treasures: { weapon: 4, armor: 3, map: 2, access: 1 }, namePatterns: [P('the {adjective} Barracks', 2), P('{root} Garrison', 2)] },
  library: { weight: 2, minSize: 3, significance: 1, districts: ['academic', 'temple', 'old_town'], treasures: { knowledge: 5, map: 2, relic: 1 }, namePatterns: [P('the {adjective} Library', 2), P('the {root} Athenaeum')] },
  laboratory: { weight: 1.5, minSize: 2, significance: 1, districts: ['laboratory', 'academic'], constraints: { minTech: 5 }, treasures: { technology: 5, knowledge: 2, resource: 1 }, namePatterns: [P('the {root} Laboratory', 2), P('{adjective} {noun} Research')] },
  hospital: { weight: 2, minSize: 3, significance: 1, districts: ['residential', 'temple', 'academic'], treasures: { knowledge: 3, technology: 2, resource: 2 }, namePatterns: [P('the {adjective} Infirmary', 2), P('House of Mercy {root}'), P('{root} Hospice', 1.5)] },
  arena: { weight: 1.5, minSize: 3, significance: 2, districts: ['entertainment'], treasures: { weapon: 4, armor: 3, wealth: 2 }, namePatterns: [P('the {adjective} Arena', 2), P('the {root} Pit', 1.5)] },
  bathhouse: { weight: 1.5, minSize: 2, significance: 0, districts: ['entertainment', 'residential', 'noble_quarter'], constraints: { requiresLiquidWater: true }, treasures: { intel: 3, wealth: 1 }, namePatterns: [P('the {adjective} Baths', 2), P('{root} Springs', 1.5)] },
  workshop: { weight: 4, minSize: 1, significance: 0, districts: ['artisan', 'industrial'], treasures: { weapon: 3, armor: 2, technology: 3, resource: 2 }, namePatterns: [P("{root}'s Workshop", 3), P('the {adjective} {noun} Works', 1.5)] },
  shrine: { weight: 3, minSize: 1, significance: 0, districts: ['temple', 'gardens', 'farmland'], treasures: { relic: 5, knowledge: 1 }, namePatterns: [P('the Shrine of the {noun}', 3), P("{root}'s Shrine", 2)] },
  prison: { weight: 1, minSize: 2, significance: 1, districts: ['military', 'administrative'], treasures: { intel: 3, access: 2, leverage: 2 }, namePatterns: [P('the {adjective} Gaol', 2), P('{root} Hold', 2)] },
  embassy: { weight: 1, minSize: 4, significance: 2, districts: ['foreign_quarter', 'administrative'], treasures: { intel: 4, leverage: 2, access: 2, wealth: 1 }, namePatterns: [P('the {root} Embassy', 3)] },
  observatory: { weight: 1, minSize: 2, significance: 1, districts: ['academic', 'temple'], constraints: { minTech: 2 }, treasures: { map: 4, knowledge: 3, technology: 1 }, namePatterns: [P('the {adjective} Observatory', 2), P('{root} Watch', 1.5)] },
  museum: { weight: 1, minSize: 3, significance: 1, districts: ['academic', 'old_town', 'administrative'], constraints: { minTech: 4 }, treasures: { artifact: 4, relic: 2, weapon: 1, armor: 1, map: 1 }, namePatterns: [P('the {root} Collection', 2), P('the Museum of the {adjective} {noun}', 1.5)] },
  gambling_den: { weight: 2, minSize: 2, significance: 0, districts: ['entertainment', 'slums', 'docks'], treasures: { wealth: 4, leverage: 2, intel: 2 }, namePatterns: [P('the {adjective} Wheel', 2), P("{root}'s Tables", 2), P('the {noun} and Dice')] },
  inn: { weight: 5, minSize: 1, significance: 0, districts: ['market', 'residential', 'foreign_quarter'], treasures: { intel: 2, map: 2, wealth: 1 }, namePatterns: VENUE(['Inn', 'Rest', 'Lodge']) },
  docks: { weight: 2, minSize: 2, significance: 1, districts: ['docks'], constraints: { requiresLiquidWater: true }, treasures: { resource: 3, map: 3, wealth: 1 }, namePatterns: [P('{root} Wharf', 2), P('the {adjective} Quay', 2)] },
  monument: { weight: 2, minSize: 2, significance: 2, districts: ['administrative', 'old_town', 'gardens'], treasures: { relic: 2, artifact: 2, knowledge: 1 }, namePatterns: [P('the {adjective} Monument', 2), P('the Statue of {root}', 2), P('the {noun} Pillar')] },
  archive: { weight: 1.5, minSize: 3, significance: 1, districts: ['administrative', 'academic'], treasures: { knowledge: 4, intel: 3, leverage: 2, map: 1 }, namePatterns: [P('the {adjective} Archive', 2), P('the {root} Records')] },
  shipyard: { weight: 1.5, minSize: 2, significance: 1, districts: ['docks', 'spaceport', 'industrial'], constraints: { minTech: 2 }, treasures: { technology: 4, resource: 2, map: 1 }, namePatterns: [P('{root} Yards', 2), P('the {adjective} Slipway')] },
  salvage_yard: { weight: 2, minSize: 1, significance: 0, districts: ['industrial', 'slums', 'ruins', 'warehouse'], treasures: { technology: 3, artifact: 2, resource: 2 }, namePatterns: [P("{root}'s Salvage", 2), P('the {adjective} Scrapyard', 1.5)] },
  theater: { weight: 1.5, minSize: 3, significance: 1, districts: ['entertainment', 'noble_quarter'], treasures: { intel: 2, wealth: 2, artifact: 1 }, namePatterns: [P('the {adjective} Stage', 2), P('the {root} Playhouse', 2)] },
  garden: { weight: 2, minSize: 2, significance: 1, districts: ['gardens', 'noble_quarter'], constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] }, treasures: { resource: 3, relic: 1, knowledge: 1 }, namePatterns: [P('the {adjective} Garden', 2), P("{root}'s Garden", 1.5)] },
  crypt: { weight: 1.5, minSize: 2, significance: 1, districts: ['necropolis', 'temple', 'old_town'], treasures: { relic: 4, artifact: 2, knowledge: 2, wealth: 1 }, namePatterns: [P('the Crypt of {root}', 2), P('the {adjective} Vault', 1.5)] },

  city_hall: { weight: 3, minSize: 2, significance: 2, districts: ['administrative', 'old_town'], treasures: { access: 3, leverage: 3, intel: 2, wealth: 1 }, namePatterns: [P('{root} Town Hall', 2), P('the {adjective} Hall', 1.5), P('the Hall of {root}')] },
  courthouse: { weight: 1.5, minSize: 3, significance: 1, districts: ['administrative'], treasures: { leverage: 3, intel: 3, access: 1 }, namePatterns: [P('the {adjective} Court', 2), P('the {root} Assizes')] },
  counting_house: { weight: 1.5, minSize: 3, significance: 1, districts: ['market', 'noble_quarter', 'administrative'], treasures: { wealth: 5, leverage: 2, intel: 1 }, namePatterns: [P("{root}'s Counting House", 2), P('the {adjective} Exchange', 1.5), P('the {noun} Bank')] },
  trading_house: { weight: 2, minSize: 2, significance: 1, districts: ['market', 'docks', 'warehouse'], treasures: { wealth: 3, resource: 3, map: 2 }, namePatterns: [P('{root} and Sons', 1.5), P('the {adjective} Company House', 1.5), P("{root}'s Trading House", 2)] },
  warehouse: { weight: 2, minSize: 2, significance: 0, districts: ['warehouse', 'docks', 'industrial'], treasures: { resource: 4, wealth: 2, weapon: 1 }, namePatterns: [P('the {adjective} Warehouse', 2), P("{root}'s Stores", 2)] },
  farmstead: { weight: 3, minSize: 1, significance: 0, districts: ['farmland'], treasures: { resource: 4, map: 1, relic: 1 }, namePatterns: [P("{root}'s Farm", 3), P('{adjective} {noun} Farm', 1.5)] },
  mine: { weight: 2, minSize: 1, significance: 1, districts: ['industrial', 'undercity'], treasures: { resource: 5, artifact: 1, map: 1 }, namePatterns: [P('the {root} Diggings', 2), P('the {adjective} Shaft', 2)] },
  hunting_lodge: { weight: 1.5, minSize: 1, significance: 0, districts: ['farmland', 'gardens'], treasures: { weapon: 3, resource: 2, map: 2 }, namePatterns: [P("{root}'s Lodge", 2), P('the {adjective} Lodge', 1.5)] },
  stables: { weight: 2, minSize: 1, significance: 0, districts: ['market', 'farmland'], treasures: { resource: 2, map: 2, access: 1 }, namePatterns: [P("{root}'s Stables", 2), P('the {adjective} Stables', 1.5)] },
  meeting_hall: { weight: 2, minSize: 1, significance: 1, districts: ['residential', 'old_town', 'market'], treasures: { intel: 2, knowledge: 2, wealth: 1 }, namePatterns: [P('the {adjective} Meeting House', 2), P('{root} Commons', 1.5)] },
  monastery: { weight: 1, minSize: 1, significance: 1, districts: ['temple', 'gardens'], treasures: { relic: 4, knowledge: 4, artifact: 1 }, namePatterns: [P('the Cloister of {root}', 2), P('the {adjective} Abbey', 2)] },
  college: { weight: 1, minSize: 3, significance: 2, districts: ['academic'], treasures: { knowledge: 5, technology: 2, map: 1 }, namePatterns: [P('the {root} College', 2), P('the College of the {adjective} {noun}', 1.5)] },
  citadel: { weight: 1, minSize: 2, significance: 2, districts: ['military', 'old_town'], treasures: { weapon: 4, armor: 4, map: 2, access: 1 }, namePatterns: [P('the {adjective} Citadel', 2), P('{root} Keep', 2)] },
  hideout: { weight: 1, minSize: 1, significance: 0, districts: ['undercity', 'slums', 'warehouse', 'ruins'], treasures: { wealth: 3, weapon: 2, intel: 3, leverage: 2 }, namePatterns: [P('the cellar under {street}', 2), P('the {adjective} Den', 1.5), P('the old {noun} Works', 1)] },

  estate: { weight: 1, minSize: 1, significance: 1, residence: true, districts: ['noble_quarter'], treasures: { wealth: 4, artifact: 2, leverage: 1, weapon: 1, relic: 1 }, namePatterns: [P('the {family} Estate', 3), P('{family} Hall', 1.5), P('the {family} family seat')] },
  manor: { weight: 1, minSize: 1, significance: 0, residence: true, districts: ['noble_quarter', 'residential'], treasures: { wealth: 4, artifact: 1, intel: 1 }, namePatterns: [P('{family} Manor', 3), P('the {adjective} Manor')] },
  townhouse: { weight: 1, minSize: 2, significance: 0, residence: true, districts: ['residential', 'noble_quarter'], treasures: { wealth: 3, knowledge: 1, intel: 1 }, namePatterns: [P('the {family} townhouse', 3), P("{given}'s townhouse on {street}", 2)] },
  house: { weight: 1, minSize: 1, significance: 0, residence: true, districts: ['residential'], treasures: { wealth: 2, knowledge: 1, weapon: 1 }, namePatterns: [P("{given}'s house on {street}", 3), P('the {family} house', 2)] },
  cottage: { weight: 1, minSize: 1, significance: 0, residence: true, districts: ['residential', 'farmland'], treasures: { relic: 1, map: 1, wealth: 1, knowledge: 1 }, namePatterns: [P("{given}'s cottage on {street}", 3), P('the {family} cottage', 1.5)] },
  tenement: { weight: 1, minSize: 3, significance: 0, residence: true, districts: ['slums', 'residential'], treasures: { intel: 1, wealth: 1, map: 1 }, namePatterns: [P("{given}'s rooms in the {street} Tenements", 3), P("a garret above {street}", 1)] },
  hovel: { weight: 1, minSize: 1, significance: 0, residence: true, districts: ['slums', 'undercity', 'ruins'], treasures: { map: 1, artifact: 1, intel: 1 }, namePatterns: [P("{given}'s shack off {street}", 3), P('a lean-to under the {noun} Bridge', 1)] },
};

/** Street names for residences ("{given}'s house on {street}"). */
export const STREET_PATTERNS: NamePattern[] = [
  P('{root} Row', 3), P('{adjective} Lane', 3), P('{noun} Street', 3), P('{root} Way', 2), P('the {adjective} Steps', 1),
];

/**
 * What a settlement's character adds to who works there and which places it
 * has: weights added to occupation choice for its notables, and to place
 * types when a new place is opened. Industries do the same per trade.
 */
export interface WorkFlavor {
  occupations: Partial<Record<Occupation, number>>;
  pois: Partial<Record<PoiType, number>>;
}

export const SETTLEMENT_TYPE_WORK: Record<SettlementType, WorkFlavor> = {
  capital: { occupations: { administrator: 2, courtier: 2, diplomat: 1.5, noble: 1 }, pois: { palace: 3, city_hall: 2, embassy: 2, courthouse: 1.5 } },
  city: { occupations: { merchant: 1.5, banker: 1, judge: 1 }, pois: { city_hall: 2, courthouse: 1.5, counting_house: 1.5, townhouse: 1 } },
  town: { occupations: { artisan: 1, innkeeper: 1 }, pois: { city_hall: 1.5, meeting_hall: 1, house: 1 } },
  village: { occupations: { farmer: 3, herder: 2, hunter: 1 }, pois: { farmstead: 3, cottage: 2, meeting_hall: 2, shrine: 1 } },
  outpost: { occupations: { guard: 2, soldier: 1.5, courier: 1.5, hunter: 1 }, pois: { barracks: 2, stables: 1.5, inn: 1.5 } },
  orbital_station: { occupations: { engineer: 2, pilot: 2, mechanic: 2 }, pois: { spaceport: 3, laboratory: 1.5, workshop: 1.5 } },
  floating_city: { occupations: { pilot: 1.5, engineer: 1.5, merchant: 1 }, pois: { docks: 2, trading_house: 1.5, garden: 1 } },
  underground: { occupations: { miner: 2, engineer: 1.5, smuggler: 1 }, pois: { mine: 2, hideout: 1.5, tenement: 1.5 } },
  fortress: { occupations: { soldier: 3, guard: 2, mercenary: 1.5, smith: 1.5 }, pois: { citadel: 3, barracks: 2.5, workshop: 1, prison: 1.5 } },
  port: { occupations: { sailor: 3, merchant: 2, fisher: 2, smuggler: 1 }, pois: { docks: 3, warehouse: 2, tavern: 1.5, trading_house: 1.5, shipyard: 1 } },
  mining_colony: { occupations: { miner: 4, engineer: 1.5, mechanic: 1 }, pois: { mine: 4, salvage_yard: 1, tenement: 1.5, tavern: 1 } },
  research_station: { occupations: { scholar: 3, engineer: 2, physician: 1.5, alchemist: 1 }, pois: { laboratory: 4, observatory: 2, college: 1.5, archive: 1 } },
  monastery: { occupations: { priest: 4, scholar: 1.5, prophet: 1 }, pois: { monastery: 5, shrine: 2, library: 1.5, garden: 1 } },
  nomad_camp: { occupations: { herder: 3, hunter: 2, beast_tamer: 2 }, pois: { stables: 2.5, hunting_lodge: 1.5, market: 1 } },
  arcology: { occupations: { engineer: 2, administrator: 1.5 }, pois: { laboratory: 1.5, garden: 1.5, city_hall: 1.5 } },
  submerged_city: { occupations: { fisher: 2, engineer: 1.5 }, pois: { docks: 2, laboratory: 1, bathhouse: 1.5 } },
  trade_hub: { occupations: { merchant: 4, banker: 2, courier: 1.5, smuggler: 1 }, pois: { market: 3, trading_house: 3, warehouse: 2, counting_house: 2, inn: 1.5 } },
  ruin_town: { occupations: { scavenger: 4, explorer: 2, thief: 1 }, pois: { ruin: 4, salvage_yard: 2, hovel: 1.5 } },
  frontier_camp: { occupations: { hunter: 2, mercenary: 1.5, explorer: 1.5, scavenger: 1 }, pois: { hunting_lodge: 2, stables: 1.5, tavern: 1.5 } },
  hive_city: { occupations: { administrator: 1.5, guard: 1.5, thief: 1 }, pois: { tenement: 2.5, city_hall: 1.5, black_market: 1.5 } },
  tree_city: { occupations: { hunter: 1.5, artisan: 1.5, beast_tamer: 1 }, pois: { garden: 2.5, shrine: 1.5, hunting_lodge: 1 } },
  cliff_city: { occupations: { miner: 1.5, beast_tamer: 1, guard: 1 }, pois: { monastery: 1.5, mine: 1.5, citadel: 1 } },
};

export const INDUSTRY_WORK: Record<Industry, WorkFlavor> = {
  agriculture: { occupations: { farmer: 3, herder: 1 }, pois: { farmstead: 3, market: 1 } },
  fishing: { occupations: { fisher: 3, sailor: 1 }, pois: { docks: 3, market: 1 } },
  mining: { occupations: { miner: 3, engineer: 1 }, pois: { mine: 3 } },
  forestry: { occupations: { hunter: 2, artisan: 1 }, pois: { hunting_lodge: 2, workshop: 1 } },
  manufacturing: { occupations: { engineer: 2, mechanic: 2, smith: 1 }, pois: { workshop: 3, warehouse: 1.5 } },
  shipbuilding: { occupations: { engineer: 2, mechanic: 2, sailor: 1 }, pois: { shipyard: 4, docks: 1 } },
  trade: { occupations: { merchant: 3, courier: 1 }, pois: { market: 2, trading_house: 2, warehouse: 1 } },
  finance: { occupations: { banker: 3, merchant: 1 }, pois: { counting_house: 4, trading_house: 1 } },
  tourism: { occupations: { innkeeper: 3, musician: 1, artist: 1 }, pois: { inn: 3, bathhouse: 1.5, theater: 1 } },
  research: { occupations: { scholar: 3, engineer: 1, alchemist: 1 }, pois: { laboratory: 3, college: 2, observatory: 1 } },
  mercenary_work: { occupations: { mercenary: 3, bounty_hunter: 1.5 }, pois: { barracks: 2, tavern: 1.5 } },
  crafts: { occupations: { artisan: 3, smith: 1.5 }, pois: { workshop: 3, guild_hall: 1.5 } },
  herding: { occupations: { herder: 3, beast_tamer: 1 }, pois: { stables: 2, farmstead: 2 } },
  energy: { occupations: { engineer: 3, mechanic: 1 }, pois: { workshop: 1.5, laboratory: 1 } },
  biotech: { occupations: { physician: 2, alchemist: 2, scholar: 1 }, pois: { laboratory: 3, hospital: 1 } },
  salvage: { occupations: { scavenger: 3, mechanic: 1 }, pois: { salvage_yard: 4 } },
  entertainment: { occupations: { musician: 2, artist: 2, innkeeper: 1 }, pois: { theater: 3, arena: 1.5, gambling_den: 1, tavern: 1 } },
  pilgrimage: { occupations: { priest: 3, prophet: 1, innkeeper: 1 }, pois: { temple: 3, shrine: 2, inn: 1.5, monastery: 1 } },
  smuggling: { occupations: { smuggler: 3, thief: 1 }, pois: { black_market: 3, warehouse: 1.5, hideout: 1 } },
  data_services: { occupations: { engineer: 2, archivist: 2, spy: 1 }, pois: { archive: 2, laboratory: 1.5 } },
  arms: { occupations: { smith: 3, engineer: 1, mercenary: 1 }, pois: { workshop: 3, warehouse: 1 } },
  textiles: { occupations: { artisan: 3, merchant: 1 }, pois: { workshop: 2.5, market: 1.5 } },
  construction: { occupations: { engineer: 2, artisan: 1.5 }, pois: { workshop: 2, guild_hall: 1.5 } },
  education: { occupations: { scholar: 3, archivist: 1 }, pois: { college: 3, library: 2 } },
  medicine: { occupations: { physician: 3, alchemist: 1 }, pois: { hospital: 4 } },
  relic_hunting: { occupations: { explorer: 3, scavenger: 2 }, pois: { ruin: 3, museum: 1.5 } },
};
