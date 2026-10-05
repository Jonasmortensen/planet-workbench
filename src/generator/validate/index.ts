import { CONFIG } from '../config';
import { PHYSICAL_RULES } from '../rules/physical';
import type { PlanetBundle, ValidationIssue } from '../types/entities';
import { kindOf, resolveEntity, type EntityKind } from '../types/ids';

type Check = (bundle: PlanetBundle) => ValidationIssue[];

const error = (code: string, entity_ref: string, message: string): ValidationIssue => ({
  severity: 'error', code, entity_ref, message,
});
const warning = (code: string, entity_ref: string, message: string): ValidationIssue => ({
  severity: 'warning', code, entity_ref, message,
});

interface RefSite {
  from: string;
  field: string;
  id: string;
  /** If set, the ref must resolve to this kind. */
  kind?: EntityKind;
}

/** Every entity reference in the bundle. Extend as entity types gain refs. */
export function collectRefs(bundle: PlanetBundle): RefSite[] {
  const out: RefSite[] = [];
  const p = bundle.planet;
  const add = (from: string, field: string, id: string | null | undefined, kind?: EntityKind) => {
    if (id !== null && id !== undefined) out.push({ from, field, id, kind });
  };
  add(p.id, 'native_species_id', p.native_species_id, 'species');
  p.species.forEach((s, i) => add(p.id, `species[${i}].species_id`, s.species_id, 'species'));
  p.dominant_languages.forEach((l, i) => add(p.id, `dominant_languages[${i}]`, l, 'language'));
  p.dominant_religions_or_ideologies.forEach((r, i) => add(p.id, `dominant_religions_or_ideologies[${i}]`, r.religion_id, 'religion'));
  p.history.forEach((e) => e.involved_refs.forEach((r, i) => add(p.id, `history.${e.id}.involved_refs[${i}]`, r)));
  if (p.world_government) add(p.id, 'world_government.leader_npc_id', p.world_government.leader_npc_id, 'npc');
  p.rumors.forEach((r, i) => {
    add(p.id, `rumors[${i}].subject_ref`, r.subject_ref);
    add(p.id, `rumors[${i}].target_ref`, r.target_ref);
  });
  for (const l of Object.values(bundle.languages)) {
    l.speaker_species_ids.forEach((s, i) => add(l.id, `speaker_species_ids[${i}]`, s, 'species'));
  }
  for (const r of Object.values(bundle.religions)) add(r.id, 'church_org_id', r.church_org_id, 'organization');
  return out;
}

const checkRefs: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  for (const site of collectRefs(bundle)) {
    const target = resolveEntity(bundle, site.id);
    if (!target) {
      issues.push(error('ref.missing', site.from, `${site.field} points to missing entity "${site.id}"`));
    } else if (site.kind && kindOf(site.id) !== site.kind) {
      issues.push(error('ref.kind', site.from, `${site.field} should reference a ${site.kind}, got "${site.id}"`));
    }
  }
  return issues;
};

const checkIds: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const maps = [bundle.countries, bundle.settlements, bundle.organizations, bundle.npcs, bundle.species, bundle.languages, bundle.religions];
  for (const map of maps) {
    for (const [key, entity] of Object.entries(map)) {
      if ((entity as { id: string }).id !== key) issues.push(error('id.mismatch', key, `Map key "${key}" does not match entity id`));
    }
  }
  return issues;
};

const nearlyOne = (x: number) => Math.abs(x - 1) <= 0.01;

const checkShares: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const p = bundle.planet;
  const biomeSum = p.biomes.reduce((a, b) => a + b.share, 0);
  if (!nearlyOne(biomeSum)) issues.push(error('shares.biomes', p.id, `Biome shares sum to ${biomeSum.toFixed(3)}, expected 1`));
  const speciesSum = p.species.reduce((a, s) => a + s.share, 0);
  if (!nearlyOne(speciesSum)) issues.push(error('shares.species', p.id, `Species shares sum to ${speciesSum.toFixed(3)}, expected 1`));
  const religionSum = p.dominant_religions_or_ideologies.reduce((a, r) => a + r.share, 0);
  if (religionSum > 1.001) issues.push(error('shares.religions', p.id, `Religion shares sum to ${religionSum.toFixed(3)}, more than 1`));
  return issues;
};

const checkPlanetStructure: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const p = bundle.planet;
  const [cMin, cMax] = CONFIG.countryCount[p.political_structure];
  if (p.country_count < cMin || p.country_count > cMax) {
    issues.push(error('planet.country_count', p.id, `country_count ${p.country_count} outside ${cMin}-${cMax} for ${p.political_structure}`));
  }
  const needsGov = p.political_structure === 'unified' || p.political_structure === 'federation';
  if (needsGov !== (p.world_government !== null)) {
    issues.push(error('planet.world_government', p.id, `world_government must exist only for unified or federation worlds`));
  }
  if (p.tech_level < 0 || p.tech_level > 10 || !Number.isInteger(p.tech_level)) {
    issues.push(error('planet.tech_level', p.id, `tech_level ${p.tech_level} must be an integer 0-10`));
  }
  if (p.native_sapients !== (p.native_species_id !== null)) {
    issues.push(error('planet.natives', p.id, 'native_sapients and native_species_id disagree'));
  }
  const [hMin, hMax] = CONFIG.planet.historyEvents;
  if (p.history.length < hMin || p.history.length > hMax) {
    issues.push(warning('planet.history_count', p.id, `History has ${p.history.length} events, expected ${hMin}-${hMax}`));
  }
  for (let i = 1; i < p.history.length; i++) {
    if (p.history[i].date <= p.history[i - 1].date) {
      issues.push(warning('history.order', p.id, `History events are not in chronological order at ${p.history[i].id}`));
    }
  }
  return issues;
};

const checkPhysical: Check = (bundle) => {
  const p = bundle.planet;
  const recorded = new Set(p.anomalies.map((a) => a.type));
  return PHYSICAL_RULES
    .filter((r) => r.violated(p) && !recorded.has(r.anomaly))
    .map((r) => warning('physical.unrecorded', p.id, `${r.describe}, but no "${r.anomaly}" anomaly is recorded`));
};

const checkEmptyFields: Check = (bundle) => {
  const issues: ValidationIssue[] = [];
  const p = bundle.planet;
  const required: [string, unknown][] = [
    ['name', p.name], ['native_name', p.native_name], ['star_system', p.star_system], ['biomes', p.biomes],
    ['species', p.species], ['dominant_languages', p.dominant_languages], ['resources', p.resources],
    ['history', p.history],
  ];
  if (p.galactic_connectivity !== 'uncontacted') {
    required.push(['primary_exports', p.primary_exports], ['primary_imports', p.primary_imports]);
  }
  if (p.world_government) required.push(['world_government.name', p.world_government.name]);
  for (const [field, value] of required) {
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      issues.push(warning('empty.field', p.id, `Field "${field}" is empty`));
    }
  }
  p.moons.forEach((m, i) => { if (!m.name) issues.push(warning('empty.field', p.id, `Moon ${i} has no name`)); });
  p.notable_features.forEach((f, i) => { if (!f.name) issues.push(warning('empty.field', p.id, `Feature ${i} has no name`)); });
  for (const l of Object.values(bundle.languages)) if (!l.name) issues.push(warning('empty.field', l.id, 'Language has no name'));
  for (const r of Object.values(bundle.religions)) if (!r.name) issues.push(warning('empty.field', r.id, 'Religion has no name'));
  return issues;
};

/** All checks, in report order. Later milestones append to this list. */
export const CHECKS: Check[] = [checkIds, checkRefs, checkShares, checkPlanetStructure, checkPhysical, checkEmptyFields];

export function validate(bundle: PlanetBundle): ValidationIssue[] {
  return CHECKS.flatMap((check) => check(bundle));
}
