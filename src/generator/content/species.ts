import type {
  AtmosphereComposition, Biology, Biosphere, BodyPlan, GenderSystem, LanguageStyle, PlanetType,
} from '../types/enums';

export interface GalacticSpeciesDef {
  weight: number;
  name: string;
  plural: string;
  biology: Biology;
  body_plan: BodyPlan;
  gender_system: GenderSystem;
  lifespan: number;
  /** Comfortable mean surface temperature range in °C. */
  comfort: [number, number];
  breathes: AtmosphereComposition[];
  /** Language styles this species' colonists tend to speak. */
  styles: Partial<Record<LanguageStyle, number>>;
  /** Planet types this species favors as colonists (multipliers). */
  favors?: Partial<Record<PlanetType, number>>;
  blurb: string;
}

const ANY_AIR: AtmosphereComposition[] = [
  'none', 'breathable', 'tainted', 'toxic', 'corrosive', 'inert', 'methane', 'spore_laden', 'exotic',
];

/** Spacefaring species found across the galaxy. All names are original. */
export const GALACTIC_SPECIES: Record<string, GalacticSpeciesDef> = {
  humans: {
    weight: 30, name: 'Human', plural: 'Humans', biology: 'carbon', body_plan: 'humanoid', gender_system: 'varied',
    lifespan: 95, comfort: [-15, 35], breathes: ['breathable', 'tainted'],
    styles: { harsh: 1, flowing: 1, clipped: 1.5, melodic: 1, sibilant: 0.3, guttural: 0.3 },
    blurb: 'adaptable, quarrelsome and everywhere',
  },
  ossuin: {
    weight: 8, name: 'Ossuin', plural: 'Ossuin', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 160, comfort: [-30, 15], breathes: ['breathable', 'tainted', 'inert'],
    styles: { harsh: 3, guttural: 1 }, favors: { arctic: 3, tundra: 3, mountainous: 2 },
    blurb: 'tall, bone-plated and slow to forgive',
  },
  varrek: {
    weight: 7, name: 'Varrek', plural: 'Varreki', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 110, comfort: [15, 55], breathes: ['breathable', 'tainted', 'toxic'],
    styles: { guttural: 3, harsh: 2 }, favors: { desert: 3, volcanic: 3, savanna: 2 },
    blurb: 'heavy-scaled, heat-loving and proud of their scars',
  },
  nuulai: {
    weight: 5, name: "Nuu'lai", plural: "Nuu'lai", biology: 'carbon', body_plan: 'cephalopod', gender_system: 'fluid',
    lifespan: 210, comfort: [0, 30], breathes: ['breathable', 'tainted', 'methane'],
    styles: { alien: 3, flowing: 1 }, favors: { ocean: 5, archipelago: 3, swamp: 2 },
    blurb: 'many-armed tide dwellers who think in currents',
  },
  corrovi: {
    weight: 5, name: 'Corrovi', plural: 'Corrovi', biology: 'carbon', body_plan: 'avian', gender_system: 'binary',
    lifespan: 70, comfort: [-5, 30], breathes: ['breathable'],
    styles: { melodic: 3, flowing: 1 }, favors: { mountainous: 3, storm: 2, archipelago: 2 },
    blurb: 'hollow-boned gliders with long memories for songs and slights',
  },
  tchakk: {
    weight: 4, name: 'Tchakk', plural: 'Tchakk', biology: 'carbon', body_plan: 'insectoid', gender_system: 'multiple',
    lifespan: 40, comfort: [10, 45], breathes: ['breathable', 'tainted', 'toxic', 'spore_laden'],
    styles: { alien: 3, clipped: 1 }, favors: { jungle: 3, desert: 2, fungal: 2 },
    blurb: 'chitinous hive-kin who speak of themselves in the plural',
  },
  halcyn: {
    weight: 2, name: 'Halcyn', plural: 'Halcyn', biology: 'crystalline', body_plan: 'crystalline', gender_system: 'none',
    lifespan: 900, comfort: [-80, 80], breathes: ['none', 'inert', 'exotic', 'tainted'],
    styles: { melodic: 2, alien: 2 }, favors: { crystal: 6, barren: 2, glass: 3 },
    blurb: 'slow, chiming beings of living lattice',
  },
  vohl: {
    weight: 2, name: 'Vohl', plural: 'Vohl', biology: 'fungal', body_plan: 'colonial', gender_system: 'none',
    lifespan: 300, comfort: [0, 35], breathes: ['spore_laden', 'tainted', 'breathable', 'methane'],
    styles: { sibilant: 2, alien: 2 }, favors: { fungal: 6, swamp: 3, hollow: 3 },
    blurb: 'mycelial colonies that bud new selves and trade memories as spores',
  },
  keth: {
    weight: 6, name: 'Keth', plural: 'Keth', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 60, comfort: [-10, 30], breathes: ['breathable', 'tainted'],
    styles: { clipped: 3, harsh: 1 }, favors: { steppe: 2, terrestrial: 2, ecumenopolis: 3 },
    blurb: 'small, quick, furred and endlessly entrepreneurial',
  },
  drossk: {
    weight: 2, name: 'Drossk', plural: 'Drossk', biology: 'silicon', body_plan: 'quadruped', gender_system: 'none',
    lifespan: 600, comfort: [20, 200], breathes: ['none', 'toxic', 'corrosive', 'inert'],
    styles: { guttural: 3, harsh: 1 }, favors: { volcanic: 6, barren: 3, toxic: 3 },
    blurb: 'massive stone-eaters who measure time in eruptions',
  },
  wrought: {
    weight: 3, name: 'Wrought', plural: 'Wrought', biology: 'synthetic', body_plan: 'mechanical', gender_system: 'none',
    lifespan: 1000, comfort: [-150, 150], breathes: ANY_AIR,
    styles: { mechanical: 5 }, favors: { machine: 8, barren: 2, ecumenopolis: 2 },
    blurb: 'self-built machine people, each one a lineage of repairs',
  },
  lumaq: {
    weight: 3, name: 'Lumaq', plural: 'Lumaqi', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 85, comfort: [10, 35], breathes: ['breathable', 'tainted', 'spore_laden'],
    styles: { flowing: 2, melodic: 2 }, favors: { swamp: 4, jungle: 3, ocean: 2 },
    blurb: 'amphibious and bioluminescent, their moods visible on their skin',
  },
  orrun: {
    weight: 2, name: 'Orrun', plural: 'Orrun', biology: 'carbon', body_plan: 'quadruped', gender_system: 'binary',
    lifespan: 250, comfort: [-5, 30], breathes: ['breathable', 'inert'],
    styles: { guttural: 2, flowing: 1 }, favors: { savanna: 4, steppe: 3, garden: 2 },
    blurb: 'enormous, gentle-voiced philosophers with tusks like pillars',
  },
  ssethra: {
    weight: 3, name: 'Ssethra', plural: 'Ssethrai', biology: 'carbon', body_plan: 'serpentine', gender_system: 'binary',
    lifespan: 130, comfort: [15, 50], breathes: ['breathable', 'tainted', 'toxic'],
    styles: { sibilant: 5 }, favors: { desert: 3, jungle: 3, volcanic: 2 },
    blurb: 'coiled, patient and fond of contracts with many clauses',
  },
  pellith: {
    weight: 2, name: 'Pellith', plural: 'Pellith', biology: 'carbon', body_plan: 'plantlike', gender_system: 'none',
    lifespan: 400, comfort: [5, 35], breathes: ['breathable', 'tainted', 'inert'],
    styles: { flowing: 2, melodic: 2 }, favors: { garden: 4, jungle: 3, savanna: 2 },
    blurb: 'rooted wanderers who photosynthesize and vote with their seeds',
  },
  nhal: {
    weight: 1, name: 'Nhal', plural: 'Nhal', biology: 'gaseous', body_plan: 'floating', gender_system: 'none',
    lifespan: 180, comfort: [-40, 60], breathes: ['methane', 'inert', 'toxic', 'tainted'],
    styles: { alien: 2, melodic: 2 }, favors: { storm: 6, toxic: 3 },
    blurb: 'drifting gas-bladders who speak in pressure and color',
  },
  teshrai: {
    weight: 4, name: 'Teshrai', plural: 'Teshrai', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 90, comfort: [10, 50], breathes: ['breathable', 'tainted'],
    styles: { sibilant: 2, flowing: 1, harsh: 1 }, favors: { desert: 5, savanna: 2, tidally_locked: 2 },
    blurb: 'long-eared desert nomads with a debt for every kindness',
  },
  aumbri: {
    weight: 1, name: 'Aumbri', plural: 'Aumbri', biology: 'carbon', body_plan: 'amorphous', gender_system: 'fluid',
    lifespan: 140, comfort: [-10, 40], breathes: ['breathable', 'tainted', 'methane', 'spore_laden'],
    styles: { alien: 3, sibilant: 1 }, favors: { swamp: 2, ocean: 2, hollow: 2 },
    blurb: 'soft-bodied shapers who borrow the faces of friends',
  },
  sivvan: {
    weight: 0.5, name: 'Sivvan', plural: 'Sivvan', biology: 'energy', body_plan: 'floating', gender_system: 'none',
    lifespan: 2000, comfort: [-200, 300], breathes: ANY_AIR,
    styles: { melodic: 2, alien: 3 }, favors: { crystal: 3, storm: 3, shattered: 3 },
    blurb: 'flickering lattices of light, rarely seen and never fully understood',
  },
  mordathi: {
    weight: 3, name: 'Mordathi', plural: 'Mordathi', biology: 'carbon', body_plan: 'humanoid', gender_system: 'binary',
    lifespan: 280, comfort: [-20, 20], breathes: ['breathable', 'tainted', 'inert'],
    styles: { flowing: 2, sibilant: 1, harsh: 1 }, favors: { tidally_locked: 3, hollow: 3, arctic: 2 },
    blurb: 'pale, long-lived and fond of keeping old grudges in good repair',
  },
};

// ---------------------------------------------------------------------------
// Native species generation
// ---------------------------------------------------------------------------

/** Biology weights for natives, by planet type (overrides) and then by biosphere. */
export const NATIVE_BIOLOGY_BY_TYPE: Partial<Record<PlanetType, Partial<Record<Biology, number>>>> = {
  crystal: { crystalline: 8, silicon: 3, energy: 1 },
  living: { symbiotic: 8, carbon: 2 },
  machine: { synthetic: 10 },
  fungal: { fungal: 8, carbon: 2 },
  storm: { gaseous: 3, carbon: 5 },
  volcanic: { silicon: 4, carbon: 3 },
  glass: { silicon: 3, crystalline: 3, energy: 1 },
  shattered: { energy: 2, silicon: 2, carbon: 2 },
  hollow: { fungal: 2, carbon: 5 },
};

export const NATIVE_BIOLOGY_BY_BIOSPHERE: Partial<Record<Biosphere, Partial<Record<Biology, number>>>> = {
  complex: { carbon: 10, fungal: 1, silicon: 0.5 },
  lush: { carbon: 10, fungal: 1, symbiotic: 0.5 },
  exotic: { silicon: 3, crystalline: 3, energy: 1, gaseous: 1, fungal: 2, carbon: 1 },
  synthetic: { synthetic: 10 },
  sparse: { carbon: 6, silicon: 1 },
  dying: { carbon: 6, fungal: 2 },
};

export interface NativeBiologyDef {
  bodyPlans: Partial<Record<BodyPlan, number>>;
  lifespan: [number, number];
  genders: Partial<Record<GenderSystem, number>>;
  /** Native language style tendencies. */
  styles: Partial<Record<LanguageStyle, number>>;
  /** Comfort temperature range width around the planet's mean. */
  comfortSpread: number;
  /** Which atmospheres they breathe, in addition to their homeworld's. */
  breathesExtra: AtmosphereComposition[];
}

export const NATIVE_BIOLOGY_TABLE: Record<Biology, NativeBiologyDef> = {
  carbon: {
    bodyPlans: { humanoid: 6, quadruped: 3, avian: 2, insectoid: 2, serpentine: 2, cephalopod: 1.5, amorphous: 0.5, plantlike: 1 },
    lifespan: [40, 250], genders: { binary: 6, varied: 2, multiple: 1, fluid: 1 },
    styles: { harsh: 2, flowing: 2, clipped: 2, melodic: 2, guttural: 2, alien: 1.5, sibilant: 1.5 },
    comfortSpread: 40, breathesExtra: [],
  },
  silicon: {
    bodyPlans: { quadruped: 3, crystalline: 2, serpentine: 2, insectoid: 1, humanoid: 1 },
    lifespan: [300, 1500], genders: { none: 5, multiple: 2 },
    styles: { guttural: 3, alien: 3, harsh: 1 }, comfortSpread: 120, breathesExtra: ['none', 'inert'],
  },
  synthetic: {
    bodyPlans: { mechanical: 8, humanoid: 2, colonial: 1 },
    lifespan: [500, 5000], genders: { none: 8, fluid: 1 },
    styles: { mechanical: 6, clipped: 1 }, comfortSpread: 250, breathesExtra: ['none', 'inert', 'toxic', 'corrosive'],
  },
  fungal: {
    bodyPlans: { colonial: 5, plantlike: 3, amorphous: 2 },
    lifespan: [100, 800], genders: { none: 5, multiple: 2 },
    styles: { sibilant: 3, alien: 2, flowing: 1 }, comfortSpread: 40, breathesExtra: ['spore_laden'],
  },
  crystalline: {
    bodyPlans: { crystalline: 8, floating: 1 },
    lifespan: [500, 3000], genders: { none: 8 },
    styles: { melodic: 3, alien: 3 }, comfortSpread: 160, breathesExtra: ['none', 'inert', 'exotic'],
  },
  energy: {
    bodyPlans: { floating: 6, amorphous: 3 },
    lifespan: [1000, 10000], genders: { none: 8, fluid: 2 },
    styles: { alien: 4, melodic: 2 }, comfortSpread: 400, breathesExtra: ['none', 'inert', 'exotic', 'toxic', 'corrosive'],
  },
  gaseous: {
    bodyPlans: { floating: 8, amorphous: 2 },
    lifespan: [100, 400], genders: { none: 5, fluid: 3 },
    styles: { alien: 3, melodic: 2, flowing: 1 }, comfortSpread: 80, breathesExtra: ['methane', 'inert'],
  },
  symbiotic: {
    bodyPlans: { amorphous: 3, colonial: 3, humanoid: 2, plantlike: 2 },
    lifespan: [80, 600], genders: { none: 3, fluid: 3, multiple: 2 },
    styles: { flowing: 2, alien: 2, melodic: 2, sibilant: 1 }, comfortSpread: 40, breathesExtra: ['spore_laden'],
  },
};

/** Suffixes appended to a generated root when naming a native species (exonym). */
export const SPECIES_NAME_SUFFIXES = ['i', 'ar', 'en', 'ath', 'ul', 'ori', 'esh', 'ik', 'an', 'oth'];
