import type { PlanetBundle } from './entities';

export const ENTITY_KINDS = [
  'planet', 'country', 'settlement', 'organization', 'npc', 'poi', 'treasure', 'species', 'language', 'religion',
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

const PREFIX: Record<EntityKind, string> = {
  planet: 'planet',
  country: 'country',
  settlement: 'settlement',
  organization: 'org',
  npc: 'npc',
  poi: 'poi',
  treasure: 'treasure',
  species: 'species',
  language: 'lang',
  religion: 'religion',
};

const KIND_BY_PREFIX: Record<string, EntityKind> = Object.fromEntries(
  ENTITY_KINDS.map((k) => [PREFIX[k], k]),
);

export const PLANET_ID = 'planet';

export function makeId(kind: EntityKind, index: number): string {
  return `${PREFIX[kind]}_${index}`;
}

/** Entity kind from an id, or null if the id is not a recognized entity id. */
export function kindOf(id: string): EntityKind | null {
  if (id === PLANET_ID) return 'planet';
  const prefix = id.slice(0, id.lastIndexOf('_'));
  return KIND_BY_PREFIX[prefix] ?? null;
}

/** Look up any entity in a bundle by id. */
export function resolveEntity(bundle: PlanetBundle, id: string): unknown | undefined {
  switch (kindOf(id)) {
    case 'planet':
      return bundle.planet.id === id ? bundle.planet : undefined;
    case 'country':
      return bundle.countries[id];
    case 'settlement':
      return bundle.settlements[id];
    case 'organization':
      return bundle.organizations[id];
    case 'npc':
      return bundle.npcs[id];
    case 'poi':
      return bundle.pois[id];
    case 'treasure':
      return bundle.treasures[id];
    case 'species':
      return bundle.species[id];
    case 'language':
      return bundle.languages[id];
    case 'religion':
      return bundle.religions[id];
    default:
      return undefined;
  }
}

/** Display name for any entity id. */
export function entityName(bundle: PlanetBundle, id: string): string {
  const entity = resolveEntity(bundle, id) as { name?: string } | undefined;
  return entity?.name ?? id;
}
