import type { EventOutcome, HistoricalEventType } from '../types/enums';
import type { Constraints } from './constraints';

export type EventScope = 'planet' | 'country' | 'settlement' | 'organization' | 'npc';

export interface HistoricalEventDef {
  /** Weight per scope; missing scope means the event never occurs at that scope. */
  weights: Partial<Record<EventScope, number>>;
  outcomes: Partial<Record<EventOutcome, number>>;
  constraints?: Constraints;
  /** Event can only happen once per timeline (e.g. colonization). */
  unique?: boolean;
}

const WAR_OUTCOMES = { victory: 3, defeat: 2, stalemate: 2, devastation: 2, subjugation: 1, division: 1 };

export const HISTORICAL_EVENT_TABLE: Record<HistoricalEventType, HistoricalEventDef> = {
  war: { weights: { planet: 6, country: 6, settlement: 2, organization: 1 }, outcomes: WAR_OUTCOMES },
  civil_war: { weights: { planet: 2, country: 3, settlement: 1 }, outcomes: { victory: 2, division: 3, devastation: 2, reform: 1 } },
  founding: {
    weights: { country: 0, settlement: 0, organization: 0 }, unique: true,
    outcomes: { prosperity: 3, survival: 3, independence: 2 },
  },
  colonization: {
    weights: { planet: 0 }, unique: true, constraints: { requiresColonists: true },
    outcomes: { survival: 4, prosperity: 2, devastation: 1 },
  },
  disaster: { weights: { planet: 4, country: 3, settlement: 4, organization: 1 }, outcomes: { devastation: 4, recovery: 3, exodus: 1, survival: 2 } },
  discovery: { weights: { planet: 3, country: 2, settlement: 2, organization: 3, npc: 2 }, outcomes: { prosperity: 3, transformation: 3, unresolved: 2 } },
  revolution: { weights: { planet: 2, country: 3, settlement: 1, organization: 1 }, outcomes: { reform: 3, victory: 2, defeat: 2, transformation: 2 } },
  treaty: { weights: { planet: 3, country: 4, organization: 2 }, outcomes: { unification: 2, prosperity: 2, stalemate: 2, independence: 1 } },
  plague: { weights: { planet: 3, country: 2, settlement: 3 }, outcomes: { devastation: 4, recovery: 3, decline: 2, exodus: 1 } },
  contact: {
    weights: { planet: 3, country: 1 }, unique: true, constraints: { requiresColonists: true, requiresNatives: true },
    outcomes: { transformation: 4, prosperity: 2, subjugation: 2, devastation: 1 },
  },
  collapse: { weights: { planet: 2, country: 2, organization: 1 }, outcomes: { devastation: 3, decline: 4, division: 2 } },
  golden_age: { weights: { planet: 3, country: 3, settlement: 2, organization: 2 }, outcomes: { prosperity: 6, transformation: 2 } },
  invasion: { weights: { planet: 2, country: 3, settlement: 2 }, outcomes: { defeat: 2, victory: 2, subjugation: 3, devastation: 2 } },
  migration: { weights: { planet: 3, country: 2, settlement: 2 }, outcomes: { transformation: 3, prosperity: 2, division: 1 } },
  famine: { weights: { planet: 2, country: 2, settlement: 3 }, outcomes: { devastation: 3, recovery: 2, exodus: 2, decline: 2 } },
  schism: { weights: { planet: 2, country: 2, organization: 3 }, outcomes: { division: 5, reform: 2, unresolved: 1 } },
  unification: { weights: { planet: 2, country: 2 }, outcomes: { unification: 6, prosperity: 1 } },
  secession: { weights: { planet: 1, country: 2, settlement: 1, organization: 1 }, outcomes: { independence: 4, defeat: 2, division: 2 } },
  assassination: { weights: { planet: 1, country: 3, settlement: 1, organization: 2 }, outcomes: { transformation: 2, division: 2, unresolved: 3 } },
  coup: { weights: { country: 3, settlement: 1, organization: 2 }, outcomes: { victory: 3, defeat: 2, transformation: 2 } },
  reform: { weights: { planet: 1, country: 3, settlement: 2, organization: 3 }, outcomes: { reform: 6, prosperity: 1 } },
  exodus: { weights: { planet: 1, country: 1, settlement: 1 }, outcomes: { exodus: 6, decline: 2 } },
  awakening: {
    weights: { planet: 1.5, country: 0.5, organization: 0.5 }, constraints: { requiresPrecursors: true },
    outcomes: { transformation: 4, devastation: 1, prosperity: 2, unresolved: 2 },
  },
  cataclysm: { weights: { planet: 1.5 }, outcomes: { devastation: 6, exodus: 2, transformation: 1 } },
  renaissance: { weights: { planet: 2, country: 2, settlement: 1, organization: 1 }, outcomes: { prosperity: 3, transformation: 4 } },
  uprising: { weights: { planet: 1, country: 2, settlement: 3, organization: 1 }, outcomes: { victory: 2, defeat: 3, reform: 2 } },
  trade_boom: { weights: { planet: 2, country: 2, settlement: 3, organization: 3 }, outcomes: { prosperity: 6, transformation: 1 } },
  persecution: { weights: { planet: 1, country: 2, settlement: 2, organization: 3 }, outcomes: { exodus: 2, defeat: 2, survival: 3, devastation: 1 } },
  miracle: { weights: { planet: 0.5, settlement: 1, organization: 1, npc: 0.3 }, outcomes: { transformation: 3, unresolved: 3, prosperity: 1 } },
  // Personal life events
  birth: { weights: { npc: 0 }, unique: true, outcomes: { survival: 1 } },
  apprenticeship: { weights: { npc: 4 }, outcomes: { prosperity: 2, survival: 1 } },
  marriage: { weights: { npc: 3 }, outcomes: { prosperity: 2, division: 1, unification: 1 } },
  loss: { weights: { npc: 3 }, outcomes: { devastation: 2, survival: 2, transformation: 1 } },
  exile: { weights: { npc: 1.5 }, outcomes: { exodus: 2, survival: 2 } },
  promotion: { weights: { npc: 3 }, outcomes: { victory: 1, prosperity: 2 } },
  crime: { weights: { npc: 1.5 }, outcomes: { victory: 1, defeat: 1, unresolved: 2 } },
  journey: { weights: { npc: 2 }, outcomes: { transformation: 2, survival: 1, prosperity: 1 } },
  conversion: { weights: { npc: 1 }, outcomes: { transformation: 3 } },
  injury: { weights: { npc: 1.5 }, outcomes: { survival: 3, decline: 1 } },
};
