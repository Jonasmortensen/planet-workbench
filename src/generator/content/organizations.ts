import type {
  GoalType, Legality, Occupation, OrgActivity, OrgResource, OrgStructure, OrgType, Recruitment, ScopeLevel, Visibility,
} from '../types/enums';
import type { WeightedDef } from './constraints';
import type { NamePattern } from './naming/patterns';

export interface OrgTypeDef extends WeightedDef {
  /** Weight per scope level (missing = never at that scope). */
  scopes: Partial<Record<ScopeLevel, number>>;
  visibility: Partial<Record<Visibility, number>>;
  legality: Partial<Record<Legality, number>>;
  structures: Partial<Record<OrgStructure, number>>;
  recruitment: Partial<Record<Recruitment, number>>;
  leaderTitles: string[];
  /** Alternative rank ladders, lowest rank first. */
  ranks: string[][];
  /** Nouns for names ("the Ashen {noun}"). */
  nouns: string[];
  activities: Partial<Record<OrgActivity, number>>;
  resources: Partial<Record<OrgResource, number>>;
  goals: Partial<Record<GoalType, number>>;
  /** Occupations of leaders and members. */
  occupations: Partial<Record<Occupation, number>>;
  /** Emblems for symbol descriptions. */
  emblems: string[];
}

export const ORG_TYPE_TABLE: Record<OrgType, OrgTypeDef> = {
  guild: {
    weight: 1, scopes: { settlement: 4, country: 2, planet: 1.5 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 6, tolerated: 3 },
    structures: { council: 4, hierarchy: 3, meritocracy: 2 }, recruitment: { apprenticeship: 6, examination: 2, purchase: 1 },
    leaderTitles: ['Guildmaster', 'Master of the Hall', 'Warden of the Guild'],
    ranks: [['Apprentice', 'Journeyman', 'Master', 'Grandmaster'], ['Novice', 'Craftsman', 'Elder Craftsman', 'Hallmaster']],
    nouns: ['Guild', 'Hall', 'Brotherhood', 'Union', 'Company'],
    activities: { trade: 4, manufacturing: 4, teaching: 2, lobbying: 2, arbitration: 1, festivals: 1 },
    resources: { monopoly_rights: 4, wealth: 3, legal_charters: 3, trade_routes: 2, archives: 1 },
    goals: { monopoly: 5, wealth: 4, expand_influence: 3, recognition: 2, legacy: 1 },
    occupations: { artisan: 4, smith: 3, merchant: 3, engineer: 1, mechanic: 1 },
    emblems: ['hammer', 'anvil', 'gear', 'loom', 'compass'],
  },
  church: {
    weight: 1, scopes: { settlement: 2, country: 2, planet: 3 },
    visibility: { public: 10 }, legality: { official: 7, tolerated: 3, outlawed: 0.3 },
    structures: { hierarchy: 6, council: 2 }, recruitment: { open: 5, initiation_rite: 3, birthright: 1 },
    leaderTitles: ['High Priest', 'Hierarch', 'Patriarch of the Faith', 'First Voice', 'Arch-Celebrant'],
    ranks: [['Acolyte', 'Priest', 'Bishop', 'Hierarch'], ['Novice', 'Celebrant', 'Elder', 'High Elder'], ['Faithful', 'Deacon', 'Prelate', 'Primate']],
    nouns: ['Church', 'Temple', 'Communion', 'Congregation', 'See'],
    activities: { worship: 6, charity: 3, teaching: 2, healing: 2, pilgrimages: 2, propaganda: 1 },
    resources: { sacred_sites: 5, land: 3, wealth: 2, archives: 2, fanatical_followers: 1 },
    goals: { spread_faith: 6, power: 2, legacy: 2, peace: 2, justice: 1 },
    occupations: { priest: 8, scholar: 2, physician: 1 },
    emblems: ['sacred flame', 'radiant eye', 'open hand', 'halo', 'star'],
  },
  corporation: {
    weight: 1, constraints: { minTech: 4 }, scopes: { settlement: 1, country: 3, planet: 4 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 8, tolerated: 2 },
    structures: { hierarchy: 7, council: 2 }, recruitment: { open: 4, examination: 3, purchase: 1 },
    leaderTitles: ['Chief Executive', 'Chairperson', 'Managing Director', 'President of the Board'],
    ranks: [['Associate', 'Manager', 'Director', 'Executive'], ['Contractor', 'Staffer', 'Vice-Director', 'Board Member']],
    nouns: ['Holdings', 'Consolidated', 'Industries', 'Combine', 'Works', 'Group'],
    activities: { manufacturing: 4, trade: 4, mining_operations: 3, research: 2, lobbying: 3, banking: 1 },
    resources: { wealth: 5, laboratories: 2, ships: 2, data_networks: 2, political_favors: 2, monopoly_rights: 2 },
    goals: { wealth: 6, monopoly: 4, expand_influence: 4, power: 2 },
    occupations: { banker: 3, merchant: 3, engineer: 3, administrator: 3 },
    emblems: ['interlocking rings', 'stylized star', 'gear', 'arrow', 'cube'],
  },
  criminal_syndicate: {
    weight: 1, scopes: { settlement: 3, country: 2, planet: 2 },
    visibility: { discreet: 5, secret: 3, public: 0.5 }, legality: { outlawed: 6, tolerated: 3 },
    structures: { hierarchy: 4, cell_network: 3, dynasty: 2, autocracy: 2 }, recruitment: { invitation: 4, coercion: 3, birthright: 1 },
    leaderTitles: ['Boss', 'Patron', 'the Uncle', 'Kingpin', 'Knifemaster'],
    ranks: [['Runner', 'Soldier', 'Lieutenant', 'Captain'], ['Hand', 'Knife', 'Fixer', 'Underboss']],
    nouns: ['Syndicate', 'Family', 'Hand', 'Knot', 'Ring', 'Crew'],
    activities: { smuggling: 5, extortion: 4, protection: 3, moneylending: 3, assassination: 1, data_theft: 1 },
    resources: { safehouses: 4, informants: 4, weapons: 3, blackmail_material: 3, wealth: 2 },
    goals: { wealth: 5, power: 4, monopoly: 3, revenge: 2, expand_influence: 3 },
    occupations: { crime_lord: 3, smuggler: 4, thief: 3, assassin: 1, bounty_hunter: 1 },
    emblems: ['knotted cord', 'open palm with an eye', 'black coin', 'crossed keys', 'serpent'],
  },
  secret_society: {
    weight: 1, scopes: { settlement: 1, country: 1.5, planet: 2 },
    visibility: { secret: 8, discreet: 2 }, legality: { tolerated: 3, outlawed: 3, official: 0.5 },
    structures: { cell_network: 4, council: 3, hierarchy: 2 }, recruitment: { invitation: 6, initiation_rite: 4 },
    leaderTitles: ['Grand Master', 'the Veiled One', 'First Keeper', 'Speaker Unseen'],
    ranks: [['Initiate', 'Adept', 'Keeper', 'Master'], ['Listener', 'Whisper', 'Voice', 'Silence']],
    nouns: ['Circle', 'Order', 'Lodge', 'Conclave', 'Veil', 'Hand'],
    activities: { espionage: 4, rituals: 3, research: 2, lobbying: 2, assassination: 1, sabotage: 1 },
    resources: { archives: 4, informants: 3, relics: 2, blackmail_material: 3, political_favors: 3 },
    goals: { power: 4, knowledge: 4, find_relic: 3, overthrow: 2, legacy: 2 },
    occupations: { scholar: 3, courtier: 3, spy: 3, noble: 2, archivist: 2 },
    emblems: ['eye in a triangle', 'veiled face', 'key', 'closed book', 'moth'],
  },
  military_order: {
    weight: 1, scopes: { settlement: 1, country: 2, planet: 1.5 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 7, tolerated: 3 },
    structures: { hierarchy: 7, meritocracy: 2 }, recruitment: { examination: 3, initiation_rite: 3, conscription: 2, birthright: 1 },
    leaderTitles: ['Grand Commander', 'Marshal of the Order', 'First Blade', 'Lord Protector'],
    ranks: [['Squire', 'Sworn', 'Knight', 'Commander'], ['Recruit', 'Trooper', 'Sergeant', 'Captain']],
    nouns: ['Order', 'Legion', 'Company', 'Shield', 'Watch', 'Vanguard'],
    activities: { patrols: 5, protection: 4, mercenary_contracts: 2, teaching: 1 },
    resources: { fortresses: 4, weapons: 5, mercenaries: 2, land: 2, trained_beasts: 1 },
    goals: { justice: 3, protect_family: 1, power: 2, peace: 2, restore_honor: 3, legacy: 2 },
    occupations: { soldier: 8, guard: 3, mercenary: 1 },
    emblems: ['sword', 'shield', 'tower', 'spear', 'helm'],
  },
  academy: {
    weight: 1, scopes: { settlement: 1, country: 1.5, planet: 2 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 8, tolerated: 2 },
    structures: { meritocracy: 5, council: 4 }, recruitment: { examination: 6, invitation: 2, purchase: 1 },
    leaderTitles: ['Rector', 'Provost', 'Chancellor of the Academy', 'First Scholar'],
    ranks: [['Student', 'Fellow', 'Lecturer', 'Professor'], ['Pupil', 'Scholar', 'Master', 'Magister']],
    nouns: ['Academy', 'College', 'Institute', 'Lyceum', 'Athenaeum'],
    activities: { teaching: 6, research: 5, exploration: 1, arbitration: 1 },
    resources: { archives: 5, laboratories: 3, land: 1, political_favors: 1 },
    goals: { knowledge: 7, discovery: 3, recognition: 2, legacy: 2 },
    occupations: { scholar: 7, archivist: 2, physician: 1, engineer: 1 },
    emblems: ['open book', 'lens', 'quill', 'lamp', 'star chart'],
  },
  rebel_movement: {
    weight: 1, scopes: { settlement: 0.5, country: 1.5, planet: 0.5 },
    visibility: { secret: 4, discreet: 4, public: 1 }, legality: { outlawed: 8, tolerated: 1 },
    structures: { cell_network: 6, council: 2, democratic: 1 }, recruitment: { open: 2, invitation: 4, initiation_rite: 1 },
    leaderTitles: ['Commander', 'the Voice of the Free', 'First Comrade', 'Liberator'],
    ranks: [['Sympathizer', 'Fighter', 'Cell Leader', 'Commander'], ['Friend', 'Comrade', 'Organizer', 'Council Voice']],
    nouns: ['Front', 'Movement', 'Resistance', 'Brigade', 'Dawn'],
    activities: { sabotage: 4, propaganda: 4, espionage: 2, recruitment_drives: 3, smuggling: 1 },
    resources: { safehouses: 5, informants: 3, weapons: 3, fanatical_followers: 2 },
    goals: { overthrow: 6, freedom: 5, secession: 3, justice: 3, revenge: 1 },
    occupations: { soldier: 3, spy: 2, courier: 2, scholar: 1, smuggler: 1 },
    emblems: ['broken chain', 'raised fist', 'torch', 'rising sun', 'red star'],
  },
  political_party: {
    weight: 1, constraints: { minTech: 3 }, scopes: { settlement: 0.5, country: 3, planet: 1 },
    visibility: { public: 10 }, legality: { official: 6, tolerated: 3, outlawed: 0.5 },
    structures: { democratic: 4, hierarchy: 3, council: 2 }, recruitment: { open: 7, invitation: 1 },
    leaderTitles: ['Party Chair', 'First Secretary', 'Leader of the Party', 'Speaker'],
    ranks: [['Member', 'Organizer', 'Delegate', 'Party Council'], ['Supporter', 'Activist', 'Officer', 'Executive']],
    nouns: ['Party', 'League', 'Alliance', 'Front', 'Union'],
    activities: { lobbying: 5, propaganda: 4, recruitment_drives: 3, festivals: 1 },
    resources: { political_favors: 5, informants: 1, wealth: 2, data_networks: 1 },
    goals: { power: 5, reform: 4, justice: 2, expand_influence: 3, peace: 1 },
    occupations: { diplomat: 4, administrator: 3, courtier: 2, judge: 1 },
    emblems: ['rose', 'clasped hands', 'wheat sheaf', 'torch', 'star'],
  },
  noble_house: {
    weight: 1, scopes: { settlement: 1, country: 2, planet: 0.5 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 9, tolerated: 1 },
    structures: { dynasty: 8, council: 1 }, recruitment: { birthright: 8, invitation: 1 },
    leaderTitles: ['Head of House', 'Head of the Line', 'Liege of the House'],
    ranks: [['Retainer', 'Cousin', 'Heir', 'Head of House'], ['Sworn', 'Kin', 'Elder Kin', 'Liege']],
    nouns: ['House'],
    activities: { lobbying: 3, trade: 2, patrols: 1, festivals: 2, moneylending: 1 },
    resources: { land: 6, wealth: 4, political_favors: 3, fortresses: 2 },
    goals: { power: 4, legacy: 4, restore_honor: 3, wealth: 2, expand_influence: 3 },
    occupations: { noble: 8, courtier: 3, diplomat: 1 },
    emblems: ['crowned beast', 'tower', 'stag', 'eagle', 'rose', 'lion'],
  },
  cult: {
    weight: 1, scopes: { settlement: 1.5, country: 1, planet: 1 },
    visibility: { secret: 5, discreet: 4, public: 1 }, legality: { tolerated: 4, outlawed: 4 },
    structures: { autocracy: 6, cell_network: 2 }, recruitment: { initiation_rite: 5, coercion: 2, invitation: 2 },
    leaderTitles: ['Prophet', 'the Awakened', 'Shepherd', 'Voice of the Deep'],
    ranks: [['Seeker', 'Believer', 'Chosen', 'Hand of the Prophet'], ['Lamb', 'Sworn', 'Anointed', 'Elect']],
    nouns: ['Children', 'Flock', 'Chosen', 'Awakening', 'Covenant'],
    activities: { rituals: 6, recruitment_drives: 3, propaganda: 2, extortion: 1, sabotage: 1 },
    resources: { fanatical_followers: 6, relics: 2, sacred_sites: 2, safehouses: 2 },
    goals: { spread_faith: 5, power: 3, find_relic: 2, overthrow: 1, discovery: 1 },
    occupations: { prophet: 5, priest: 2, scholar: 1, farmer: 1 },
    emblems: ['spiral', 'black sun', 'open eye', 'thorned crown', 'hand of flame'],
  },
  mercenary_company: {
    weight: 1, scopes: { settlement: 1.5, country: 1, planet: 1.5 },
    visibility: { public: 7, discreet: 3 }, legality: { tolerated: 6, official: 3, outlawed: 1 },
    structures: { hierarchy: 5, meritocracy: 3, democratic: 1 }, recruitment: { open: 4, examination: 2, purchase: 1, conscription: 1 },
    leaderTitles: ['Captain-General', 'Condottiere', 'Free Captain', 'Warmaster'],
    ranks: [['Recruit', 'Blade', 'Sergeant', 'Captain'], ['Hireling', 'Veteran', 'Lieutenant', 'Free Captain']],
    nouns: ['Company', 'Free Company', 'Blades', 'Lances', 'Wolves'],
    activities: { mercenary_contracts: 7, protection: 3, patrols: 1 },
    resources: { weapons: 5, mercenaries: 4, ships: 2, trained_beasts: 1 },
    goals: { wealth: 6, recognition: 3, restore_honor: 2, survival: 2 },
    occupations: { mercenary: 7, soldier: 3, bounty_hunter: 1 },
    emblems: ['wolf head', 'crossed blades', 'skull', 'lance', 'banner'],
  },
  trade_consortium: {
    weight: 1, scopes: { settlement: 1, country: 2, planet: 3 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 8, tolerated: 2 },
    structures: { council: 6, hierarchy: 2 }, recruitment: { purchase: 4, invitation: 3, examination: 1 },
    leaderTitles: ['Chief Factor', 'Master of the Exchange', 'First Trader', 'Consul of Trade'],
    ranks: [['Clerk', 'Factor', 'Partner', 'Senior Partner'], ['Agent', 'Broker', 'Associate', 'Principal']],
    nouns: ['Consortium', 'Exchange', 'Compact', 'League', 'Combine'],
    activities: { trade: 7, banking: 3, lobbying: 2, smuggling: 0.5 },
    resources: { trade_routes: 6, ships: 4, wealth: 4, legal_charters: 2 },
    goals: { wealth: 5, monopoly: 4, expand_influence: 4 },
    occupations: { merchant: 7, banker: 2, sailor: 1, pilot: 1 },
    emblems: ['scales', 'coin', 'ship', 'lantern', 'ledger'],
  },
  monastic_order: {
    weight: 1, scopes: { settlement: 1, country: 1, planet: 1 },
    visibility: { public: 6, discreet: 4 }, legality: { official: 6, tolerated: 4 },
    structures: { hierarchy: 4, council: 3 }, recruitment: { initiation_rite: 5, open: 2, invitation: 2 },
    leaderTitles: ['Abbot', 'Prior', 'Eldest of the Order', 'Keeper of Silence'],
    ranks: [['Novice', 'Sibling', 'Elder', 'Abbot'], ['Postulant', 'Monk', 'Master', 'Prior']],
    nouns: ['Order', 'Brotherhood', 'Cloister', 'Sisterhood', 'Fellowship'],
    activities: { worship: 4, teaching: 2, healing: 3, research: 2, charity: 2 },
    resources: { sacred_sites: 4, archives: 4, land: 2 },
    goals: { knowledge: 3, peace: 3, spread_faith: 2, redemption: 2, legacy: 1 },
    occupations: { priest: 6, scholar: 3, physician: 2 },
    emblems: ['closed eye', 'lamp', 'bell', 'knotted rope', 'lotus'],
  },
  explorers_society: {
    weight: 1, scopes: { settlement: 0.5, country: 1, planet: 2 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 6, tolerated: 4 },
    structures: { council: 4, meritocracy: 3, loose_network: 2 }, recruitment: { invitation: 3, examination: 3, open: 2 },
    leaderTitles: ['President of the Society', 'First Pathfinder', 'Chief Cartographer'],
    ranks: [['Member', 'Fellow', 'Pathfinder', 'Elder Pathfinder'], ['Associate', 'Surveyor', 'Expedition Leader', 'Councillor']],
    nouns: ['Society', 'Company', 'Survey', 'Expedition', 'Wayfarers'],
    activities: { exploration: 7, research: 3, relic_hunting: 3, teaching: 1 },
    resources: { archives: 4, ships: 3, relics: 2, trade_routes: 1 },
    goals: { discovery: 7, find_relic: 3, recognition: 2, knowledge: 3 },
    occupations: { explorer: 7, scholar: 2, pilot: 2, hunter: 1 },
    emblems: ['compass', 'star chart', 'boot print', 'spyglass', 'mountain'],
  },
  mutual_aid_society: {
    weight: 1, scopes: { settlement: 2, country: 1, planet: 0.5 },
    visibility: { public: 9, discreet: 1 }, legality: { official: 6, tolerated: 4 },
    structures: { democratic: 5, council: 3, loose_network: 2 }, recruitment: { open: 8 },
    leaderTitles: ['Steward', 'First Neighbor', 'Chair of the Fellowship'],
    ranks: [['Member', 'Volunteer', 'Organizer', 'Steward']],
    nouns: ['Fellowship', 'Society', 'Circle', 'Commons', 'Hearth'],
    activities: { charity: 6, healing: 3, protection: 2, festivals: 2, arbitration: 1 },
    resources: { safehouses: 2, land: 1, informants: 1, wealth: 1 },
    goals: { justice: 4, peace: 3, protect_family: 3, survival: 3, reform: 2 },
    occupations: { physician: 3, farmer: 2, administrator: 2, innkeeper: 2 },
    emblems: ['clasped hands', 'hearth', 'loaf', 'open door', 'ring of hands'],
  },
  hacker_collective: {
    weight: 1, constraints: { minTech: 6 }, scopes: { settlement: 0.5, country: 1, planet: 1 },
    visibility: { secret: 6, discreet: 3 }, legality: { outlawed: 5, tolerated: 4 },
    structures: { loose_network: 6, cell_network: 3 }, recruitment: { invitation: 5, examination: 3 },
    leaderTitles: ['Root', 'the Admin', 'Prime Node', 'Ghost'],
    ranks: [['Script', 'Runner', 'Operator', 'Root'], ['Node', 'Relay', 'Core', 'Kernel']],
    nouns: ['Collective', 'Network', 'Node', 'Cipher', 'Signal'],
    activities: { data_theft: 6, espionage: 3, sabotage: 3, propaganda: 2 },
    resources: { data_networks: 6, blackmail_material: 3, informants: 2 },
    goals: { freedom: 4, knowledge: 3, overthrow: 2, wealth: 2, recognition: 2 },
    occupations: { engineer: 5, spy: 2, thief: 2, mechanic: 1 },
    emblems: ['broken lock', 'glyph of static', 'masked face', 'open circuit', 'spiral of code'],
  },
};

export const ORG_NAME_PATTERNS: NamePattern[] = [
  { pattern: 'The {adjective} {orgNoun}', weight: 5 },
  { pattern: '{root} {orgNoun}', weight: 3 },
  { pattern: 'The {orgNoun} of the {adjective} {noun}', weight: 3 },
  { pattern: 'The {orgNoun} of {place}', weight: 2 },
  { pattern: 'The {noun} {orgNoun}', weight: 2 },
];

export const ORG_MOTTO_PATTERNS: NamePattern[] = [
  { pattern: 'From the {noun1}, the {noun2}', weight: 3 },
  { pattern: 'The {noun1} endures', weight: 2 },
  { pattern: 'We are the {orgNoun}', weight: 1 },
  { pattern: 'By {noun1} and {noun2}', weight: 3 },
  { pattern: 'Ever watchful, ever {virtue}', weight: 1.5 },
  { pattern: '{virtue} unto the last', weight: 1.5 },
  { pattern: 'Stand {virtue}', weight: 1 },
];

/** Adjectives fit for mottos ("Ever watchful, ever faithful"). */
export const MOTTO_VIRTUES = [
  'faithful', 'vigilant', 'free', 'true', 'loyal', 'unbroken', 'steadfast', 'silent', 'patient', 'unbowed', 'just',
  'humble', 'fearless', 'generous', 'hungry', 'awake', 'resolute', 'merciful', 'proud', 'united',
];

/** Org counts. Settlement-scope counts depend on settlement size (1..5). */
export const ORG_COUNTS = {
  planet: [2, 4] as [number, number],
  country: [1, 3] as [number, number],
  settlement: { 1: [0, 1], 2: [0, 1], 3: [1, 2], 4: [1, 3], 5: [1, 3] } as Record<number, [number, number]>,
};
