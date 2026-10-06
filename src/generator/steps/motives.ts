import { CONFIG } from '../config';
import type { Rng } from '../rng';
import { CLAIMS_BY_KIND, rumorTruth } from '../rules/rumors';
import type { Country, Motive, Npc, PlanetBundle, QuestHook, Rumor } from '../types/entities';
import {
  MOTIVE_REASONS, WEALTH_LEVELS,
  type FearType, type GoalType, type MotiveReason, type QuestType, type RewardType, type SecretType,
} from '../types/enums';
import { kindOf } from '../types/ids';
import { makeMotive, type MotiveTargets } from './organizations';
import { link } from './relationships';
import { biased } from './util';

/**
 * Pipeline step 10: motives and hooks. Secrets first (goals and fears can
 * depend on them), then goals, fears, quest hooks, and finally rumors, whose
 * truth is judged against everything else (rules/rumors.ts).
 * Every motive and hook points at real entities in the bundle.
 */
export function generateMotivesStep(bundle: PlanetBundle, rng: Rng): void {
  const ctx = new MotiveContext(bundle);
  for (const n of Object.values(bundle.npcs)) assignSecret(ctx, rng.fork(`secret:${n.id}`), n);
  for (const n of Object.values(bundle.npcs)) n.goal = chooseGoal(ctx, rng.fork(`goal:${n.id}`), n);
  for (const n of Object.values(bundle.npcs)) n.fear = chooseFear(ctx, rng.fork(`fear:${n.id}`), n);
  for (const n of Object.values(bundle.npcs)) n.quest_hooks = questHooks(ctx, rng.fork(`hooks:${n.id}`), n);
  generateRumors(bundle, rng.fork('rumors'));
}

type Target = MotiveTargets;
type Option<T extends string> = { type: T; weight: number; target?: Target };

/** Lookups shared by the motive builders. */
class MotiveContext {
  readonly locals = new Map<string, Npc[]>();
  constructor(readonly b: PlanetBundle) {
    for (const n of Object.values(b.npcs)) {
      const list = this.locals.get(n.settlement_id) ?? [];
      list.push(n);
      this.locals.set(n.settlement_id, list);
    }
  }
  country(n: Npc): Country {
    return this.b.countries[this.b.settlements[n.settlement_id].country_id];
  }
  related(n: Npc, ...types: string[]): Npc[] {
    return n.relationships.filter((r) => types.includes(r.type)).map((r) => this.b.npcs[r.npc_id]);
  }
  orgsHere(n: Npc) {
    return this.b.settlements[n.settlement_id].organizations_present.map((id) => this.b.organizations[id]);
  }
  foes(country: Country): Country[] {
    return country.relations.filter((r) => r.target_ref in this.b.countries && ['rival', 'hostile', 'at_war'].includes(r.attitude)).map((r) => this.b.countries[r.target_ref]);
  }
  hasEvent(n: Npc, type: string): boolean {
    return this.b.settlements[n.settlement_id].current_events.some((e) => e.type === type);
  }
}

function pickOption<T extends string>(rng: Rng, options: Option<T>[]): Option<T> {
  return rng.weighted(options.filter((o) => o.weight > 0).map((o) => ({ value: o, weight: o.weight })));
}

const FEAR_REASONS: Partial<Record<FearType, Partial<Record<MotiveReason, number>>>> = {
  exposure: { guilt: 4, fear: 2, debt: 1 },
  death: { fear: 4, survival: 3 },
  poverty: { financial_ruin: 4, debt: 3, fear: 1 },
  loss_of_power: { ambition: 4, fear: 2 },
  betrayal: { betrayal: 5, jealousy: 1 },
  war: { family_death: 3, fear: 3, duty: 1 },
  disease: { family_death: 3, fear: 3 },
  rival_success: { jealousy: 5, ambition: 2 },
  divine_wrath: { faith: 5, guilt: 2, prophecy: 1 },
  the_past: { guilt: 5, fear: 2 },
  scandal: { honor: 3, ambition: 2, guilt: 1 },
};

function motive<T extends string>(rng: Rng, type: T, target: Target = {}, reasons?: Partial<Record<MotiveReason, number>>): Motive<T> {
  if (!reasons) return makeMotive(rng, type, target);
  const m = makeMotive(rng, type, target);
  m.reason = rng.weighted(biased(MOTIVE_REASONS, reasons));
  return m;
}

// ---------------------------------------------------------------------------
// Secrets

function assignSecret(ctx: MotiveContext, rng: Rng, n: Npc): void {
  if (n.secret) return; // hidden leadership, set by the leaders step
  const b = ctx.b;
  const secretOrg = n.organization_ids.map((id) => b.organizations[id]).find((o) => o.visibility === 'secret' || o.legality === 'outlawed');
  if (secretOrg && rng.chance(0.7)) {
    n.secret = motive(rng, 'true_loyalty', { target_org_id: secretOrg.id }, { loyalty: 4, ideology: 3, faith: 1 });
    return;
  }
  if (!rng.chance(0.45)) return;

  const locals = (ctx.locals.get(n.settlement_id) ?? []).filter((x) => x.id !== n.id);
  const orgs = ctx.orgsHere(n);
  const syndicate = orgs.find((o) => o.org_type === 'criminal_syndicate' || o.activities.includes('smuggling'));
  const cult = orgs.find((o) => o.org_type === 'cult');
  const country = ctx.country(n);
  const foreign = Object.values(b.countries).filter((c) => c.id !== country.id && c.ruler_npc_id);
  const enemies = ctx.related(n, 'enemy', 'rival');
  const younger = locals.filter((x) => x.species_id === n.species_id && n.age - x.age >= b.species[n.species_id].lifespan_years * 0.18);
  const villains = locals.filter((x) => ['villain', 'fixer', 'enforcer'].includes(x.role_type));
  const ruins = Object.values(b.settlements).filter((s) => s.settlement_type === 'ruin_town' || s.districts.some((d) => d.type === 'ruins'));
  const species = b.species[n.species_id];

  const options: Option<SecretType>[] = [
    { type: 'affair', weight: locals.length ? 3 : 0, target: locals.length ? { target_npc_id: rng.pick(locals).id } : {} },
    { type: 'hidden_identity', weight: 1.5 },
    { type: 'past_crime', weight: 2, target: enemies.length ? { target_npc_id: rng.pick(enemies).id } : {} },
    { type: 'crippling_debt', weight: 2, target: syndicate ? { target_org_id: syndicate.id } : {} },
    { type: 'forbidden_faith', weight: cult ? 2 : 0.5, target: cult ? { target_org_id: cult.id } : {} },
    { type: 'double_agent', weight: foreign.length ? 1 : 0 },
    { type: 'illegitimate_child', weight: younger.length ? 1 : 0, target: younger.length ? { target_npc_id: rng.pick(younger).id } : {} },
    { type: 'stolen_wealth', weight: 1.5, target: n.organization_ids.length ? { target_org_id: rng.pick(n.organization_ids) } : {} },
    { type: 'false_credentials', weight: 1.2, target: n.organization_ids.length ? { target_org_id: rng.pick(n.organization_ids) } : {} },
    { type: 'addiction', weight: 1.5, target: syndicate ? { target_org_id: syndicate.id } : {} },
    { type: 'murder', weight: 0.6, target: enemies.length ? { target_npc_id: rng.pick(enemies).id } : {} },
    { type: 'forbidden_power', weight: n.special_abilities.length ? 3 : 0 },
    { type: 'offworld_heritage', weight: species.origin === 'galactic' && b.planet.native_species_id ? 1 : 0 },
    { type: 'cowardice', weight: 1.2 },
    { type: 'blackmailed', weight: villains.length ? 1.5 : 0, target: villains.length ? { target_npc_id: rng.pick(villains).id } : {} },
    { type: 'smuggling', weight: syndicate ? 1.5 : 0, target: syndicate ? { target_org_id: syndicate.id } : {} },
    { type: 'hidden_illness', weight: 1.5 },
    { type: 'prophecy_knowledge', weight: 0.6, target: { target_settlement_id: n.settlement_id } },
    { type: 'relic_possession', weight: ruins.length && b.planet.precursor_presence !== 'none' ? 1 : 0, target: ruins.length ? { target_settlement_id: rng.pick(ruins).id } : {} },
  ];
  const choice = pickOption(rng, options);
  let target = choice.target ?? {};
  if (choice.type === 'double_agent') {
    // A spy for a foreign ruler: the foreign country is their true allegiance, and its ruler their handler.
    const hostile = ctx.foes(country).filter((c) => c.ruler_npc_id);
    const master = hostile.length ? rng.pick(hostile) : rng.pick(foreign);
    target = { target_country_id: master.id };
    n.allegiance_ref = master.id;
    link(rng.fork('handler'), n, b.npcs[master.ruler_npc_id!], 'employer');
  }
  n.secret = motive(rng, choice.type, target, { guilt: 2, fear: 2, greed: 1, love: 1, survival: 1, loyalty: 1, debt: 1 });
}

// ---------------------------------------------------------------------------
// Goals

function chooseGoal(ctx: MotiveContext, rng: Rng, n: Npc): Motive<GoalType> {
  const b = ctx.b;
  const country = ctx.country(n);
  const foes = ctx.foes(country);
  const lead = n.leads[0];

  // Organization leaders usually share their organization's real aim.
  if (lead?.entity_type === 'organization' && rng.chance(0.6)) {
    const g = b.organizations[lead.entity_id].true_goal;
    // Unless that aim is aimed at another organization this NPC belongs to.
    if (!g.target_org_id || !n.organization_ids.includes(g.target_org_id)) return { ...g };
  }

  const options: Option<GoalType>[] = [];
  const add = (type: GoalType, weight: number, target: Target = {}) => options.push({ type, weight, target });

  if (lead && (lead.entity_type === 'country' || lead.entity_type === 'world_government')) {
    add('power', 2);
    add('legacy', 2, { target_country_id: country.id });
    if (foes.length) {
      const foe = rng.pick(foes);
      add('expand_influence', 2, { target_country_id: foe.id });
      add(country.relations.some((r) => r.target_ref === foe.id && r.attitude === 'at_war') ? 'revenge' : 'peace', 1.5, { target_country_id: foe.id });
    }
    add('reform', ['democracy', 'republic', 'constitutional_monarchy', 'technocracy'].includes(country.government_type) ? 1.5 : 0.3, { target_country_id: country.id });
    add('survival', ['collapsing', 'volatile', 'unstable'].includes(country.stability) ? 3 : 0.2);
    const threat = Object.values(b.organizations).find((o) => o.true_goal.target_country_id === country.id && ['overthrow', 'secession'].includes(o.true_goal.type)
      && !n.organization_ids.includes(o.id));
    if (threat) add('justice', 2, { target_org_id: threat.id });
  } else if (lead?.entity_type === 'settlement') {
    const s = b.settlements[lead.entity_id];
    // Never against an organization the leader belongs to (or secretly runs).
    const crooks = ctx.orgsHere(n).filter((o) => o.legality === 'outlawed' && !n.organization_ids.includes(o.id));
    const neighbors = s.connections.map((c) => c.settlement_id);
    add('expand_influence', 2, neighbors.length ? { target_settlement_id: rng.pick(neighbors) } : {});
    add('wealth', 2);
    add('legacy', 2, { target_settlement_id: s.id });
    add('justice', crooks.length ? 3 : 0, crooks.length ? { target_org_id: rng.pick(crooks).id } : {});
    add('recognition', 1.5, country.ruler_npc_id && country.ruler_npc_id !== n.id ? { target_npc_id: country.ruler_npc_id } : {});
    add('power', n.traits.includes('ambitious') ? 2 : 0.5, { target_country_id: country.id });
  }

  // Personal goals, open to everyone.
  const enemies = ctx.related(n, 'enemy');
  const lovers = ctx.related(n, 'lover');
  const family = ctx.related(n, 'parent', 'child', 'sibling', 'spouse');
  const estranged = n.relationships.filter((r) => ['parent', 'child', 'sibling', 'spouse'].includes(r.type) && ['estranged', 'bitter_separation'].includes(r.note_key));
  const rivals = ctx.related(n, 'rival');
  const orgs = ctx.orgsHere(n);
  const rivalOrg = orgs.find((o) => !n.organization_ids.includes(o.id) && o.relations.some((r) => n.organization_ids.includes(r.target_ref) && ['rival', 'hostile', 'at_war'].includes(r.attitude)));
  const crooks = orgs.filter((o) => o.org_type === 'criminal_syndicate');
  const rebel = n.organization_ids.map((id) => b.organizations[id]).find((o) => o.org_type === 'rebel_movement');
  const greedy = n.traits.includes('greedy') ? 2 : 1;
  const scholarly = ['scholar', 'archivist', 'explorer', 'alchemist'].includes(n.occupation);

  add('revenge', enemies.length ? 3 : 0, enemies.length ? { target_npc_id: rng.pick(enemies).id } : {});
  add('love', lovers.length ? 2.5 : 0.5, lovers.length ? { target_npc_id: rng.pick(lovers).id } : {});
  add('protect_family', family.length ? 2 : 0, family.length ? { target_npc_id: rng.pick(family).id } : {});
  add('reunite', estranged.length ? 3 : 0, estranged.length ? { target_npc_id: rng.pick(estranged).npc_id } : {});
  add('recognition', rivals.length ? 2 : 1, rivals.length ? { target_npc_id: rng.pick(rivals).id } : {});
  add('wealth', 2.5 * greedy, rivalOrg ? { target_org_id: rivalOrg.id } : {});
  add('monopoly', n.occupation === 'merchant' && rivalOrg ? 2 : 0, rivalOrg ? { target_org_id: rivalOrg.id } : {});
  add('knowledge', scholarly ? 3 : 0.5);
  add('discovery', n.occupation === 'explorer' ? 4 : 0.5, { target_settlement_id: rng.pick(Object.keys(b.settlements)) });
  add('find_relic', b.planet.precursor_presence !== 'none' ? 1.5 : 0);
  add('justice', crooks.length && !n.organization_ids.some((id) => crooks.some((c) => c.id === id)) ? 1.5 : 0, crooks.length ? { target_org_id: rng.pick(crooks).id } : {});
  add('freedom', ['oppressive', 'absolute'].includes(country.law_level) ? 2 : 0.3, { target_country_id: country.id });
  add('overthrow', rebel ? 4 : 0, rebel?.true_goal.target_country_id ? { target_country_id: rebel.true_goal.target_country_id } : {});
  add('escape', ['grim', 'fearful', 'mournful'].includes(b.settlements[n.settlement_id].mood) ? 1.5 : 0.3, { target_settlement_id: n.settlement_id });
  add('spread_faith', n.occupation === 'priest' || n.occupation === 'prophet' ? 3 : 0, { target_settlement_id: n.settlement_id });
  add('find_cure', ctx.hasEvent(n, 'plague') ? 3 : n.secret?.type === 'hidden_illness' ? 2 : 0, ctx.hasEvent(n, 'plague') ? { target_settlement_id: n.settlement_id } : {});
  add('redemption', n.secret && ['past_crime', 'murder', 'cowardice'].includes(n.secret.type) ? 3 : 0.3,
    n.secret?.target_npc_id ? { target_npc_id: n.secret.target_npc_id } : {});
  add('survival', WEALTH_LEVELS.indexOf(n.wealth_level) <= 1 ? 2 : 0.3);
  add('legacy', ['elder', 'ancient'].includes(n.age_category) ? 2 : 0.5);
  add('peace', 0.7);

  const choice = pickOption(rng, options);
  return makeMotive(rng.fork('reason'), choice.type, choice.target ?? {});
}

// ---------------------------------------------------------------------------
// Fears

function chooseFear(ctx: MotiveContext, rng: Rng, n: Npc): Motive<FearType> {
  const b = ctx.b;
  const country = ctx.country(n);
  const options: Option<FearType>[] = [];
  const add = (type: FearType, weight: number, target: Target = {}) => options.push({ type, weight, target });
  const rivals = ctx.related(n, 'rival', 'enemy');
  const close = ctx.related(n, 'friend', 'employee', 'spouse', 'lover');
  const foes = ctx.foes(country).filter((c) => country.relations.some((r) => r.target_ref === c.id && (r.attitude === 'hostile' || r.attitude === 'at_war')));
  const leader = n.leads.length > 0;
  const secretTarget = n.secret ? (n.secret.target_npc_id ? { target_npc_id: n.secret.target_npc_id } : {}) : {};

  add('exposure', n.secret ? 4 : 0, secretTarget);
  add('the_past', n.secret && ['past_crime', 'murder', 'hidden_identity', 'cowardice'].includes(n.secret.type) ? 3 : 0, secretTarget);
  add('loss_of_power', leader ? 3 : 0, rivals.length ? { target_npc_id: rng.pick(rivals).id } : {});
  add('rival_success', rivals.length ? 2.5 : 0, rivals.length ? { target_npc_id: rng.pick(rivals).id } : {});
  add('betrayal', close.length ? 2 : 0.5, close.length ? { target_npc_id: rng.pick(close).id } : {});
  add('war', foes.length ? 2.5 : 0, foes.length ? { target_country_id: rng.pick(foes).id } : {});
  add('disease', ctx.hasEvent(n, 'plague') ? 4 : 0.5, ctx.hasEvent(n, 'plague') ? { target_settlement_id: n.settlement_id } : {});
  add('monsters', ctx.hasEvent(n, 'monster_sighting') || b.planet.hazards.some((h) => h.type === 'apex_predators') ? 2.5 : 0.2,
    ctx.hasEvent(n, 'monster_sighting') ? { target_settlement_id: n.settlement_id } : {});
  add('poverty', WEALTH_LEVELS.indexOf(n.wealth_level) <= 1 ? 2.5 : 0.5);
  add('death', ['elder', 'ancient'].includes(n.age_category) ? 2 : 0.8);
  add('aging', ['middle_aged', 'elder'].includes(n.age_category) ? 1.5 : 0);
  add('offworlders', ['uncontacted', 'quarantined', 'isolated'].includes(b.planet.galactic_connectivity) ? 2 : 0.3);
  add('machines', n.quirk === 'distrusts_machines' ? 4 : 0.2);
  add('divine_wrath', n.traits.includes('zealous') || n.occupation === 'priest' ? 2 : 0.3);
  add('loss_of_faith', n.occupation === 'priest' || n.occupation === 'prophet' ? 1.5 : 0);
  add('imprisonment', n.organization_ids.some((id) => b.organizations[id].legality === 'outlawed') ? 2.5 : 0.3);
  add('failure', n.traits.includes('ambitious') ? 2.5 : 1);
  add('scandal', leader || n.social_rank === 'noble' ? 1.5 : 0.2);
  add('replacement', leader ? 1 : 0.4);
  add('abandonment', 0.6, close.length ? { target_npc_id: rng.pick(close).id } : {});
  add('the_unknown', 0.8);
  add('madness', 0.3);

  const choice = pickOption(rng, options);
  return motive(rng.fork('reason'), choice.type, choice.target ?? {}, FEAR_REASONS[choice.type] ?? { fear: 3, survival: 1, guilt: 1, love: 1 });
}

// ---------------------------------------------------------------------------
// Quest hooks

function questHooks(ctx: MotiveContext, rng: Rng, n: Npc): QuestHook[] {
  const b = ctx.b;
  const hooks: QuestHook[] = [];
  const goal = n.goal!;
  const goalTarget = goal.target_npc_id ?? goal.target_org_id ?? goal.target_settlement_id ?? goal.target_country_id;
  const s = b.settlements[n.settlement_id];
  const nearby = s.connections.map((c) => c.settlement_id);
  const elsewhere = nearby.length ? rng.pick(nearby) : s.id;

  // Primary hook follows the goal.
  let type: QuestType = 'deliver';
  let targets: string[] = [goalTarget ?? elsewhere];
  switch (goal.type) {
    case 'revenge': case 'monopoly': case 'overthrow': case 'secession':
      type = goalTarget && kindOf(goalTarget) === 'npc' ? 'eliminate' : 'sabotage'; break;
    case 'justice': type = 'investigate'; break;
    case 'protect_family': case 'survival': type = 'protect'; targets = [goalTarget ?? n.id]; break;
    case 'rescue': case 'escape': type = 'escort'; targets = goalTarget ? [goalTarget] : [n.id, elsewhere]; break;
    case 'knowledge': case 'discovery': type = 'investigate'; break;
    case 'find_relic': case 'find_cure': type = 'retrieve'; break;
    case 'love': case 'reunite': case 'peace': case 'reform': case 'spread_faith': case 'expand_influence': case 'recognition':
      type = 'persuade'; break;
    case 'redemption': type = goalTarget ? 'deliver' : 'protect'; targets = [goalTarget ?? n.id]; break;
    default: type = 'deliver'; break;
  }
  hooks.push({ type, target_refs: targets, reward_type: reward(rng, n) });

  // Secondary hook: their current event, or the kind of work they do.
  if (rng.chance(0.55)) {
    const event = n.current_event_involvement ? s.current_events.find((e) => e.id === n.current_event_involvement) : null;
    const others = event?.involved_refs.filter((r) => r !== n.id) ?? [];
    if (event && others.length) {
      const evType: QuestType = ['murder_investigation', 'disappearances', 'scandal', 'cult_activity', 'crime_wave'].includes(event.type) ? 'investigate'
        : ['siege', 'riot', 'monster_sighting'].includes(event.type) ? 'protect'
          : ['foreign_delegation', 'election', 'succession_dispute', 'strike', 'protest'].includes(event.type) ? 'persuade' : 'deliver';
      hooks.push({ type: evType, target_refs: [rng.pick(others)], reward_type: reward(rng, n) });
    } else if (['merchant', 'courier', 'smuggler', 'innkeeper', 'artisan', 'smith'].includes(n.occupation)) {
      hooks.push({ type: 'deliver', target_refs: [elsewhere], reward_type: 'money' });
    } else if (['guard', 'soldier', 'mercenary', 'bounty_hunter'].includes(n.occupation)) {
      const crooks = ctx.orgsHere(n).filter((o) => o.legality === 'outlawed');
      hooks.push(crooks.length
        ? { type: 'eliminate', target_refs: [rng.pick(crooks).id], reward_type: reward(rng, n) }
        : { type: 'escort', target_refs: [elsewhere], reward_type: 'money' });
    }
  }
  return hooks;
}

function reward(rng: Rng, n: Npc): RewardType {
  const weights: Record<RewardType, number> = {
    money: WEALTH_LEVELS.indexOf(n.wealth_level) >= 2 ? 4 : 1,
    item: ['artisan', 'smith', 'alchemist', 'engineer', 'scavenger'].includes(n.occupation) ? 3 : 0.8,
    information: ['informant', 'scholar'].includes(n.role_type) || ['spy', 'archivist', 'scholar'].includes(n.occupation) ? 3 : 1,
    favor: n.leads.length > 0 || ['elite', 'noble', 'sovereign'].includes(n.social_rank) ? 3 : 1,
    membership: n.organization_ids.length > 0 ? 1.5 : 0,
  };
  return rng.weightedKeys(['money', 'item', 'information', 'favor', 'membership'], weights);
}

// ---------------------------------------------------------------------------
// Rumors

function generateRumors(bundle: PlanetBundle, rng: Rng): void {
  const make = (subjectId: string, count: number, r: Rng): Rumor[] => {
    const claims = CLAIMS_BY_KIND[kindOf(subjectId)!] ?? [];
    const pool = claims.map((claim) => {
      const truth = rumorTruth(bundle, subjectId, claim);
      // True rumors are more useful in play, so they are favored when the data supports them.
      return { claim, truth, weight: truth ? 6 : 1 };
    });
    const chosen = r.weightedSample(pool.map((p) => ({ value: p, weight: p.weight })), count);
    return chosen.map((p) => ({
      subject_ref: subjectId,
      claim_type: p.claim,
      // True rumors point at what the data says; false ones at a plausible bystander.
      target_ref: p.truth ? p.truth.target : plausibleTarget(bundle, r.fork(p.claim), subjectId),
      is_true: p.truth !== null,
    }));
  };
  const counts = CONFIG.rumors;
  bundle.planet.rumors = make(bundle.planet.id, rng.int(...counts.planet), rng.fork('planet'));
  for (const c of Object.values(bundle.countries)) c.rumors = make(c.id, rng.int(...counts.country), rng.fork(c.id));
  for (const s of Object.values(bundle.settlements)) s.rumors = make(s.id, rng.int(...counts.settlement), rng.fork(s.id));
  for (const o of Object.values(bundle.organizations)) o.rumors = make(o.id, rng.int(...counts.organization), rng.fork(o.id));
  for (const n of Object.values(bundle.npcs)) {
    const r = rng.fork(n.id);
    n.rumors_about = make(n.id, n.npc_category === 'leader' ? r.int(...counts.leader) : r.int(...counts.notable), r);
  }
}

/** A target for an untrue rumor: someone or something close to the subject, or nothing. */
function plausibleTarget(b: PlanetBundle, rng: Rng, subjectId: string): string | null {
  if (rng.chance(0.4)) return null;
  const kind = kindOf(subjectId);
  if (kind === 'npc') {
    const n = b.npcs[subjectId];
    const pool = [...n.relationships.map((r) => r.npc_id), ...n.organization_ids];
    return pool.length ? rng.pick(pool) : null;
  }
  if (kind === 'settlement') {
    const s = b.settlements[subjectId];
    const pool = [...s.organizations_present, ...(s.leader_npc_id ? [s.leader_npc_id] : [])];
    return pool.length ? rng.pick(pool) : null;
  }
  if (kind === 'organization') {
    const o = b.organizations[subjectId];
    const pool = o.relations.map((r) => r.target_ref);
    return pool.length ? rng.pick(pool) : null;
  }
  if (kind === 'country') {
    const c = b.countries[subjectId];
    const pool = [...c.relations.map((r) => r.target_ref), ...(c.ruler_npc_id ? [c.ruler_npc_id] : [])];
    return pool.length ? rng.pick(pool) : null;
  }
  const pool = Object.keys(b.organizations);
  return pool.length ? rng.pick(pool) : null;
}
