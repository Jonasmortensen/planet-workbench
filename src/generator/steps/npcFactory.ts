import {
  APPEARANCE_TABLE, CLOTHING_BY_RANK, CLOTHING_CONSTRAINTS, CULTURE_VALUE_TABLE, DISTINGUISHING_MARK_TABLE, EPITHETS,
  HISTORICAL_EVENT_TABLE, OCCUPATION_TABLE, POSSESSION_CONSTRAINTS, QUIRK_TABLE, SKILL_CONSTRAINTS, SPEECH_BASE,
  TRAIT_TABLE, eligible, meets, type ConstraintContext,
} from '../content';
import { makePersonName } from '../naming';
import { NAME_STYLES } from '../content/naming/styles';
import type { Rng } from '../rng';
import type { HistoricalEvent, Language, Npc, PlanetBundle, Settlement } from '../types/entities';
import {
  APPEARANCE_DETAILS, CLOTHING_STYLES, CULTURE_VALUES, DISPOSITIONS, DISTINGUISHING_MARKS,
  EVENT_OUTCOMES, OCCUPATIONS, POSSESSIONS, QUIRKS, ROLE_TYPES, SKILLS, SOCIAL_RANKS, SPEECH_STYLES, TRAITS,
  WEALTH_LEVELS,
  type AgeCategory, type Gender, type HistoricalEventType, type NpcCategory, type Occupation, type RoleType,
  type SocialRank, type Trait,
} from '../types/enums';
import { makeId } from '../types/ids';
import { bundleContext } from './context';
import { biased, clamp, scaleAt } from './util';

export interface NpcOptions {
  settlementId: string;
  category: NpcCategory;
  occupation?: Occupation;
  rank?: SocialRank;
  role?: RoleType;
  title?: string;
  /** Forced family name (noble houses). */
  familyName?: string;
  /** Minimum age as a fraction of species lifespan. */
  minAgeFraction?: number;
}

/** Age category thresholds as fractions of species lifespan (upper bounds). */
const AGE_FRACTIONS: [AgeCategory, number][] = [
  ['youth', 0.17], ['young_adult', 0.27], ['adult', 0.45], ['middle_aged', 0.65], ['elder', 0.9], ['ancient', Infinity],
];

export function ageCategory(age: number, lifespan: number): AgeCategory {
  const f = age / lifespan;
  return AGE_FRACTIONS.find(([, max]) => f < max)![0];
}

const GENDERS_BY_SYSTEM: Record<string, Partial<Record<Gender, number>>> = {
  binary: { female: 50, male: 50 },
  varied: { female: 46, male: 46, nonbinary: 8 },
  none: { none: 1 },
  multiple: { other: 60, nonbinary: 20, none: 20 },
  fluid: { nonbinary: 40, other: 30, female: 15, male: 15 },
};

const RANK_WEALTH: Record<SocialRank, number> = {
  outcast: 0, lowborn: 1, commoner: 1.8, skilled: 2.4, notable: 3, elite: 4, noble: 4.3, sovereign: 4.8,
};

const ABILITY_CHANCE = { rare: 0.05, uncommon: 0.15, common: 0.4, universal: 0.9 };

/** Rebuild full name from parts in the naming order of the NPC's language style. */
export function fullName(lang: Language, given: string, family: string): string {
  if (!family) return given;
  return NAME_STYLES[lang.style].nameOrder === 'family_given' ? `${family} ${given}` : `${given} ${family}`;
}

/**
 * Create an NPC with every non-relational field filled. Relationships,
 * motives, hooks and prose are added by later steps.
 */
export function createNpc(bundle: PlanetBundle, rng: Rng, opts: NpcOptions): Npc {
  const id = makeId('npc', Object.keys(bundle.npcs).length);
  const r = rng.fork(id);
  const settlement: Settlement = bundle.settlements[opts.settlementId];
  const country = bundle.countries[settlement.country_id];
  const ctx: ConstraintContext = bundleContext(bundle, { techLevel: country.tech_level, biomes: [settlement.biome] });

  // Species, gender, age
  const speciesId = r.weighted(settlement.species.map((s) => ({ value: s.species_id, weight: s.share })));
  const species = bundle.species[speciesId];
  const gender = r.weighted(biased(['female', 'male', 'nonbinary', 'none', 'other'] as Gender[], GENDERS_BY_SYSTEM[species.gender_system]));
  const minFrac = opts.minAgeFraction ?? (opts.category === 'leader' ? 0.3 : 0.18);
  const frac = r.chance(0.05) && opts.category === 'notable' ? r.float(0.13, 0.18) : r.float(minFrac, 0.85);
  const age = Math.max(1, Math.round(species.lifespan_years * frac));

  // Language and name
  const spoken = settlement.languages.filter((lid) => bundle.languages[lid].speaker_species_ids.includes(speciesId));
  const ownTongues = Object.values(bundle.languages).filter((l) => l.speaker_species_ids.includes(speciesId)).map((l) => l.id);
  const languageId = spoken[0] ?? ownTongues[0] ?? settlement.languages[0];
  const lang = bundle.languages[languageId];
  const name = makePersonName(lang, r.fork('name'), gender);
  const family = opts.familyName ?? name.family;

  // Occupation, rank, role
  const occupation = opts.occupation ?? r.weighted(eligible(OCCUPATIONS, OCCUPATION_TABLE, ctx));
  const occ = OCCUPATION_TABLE[occupation];
  const rank = opts.rank ?? occ.rank;
  const role = opts.role ?? r.weighted(biased(ROLE_TYPES, { ...occ.roles, ruler: 0 }));

  // Appearance
  const aRng = r.fork('appearance');
  const plan = species.body_plan;
  const appearance = aRng.weightedSample(eligible(APPEARANCE_DETAILS, APPEARANCE_TABLE, ctx, (k, d) => {
    if (k === 'cracked_plating' && !['crystalline', 'mechanical', 'insectoid'].includes(plan)) return 0;
    if (k === 'braided_crest' && ['mechanical', 'amorphous', 'floating', 'colonial'].includes(plan)) return 0;
    if (k === 'cybernetic_limb' && ['mechanical', 'amorphous', 'floating', 'colonial', 'plantlike'].includes(plan)) return 0;
    if (k === 'luminous_patterns' && species.biology !== 'energy' && plan !== 'cephalopod' && aRng.chance(0.5)) return d.weight * 0.3;
    return d.weight;
  }), aRng.int(2, 3));
  const breathes = species.breathes.includes(bundle.planet.atmosphere.composition);
  const clothingWeights = CLOTHING_STYLES.map((c) => {
    let w = (CLOTHING_BY_RANK[rank][c] ?? 0) + (occ.clothing[c] ?? 0) * 1.5;
    const cons = CLOTHING_CONSTRAINTS[c];
    if (cons && !meets(cons.constraints, ctx)) w = 0;
    if (c === 'environment_suit' && !breathes && meets(cons?.constraints, ctx)) w = (w + 1) * 5;
    return { value: c, weight: w };
  });
  const clothing = clothingWeights.some((w) => w.weight > 0) ? aRng.weighted(clothingWeights) : 'nothing_notable';
  const mark = aRng.weighted(eligible(DISTINGUISHING_MARKS, DISTINGUISHING_MARK_TABLE, ctx));

  // Personality
  const pRng = r.fork('personality');
  const traits: Trait[] = [];
  const traitCount = pRng.int(2, 3);
  while (traits.length < traitCount) {
    const pool = TRAITS.filter((t) => !traits.includes(t) && !traits.some((x) => TRAIT_TABLE[x].opposites.includes(t) || TRAIT_TABLE[t].opposites.includes(x)))
      .map((t) => ({ value: t, weight: TRAIT_TABLE[t].weight }));
    if (pool.length === 0) break;
    traits.push(pRng.weighted(pool));
  }
  const values = pRng.weightedSample(CULTURE_VALUES.map((v) => ({
    value: v, weight: CULTURE_VALUE_TABLE[v].weight * (country.values.includes(v) ? 4 : 1),
  })), pRng.int(1, 2));
  const quirk = pRng.weighted(eligible(QUIRKS, QUIRK_TABLE, ctx));
  const speech = pRng.weightedBy(SPEECH_STYLES, (s) => {
    let w = SPEECH_BASE[s];
    for (const t of traits) w += (TRAIT_TABLE[t].speech[s] ?? 0) * 2;
    if (s === 'formal' && SOCIAL_RANKS.indexOf(rank) >= SOCIAL_RANKS.indexOf('elite')) w *= 2;
    if (s === 'academic' && (occupation === 'scholar' || occupation === 'archivist' || occupation === 'physician')) w *= 3;
    if (s === 'folksy' && SOCIAL_RANKS.indexOf(rank) <= SOCIAL_RANKS.indexOf('commoner')) w *= 1.5;
    return w;
  });
  const moodShift = ['fearful', 'tense', 'grim', 'secretive', 'militant'].includes(settlement.mood) ? -0.6
    : ['festive', 'hopeful', 'bustling', 'serene'].includes(settlement.mood) ? 0.5 : 0;
  const conn = bundle.planet.galactic_connectivity;
  const connShift = conn === 'uncontacted' || conn === 'quarantined' ? -0.8 : conn === 'hub' ? 0.6 : 0;
  const disposition = scaleAt(DISPOSITIONS, 3 + traits.reduce((a, t) => a + TRAIT_TABLE[t].disposition, 0) * 0.6 + moodShift + connShift + pRng.normal(0, 0.8));

  // Capabilities
  const cRng = r.fork('capabilities');
  const skillPool = SKILLS.map((s) => {
    const cons = SKILL_CONSTRAINTS[s];
    if (cons && !meets(cons.constraints, ctx)) return { value: s, weight: 0 };
    return { value: s, weight: (occ.skills[s] ?? 0) * 3 + 0.3 };
  });
  const skills = cRng.weightedSample(skillPool, cRng.int(2, 4));
  const abilities = bundle.planet.special_abilities
    .filter((a) => cRng.chance(ABILITY_CHANCE[a.prevalence]))
    .map((a) => a.type);
  const possessionPool = POSSESSIONS.map((pz) => {
    const cons = POSSESSION_CONSTRAINTS[pz];
    if (cons && !meets(cons.constraints, ctx)) return { value: pz, weight: 0 };
    return { value: pz, weight: (occ.possessions[pz] ?? 0) * 3 + 0.2 };
  });
  const possessions = cRng.weightedSample(possessionPool, cRng.int(1, 3));
  const wealth = scaleAt(WEALTH_LEVELS, clamp(RANK_WEALTH[rank] + (WEALTH_LEVELS.indexOf(settlement.wealth_level) - 2) * 0.4 + cRng.normal(0, 0.6), 0, 5));

  // Faith
  const fRng = r.fork('faith');
  const faiths = settlement.religions_or_ideologies;
  const unaffiliated = Math.max(0, 1 - faiths.reduce((a, f) => a + f.share, 0));
  const religion = fRng.weighted([
    ...faiths.map((f) => ({ value: f.religion_id as string | null, weight: f.share })),
    { value: null, weight: unaffiliated + 0.001 },
  ]);

  // Epithet
  const title = opts.title ?? (r.chance(0.3) ? `the ${r.pick(EPITHETS)}` : '');

  const npc: Npc = {
    id,
    seed: r.seed,
    settlement_id: settlement.id,
    name: fullName(lang, name.given, family),
    given_name: name.given,
    family_name: family,
    title_or_epithet: title,
    species_id: speciesId,
    language_id: languageId,
    age,
    age_category: ageCategory(age, species.lifespan_years),
    gender,
    npc_category: opts.category,
    leads: [],
    occupation,
    social_rank: rank,
    role_type: role,
    workplace_poi_id: null,
    appearance,
    clothing,
    distinguishing_mark: mark,
    traits,
    values,
    quirk,
    speech_style: speech,
    disposition_to_outsiders: disposition,
    goal: null,
    fear: null,
    secret: null,
    skills,
    special_abilities: abilities,
    possessions,
    wealth_level: wealth,
    organization_ids: [],
    religion_or_ideology: religion,
    allegiance_ref: country.id,
    relationships: [],
    current_event_involvement: null,
    quest_hooks: [],
    rumors_about: [],
    key_life_events: [],
    tagline: '',
    description: '',
    backstory: '',
    sample_greeting: '',
  };
  npc.key_life_events = lifeEvents(r.fork('life'), npc, settlement, species.lifespan_years);
  bundle.npcs[id] = npc;
  return npc;
}

const PERSONAL_EVENTS: HistoricalEventType[] = [
  'apprenticeship', 'marriage', 'loss', 'exile', 'promotion', 'crime', 'journey', 'conversion', 'injury', 'discovery', 'miracle',
];

/** Birth plus 1 to 3 personal events, sometimes tied to an event in the home settlement's history. */
function lifeEvents(rng: Rng, npc: Npc, settlement: Settlement, lifespan: number): HistoricalEvent[] {
  const born = -npc.age;
  const events: HistoricalEvent[] = [{
    id: '', date: born, event_type: 'birth', involved_refs: [settlement.id], outcome: 'survival', parent_event_id: null,
  }];
  const adulthood = Math.round(born + lifespan * 0.15);
  const count = rng.int(1, 3);
  const local = settlement.key_events.filter((e) => e.date > adulthood && e.date < 0 && e.event_type !== 'founding');
  for (let i = 0; i < count && adulthood < -1; i++) {
    if (local.length > 0 && rng.chance(0.3)) {
      const e = rng.pick(local);
      const type: HistoricalEventType = ['war', 'invasion', 'uprising', 'civil_war'].includes(e.event_type) ? 'injury'
        : ['plague', 'famine', 'disaster', 'cataclysm'].includes(e.event_type) ? 'loss' : 'journey';
      events.push({
        id: '', date: e.date, event_type: type, involved_refs: [settlement.id],
        outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[type].outcomes)), parent_event_id: e.id,
      });
      continue;
    }
    const type = rng.weighted(PERSONAL_EVENTS.map((t) => ({ value: t, weight: HISTORICAL_EVENT_TABLE[t].weights.npc ?? 0 })));
    events.push({
      id: '', date: rng.int(adulthood, -1), event_type: type, involved_refs: [],
      outcome: rng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[type].outcomes)), parent_event_id: null,
    });
  }
  events.sort((a, b) => a.date - b.date);
  events.forEach((e, i) => { e.id = `event_${npc.id}_${i}`; });
  return events;
}
