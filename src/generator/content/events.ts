import type { CurrentEventType, Mood, OrgType } from '../types/enums';
import type { WeightedDef } from './constraints';

export interface CurrentEventDef extends WeightedDef {
  /** Settlement mood multipliers. */
  moods?: Partial<Record<Mood, number>>;
  /** Organization types likely to be involved (x3 when present). */
  orgTypes?: OrgType[];
  /** How many present organizations get drawn in. */
  orgCount: [number, number];
  /** Involves another country (foreign delegations, sieges). */
  foreignCountry?: boolean;
  minSize?: number;
  /** Prefer unstable places (0 = neutral, positive = unstable, negative = stable). */
  instability?: number;
}

export const CURRENT_EVENT_TABLE: Record<CurrentEventType, CurrentEventDef> = {
  plague: { weight: 1.5, orgCount: [0, 1], orgTypes: ['church', 'mutual_aid_society', 'academy', 'monastic_order'], moods: { fearful: 3, mournful: 3, grim: 2 }, constraints: { biospheres: ['microbial', 'sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  festival: { weight: 4, orgCount: [0, 2], orgTypes: ['church', 'guild', 'noble_house', 'cult'], moods: { festive: 5, bustling: 2, decadent: 2, hopeful: 2 }, instability: -1 },
  succession_dispute: { weight: 2, orgCount: [1, 2], orgTypes: ['noble_house', 'political_party', 'criminal_syndicate'], moods: { tense: 3 }, instability: 1 },
  monster_sighting: { weight: 2, orgCount: [0, 1], orgTypes: ['military_order', 'mercenary_company', 'explorers_society'], moods: { fearful: 3 }, constraints: { biospheres: ['complex', 'lush', 'exotic', 'synthetic'] } },
  famine: { weight: 1.5, orgCount: [0, 1], orgTypes: ['mutual_aid_society', 'church', 'trade_consortium'], moods: { grim: 3, mournful: 2, defiant: 1 }, instability: 1 },
  strike: { weight: 2, orgCount: [1, 2], orgTypes: ['guild', 'corporation', 'political_party', 'mutual_aid_society'], moods: { defiant: 3, tense: 2 }, constraints: { minTech: 3 }, minSize: 2 },
  riot: { weight: 1.5, orgCount: [0, 2], orgTypes: ['rebel_movement', 'political_party', 'criminal_syndicate', 'cult'], moods: { defiant: 3, tense: 3, rowdy: 2 }, instability: 2, minSize: 3 },
  election: { weight: 2, orgCount: [1, 3], orgTypes: ['political_party', 'guild', 'corporation'], moods: { bustling: 2, tense: 1, hopeful: 2 }, constraints: { minTech: 2 } },
  trade_boom: { weight: 2.5, orgCount: [1, 2], orgTypes: ['trade_consortium', 'guild', 'corporation'], moods: { bustling: 4, hopeful: 2, decadent: 1 }, instability: -1 },
  crime_wave: { weight: 2.5, orgCount: [1, 2], orgTypes: ['criminal_syndicate', 'military_order', 'mercenary_company'], moods: { fearful: 2, tense: 2, grim: 2 }, instability: 1 },
  religious_revival: { weight: 2, orgCount: [1, 2], orgTypes: ['church', 'cult', 'monastic_order'], moods: { pious: 5, hopeful: 2 } },
  foreign_delegation: { weight: 2, orgCount: [0, 1], orgTypes: ['political_party', 'trade_consortium', 'noble_house'], foreignCountry: true, moods: { bustling: 2, tense: 1 }, minSize: 3 },
  natural_disaster: { weight: 1.5, orgCount: [0, 1], orgTypes: ['mutual_aid_society', 'church', 'military_order'], moods: { mournful: 3, grim: 2, fearful: 2 } },
  siege: { weight: 0.8, orgCount: [0, 2], orgTypes: ['military_order', 'mercenary_company', 'rebel_movement'], foreignCountry: true, moods: { militant: 4, fearful: 2, defiant: 2 }, instability: 2 },
  refugee_influx: { weight: 1.5, orgCount: [0, 1], orgTypes: ['mutual_aid_society', 'church'], moods: { tense: 2, grim: 1, hopeful: 1 }, instability: 1 },
  murder_investigation: { weight: 2.5, orgCount: [0, 2], orgTypes: ['criminal_syndicate', 'secret_society', 'noble_house', 'cult'], moods: { tense: 2, secretive: 3, fearful: 1 } },
  tournament: { weight: 2, orgCount: [1, 2], orgTypes: ['military_order', 'noble_house', 'mercenary_company', 'guild'], moods: { festive: 3, rowdy: 3, bustling: 2 }, instability: -0.5 },
  scandal: { weight: 2.5, orgCount: [1, 2], orgTypes: ['noble_house', 'political_party', 'church', 'corporation'], moods: { tense: 2, decadent: 2, secretive: 1 } },
  construction: { weight: 2.5, orgCount: [0, 1], orgTypes: ['guild', 'corporation', 'church'], moods: { bustling: 3, hopeful: 3 }, instability: -1 },
  disappearances: { weight: 2, orgCount: [0, 2], orgTypes: ['cult', 'secret_society', 'criminal_syndicate'], moods: { fearful: 4, secretive: 3, grim: 1 } },
  smuggling_crackdown: { weight: 1.5, orgCount: [1, 2], orgTypes: ['criminal_syndicate', 'military_order', 'trade_consortium'], moods: { tense: 3, militant: 2 }, minSize: 2 },
  discovery: { weight: 2, orgCount: [0, 2], orgTypes: ['academy', 'explorers_society', 'secret_society', 'corporation'], moods: { hopeful: 3, bustling: 2, secretive: 1 } },
  cult_activity: { weight: 1.5, orgCount: [1, 1], orgTypes: ['cult', 'secret_society'], moods: { fearful: 3, secretive: 3, pious: 1 } },
  protest: { weight: 2, orgCount: [1, 2], orgTypes: ['political_party', 'rebel_movement', 'mutual_aid_society', 'guild'], moods: { defiant: 4, tense: 2 }, instability: 1, constraints: { minTech: 2 } },
};

/** Current events per settlement, by settlement size (1..5). */
export const CURRENT_EVENT_COUNTS: Record<number, [number, number]> = { 1: [1, 1], 2: [1, 2], 3: [1, 2], 4: [1, 3], 5: [2, 3] };
