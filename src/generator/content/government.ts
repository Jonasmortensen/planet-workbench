import type {
  CultureValue, GoverningBody, GovernmentType, MilitaryDoctrine, PoliticalStructure, SettlementOrigin, SocialStructure,
} from '../types/enums';
import type { WeightedDef } from './constraints';

export interface GovernmentDef extends WeightedDef {
  /** Weight multipliers by planetary political structure (missing = 1). */
  structures: Partial<Record<PoliticalStructure, number>>;
  origins?: Partial<Record<SettlementOrigin, number>>;
  /** Gender-neutral ruler titles. */
  rulerTitles: string[];
  /** Nouns for the state in country names ("Kingdom of X", "X Republic"). */
  stateNouns: string[];
  /** Shifts on ordered scales relative to the planet baseline. */
  law: number;
  freedom: number;
  stability: number;
  values: Partial<Record<CultureValue, number>>;
  socialStructures: Partial<Record<SocialStructure, number>>;
  /** Default governing bodies for settlements in a country of this type. */
  governingBodies: Partial<Record<GoverningBody, number>>;
}

export const GOVERNMENT_TABLE: Record<GovernmentType, GovernmentDef> = {
  absolute_monarchy: {
    weight: 5, constraints: { maxTech: 8 },
    structures: { unified: 1.5, rival_powers: 1.5, anarchic: 0.2, federation: 0.4 },
    rulerTitles: ['Sovereign', 'Monarch', 'High Throne', 'Crowned One'], stateNouns: ['Kingdom', 'Realm', 'Crown'],
    law: 1, freedom: -1, stability: 0,
    values: { honor: 3, tradition: 3, loyalty: 3, order: 2, glory: 1 },
    socialStructures: { feudal: 2, class: 3, caste: 1 },
    governingBodies: { noble_lord: 3, mayor: 2, appointed_administrator: 1 },
  },
  constitutional_monarchy: {
    weight: 4, constraints: { minTech: 3 },
    structures: { federation: 1.5, unified: 1.2, anarchic: 0 },
    rulerTitles: ['Monarch', 'Sovereign', 'Crowned Regent'], stateNouns: ['Kingdom', 'Commonwealth', 'Crown'],
    law: 0, freedom: 1, stability: 1,
    values: { tradition: 3, justice: 2, community: 2, honor: 1 },
    socialStructures: { class: 4, meritocratic: 1 },
    governingBodies: { mayor: 3, council: 3 },
  },
  elective_monarchy: {
    weight: 2,
    structures: { rival_powers: 1.5, fragmented: 1.2, anarchic: 0.2 },
    rulerTitles: ['Elected Sovereign', 'High Elector', 'Throne-Elect'], stateNouns: ['Realm', 'Electorate'],
    law: 0, freedom: 0, stability: -0.5,
    values: { honor: 2, ambition: 3, tradition: 2 },
    socialStructures: { class: 2, feudal: 2 },
    governingBodies: { noble_lord: 3, council: 2 },
  },
  theocracy: {
    weight: 4,
    structures: { unified: 1.5, rival_powers: 1.2, anarchic: 0.2 },
    rulerTitles: ['High Prophet', 'Hierarch', 'Voice of the Faith', 'Archpontiff'],
    stateNouns: ['Holy Dominion', 'Sanctum', 'Theocracy'],
    law: 2, freedom: -2, stability: 0.5,
    values: { faith: 5, tradition: 2, order: 2, discipline: 1 },
    socialStructures: { religious_hierarchy: 6, caste: 1 },
    governingBodies: { high_priest: 4, council: 1 },
  },
  republic: {
    weight: 6, constraints: { minTech: 2 },
    structures: { federation: 2, unified: 1.2, anarchic: 0.2 },
    rulerTitles: ['First Consul', 'President', 'Chancellor'], stateNouns: ['Republic'],
    law: 0, freedom: 1, stability: 0.5,
    values: { justice: 3, freedom: 2, progress: 2, community: 1 },
    socialStructures: { class: 4, meritocratic: 2 },
    governingBodies: { mayor: 3, council: 3, assembly: 1 },
  },
  democracy: {
    weight: 5, constraints: { minTech: 4 },
    structures: { federation: 2, unified: 1.3, anarchic: 0.1 },
    rulerTitles: ['Prime Minister', 'President', 'First Speaker'], stateNouns: ['Commonwealth', 'Democratic Union', 'Republic'],
    law: 0, freedom: 2, stability: 0.5,
    values: { freedom: 3, justice: 3, community: 2, progress: 1 },
    socialStructures: { egalitarian: 2, class: 3 },
    governingBodies: { mayor: 3, council: 3, assembly: 2 },
  },
  direct_democracy: {
    weight: 1.5, constraints: { minTech: 2 },
    structures: { federation: 1.5, fragmented: 1.2 },
    rulerTitles: ['Speaker of the Assembly', 'Convenor'], stateNouns: ['Commune', 'Assembly'],
    law: -1, freedom: 2, stability: -0.5,
    values: { community: 4, freedom: 3, harmony: 1 },
    socialStructures: { egalitarian: 4, communal: 2 },
    governingBodies: { assembly: 4, council: 2, collective: 1 },
  },
  oligarchy: {
    weight: 4,
    structures: { rival_powers: 1.5, fragmented: 1.2 },
    rulerTitles: ['First Magnate', 'Chair of the Council', 'Primarch'], stateNouns: ['Oligarchy', 'Council-State', 'Directorate'],
    law: 1, freedom: -1, stability: 0,
    values: { wealth: 3, ambition: 3, order: 2 },
    socialStructures: { wealth_tiers: 3, class: 3 },
    governingBodies: { council: 3, guild_council: 2, noble_lord: 1 },
  },
  plutocracy: {
    weight: 3, constraints: { minTech: 3 },
    structures: { rival_powers: 1.3, unified: 1.2 },
    rulerTitles: ['Treasurer-General', 'First Banker', 'Keeper of the Vault'], stateNouns: ['Exchange', 'Trade-State', 'Commonwealth'],
    law: 0, freedom: -0.5, stability: 0,
    values: { wealth: 5, ambition: 2, craftsmanship: 1 },
    socialStructures: { wealth_tiers: 6 },
    governingBodies: { guild_council: 3, corporate_board: 2, council: 1 },
  },
  corporate_state: {
    weight: 3, constraints: { minTech: 6 },
    structures: { unified: 1.5, rival_powers: 1.5 }, origins: { colonial: 2, lost_colony: 0.3 },
    rulerTitles: ['Chief Executive', 'Chairperson', 'Prime Director'], stateNouns: ['Holdings', 'Concern', 'Corporate Sovereignty'],
    law: 1, freedom: -1, stability: 0.5,
    values: { wealth: 4, progress: 2, discipline: 2, ambition: 2 },
    socialStructures: { wealth_tiers: 4, meritocratic: 2 },
    governingBodies: { corporate_board: 5, appointed_administrator: 2 },
  },
  military_junta: {
    weight: 3,
    structures: { rival_powers: 1.5, fragmented: 1.3, anarchic: 3, federation: 0.2 },
    rulerTitles: ['Marshal', 'Supreme Commander', 'Lord Protector', 'General-Regent'], stateNouns: ['Protectorate', 'Command', 'Military State'],
    law: 2, freedom: -2, stability: -1,
    values: { order: 3, strength: 3, discipline: 3, loyalty: 1 },
    socialStructures: { class: 2, caste: 2, meritocratic: 1 },
    governingBodies: { military_governor: 5, appointed_administrator: 1 },
  },
  dictatorship: {
    weight: 3,
    structures: { rival_powers: 1.3, anarchic: 2, federation: 0.1 },
    rulerTitles: ['Supreme Leader', 'Autarch', 'Great Guardian'], stateNouns: ['State', 'Autarchy', 'Dominion'],
    law: 2, freedom: -2, stability: -1,
    values: { order: 3, loyalty: 3, strength: 2 },
    socialStructures: { class: 3, caste: 1 },
    governingBodies: { appointed_administrator: 4, military_governor: 2 },
  },
  technocracy: {
    weight: 2.5, constraints: { minTech: 5 },
    structures: { unified: 1.5, federation: 1.2 },
    rulerTitles: ['Chief Engineer', 'Prime Architect', 'Director of Science'], stateNouns: ['Technate', 'Directorate'],
    law: 1, freedom: 0, stability: 0.5,
    values: { knowledge: 4, progress: 3, discipline: 2 },
    socialStructures: { meritocratic: 6 },
    governingBodies: { council: 3, appointed_administrator: 3 },
  },
  meritocracy: {
    weight: 2, constraints: { minTech: 3 },
    structures: {},
    rulerTitles: ['First Examiner', 'Paragon', 'High Scholar'], stateNouns: ['Merit-State', 'Academy-State', 'Commonwealth'],
    law: 0.5, freedom: 0.5, stability: 0.5,
    values: { knowledge: 3, ambition: 2, discipline: 3, justice: 1 },
    socialStructures: { meritocratic: 6 },
    governingBodies: { council: 4, mayor: 1 },
  },
  tribal_confederacy: {
    weight: 4, constraints: { maxTech: 4 },
    structures: { fragmented: 1.5, federation: 1.5, rival_powers: 1.2 }, origins: { native: 3, lost_colony: 1.5, colonial: 0.2 },
    rulerTitles: ['High Chief', 'Elder Speaker', 'Warleader'], stateNouns: ['Confederacy', 'Tribes', 'Nations'],
    law: -1, freedom: 1, stability: 0,
    values: { tradition: 3, family: 3, honor: 2, nature: 2, survival: 1 },
    socialStructures: { clan: 6, age_hierarchy: 1 },
    governingBodies: { elders: 5, council: 1 },
  },
  clan_council: {
    weight: 3, constraints: { maxTech: 6 },
    structures: { fragmented: 1.5, federation: 1.3, anarchic: 2 },
    rulerTitles: ['Clan-Speaker', 'First of Clans', 'Eldest'], stateNouns: ['Clanholds', 'Council of Clans'],
    law: 0, freedom: 0.5, stability: 0,
    values: { family: 4, loyalty: 3, tradition: 2 },
    socialStructures: { clan: 5, age_hierarchy: 2 },
    governingBodies: { elders: 4, council: 2 },
  },
  feudal_realm: {
    weight: 4, constraints: { maxTech: 5 },
    structures: { fragmented: 2, rival_powers: 1.5, unified: 0.5 },
    rulerTitles: ['Liege Sovereign', 'Overlord', 'Grand Liege'], stateNouns: ['Realm', 'Marches', 'Holdings'],
    law: 1, freedom: -1, stability: -0.5,
    values: { honor: 4, loyalty: 3, glory: 2, tradition: 1 },
    socialStructures: { feudal: 7 },
    governingBodies: { noble_lord: 6, military_governor: 1 },
  },
  merchant_republic: {
    weight: 3, constraints: { minTech: 2 },
    structures: { federation: 1.5, rival_powers: 1.2 },
    rulerTitles: ['First Merchant', 'Grand Factor', 'Master of Ledgers'], stateNouns: ['Merchant Republic', 'Free Port', 'League'],
    law: 0, freedom: 1, stability: 0.5,
    values: { wealth: 4, freedom: 2, ambition: 2, hospitality: 1 },
    socialStructures: { guild_based: 4, wealth_tiers: 3 },
    governingBodies: { guild_council: 5, council: 2 },
  },
  gerontocracy: {
    weight: 1.5,
    structures: {},
    rulerTitles: ['Eldest', 'First Elder', 'Ancient Speaker'], stateNouns: ['Elder Council', 'Venerable Realm'],
    law: 1, freedom: -0.5, stability: 1,
    values: { tradition: 5, order: 2, family: 1 },
    socialStructures: { age_hierarchy: 7 },
    governingBodies: { elders: 6 },
  },
  colonial_administration: {
    weight: 2, constraints: { minTech: 5, origins: ['colonial', 'mixed'], minConnectivity: 'peripheral' },
    structures: { federation: 1.2, rival_powers: 1.2 },
    rulerTitles: ['Governor-General', 'Administrator', 'Viceroy'], stateNouns: ['Colony', 'Territory', 'Mandate'],
    law: 1, freedom: -1, stability: 0,
    values: { order: 3, progress: 2, ambition: 1 },
    socialStructures: { class: 4, caste: 1 },
    governingBodies: { appointed_administrator: 5, corporate_board: 1 },
  },
  raider_kingdom: {
    weight: 1.5,
    structures: { anarchic: 4, fragmented: 1.5, federation: 0, unified: 0.1 },
    rulerTitles: ['Reaver Lord', 'Warlord', 'Captain-King'], stateNouns: ['Freehold', 'Reaches', 'Reaverhold'],
    law: -2, freedom: 0, stability: -2,
    values: { strength: 4, glory: 3, independence: 2 },
    socialStructures: { clan: 2, class: 2 },
    governingBodies: { warlord: 5, crime_boss: 2 },
  },
  anarcho_commune: {
    weight: 1, constraints: { minTech: 2 },
    structures: { anarchic: 4, fragmented: 1.2, unified: 0.1 },
    rulerTitles: ['Facilitator', 'Rotating Delegate', 'Coordinator'], stateNouns: ['Free Communes', 'Commonality'],
    law: -2, freedom: 2, stability: -1,
    values: { freedom: 4, community: 4, independence: 1 },
    socialStructures: { communal: 5, egalitarian: 3 },
    governingBodies: { collective: 5, assembly: 2 },
  },
  hive_council: {
    weight: 0.6, constraints: { bodyPlans: ['insectoid', 'colonial'] },
    structures: { unified: 2 },
    rulerTitles: ['Overmind', 'Hive Voice', 'First Brood'], stateNouns: ['Hive', 'Brood-State', 'Swarm'],
    law: 2, freedom: -2, stability: 1.5,
    values: { community: 4, order: 3, loyalty: 3 },
    socialStructures: { hive: 8 },
    governingBodies: { collective: 5, council: 1 },
  },
  ai_administration: {
    weight: 0.6, constraints: { minTech: 8 },
    structures: { unified: 2 },
    rulerTitles: ['Prime Intelligence', 'Steward Core', 'Administrator Unit'], stateNouns: ['Administrate', 'Directorate', 'Lattice'],
    law: 1, freedom: -1, stability: 2,
    values: { order: 4, progress: 3, knowledge: 2 },
    socialStructures: { meritocratic: 3, class: 2 },
    governingBodies: { ai_steward: 6, appointed_administrator: 2 },
  },
  psionic_conclave: {
    weight: 0.5, constraints: { requiresAbility: ['psionics', 'telepathy', 'dream_walking'] },
    structures: {},
    rulerTitles: ['First Mind', 'Conclave Speaker', 'Seer-Sovereign'], stateNouns: ['Conclave', 'Mindhold'],
    law: 1, freedom: -1, stability: 0.5,
    values: { knowledge: 3, secrecy: 3, discipline: 3 },
    socialStructures: { caste: 6 },
    governingBodies: { council: 3, high_priest: 2 },
  },
  oracle_rule: {
    weight: 0.5, constraints: { requiresAbility: ['precognition', 'dream_walking', 'void_sight'] },
    structures: {},
    rulerTitles: ['Oracle', 'Voice of Fate', 'Seer'], stateNouns: ['Oracle-State', 'Sanctum of Fate'],
    law: 1, freedom: -1, stability: 0,
    values: { faith: 3, tradition: 3, secrecy: 1 },
    socialStructures: { religious_hierarchy: 4, caste: 2 },
    governingBodies: { high_priest: 4, elders: 2 },
  },
};

export interface MilitaryDoctrineDef extends WeightedDef {
  /** Multiplier on military strength. */
  strength: number;
}

export const MILITARY_DOCTRINE_TABLE: Record<MilitaryDoctrine, MilitaryDoctrineDef> = {
  fortification: { weight: 4, strength: 1 },
  standing_army: { weight: 6, strength: 1.2, constraints: { minTech: 2 } },
  citizen_militia: { weight: 4, strength: 0.8 },
  mercenary_reliance: { weight: 2, strength: 0.9 },
  naval_power: { weight: 3, strength: 1.1, constraints: { requiresLiquidWater: true, minTech: 2 } },
  air_power: { weight: 2, strength: 1.2, constraints: { minTech: 5, requiresAtmosphere: true } },
  guerrilla: { weight: 3, strength: 0.7 },
  orbital_supremacy: { weight: 2, strength: 1.5, constraints: { minTech: 7 } },
  mechanized: { weight: 3, strength: 1.3, constraints: { minTech: 4 } },
  feudal_levy: { weight: 3, strength: 0.8, constraints: { maxTech: 4 } },
  elite_warriors: { weight: 3, strength: 1 },
  drone_swarms: { weight: 2, strength: 1.4, constraints: { minTech: 7 } },
  psionic_corps: { weight: 1, strength: 1.3, constraints: { requiresAbility: ['psionics', 'telepathy', 'gravity_shaping'] } },
  deterrence: { weight: 2, strength: 1.2, constraints: { minTech: 6 } },
  expansionist: { weight: 2, strength: 1.2 },
  pacifist: { weight: 0.8, strength: 0.4 },
  beast_cavalry: { weight: 2, strength: 1, constraints: { biospheres: ['complex', 'lush', 'exotic'], maxTech: 6 } },
};
