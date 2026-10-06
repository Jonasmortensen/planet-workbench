import { createContext, useContext, type ReactNode } from 'react';
import { kindOf, type EntityKind } from '../generator';

/**
 * Explorer-mode gating. In the inspector everything is known. In the
 * explorer, sections and fields are shown only when the player knows the
 * fact group they belong to. Pages stay unchanged: the mapping below ties
 * section titles and field labels to fact groups (see src/explore/facts.ts).
 */
export interface KnowValue {
  explore: boolean;
  knows: (entity: string, group: string) => boolean;
  isKnown: (entity: string) => boolean;
}

const ALL_KNOWN: KnowValue = { explore: false, knows: () => true, isKnown: () => true };

export const KnowContext = createContext<KnowValue>(ALL_KNOWN);
export const useKnow = () => useContext(KnowContext);

/** The entity whose page is being rendered. */
const ScopeContext = createContext<string | null>(null);
/** Groups of the enclosing section, the default for its fields. */
const SectionGroupsContext = createContext<string[] | null>(null);

export function KnowScope({ id, children }: { id: string; children: ReactNode }) {
  return <ScopeContext.Provider value={id}>{children}</ScopeContext.Provider>;
}

/** Never shown in the explorer (secrets, hidden agendas, debug views). */
export const HIDDEN = '__hidden';

type Mapping = Partial<Record<EntityKind, Record<string, string | string[]>>>;

const SECTION_GROUPS: Mapping = {
  planet: {
    Identity: 'name', Physical: 'physical', 'Geography and resources': ['geography', 'features', 'resources', 'hazards'],
    Life: ['life', 'species_mix'], Civilization: ['population', 'tech', 'politics', 'faiths_languages'], Countries: 'politics',
    History: 'history', 'Economy and galactic relations': ['economy', 'galactic'], 'Notable oddities': ['oddities', 'megastructures'],
    Flavor: HIDDEN,
  },
  country: {
    Identity: ['name', 'flag', 'culture'], Territory: 'territory', Population: 'population', Government: ['government', 'ruler'],
    Economy: ['economy', 'tech'], 'Military and relations': 'military', 'Relations with countries': 'relations',
    'Relations with organizations': 'relations', Culture: 'culture', Settlements: 'name', History: 'history', Flavor: HIDDEN,
  },
  settlement: {
    Identity: 'name', Location: ['appearance', 'connections'], Population: ['appearance', 'people', 'faiths', 'governance'],
    Governance: 'governance', Economy: ['appearance', 'economy'], Defense: 'appearance', Districts: 'appearance',
    'Points of interest': 'appearance', Atmosphere: ['appearance', 'people'], 'Current situation': ['events', 'organizations'],
    People: 'name', History: 'history', Flavor: HIDDEN,
  },
  organization: {
    Identity: 'name', Scope: 'scope', Leadership: 'leadership', Status: 'status', Purpose: 'purpose', Relations: 'relations',
    Members: 'members', History: 'history', Flavor: HIDDEN,
  },
  npc: {
    Identity: ['name', 'appearance'], 'Category and role': 'role', Whereabouts: 'location', Treasures: 'name',
    Appearance: 'appearance', Personality: 'personality',
    Motivation: ['goal', 'fear'], Capabilities: ['role', 'appearance'], Affiliations: 'affiliations', Relationships: 'relationships',
    'Story hooks': 'hooks', Life: 'history',
  },
  poi: { Identity: 'name', 'People present': 'name', Treasures: 'name', 'Carried by people here': 'name' },
  treasure: { Identity: 'name', Where: 'details', About: 'details' },
  species: { Biology: 'biology', Languages: 'biology', 'Present in': HIDDEN },
  language: { Language: 'details', Phonology: 'details', 'Present in': HIDDEN },
  religion: { Faith: 'details', 'Present in': HIDDEN },
};

const FIELD_GROUPS: Mapping = {
  planet: {
    'Native name': 'faiths_languages', Seed: HIDDEN,
    Biomes: 'geography', Continents: 'geography', 'Notable features': 'features', Resources: 'resources', Hazards: 'hazards',
    Biosphere: 'life', 'Native sapients': 'species_mix', 'Settlement origin': 'species_mix', Species: 'species_mix',
    Population: 'population', 'Tech level': 'tech', 'Political structure': 'politics', 'Country count': 'politics',
    'World government': 'politics', Stability: 'politics', 'Dominant languages': 'faiths_languages',
    'Religions and ideologies': 'faiths_languages', Wealth: 'economy', Exports: 'economy', Imports: 'economy',
    'Law level': 'economy', 'Danger level': 'economy', 'Galactic connectivity': 'galactic', 'Faction allegiance': 'galactic',
    Anomalies: 'oddities', 'Precursor presence': 'oddities', 'Special abilities': 'oddities', Megastructures: 'megastructures',
    Rumors: HIDDEN,
  },
  country: {
    Name: 'name', Demonym: 'culture', Planet: 'name', Seed: HIDDEN, Flag: 'flag', Motto: 'culture', Ruler: 'ruler',
    'Ruler title': 'government', 'Government type': 'government', Stability: 'government', 'Law level': 'government',
    Freedom: 'government', Wealth: 'economy', Industries: 'economy', Exports: 'economy', Imports: 'economy',
    Currency: 'economy', 'Tech level': 'tech', Founded: 'history', Rumors: HIDDEN,
  },
  settlement: {
    Name: 'name', Type: 'name', Country: 'name', Seed: HIDDEN, Nickname: 'history', Biome: 'appearance', Terrain: 'appearance',
    Position: 'appearance', Connections: 'connections', Population: 'appearance', Species: 'people', Languages: 'people',
    Faiths: 'faiths', 'Social structure': 'governance', Wealth: 'appearance', Industries: 'economy', 'Notable goods': 'appearance',
    'Market size': 'appearance', Mood: 'appearance', Aesthetic: 'appearance', 'Local customs': 'people',
    'Current events': 'events', 'Organizations present': 'organizations', Founded: 'history', Rumors: HIDDEN,
  },
  organization: {
    Seed: HIDDEN, Motto: 'purpose', 'State role': 'status', Faith: 'purpose', 'True goal': HIDDEN, Founded: 'history', Rumors: HIDDEN,
  },
  npc: {
    Name: 'name', 'Given / family': 'name', 'Title or epithet': 'name', Home: 'name', Seed: HIDDEN, Species: 'appearance',
    // Leader/notable and story role are meta-data that could expose hidden leadership.
    'Story role': HIDDEN,
    'Native tongue': 'appearance', Age: 'appearance', Gender: 'appearance', Category: HIDDEN, Skills: 'role',
    'Special abilities': 'personality', Possessions: 'appearance', Wealth: 'appearance', Goal: 'goal', Fear: 'fear',
    Secret: HIDDEN, 'Current event': 'hooks', 'Quest hooks': 'hooks', 'Rumors about': HIDDEN,
    // Whereabouts are only ever learned when public, so the presence marker and its reason are safe to show.
    'Found at': 'location', 'Why there': 'location', 'Because of': 'location', Presence: 'location',
  },
  poi: {
    Name: 'name', Type: 'details', Significance: 'details', Settlement: 'name', Owner: 'details', Seed: HIDDEN,
  },
  treasure: {
    Name: 'name', Category: 'details', Rarity: 'details', Visibility: 'details', Seed: HIDDEN,
  },
};

const asList = (g: string | string[] | undefined): string[] | null => (g === undefined ? null : Array.isArray(g) ? g : [g]);
const stripCount = (title: string) => title.replace(/\s*\(\d+\)$/, '');

/** Whether a section is visible; returns its groups for the fields inside. */
export function useSectionGate(title: string): { visible: boolean; groups: string[] | null } {
  const { explore, knows } = useKnow();
  const scope = useContext(ScopeContext);
  if (!explore || !scope) return { visible: true, groups: null };
  const kind = kindOf(scope)!;
  const t = stripCount(title);
  if (t.startsWith('Referenced by')) return { visible: false, groups: null };
  const groups = asList(SECTION_GROUPS[kind]?.[t]);
  if (!groups) return { visible: knows(scope, 'name'), groups: null };
  if (groups.includes(HIDDEN)) return { visible: false, groups };
  return { visible: groups.some((g) => knows(scope, g)), groups };
}

export function useFieldGate(label: string): boolean {
  const { explore, knows } = useKnow();
  const scope = useContext(ScopeContext);
  const sectionGroups = useContext(SectionGroupsContext);
  if (!explore || !scope) return true;
  const kind = kindOf(scope)!;
  const groups = asList(FIELD_GROUPS[kind]?.[label]) ?? (sectionGroups?.length === 1 ? sectionGroups : null);
  if (!groups) return sectionGroups ? sectionGroups.some((g) => knows(scope, g)) : knows(scope, 'name');
  if (groups.includes(HIDDEN)) return false;
  return groups.some((g) => knows(scope, g));
}

export function SectionGroups({ groups, children }: { groups: string[] | null; children: ReactNode }) {
  return <SectionGroupsContext.Provider value={groups}>{children}</SectionGroupsContext.Provider>;
}

/** A table cell or inline value that is shown only when its fact group is known. */
export function Known({ id, group, children }: { id: string; group: string; children: ReactNode }) {
  const { knows } = useKnow();
  return knows(id, group) ? <>{children}</> : <span className="muted" title="Not known yet">?</span>;
}
