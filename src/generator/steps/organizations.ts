import {
  ADJECTIVES, CULTURE_VALUE_TABLE, FLAG_COLORS, HISTORICAL_EVENT_TABLE, MOTTO_VIRTUES, NOUNS, ORG_COUNTS, ORG_MOTTO_PATTERNS,
  ORG_NAME_PATTERNS, ORG_TYPE_TABLE, RELIGION_KIND_TABLE, SETTLEMENT_TYPE_TABLE, meets,
} from '../content';
import { fillPattern, makeBareName, makeFamilyName, pickPattern } from '../naming';
import type { Rng } from '../rng';
import type { Country, HistoricalEvent, Motive, Organization, OrgPresence, PlanetBundle, Settlement } from '../types/entities';
import {
  EVENT_OUTCOMES, GOAL_TYPES, HISTORICAL_EVENT_TYPES, INFLUENCE_LEVELS, LAW_LEVELS, LEGALITY_LEVELS, MOTIVE_REASONS,
  ORG_ACTIVITIES, ORG_RESOURCES, ORG_SIZES, ORG_STRUCTURES, ORG_TYPES, RECRUITMENT_METHODS, VISIBILITY_LEVELS,
  WEALTH_LEVELS,
  type GoalType, type Legality, type MotiveReason, type OrgType, type ScopeLevel, type StateRole, type Visibility,
} from '../types/enums';
import { PLANET_ID, makeId } from '../types/ids';
import { bundleContext } from './context';
import { biased, scaleAt } from './util';

const MONARCHIES = ['absolute_monarchy', 'constitutional_monarchy', 'elective_monarchy', 'feudal_realm'];
const FAITH_ORGS: OrgType[] = ['church', 'cult', 'monastic_order'];

interface OrgSpec {
  type: OrgType;
  scope: ScopeLevel;
  homeRef: string;
  stateRole: StateRole;
  religionId: string | null;
}

/** Reasons that fit each goal; anything else falls back to a general pool. */
const GOAL_REASONS: Partial<Record<GoalType, Partial<Record<MotiveReason, number>>>> = {
  revenge: { betrayal: 4, humiliation: 3, family_death: 2, injustice: 2 },
  wealth: { greed: 4, ambition: 3, debt: 1, survival: 1 },
  power: { ambition: 5, ideology: 2, fear: 1 },
  overthrow: { injustice: 4, ideology: 4, ambition: 2 },
  spread_faith: { faith: 6, prophecy: 2, duty: 1 },
  monopoly: { greed: 4, ambition: 3 },
  freedom: { injustice: 4, ideology: 3 },
  secession: { injustice: 3, ideology: 3, loyalty: 1 },
  knowledge: { curiosity: 5, duty: 1 },
  discovery: { curiosity: 5, ambition: 1, prophecy: 1 },
  justice: { injustice: 5, duty: 2, honor: 2 },
  legacy: { honor: 3, ambition: 2, duty: 2 },
  restore_honor: { humiliation: 4, honor: 4 },
  find_relic: { prophecy: 3, curiosity: 3, greed: 2 },
  love: { love: 6, loyalty: 1 },
  redemption: { guilt: 6, faith: 2, honor: 1 },
  protect_family: { love: 4, duty: 3, fear: 2 },
  expand_influence: { ambition: 5, greed: 2, ideology: 1 },
  escape: { fear: 4, debt: 3, injustice: 2, boredom: 1 },
  recognition: { ambition: 4, humiliation: 2, jealousy: 2 },
  peace: { duty: 3, faith: 2, fear: 2, guilt: 1, ideology: 2 },
  find_cure: { love: 3, duty: 3, fear: 2, curiosity: 1 },
  survival: { fear: 4, survival: 5 },
  rescue: { love: 4, loyalty: 3, duty: 2, oath: 1 },
  reform: { injustice: 4, ideology: 4, duty: 1 },
  reunite: { love: 4, loyalty: 3, guilt: 1 },
};

export function makeMotive<T extends string>(rng: Rng, type: T, targets: Partial<Pick<Motive<T>, 'target_npc_id' | 'target_org_id' | 'target_settlement_id' | 'target_country_id'>> = {}): Motive<T> {
  const reasons = GOAL_REASONS[type as unknown as GoalType];
  const reason = reasons && Object.values(reasons).some((w) => (w ?? 0) > 0)
    ? rng.weighted(biased(MOTIVE_REASONS, reasons))
    : rng.pick(['ambition', 'duty', 'loyalty', 'curiosity'] as MotiveReason[]);
  return {
    type,
    target_npc_id: targets.target_npc_id ?? null,
    target_org_id: targets.target_org_id ?? null,
    target_settlement_id: targets.target_settlement_id ?? null,
    target_country_id: targets.target_country_id ?? null,
    reason,
  };
}

/**
 * Pipeline step 4: organizations. Planet, country and settlement scope.
 * State organizations are guaranteed where the government implies them
 * (theocracy church, corporate state corporation, royal house), so the
 * leaders step can apply the automatic leadership combinations.
 */
export function generateOrganizationsStep(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const specs: OrgSpec[] = [];
  const ctx = bundleContext(bundle);
  const churchedReligions = new Set<string>();

  const pickReligion = (r: Rng, shares: { religion_id: string; share: number }[], type: OrgType): string | null => {
    if (!FAITH_ORGS.includes(type) || shares.length === 0) return null;
    // Churches serve faiths that do not yet have one; cults favor minor faiths.
    const pool = shares.map((s) => {
      const kind = RELIGION_KIND_TABLE[bundle.religions[s.religion_id].kind];
      let w = type === 'cult' ? 1 - s.share + 0.1 : s.share;
      if (type === 'church' && churchedReligions.has(s.religion_id)) w *= 0.2;
      if (type === 'church' && kind.family === 'secular') w *= 0.1;
      return { value: s.religion_id, weight: w };
    });
    return r.weighted(pool);
  };

  const typeFor = (r: Rng, scope: ScopeLevel, techLevel: number, extra: (t: OrgType) => number = () => 1): OrgType =>
    r.weightedBy(ORG_TYPES, (t) => {
      const def = ORG_TYPE_TABLE[t];
      if (!meets(def.constraints, { ...ctx, techLevel })) return 0;
      return (def.scopes[scope] ?? 0) * extra(t);
    });

  // Planet scope
  const pRng = rng.fork('planet');
  const planetCount = pRng.int(...ORG_COUNTS.planet);
  for (let i = 0; i < planetCount; i++) {
    const r = pRng.fork(`org:${i}`);
    const type = typeFor(r, 'planet', p.tech_level, (t) => (t === 'political_party' && p.political_structure !== 'federation' && p.political_structure !== 'unified' ? 0.2 : 1));
    const religionId = pickReligion(r, p.dominant_religions_or_ideologies, type);
    if (type === 'church' && religionId) churchedReligions.add(religionId);
    specs.push({ type, scope: 'planet', homeRef: PLANET_ID, stateRole: 'none', religionId });
  }

  // Country scope, state organizations first.
  for (const c of Object.values(bundle.countries)) {
    const r = rng.fork(c.id);
    const guaranteed: OrgSpec[] = [];
    if (c.government_type === 'theocracy') {
      const religionId = c.religions_or_ideologies[0]?.religion_id ?? null;
      if (religionId) churchedReligions.add(religionId);
      guaranteed.push({ type: 'church', scope: 'country', homeRef: c.id, stateRole: 'state_church', religionId });
    }
    if (c.government_type === 'corporate_state') {
      guaranteed.push({ type: 'corporation', scope: 'country', homeRef: c.id, stateRole: 'state_corporation', religionId: null });
    }
    if (MONARCHIES.includes(c.government_type) && r.chance(0.8)) {
      guaranteed.push({ type: 'noble_house', scope: 'country', homeRef: c.id, stateRole: 'royal_house', religionId: null });
    }
    specs.push(...guaranteed);
    const total = Math.max(guaranteed.length, r.int(...ORG_COUNTS.country));
    for (let i = guaranteed.length; i < total; i++) {
      const rr = r.fork(`org:${i}`);
      const type = typeFor(rr, 'country', c.tech_level, (t) => {
        if (t === 'rebel_movement') return LAW_LEVELS.indexOf(c.law_level) >= 3 ? 2.5 : 0.6;
        if (t === 'political_party') return ['democracy', 'republic', 'direct_democracy', 'constitutional_monarchy', 'merchant_republic'].includes(c.government_type) ? 2 : 0.4;
        if (t === 'noble_house') return MONARCHIES.includes(c.government_type) || c.government_type === 'oligarchy' ? 2 : 0.3;
        return 1;
      });
      const religionId = pickReligion(rr, c.religions_or_ideologies, type);
      if (type === 'church' && religionId) churchedReligions.add(religionId);
      specs.push({ type, scope: 'country', homeRef: c.id, stateRole: 'none', religionId });
    }
  }

  // Settlement scope
  for (const s of Object.values(bundle.settlements)) {
    const r = rng.fork(s.id);
    const size = SETTLEMENT_TYPE_TABLE[s.settlement_type].size;
    const count = r.int(...ORG_COUNTS.settlement[size]);
    const tech = bundle.countries[s.country_id].tech_level;
    for (let i = 0; i < count; i++) {
      const rr = r.fork(`org:${i}`);
      const type = typeFor(rr, 'settlement', tech, (t) => (t === 'criminal_syndicate' && ['high', 'rampant'].includes(s.corruption_level) ? 2.5 : 1));
      const religionId = pickReligion(rr, s.religions_or_ideologies, type);
      if (type === 'church' && religionId) churchedReligions.add(religionId);
      specs.push({ type, scope: 'settlement', homeRef: s.id, stateRole: 'none', religionId });
    }
  }

  specs.forEach((spec, i) => {
    const id = makeId('organization', i);
    bundle.organizations[id] = buildOrg(bundle, rng.fork(id), id, spec);
  });

  // Faith links: a religion's church is its highest-scope church organization.
  const scopeRank: Record<ScopeLevel, number> = { planet: 3, country: 2, settlement: 1 };
  for (const o of Object.values(bundle.organizations)) {
    if (o.org_type !== 'church' || !o.religion_id) continue;
    const rel = bundle.religions[o.religion_id];
    const current = rel.church_org_id ? bundle.organizations[rel.church_org_id] : null;
    if (!current || scopeRank[o.scope_level] > scopeRank[current.scope_level] || (o.state_role !== 'none' && current.state_role === 'none' && scopeRank[o.scope_level] >= scopeRank[current.scope_level])) {
      rel.church_org_id = o.id;
    }
  }

  // organizations_present mirrors org presence.
  for (const s of Object.values(bundle.settlements)) s.organizations_present = [];
  for (const o of Object.values(bundle.organizations)) {
    for (const pr of o.presence) bundle.settlements[pr.settlement_id].organizations_present.push(o.id);
  }
}

// ---------------------------------------------------------------------------

function settlementsOf(bundle: PlanetBundle, countryId?: string): Settlement[] {
  return Object.values(bundle.settlements).filter((s) => !countryId || s.country_id === countryId);
}

const sizeOf = (s: Settlement) => SETTLEMENT_TYPE_TABLE[s.settlement_type].size;

function homeCountry(bundle: PlanetBundle, spec: OrgSpec): Country | null {
  if (spec.scope === 'country') return bundle.countries[spec.homeRef];
  if (spec.scope === 'settlement') return bundle.countries[bundle.settlements[spec.homeRef].country_id];
  return null;
}

function buildOrg(bundle: PlanetBundle, rng: Rng, id: string, spec: OrgSpec): Organization {
  const p = bundle.planet;
  const def = ORG_TYPE_TABLE[spec.type];
  const country = homeCountry(bundle, spec);

  // Headquarters and presence
  const lRng = rng.fork('location');
  let hq: Settlement;
  const presence: OrgPresence[] = [];
  if (spec.scope === 'settlement') {
    hq = bundle.settlements[spec.homeRef];
    presence.push({ settlement_id: hq.id, strength: sizeOf(hq) <= 2 ? 'dominant' : lRng.weightedKeys(['established', 'dominant'], { established: 3, dominant: 1 }) });
  } else {
    const pool = spec.scope === 'country' ? settlementsOf(bundle, country!.id) : settlementsOf(bundle);
    const capitalFirst = spec.stateRole !== 'none' || lRng.chance(spec.scope === 'country' ? 0.6 : 0.4);
    hq = capitalFirst && country
      ? bundle.settlements[country.capital_settlement_id!]
      : lRng.weightedBy(pool, (s) => sizeOf(s) ** 2 * (s.settlement_type === 'capital' ? 2 : 1));
    presence.push({ settlement_id: hq.id, strength: spec.stateRole !== 'none' ? 'dominant' : lRng.weightedKeys(['established', 'dominant'], { established: 2, dominant: 1 }) });
    const others = pool.filter((s) => s.id !== hq.id);
    const reach = spec.stateRole !== 'none' ? 0.8 : spec.scope === 'country' ? lRng.float(0.25, 0.7) : lRng.float(0.1, 0.35);
    for (const s of others) {
      if (!lRng.chance(reach * (0.5 + sizeOf(s) / 5))) continue;
      presence.push({ settlement_id: s.id, strength: lRng.weightedKeys(['minor', 'established', 'dominant'], { minor: 5, established: 3, dominant: 0.5 }) });
    }
    if (spec.scope === 'planet' && presence.length < 2 && others.length > 0) {
      presence.push({ settlement_id: lRng.pick(others).id, strength: 'minor' });
    }
  }

  // Status: visibility and legality, shaped by the home country's laws.
  const sRng = rng.fork('status');
  let visibility: Visibility = sRng.weighted(biased(VISIBILITY_LEVELS, def.visibility));
  let legality: Legality = sRng.weighted(LEGALITY_LEVELS.map((l) => {
    let w = def.legality[l] ?? 0;
    const strict = country ? LAW_LEVELS.indexOf(country.law_level) >= 3 : false;
    if (l === 'outlawed' && strict) w *= 2;
    if (l === 'tolerated' && country && LAW_LEVELS.indexOf(country.law_level) <= 1) w *= 2;
    if (l === 'outlawed' && country?.government_type === 'theocracy' && spec.type === 'cult') w *= 4;
    if (l === 'outlawed' && ['dictatorship', 'military_junta', 'absolute_monarchy'].includes(country?.government_type ?? '') && ['political_party', 'rebel_movement'].includes(spec.type)) w *= 3;
    return { value: l, weight: w };
  }));
  if (spec.stateRole !== 'none') {
    visibility = 'public';
    legality = 'official';
  }
  if (visibility === 'secret' && legality === 'official') legality = 'tolerated';

  const scopeBase = spec.scope === 'planet' ? 2.5 : spec.scope === 'country' ? 1.5 : 0.5;
  const size = scaleAt(ORG_SIZES, scopeBase + presence.length * 0.08 + sRng.normal(0, 0.6));
  const influence = scaleAt(INFLUENCE_LEVELS, scopeBase + (spec.stateRole !== 'none' ? 1.5 : 0) + (visibility === 'secret' ? -0.5 : 0) + sRng.normal(0, 0.6));
  const baseWealth = WEALTH_LEVELS.indexOf(country?.wealth_level ?? p.wealth_level);
  const typeWealth = ['corporation', 'trade_consortium', 'noble_house', 'criminal_syndicate'].includes(spec.type) ? 1
    : ['rebel_movement', 'mutual_aid_society', 'monastic_order', 'cult'].includes(spec.type) ? -1 : 0;
  const wealth = scaleAt(WEALTH_LEVELS, baseWealth + typeWealth + sRng.normal(0, 0.6));

  // Purpose
  const gRng = rng.fork('goals');
  const goalType = gRng.weighted(biased(GOAL_TYPES, def.goals));
  const targetFor = (r: Rng, type: GoalType) => {
    const scopeSettlements = spec.scope === 'settlement' ? [] : (spec.scope === 'country' ? settlementsOf(bundle, country!.id) : settlementsOf(bundle));
    const outside = scopeSettlements.filter((s) => !presence.some((x) => x.settlement_id === s.id));
    switch (type) {
      case 'overthrow': case 'secession':
        return { target_country_id: country?.id ?? r.pick(Object.keys(bundle.countries)) };
      case 'expand_influence': case 'spread_faith':
        return outside.length ? { target_settlement_id: r.pick(outside).id } : {};
      default:
        return {};
    }
  };
  const statedGoal = makeMotive(gRng.fork('stated'), goalType, targetFor(gRng.fork('stated-target'), goalType));
  const hiddenAgenda = visibility === 'secret' ? 0.55 : visibility === 'discreet' ? 0.3 : 0.12;
  let trueGoal = statedGoal;
  if (gRng.chance(hiddenAgenda)) {
    const darker: GoalType[] = ['power', 'wealth', 'overthrow', 'monopoly', 'find_relic', 'revenge'];
    const t = gRng.pick(darker.filter((g) => g !== goalType));
    trueGoal = makeMotive(gRng.fork('true'), t, targetFor(gRng.fork('true-target'), t));
  }
  const activities = gRng.weightedSample(biased(ORG_ACTIVITIES, def.activities), gRng.int(2, 3));
  const resources = gRng.weightedSample(biased(ORG_RESOURCES, def.resources), gRng.int(2, 3));

  // Structure and membership
  const mRng = rng.fork('membership');
  const structure = spec.type === 'noble_house' ? 'dynasty' : mRng.weighted(biased(ORG_STRUCTURES, def.structures));
  const recruitment = mRng.weighted(biased(RECRUITMENT_METHODS, def.recruitment));
  const ranks = mRng.pick(def.ranks);
  const leaderTitle = spec.stateRole === 'royal_house' ? 'Head of the Royal House' : mRng.pick(def.leaderTitles);

  // History
  const history = orgHistory(rng.fork('history'), id, spec, bundle, country, hq);

  // Names
  const nRng = rng.fork('names');
  const lang = bundle.languages[hq.languages[0]];
  const ph = lang.phonology;
  const religion = spec.religionId ? bundle.religions[spec.religionId] : null;
  // 'Kingdom of Ash' contributes 'Ash', so names read 'the Front of Ash'.
  const homeName = spec.scope === 'planet' ? p.native_name : spec.scope === 'country' ? country!.name.split(' of ').pop()!.replace(/^The /, '') : hq.name;
  let name: string;
  if (spec.type === 'noble_house') {
    name = `House ${makeFamilyName(ph, nRng.fork('house'))}`;
  } else if (religion?.focus_name && nRng.chance(0.5)) {
    name = `The ${nRng.pick(ADJECTIVES)} ${nRng.pick(def.nouns)} of ${religion.focus_name}`;
  } else {
    name = fillPattern(pickPattern(nRng, ORG_NAME_PATTERNS), {
      adjective: () => nRng.pick(ADJECTIVES),
      orgNoun: () => nRng.pick(def.nouns),
      noun: () => nRng.pick(NOUNS),
      root: () => makeBareName(ph, nRng, 2),
      place: () => homeName,
    });
  }
  const shortName = makeShortName(name, def.nouns);
  const [c1, c2] = nRng.sample(FLAG_COLORS, 2);
  const symbol = `${withArticle(c1, true)} ${nRng.pick(def.emblems)} on ${withArticle(c2)} field`;
  const valueNouns = (country?.values ?? []).map((v) => CULTURE_VALUE_TABLE[v].noun);
  const motto = fillPattern(pickPattern(nRng, ORG_MOTTO_PATTERNS), {
    noun1: () => (valueNouns.length && nRng.chance(0.5) ? nRng.pick(valueNouns) : nRng.pick(NOUNS)),
    noun2: () => nRng.pick(NOUNS),
    virtue: () => nRng.pick(MOTTO_VIRTUES),
    orgNoun: () => nRng.pick(def.nouns),
  });

  return {
    id,
    seed: rng.seed,
    name,
    short_name: shortName,
    symbol_description: symbol,
    motto: motto.charAt(0).toUpperCase() + motto.slice(1),
    org_type: spec.type,
    state_role: spec.stateRole,
    religion_id: spec.religionId,
    scope_level: spec.scope,
    home_ref: spec.homeRef,
    headquarters_settlement_id: hq.id,
    presence,
    leader_title: leaderTitle,
    leader_npc_id: null,
    structure,
    visibility,
    legality,
    influence,
    wealth_level: wealth,
    size,
    stated_goal: statedGoal,
    true_goal: trueGoal,
    activities,
    resources,
    relations: [],
    member_npc_ids: [],
    recruitment,
    ranks,
    founding_date: history.founding,
    key_events: history.events,
    tagline: '',
    description: '',
    rumors: [],
  };
}

/** "a" or "an" before a word, optionally capitalized. */
export function withArticle(word: string, capital = false): string {
  const article = /^[aeiou]/i.test(word) ? 'an' : 'a';
  return `${capital ? article.charAt(0).toUpperCase() + article.slice(1) : article} ${word}`;
}

function makeShortName(name: string, nouns: string[]): string {
  if (name.startsWith('House ')) return name;
  const words = name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && w !== 'The');
  if (words.length >= 3) return words.map((w) => w[0]).join('');
  const noun = words.find((w) => nouns.includes(w));
  return noun ? `the ${noun}` : words[words.length - 1] ?? name;
}

function orgHistory(rng: Rng, id: string, spec: OrgSpec, bundle: PlanetBundle, country: Country | null, hq: Settlement): { founding: number; events: HistoricalEvent[] } {
  const p = bundle.planet;
  const colonization = p.history.find((e) => e.event_type === 'colonization');
  const floor = spec.scope === 'settlement' ? hq.founding_date
    : spec.scope === 'country' ? country!.founding_date - (spec.stateRole !== 'none' ? 0 : 50)
      : (colonization?.date ?? p.history[0]?.date ?? -500);
  const start = Math.max(floor, colonization ? colonization.date + 1 : floor);
  const founding = spec.stateRole !== 'none' && country
    ? Math.min(-2, country.founding_date + rng.int(0, 20))
    : Math.min(-2, start + Math.floor((-3 - start) * rng.next() ** 1.2));
  const events: HistoricalEvent[] = [{
    id: '', date: founding, event_type: 'founding', involved_refs: [hq.id],
    outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE.founding.outcomes)), parent_event_id: null,
  }];
  const target = rng.int(1, 3);
  const countryEvents = country?.key_events.filter((e) => e.event_type !== 'founding' && e.date > founding) ?? [];
  if (countryEvents.length > 0 && rng.chance(0.4) && events.length < target) {
    const e = rng.pick(countryEvents);
    events.push({
      id: '', date: e.date, event_type: e.event_type, involved_refs: country ? [country.id] : [],
      outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[e.event_type].outcomes)), parent_event_id: e.id,
    });
  }
  while (events.length < target && founding < -2) {
    const t = rng.weighted(HISTORICAL_EVENT_TYPES.map((x) => ({
      value: x, weight: HISTORICAL_EVENT_TABLE[x].unique ? 0 : HISTORICAL_EVENT_TABLE[x].weights.organization ?? 0,
    })));
    events.push({
      id: '', date: -rng.int(1, -founding - 1), event_type: t, involved_refs: [],
      outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[t].outcomes)), parent_event_id: null,
    });
  }
  events.sort((a, b) => a.date - b.date);
  events.forEach((e, i) => { e.id = `event_${id}_${i}`; });
  return { founding, events };
}

