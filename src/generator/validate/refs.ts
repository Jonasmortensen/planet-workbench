import type { HistoricalEvent, Motive, PlanetBundle, Rumor } from '../types/entities';
import type { EntityKind } from '../types/ids';

export interface RefSite {
  /** Entity holding the reference. */
  from: string;
  /** Human-readable field path. */
  field: string;
  /** Referenced id. */
  id: string;
  /** If set, the ref must resolve to this kind. */
  kind?: EntityKind;
}

/**
 * Every entity reference in the bundle, in a stable order. Used both by the
 * validator (refs must resolve) and by the app (reverse links). Extend this
 * whenever an entity type gains a reference field.
 */
export function collectRefs(bundle: PlanetBundle): RefSite[] {
  const out: RefSite[] = [];
  const add = (from: string, field: string, id: string | null | undefined, kind?: EntityKind) => {
    if (id !== null && id !== undefined) out.push({ from, field, id, kind });
  };
  const events = (from: string, field: string, list: HistoricalEvent[]) => {
    list.forEach((e) => e.involved_refs.forEach((r) => add(from, `${field} (${e.event_type})`, r)));
  };
  const rumors = (from: string, list: Rumor[]) => {
    list.forEach((r, i) => {
      add(from, `rumors[${i}].subject_ref`, r.subject_ref);
      add(from, `rumors[${i}].target_ref`, r.target_ref);
    });
  };

  const p = bundle.planet;
  add(p.id, 'native_species_id', p.native_species_id, 'species');
  p.species.forEach((s) => add(p.id, 'species', s.species_id, 'species'));
  p.dominant_languages.forEach((l) => add(p.id, 'dominant_languages', l, 'language'));
  p.dominant_religions_or_ideologies.forEach((r) => add(p.id, 'dominant_religions_or_ideologies', r.religion_id, 'religion'));
  events(p.id, 'history', p.history);
  if (p.world_government) add(p.id, 'world_government.leader_npc_id', p.world_government.leader_npc_id, 'npc');
  rumors(p.id, p.rumors);

  for (const c of Object.values(bundle.countries)) {
    add(c.id, 'planet_id', c.planet_id, 'planet');
    add(c.id, 'capital_settlement_id', c.capital_settlement_id, 'settlement');
    c.neighbor_ids.forEach((n) => add(c.id, 'neighbor_ids', n, 'country'));
    c.species.forEach((s) => add(c.id, 'species', s.species_id, 'species'));
    c.languages.forEach((l) => add(c.id, 'languages', l, 'language'));
    c.religions_or_ideologies.forEach((r) => add(c.id, 'religions_or_ideologies', r.religion_id, 'religion'));
    add(c.id, 'ruler_npc_id', c.ruler_npc_id, 'npc');
    c.relations.forEach((r) => add(c.id, `relations (${r.attitude})`, r.target_ref));
    events(c.id, 'key_events', c.key_events);
    rumors(c.id, c.rumors);
  }

  for (const s of Object.values(bundle.settlements)) {
    add(s.id, 'country_id', s.country_id, 'country');
    s.connections.forEach((c) => add(s.id, `connections (${c.link_type})`, c.settlement_id, 'settlement'));
    s.species.forEach((x) => add(s.id, 'species', x.species_id, 'species'));
    s.languages.forEach((l) => add(s.id, 'languages', l, 'language'));
    s.religions_or_ideologies.forEach((r) => add(s.id, 'religions_or_ideologies', r.religion_id, 'religion'));
    add(s.id, 'leader_npc_id', s.leader_npc_id, 'npc');
    s.points_of_interest.forEach((poi) => add(s.id, `points_of_interest.${poi.id}.owner_npc_id`, poi.owner_npc_id, 'npc'));
    s.current_events.forEach((e) => e.involved_refs.forEach((r) => add(s.id, `current_events (${e.type})`, r)));
    s.organizations_present.forEach((o) => add(s.id, 'organizations_present', o, 'organization'));
    events(s.id, 'key_events', s.key_events);
    rumors(s.id, s.rumors);
  }

  const motive = (from: string, field: string, m: Motive<string> | null) => {
    if (!m) return;
    add(from, `${field}.target_npc_id`, m.target_npc_id, 'npc');
    add(from, `${field}.target_org_id`, m.target_org_id, 'organization');
    add(from, `${field}.target_settlement_id`, m.target_settlement_id, 'settlement');
    add(from, `${field}.target_country_id`, m.target_country_id, 'country');
  };

  for (const o of Object.values(bundle.organizations)) {
    add(o.id, 'home_ref', o.home_ref);
    add(o.id, 'headquarters_settlement_id', o.headquarters_settlement_id, 'settlement');
    o.presence.forEach((x) => add(o.id, `presence (${x.strength})`, x.settlement_id, 'settlement'));
    add(o.id, 'leader_npc_id', o.leader_npc_id, 'npc');
    add(o.id, 'religion_id', o.religion_id, 'religion');
    motive(o.id, 'stated_goal', o.stated_goal);
    motive(o.id, 'true_goal', o.true_goal);
    o.relations.forEach((r) => add(o.id, `relations (${r.attitude})`, r.target_ref));
    o.member_npc_ids.forEach((m) => add(o.id, 'member_npc_ids', m, 'npc'));
    events(o.id, 'key_events', o.key_events);
    rumors(o.id, o.rumors);
  }

  for (const n of Object.values(bundle.npcs)) {
    add(n.id, 'settlement_id', n.settlement_id, 'settlement');
    add(n.id, 'species_id', n.species_id, 'species');
    add(n.id, 'language_id', n.language_id, 'language');
    n.leads.forEach((l) => add(n.id, `leads (${l.entity_type})`, l.entity_id));
    motive(n.id, 'goal', n.goal);
    motive(n.id, 'fear', n.fear);
    motive(n.id, 'secret', n.secret);
    n.organization_ids.forEach((o) => add(n.id, 'organization_ids', o, 'organization'));
    add(n.id, 'religion_or_ideology', n.religion_or_ideology, 'religion');
    add(n.id, 'allegiance_ref', n.allegiance_ref);
    n.relationships.forEach((r) => add(n.id, `relationships (${r.type})`, r.npc_id, 'npc'));
    n.quest_hooks.forEach((h) => h.target_refs.forEach((t) => add(n.id, `quest_hooks (${h.type})`, t)));
    rumors(n.id, n.rumors_about);
    events(n.id, 'key_life_events', n.key_life_events);
  }

  for (const l of Object.values(bundle.languages)) {
    l.speaker_species_ids.forEach((s) => add(l.id, 'speaker_species_ids', s, 'species'));
  }
  for (const r of Object.values(bundle.religions)) add(r.id, 'church_org_id', r.church_org_id, 'organization');
  return out;
}

/** All historical events in the bundle, keyed by id. */
export function eventIndex(bundle: PlanetBundle): Map<string, HistoricalEvent> {
  const map = new Map<string, HistoricalEvent>();
  for (const e of bundle.planet.history) map.set(e.id, e);
  for (const c of Object.values(bundle.countries)) for (const e of c.key_events) map.set(e.id, e);
  for (const s of Object.values(bundle.settlements)) for (const e of s.key_events) map.set(e.id, e);
  for (const o of Object.values(bundle.organizations)) for (const e of o.key_events) map.set(e.id, e);
  for (const n of Object.values(bundle.npcs)) for (const e of n.key_life_events) map.set(e.id, e);
  return map;
}
