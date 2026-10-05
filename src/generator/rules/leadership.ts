import { CONFIG } from '../config';
import { SETTLEMENT_TYPE_TABLE } from '../content';
import type { LeadEntry, Npc, PlanetBundle } from '../types/entities';
import type { LeadEntityType } from '../types/enums';

/**
 * Leadership overlap rules, shared by the leaders step, the validator and tests.
 *
 * Every leadership slot has a tier describing its reach. An NPC may take on
 * an extra role only if the new slot's tier is within one step of the
 * highest tier they already hold, so a village mayor never leads a
 * planet-wide corporation and a country's ruler never runs a village guild.
 */

export interface SlotRef {
  kind: LeadEntityType;
  entityId: string;
}

/** Reach of a leadership slot: 5 world government .. 1 village-level. */
export function slotTier(bundle: PlanetBundle, slot: SlotRef): number {
  switch (slot.kind) {
    case 'world_government':
      return 5;
    case 'country':
      return 4;
    case 'settlement': {
      const size = SETTLEMENT_TYPE_TABLE[bundle.settlements[slot.entityId].settlement_type].size;
      return size === 5 ? 3 : size === 4 ? 2.5 : size === 3 ? 2 : 1;
    }
    case 'organization': {
      const o = bundle.organizations[slot.entityId];
      if (o.scope_level === 'planet') return 4;
      if (o.scope_level === 'country') return 3;
      const size = SETTLEMENT_TYPE_TABLE[bundle.settlements[o.home_ref].settlement_type].size;
      return size >= 4 ? 2 : 1.5;
    }
  }
}

export function npcTier(bundle: PlanetBundle, npc: Pick<Npc, 'leads'>): number {
  return Math.max(0, ...npc.leads.map((l) => slotTier(bundle, { kind: l.entity_type, entityId: l.entity_id })));
}

export function scopesCompatible(bundle: PlanetBundle, npc: Pick<Npc, 'leads'>, slot: SlotRef): boolean {
  if (npc.leads.length === 0) return true;
  return Math.abs(slotTier(bundle, slot) - npcTier(bundle, npc)) <= 1;
}

/** Same settlement or directly connected to it. */
export function livesNear(bundle: PlanetBundle, npc: Pick<Npc, 'settlement_id'>, settlementId: string): boolean {
  if (npc.settlement_id === settlementId) return true;
  return bundle.settlements[settlementId]?.connections.some((c) => c.settlement_id === npc.settlement_id) ?? false;
}

/** Whether a slot's leadership must be hidden (secret or outlawed organizations). */
export function isHiddenSlot(bundle: PlanetBundle, slot: SlotRef): boolean {
  if (slot.kind !== 'organization') return false;
  const o = bundle.organizations[slot.entityId];
  return o.visibility === 'secret' || o.legality === 'outlawed';
}

export function hasHiddenRole(npc: Pick<Npc, 'leads'>): boolean {
  return npc.leads.some((l) => !l.public);
}

/**
 * Whether an existing leader may be reused for a slot (the 10 to 15% overlap
 * roll): lives in or near the slot's seat (rulers: in it), compatible scope, fewer than 3
 * roles, not already leading this entity, and at most one hidden role.
 */
export function canReuseLeader(bundle: PlanetBundle, npc: Npc, slot: SlotRef, seatSettlementId: string): boolean {
  if (npc.leads.length >= CONFIG.leaders.maxLeads) return false;
  if (npc.leads.some((l) => l.entity_id === slot.entityId && l.entity_type === slot.kind)) return false;
  // One settlement per leader: nobody is mayor of two towns.
  if (slot.kind === 'settlement' && npc.leads.some((l) => l.entity_type === 'settlement')) return false;
  // Rulers live in their capital (or the world government's seat); other slots accept a neighbor.
  const strict = slot.kind === 'country' || slot.kind === 'world_government';
  if (strict ? npc.settlement_id !== seatSettlementId : !livesNear(bundle, npc, seatSettlementId)) return false;
  if (!scopesCompatible(bundle, npc, slot)) return false;
  // One secret slot per NPC, so the single `secret` field can always describe it.
  if (isHiddenSlot(bundle, slot) && hasHiddenRole(npc)) return false;
  return true;
}

export function leadEntry(bundle: PlanetBundle, slot: SlotRef): LeadEntry {
  return { entity_type: slot.kind, entity_id: slot.entityId, public: !isHiddenSlot(bundle, slot) };
}
