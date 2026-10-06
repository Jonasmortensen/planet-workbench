import type { EntityKind } from '../generator';

/**
 * Knowledge is tracked per entity and per fact group: "country_2 / government"
 * is known or not. Groups follow the data model's categories, finely enough
 * that what you can see (a town's size) and what you must be told (who runs
 * it) are separate.
 *
 * `seen` marks when a group is revealed without anyone saying it:
 *   orbit   - visible on arrival from space
 *   arrival - visible on walking into a settlement (for that settlement and its country)
 *   meet    - visible on meeting an NPC face to face
 * Groups without `seen` must be learned in conversation.
 */
export type SeenWhen = 'orbit' | 'arrival' | 'meet';

export interface FactGroup {
  key: string;
  label: string;
  seen?: SeenWhen;
}

export const FACT_GROUPS: Record<EntityKind, FactGroup[]> = {
  planet: [
    { key: 'name', label: 'Name and location', seen: 'orbit' },
    { key: 'physical', label: 'Physical traits', seen: 'orbit' },
    { key: 'geography', label: 'Biomes and continents', seen: 'orbit' },
    { key: 'life', label: 'Biosphere', seen: 'orbit' },
    { key: 'tech', label: 'Technical advancement', seen: 'orbit' },
    { key: 'megastructures', label: 'Megastructures', seen: 'orbit' },
    { key: 'features', label: 'Notable features' },
    { key: 'resources', label: 'Resources' },
    { key: 'hazards', label: 'Hazards' },
    { key: 'species_mix', label: 'Peoples and origin' },
    { key: 'population', label: 'Population' },
    { key: 'politics', label: 'Politics' },
    { key: 'faiths_languages', label: 'Languages and faiths' },
    { key: 'history', label: 'History' },
    { key: 'economy', label: 'Economy and law' },
    { key: 'galactic', label: 'Galactic ties' },
    { key: 'oddities', label: 'Anomalies and oddities' },
  ],
  country: [
    { key: 'name', label: 'Name', seen: 'arrival' },
    { key: 'flag', label: 'Flag', seen: 'arrival' },
    { key: 'tech', label: 'Technical advancement', seen: 'arrival' },
    { key: 'territory', label: 'Territory' },
    { key: 'population', label: 'Population' },
    { key: 'government', label: 'Government' },
    { key: 'ruler', label: 'Ruler' },
    { key: 'economy', label: 'Economy' },
    { key: 'military', label: 'Military' },
    { key: 'relations', label: 'Foreign relations' },
    { key: 'culture', label: 'Culture' },
    { key: 'history', label: 'History' },
  ],
  settlement: [
    { key: 'name', label: 'Name', seen: 'arrival' },
    { key: 'appearance', label: 'Size and appearance', seen: 'arrival' },
    { key: 'people', label: 'Peoples and customs', seen: 'arrival' },
    { key: 'connections', label: 'Roads and routes' },
    { key: 'faiths', label: 'Faiths' },
    { key: 'governance', label: 'Governance' },
    { key: 'economy', label: 'Trades' },
    { key: 'events', label: 'Current events' },
    { key: 'organizations', label: 'Organizations present' },
    { key: 'history', label: 'History and lore' },
  ],
  organization: [
    { key: 'name', label: 'Name and symbol' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'scope', label: 'Reach' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'status', label: 'Standing' },
    { key: 'relations', label: 'Relations' },
    { key: 'members', label: 'Members' },
    { key: 'history', label: 'History' },
  ],
  npc: [
    { key: 'name', label: 'Name and whereabouts' },
    { key: 'appearance', label: 'Appearance', seen: 'meet' },
    { key: 'role', label: 'Occupation and role' },
    { key: 'personality', label: 'Personality' },
    { key: 'history', label: 'Life story' },
    { key: 'affiliations', label: 'Affiliations' },
    { key: 'relationships', label: 'Relationships' },
    { key: 'goal', label: 'Goal' },
    { key: 'fear', label: 'Fear' },
    { key: 'hooks', label: 'Work on offer' },
  ],
  species: [
    { key: 'name', label: 'Name', seen: 'arrival' },
    { key: 'biology', label: 'Biology' },
  ],
  language: [
    { key: 'name', label: 'Name' },
    { key: 'details', label: 'Details' },
  ],
  religion: [
    { key: 'name', label: 'Name' },
    { key: 'details', label: 'Beliefs' },
  ],
};

export function groupsSeen(kind: EntityKind, when: SeenWhen): string[] {
  return FACT_GROUPS[kind].filter((g) => g.seen === when).map((g) => g.key);
}

export function allGroups(kind: EntityKind): string[] {
  return FACT_GROUPS[kind].map((g) => g.key);
}
