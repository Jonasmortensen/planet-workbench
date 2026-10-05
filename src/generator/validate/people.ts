import { CONFIG } from '../config';
import { livesNear, slotTier } from '../rules/leadership';
import type { LeadEntry, Npc, PlanetBundle, ValidationIssue } from '../types/entities';
import { RELATIONSHIP_INVERSE } from '../types/enums';
import { PLANET_ID } from '../types/ids';

type Check = (bundle: PlanetBundle) => ValidationIssue[];

const error = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'error', code, entity_ref, message });
const warning = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'warning', code, entity_ref, message });

/** Every leadership slot with the NPC id it records. */
function slots(bundle: PlanetBundle): { entry: Omit<LeadEntry, 'public'>; holder: string | null; label: string }[] {
  const out: { entry: Omit<LeadEntry, 'public'>; holder: string | null; label: string }[] = [];
  if (bundle.planet.world_government) {
    out.push({ entry: { entity_type: 'world_government', entity_id: PLANET_ID }, holder: bundle.planet.world_government.leader_npc_id, label: 'world government' });
  }
  for (const c of Object.values(bundle.countries)) out.push({ entry: { entity_type: 'country', entity_id: c.id }, holder: c.ruler_npc_id, label: `ruler of ${c.id}` });
  for (const s of Object.values(bundle.settlements)) out.push({ entry: { entity_type: 'settlement', entity_id: s.id }, holder: s.leader_npc_id, label: `leader of ${s.id}` });
  for (const o of Object.values(bundle.organizations)) out.push({ entry: { entity_type: 'organization', entity_id: o.id }, holder: o.leader_npc_id, label: `leader of ${o.id}` });
  return out;
}

const sameSlot = (a: Omit<LeadEntry, 'public'>, b: Omit<LeadEntry, 'public'>) => a.entity_type === b.entity_type && a.entity_id === b.entity_id;

export const checkLeadership: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const npcs = Object.values(bundle.npcs);
  for (const slot of slots(bundle)) {
    const ref = slot.entry.entity_id;
    if (!slot.holder) {
      issues.push(error('leadership.empty', ref, `No NPC fills the ${slot.label} slot`));
      continue;
    }
    const holder = bundle.npcs[slot.holder];
    if (holder && !holder.leads.some((l) => sameSlot(l, slot.entry))) {
      issues.push(error('leadership.leads', holder.id, `${holder.id} holds the ${slot.label} slot but its leads does not include it`));
    }
    const claimants = npcs.filter((n) => n.leads.some((l) => sameSlot(l, slot.entry)));
    if (claimants.length > 1) {
      issues.push(error('leadership.multiple', ref, `${claimants.length} NPCs claim the ${slot.label} slot: ${claimants.map((n) => n.id).join(', ')}`));
    }
  }
  const all = slots(bundle);
  for (const n of npcs) {
    if (n.leads.length > CONFIG.leaders.maxLeads) issues.push(error('leadership.too_many', n.id, `NPC has ${n.leads.length} leads entries (max ${CONFIG.leaders.maxLeads})`));
    for (const l of n.leads) {
      const slot = all.find((s) => sameSlot(s.entry, l));
      if (!slot) issues.push(error('leadership.unknown', n.id, `leads entry ${l.entity_type}:${l.entity_id} is not a leadership slot`));
      else if (slot.holder !== n.id) issues.push(error('leadership.leads', n.id, `NPC lists ${slot.label} in leads, but the slot records ${slot.holder}`));
    }
    if (n.npc_category === 'leader' && n.leads.length === 0) issues.push(error('leadership.category', n.id, 'NPC is a leader with no leads entries'));
    if (n.npc_category === 'notable' && n.leads.length > 0) issues.push(error('leadership.category', n.id, 'Notable NPC has leads entries'));
  }
  return issues;
};

/** Warnings about how leadership was assigned. */
export const checkLeadershipFit: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const n of Object.values(bundle.npcs)) {
    for (const l of n.leads) {
      if (!l.public && !(n.secret?.type === 'secret_leadership' && n.secret.target_org_id === l.entity_id)) {
        issues.push(warning('leadership.secret', n.id, `Hidden leadership of ${l.entity_id} has no matching secret`));
      }
    }
    if (n.leads.length > 1) {
      // Automatic combinations (state organizations, a unified world's ruler) are exempt from the scope rule.
      const ordinary = n.leads.filter((l) => !(l.entity_type === 'organization' && bundle.organizations[l.entity_id].state_role !== 'none')
        && !(l.entity_type === 'world_government' && bundle.planet.political_structure === 'unified'));
      const tiers = ordinary.map((l) => slotTier(bundle, { kind: l.entity_type, entityId: l.entity_id }));
      if (tiers.length > 1 && Math.max(...tiers) - Math.min(...tiers) > 2) {
        issues.push(warning('leadership.scope', n.id, `Leadership roles span incompatible scopes (tiers ${tiers.join(', ')})`));
      }
    }
  }
  for (const c of Object.values(bundle.countries)) {
    const ruler = c.ruler_npc_id ? bundle.npcs[c.ruler_npc_id] : null;
    if (ruler && ruler.settlement_id !== c.capital_settlement_id && bundle.planet.political_structure !== 'unified') {
      issues.push(warning('leadership.residence', c.id, `Ruler ${ruler.id} does not live in the capital`));
    }
  }
  for (const o of Object.values(bundle.organizations)) {
    const leader = o.leader_npc_id ? bundle.npcs[o.leader_npc_id] : null;
    if (leader && !o.presence.some((p) => livesNear(bundle, leader, p.settlement_id)) && o.state_role === 'none') {
      issues.push(warning('leadership.residence', o.id, `Leader ${leader.id} lives neither in nor near a settlement where the organization is present`));
    }
  }
  return issues;
};

export const checkOrganizations: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const o of Object.values(bundle.organizations)) {
    const places = o.presence.map((p) => p.settlement_id);
    if (!places.includes(o.headquarters_settlement_id)) issues.push(error('org.presence', o.id, 'Headquarters is not in the presence list'));
    if (new Set(places).size !== places.length) issues.push(error('org.presence', o.id, 'Presence lists a settlement twice'));
    if (o.scope_level === 'settlement' && places.some((p) => p !== o.home_ref)) {
      issues.push(error('org.scope', o.id, 'Settlement-scope organization operates outside its home settlement'));
    }
    if (o.scope_level === 'country' && places.some((p) => bundle.settlements[p]?.country_id !== o.home_ref)) {
      issues.push(error('org.scope', o.id, 'Country-scope organization operates outside its home country'));
    }
    for (const p of places) {
      if (!bundle.settlements[p]?.organizations_present.includes(o.id)) issues.push(error('org.present', o.id, `${p} does not list this organization in organizations_present`));
    }
    for (const m of o.member_npc_ids) {
      if (!bundle.npcs[m]?.organization_ids.includes(o.id)) issues.push(error('org.members', o.id, `Member ${m} does not list this organization`));
    }
    if (o.leader_npc_id && !o.member_npc_ids.includes(o.leader_npc_id)) issues.push(error('org.members', o.id, 'Leader is not a member'));
    if (o.religion_id && !['church', 'cult', 'monastic_order'].includes(o.org_type)) issues.push(warning('org.religion', o.id, `${o.org_type} serves a faith`));
  }
  for (const s of Object.values(bundle.settlements)) {
    for (const oid of s.organizations_present) {
      if (!bundle.organizations[oid]?.presence.some((p) => p.settlement_id === s.id)) {
        issues.push(error('org.present', s.id, `organizations_present lists ${oid}, which has no presence here`));
      }
    }
  }
  for (const r of Object.values(bundle.religions)) {
    if (r.church_org_id && bundle.organizations[r.church_org_id]?.religion_id !== r.id) {
      issues.push(error('religion.church', r.id, `church_org_id ${r.church_org_id} does not serve this faith`));
    }
  }
  for (const n of Object.values(bundle.npcs)) {
    for (const oid of n.organization_ids) {
      if (!bundle.organizations[oid]?.member_npc_ids.includes(n.id)) issues.push(error('org.members', n.id, `Organization ${oid} does not list this NPC as a member`));
    }
  }
  return issues;
};

export const checkNpcLinks: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const events = new Map<string, { settlement: string; refs: string[] }>();
  for (const s of Object.values(bundle.settlements)) for (const e of s.current_events) events.set(e.id, { settlement: s.id, refs: e.involved_refs });
  for (const n of Object.values(bundle.npcs)) {
    for (const rel of n.relationships) {
      const other = bundle.npcs[rel.npc_id];
      const back = other?.relationships.find((x) => x.npc_id === n.id);
      if (other && (!back || back.type !== RELATIONSHIP_INVERSE[rel.type] || back.note_key !== rel.note_key)) {
        issues.push(error('symmetry.relationships', n.id, `Relationship with ${rel.npc_id} (${rel.type}) is not mirrored as ${RELATIONSHIP_INVERSE[rel.type]}`));
      }
      if (rel.npc_id === n.id) issues.push(error('symmetry.relationships', n.id, 'NPC has a relationship with itself'));
    }
    if (n.current_event_involvement) {
      const e = events.get(n.current_event_involvement);
      if (!e) issues.push(error('ref.current_event', n.id, `current_event_involvement points to missing event ${n.current_event_involvement}`));
      else if (!e.refs.includes(n.id)) issues.push(error('ref.current_event', n.id, `Event ${n.current_event_involvement} does not list this NPC`));
    }
    if (n.workplace_poi_id && !bundle.settlements[n.settlement_id]?.points_of_interest.some((p) => p.id === n.workplace_poi_id)) {
      issues.push(error('ref.poi', n.id, `workplace_poi_id ${n.workplace_poi_id} is not in the NPC's home settlement`));
    }
    const lifespan = bundle.species[n.species_id]?.lifespan_years ?? Infinity;
    if (n.age > lifespan * 1.2) issues.push(warning('npc.age', n.id, `Age ${n.age} far exceeds the species lifespan of ${lifespan}`));
    for (const rel of n.relationships.filter((r) => r.type === 'parent')) {
      const parent = bundle.npcs[rel.npc_id];
      if (parent && parent.age <= n.age) issues.push(warning('npc.family', n.id, `Parent ${parent.id} is not older than their child`));
    }
  }
  for (const [id, e] of events) {
    for (const ref of e.refs.filter((x) => x.startsWith('npc_'))) {
      if (bundle.npcs[ref]?.current_event_involvement !== id) issues.push(error('ref.current_event', e.settlement, `Event ${id} lists ${ref}, who is not involved in it`));
    }
  }
  for (const s of Object.values(bundle.settlements)) {
    for (const poi of s.points_of_interest) {
      const owner = poi.owner_npc_id ? bundle.npcs[poi.owner_npc_id] : null;
      if (owner && owner.settlement_id !== s.id) issues.push(warning('poi.owner', s.id, `${poi.id} is owned by ${owner.id}, who lives elsewhere`));
    }
  }
  return issues;
};

export const checkOrgSymmetry: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const o of Object.values(bundle.organizations)) {
    for (const r of o.relations) {
      const other = bundle.organizations[r.target_ref] ?? bundle.countries[r.target_ref];
      const back = other?.relations.find((x) => x.target_ref === o.id);
      if (other && (!back || back.attitude !== r.attitude)) {
        issues.push(error('symmetry.relations', o.id, `Relation with ${r.target_ref} (${r.attitude}) is not mirrored`));
      }
    }
  }
  return issues;
};

export function requiredNpcFields(n: Npc): [string, unknown][] {
  return [
    ['name', n.name], ['given_name', n.given_name], ['appearance', n.appearance], ['traits', n.traits], ['values', n.values],
    ['skills', n.skills], ['possessions', n.possessions], ['key_life_events', n.key_life_events],
  ];
}
