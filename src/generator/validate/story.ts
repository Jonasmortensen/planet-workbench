import { allRumors, rumorTruth } from '../rules/rumors';
import type { PlanetBundle, ValidationIssue } from '../types/entities';

type Check = (bundle: PlanetBundle) => ValidationIssue[];

const error = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'error', code, entity_ref, message });
const warning = (code: string, entity_ref: string, message: string): ValidationIssue => ({ severity: 'warning', code, entity_ref, message });

/** Rumors: each lives on its subject, and is_true matches what the data says. */
export const checkRumors: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const { holder, rumor } of allRumors(bundle)) {
    if (rumor.subject_ref !== holder) issues.push(error('rumor.subject', holder, `Rumor about ${rumor.subject_ref} is stored on ${holder}`));
    const truth = rumorTruth(bundle, rumor.subject_ref, rumor.claim_type);
    if (rumor.is_true !== (truth !== null)) {
      issues.push(error('rumor.truth', holder, `Rumor "${rumor.claim_type}" is marked ${rumor.is_true ? 'true' : 'false'} but the data says ${truth ? 'true' : 'false'}`));
    } else if (truth && rumor.target_ref !== truth.target) {
      issues.push(error('rumor.target', holder, `True rumor "${rumor.claim_type}" targets ${rumor.target_ref}, expected ${truth.target}`));
    }
  }
  return issues;
};

/** Motives and hooks: present, and coherent with allegiances. */
export const checkMotives: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const n of Object.values(bundle.npcs)) {
    if (!n.goal) issues.push(warning('motive.missing', n.id, 'NPC has no goal'));
    if (!n.fear) issues.push(warning('motive.missing', n.id, 'NPC has no fear'));
    if (n.quest_hooks.length < 1 || n.quest_hooks.length > 2) issues.push(warning('hook.count', n.id, `NPC has ${n.quest_hooks.length} quest hooks, expected 1-2`));
    for (const h of n.quest_hooks) if (h.target_refs.length === 0) issues.push(error('hook.target', n.id, `Quest hook "${h.type}" has no targets`));
    if (n.secret?.type === 'double_agent' && n.allegiance_ref !== n.secret.target_country_id) {
      issues.push(error('secret.allegiance', n.id, 'Double agent whose allegiance does not match the country they spy for'));
    }
    if (n.allegiance_ref && n.allegiance_ref !== bundle.settlements[n.settlement_id].country_id && n.secret?.type !== 'double_agent' && !n.allegiance_ref.startsWith('org_')) {
      issues.push(warning('secret.allegiance', n.id, 'Allegiance to a foreign country without a matching secret'));
    }
  }
  return issues;
};

const ARTIFACT = /[{}<>[\]]|undefined|null|NaN|\s{2}|\s[,.]/;

/** Prose: every rendered field is filled and free of template artifacts. */
export const checkProse: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const check = (id: string, field: string, text: string) => {
    if (!text) issues.push(warning('prose.empty', id, `${field} is empty`));
    else if (ARTIFACT.test(text)) issues.push(error('prose.artifact', id, `${field} contains a template artifact: "${text.match(ARTIFACT)![0]}"`));
  };
  const p = bundle.planet;
  check(p.id, 'tagline', p.tagline);
  check(p.id, 'description', p.description);
  for (const c of Object.values(bundle.countries)) { check(c.id, 'tagline', c.tagline); check(c.id, 'description', c.description); }
  for (const s of Object.values(bundle.settlements)) {
    check(s.id, 'tagline', s.tagline);
    check(s.id, 'description', s.description);
    s.districts.forEach((d, i) => check(s.id, `districts[${i}].description`, d.description));
    s.points_of_interest.forEach((poi) => check(s.id, `${poi.id}.description`, poi.description));
  }
  for (const o of Object.values(bundle.organizations)) { check(o.id, 'tagline', o.tagline); check(o.id, 'description', o.description); }
  for (const n of Object.values(bundle.npcs)) {
    check(n.id, 'tagline', n.tagline);
    check(n.id, 'description', n.description);
    check(n.id, 'backstory', n.backstory);
    check(n.id, 'sample_greeting', n.sample_greeting);
    // Hidden leadership must never leak into prose.
    for (const l of n.leads.filter((x) => !x.public)) {
      const org = bundle.organizations[l.entity_id];
      if ([n.tagline, n.description, n.backstory, n.sample_greeting].some((t) => t.includes(org.name))) {
        issues.push(error('prose.leak', n.id, `Prose mentions ${org.name}, which ${n.id} leads in secret`));
      }
    }
  }
  for (const o of Object.values(bundle.organizations)) {
    const lead = o.leader_npc_id ? bundle.npcs[o.leader_npc_id].leads.find((l) => l.entity_id === o.id) : null;
    if (lead && !lead.public && [o.tagline, o.description].some((t) => t.includes(bundle.npcs[o.leader_npc_id!].name))) {
      issues.push(error('prose.leak', o.id, 'Prose names the secret leader'));
    }
  }
  return issues;
};

