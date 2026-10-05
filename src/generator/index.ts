/**
 * Planet generator: a pure, deterministic library. No DOM, no browser APIs,
 * no unseeded randomness, no clock. generatePlanet(seed) always returns the same
 * bundle for the same seed and generator version.
 */
import { Rng } from './rng';
import { generateCountriesStep } from './steps/countries';
import { emptyPlanet, generatePlanetStep } from './steps/planet';
import { generateCurrentEventsStep } from './steps/currentEvents';
import { generateLeadersStep } from './steps/leaders';
import { generateNotablesStep } from './steps/notables';
import { generateOrganizationsStep } from './steps/organizations';
import { generateRelationshipsStep } from './steps/relationships';
import { generateSettlementsStep } from './steps/settlements';
import type { PlanetBundle } from './types/entities';
import { validate } from './validate';

export const GENERATOR_VERSION = '0.3.0';

/** Pipeline steps in order. Each receives the bundle built so far and its own stream. */
const PIPELINE: { key: string; run: (bundle: PlanetBundle, rng: Rng) => void }[] = [
  { key: 'planet', run: generatePlanetStep },
  { key: 'countries', run: generateCountriesStep },
  { key: 'settlements', run: generateSettlementsStep },
  { key: 'organizations', run: generateOrganizationsStep },
  { key: 'current-events', run: generateCurrentEventsStep },
  { key: 'leaders', run: generateLeadersStep },
  { key: 'notables', run: generateNotablesStep },
  { key: 'relationships', run: generateRelationshipsStep },
  // Milestone 4: motives and hooks, render
];

export function generatePlanet(seed: string): PlanetBundle {
  const root = new Rng(seed);
  const bundle: PlanetBundle = {
    generator_version: GENERATOR_VERSION,
    seed,
    planet: emptyPlanet(root.childSeed('planet')),
    countries: {},
    settlements: {},
    organizations: {},
    npcs: {},
    species: {},
    languages: {},
    religions: {},
    validation: [],
  };
  for (const step of PIPELINE) step.run(bundle, root.fork(step.key));
  bundle.validation = validate(bundle);
  return bundle;
}

export { validate } from './validate';
export * from './types';
