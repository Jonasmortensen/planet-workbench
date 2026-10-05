import type {
  GalacticConnectivity, GalacticFaction, PoliticalStructure, SettlementOrigin, StabilityLevel, TradeGood,
} from '../types/enums';

export const TECH_LEVEL_LABELS: string[] = [
  'Stone age', 'Bronze age', 'Iron age', 'Age of sail', 'Industrial', 'Information age', 'Early spaceflight',
  'Interplanetary', 'Interstellar', 'Advanced interstellar', 'Post-scarcity',
];

/** Tech level weights (index = tech level) by settlement origin. */
export const TECH_WEIGHTS_BY_ORIGIN: Record<SettlementOrigin, number[]> = {
  //            0    1    2    3    4    5    6    7    8    9   10
  native:      [3,   4,   5,   5,   4,   3,   2,   1.5, 1,   0.4, 0.1],
  mixed:       [0.2, 0.5, 1,   2,   3,   4,   5,   5,   4,   2,   0.5],
  colonial:    [0,   0,   0,   0.2, 1,   3,   5,   6,   5,   3,   0.8],
  lost_colony: [0.5, 2,   4,   4,   3,   1.5, 0.5, 0,   0,   0,   0],
};

export const SETTLEMENT_ORIGIN_WEIGHTS = {
  /** When the planet has native sapients. */
  withNatives: { native: 45, mixed: 55 } as Partial<Record<SettlementOrigin, number>>,
  /** When it does not. */
  withoutNatives: { colonial: 88, lost_colony: 12 } as Partial<Record<SettlementOrigin, number>>,
};

export interface PoliticalStructureDef {
  /** Weights by tech band: [0-3, 4-6, 7-10]. */
  weightByTech: [number, number, number];
  stability: Partial<Record<StabilityLevel, number>>;
  hasWorldGovernment: boolean;
}

export const POLITICAL_STRUCTURE_TABLE: Record<PoliticalStructure, PoliticalStructureDef> = {
  unified: {
    weightByTech: [1, 3, 6], hasWorldGovernment: true,
    stability: { unstable: 1, tense: 2, stable: 5, secure: 3 },
  },
  federation: {
    weightByTech: [1, 4, 5], hasWorldGovernment: true,
    stability: { volatile: 0.5, unstable: 1, tense: 3, stable: 5, secure: 1.5 },
  },
  rival_powers: {
    weightByTech: [3, 5, 3], hasWorldGovernment: false,
    stability: { volatile: 1, unstable: 2, tense: 5, stable: 2 },
  },
  fragmented: {
    weightByTech: [7, 4, 1.5], hasWorldGovernment: false,
    stability: { volatile: 2, unstable: 4, tense: 3, stable: 1 },
  },
  anarchic: {
    weightByTech: [1.5, 1, 0.6], hasWorldGovernment: false,
    stability: { collapsing: 4, volatile: 4, unstable: 1 },
  },
};

/** Connectivity weights by settlement origin. Tech level then shifts them (see steps/planet/civilization). */
export const CONNECTIVITY_BY_ORIGIN: Record<SettlementOrigin, Partial<Record<GalacticConnectivity, number>>> = {
  native: { uncontacted: 4, quarantined: 2, isolated: 3, peripheral: 2, connected: 1.5, hub: 0.3 },
  mixed: { quarantined: 0.5, isolated: 1, peripheral: 4, connected: 5, hub: 1.5 },
  colonial: { isolated: 1, peripheral: 4, connected: 5, hub: 2 },
  lost_colony: { uncontacted: 3, quarantined: 1, isolated: 4, peripheral: 1.5 },
};

export interface FactionDef {
  name: string;
  weight: number;
  /** Minimum connectivity index (CONNECTIVITY_LEVELS) for a planet to be a member. */
  minConnectivity: number;
  description: string;
}

export const FACTION_TABLE: Record<GalacticFaction, FactionDef> = {
  none: { name: 'None', weight: 0, minConnectivity: 0, description: 'Unaware of, or unknown to, the wider galaxy.' },
  independent: { name: 'Independent', weight: 10, minConnectivity: 1, description: 'Owes allegiance to no galactic power.' },
  concord_of_spheres: {
    name: 'The Concord of Spheres', weight: 6, minConnectivity: 3,
    description: 'A sprawling, argumentative league of member worlds bound by shared law.',
  },
  ascendant_hegemony: {
    name: 'The Ascendant Hegemony', weight: 4, minConnectivity: 2,
    description: 'An expansionist empire that calls its conquests "uplift".',
  },
  free_trade_compact: {
    name: 'The Free Trade Compact', weight: 5, minConnectivity: 3,
    description: 'A mercantile alliance where every treaty has a price list.',
  },
  lattice_directorate: {
    name: 'The Lattice Directorate', weight: 2, minConnectivity: 3,
    description: 'Worlds administered by distributed machine minds, efficient and unblinking.',
  },
  ember_throne: {
    name: 'The Ember Throne', weight: 3, minConnectivity: 2,
    description: 'A feudal stellar empire of vassal houses and inherited fleets.',
  },
  pilgrim_synod: {
    name: 'The Pilgrim Synod', weight: 2, minConnectivity: 2,
    description: 'A theocratic network of shrine-worlds along ancient pilgrim routes.',
  },
  quiet_covenant: {
    name: 'The Quiet Covenant', weight: 2, minConnectivity: 1,
    description: 'An isolationist pact of worlds that agreed to be left alone together.',
  },
  drift_marches: {
    name: 'The Drift Marches', weight: 3, minConnectivity: 2,
    description: 'A lawless frontier confederation of raiders, prospectors and refugees.',
  },
};

/** Goods produced at each tech band, for exports: [0-3, 4-6, 7-10]. */
export const TECH_GOODS: [TradeGood[], TradeGood[], TradeGood[]] = [
  ['crafts', 'textiles', 'grain', 'livestock', 'art', 'labor', 'spices'],
  ['machinery', 'textiles', 'preserved_food', 'chemicals', 'weapons', 'medicine', 'electronics'],
  ['starship_parts', 'electronics', 'data', 'medicine', 'machinery', 'luxury_goods', 'weapons'],
];

/** Population density per km² of habitable land, by tech level. */
export const DENSITY_BY_TECH = [0.05, 0.3, 1.5, 5, 15, 40, 70, 100, 120, 140, 150];
