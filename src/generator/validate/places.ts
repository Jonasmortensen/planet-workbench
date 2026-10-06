import { isSurprising, needsSubject, treasureFits } from '../rules/places';
import type { PlanetBundle, ValidationIssue } from '../types/entities';

type Check = (bundle: PlanetBundle) => ValidationIssue[];

const error = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'error', code, entity_ref, message });
const warning = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'warning', code, entity_ref, message });

/** Every NPC is somewhere in their home settlement, and every place has someone in it. */
export const checkPlaces: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const occupied = new Set<string>();
  for (const n of Object.values(bundle.npcs)) {
    const poi = bundle.pois[n.location_poi_id];
    if (!poi) {
      issues.push(error('npc.location', n.id, `location_poi_id "${n.location_poi_id}" is not a point of interest`));
      continue;
    }
    occupied.add(poi.id);
    if (poi.settlement_id !== n.settlement_id) {
      issues.push(error('npc.location_settlement', n.id, `Located at ${poi.id} in ${poi.settlement_id}, but lives in ${n.settlement_id}`));
    }
    if (isSurprising(n.location_reason) && !n.location_reason_ref) {
      issues.push(warning('npc.location_reason', n.id, `Surprising location (${n.location_reason}) has no location_reason_ref explaining it`));
    }
  }
  for (const poi of Object.values(bundle.pois)) {
    if (!occupied.has(poi.id)) issues.push(error('poi.empty', poi.id, 'No NPC can be found here'));
  }
  return issues;
};

/** Every place holds treasure; every treasure has a holder and, where needed, a subject. */
export const checkTreasures: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const held = new Set<string>();
  for (const t of Object.values(bundle.treasures)) {
    if ('poi_id' in t.holder) {
      const poi = bundle.pois[t.holder.poi_id];
      if (!poi) issues.push(error('treasure.holder', t.id, `Held at missing point of interest "${t.holder.poi_id}"`));
      else {
        held.add(poi.id);
        if (!treasureFits(poi.type, t.category)) issues.push(warning('treasure.fit', t.id, `A ${t.category} treasure does not fit a ${poi.type}`));
      }
    } else if (!bundle.npcs[t.holder.npc_id]) {
      issues.push(error('treasure.holder', t.id, `Held by missing NPC "${t.holder.npc_id}"`));
    }
    if (needsSubject(t.category) && t.subject_refs.length === 0) {
      issues.push(error('treasure.subject', t.id, `A ${t.category} treasure must name what it is about (subject_refs)`));
    }
  }
  for (const poi of Object.values(bundle.pois)) {
    if (!held.has(poi.id)) issues.push(error('poi.treasures', poi.id, 'Holds no treasures of its own'));
  }
  return issues;
};
