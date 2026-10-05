import type { Rng } from '../../rng';
import type { Planet, PlanetBundle } from '../../types/entities';
import { PLANET_ID } from '../../types/ids';
import { rollEconomy, rollSociety, rollTech } from './civilization';
import { rollBiomes, rollGeographyDetails } from './geography';
import { rollHistory } from './history';
import { rollLife } from './life';
import { rollPlanetNames } from './names';
import { rollAnomalies, rollMegastructures, rollPrecursors, rollSpecialAbilities } from './oddities';
import { rollPeoples } from './peoples';
import { rollPhysical } from './physical';

export function emptyPlanet(seed: string): Planet {
  return {
    id: PLANET_ID, seed, name: '', native_name: '', star_system: '', orbital_position: 1, orbital_distance_au: 1,
    insolation: 1,
    planet_type: 'terrestrial', size_class: 'medium', radius_km: 0, gravity: 1, day_length_hours: 24,
    tidally_locked: false, year_length_days: 365, axial_tilt: 0, seasonality: 'none', moons: [],
    atmosphere: { composition: 'none', pressure: 'none' }, temperature_range: { min: 0, mean: 0, max: 0 },
    water_coverage: 0,
    biomes: [], continent_count: 0, notable_features: [], resources: [], hazards: [],
    biosphere: 'none', native_sapients: false, native_species_id: null, settlement_origin: 'colonial', species: [],
    population: 0, tech_level: 0, political_structure: 'unified', world_government: null, country_count: 1,
    stability: 'stable', dominant_languages: [], dominant_religions_or_ideologies: [], history: [],
    wealth_level: 'modest', primary_exports: [], primary_imports: [], galactic_connectivity: 'isolated',
    faction_allegiance: 'independent', law_level: 'moderate', danger_level: 'moderate',
    anomalies: [], precursor_presence: 'none', megastructures: [], special_abilities: [],
    tagline: '', description: '', rumors: [],
  };
}

/**
 * Pipeline step 1: the planet. Each sub-step gets its own forked stream, so
 * adding rolls to one sub-step never shifts the others.
 */
export function generatePlanetStep(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  rollPhysical(p, rng.fork('physical'));
  rollBiomes(p, rng.fork('biomes'));
  rollLife(p, rng.fork('life'));
  rollPrecursors(p, rng.fork('precursors'));
  rollTech(bundle, rng.fork('tech'));
  rollPeoples(bundle, rng.fork('peoples'));
  rollGeographyDetails(p, rng.fork('geography'));
  rollSociety(bundle, rng.fork('society'));
  rollAnomalies(p, rng.fork('anomalies'));
  rollMegastructures(p, rng.fork('megastructures'));
  rollSpecialAbilities(p, rng.fork('abilities'));
  rollEconomy(bundle, rng.fork('economy'));
  rollHistory(bundle, rng.fork('history'));
  rollPlanetNames(bundle, rng.fork('names'));
}
