import {
  DISPOSITIONS, PLANET_ID, entityName, kindOf,
  type Npc, type PlanetBundle, type Rumor,
} from '../generator';
import { CULTURE_VALUE_TABLE, FACTION_TABLE, TECH_LEVEL_LABELS } from '../generator/content';
import {
  ANOMALY_PHRASE, APPEARANCE_PHRASE, ATTITUDE_PHRASE, BIOME_PHRASE, CURRENT_EVENT_PHRASE, DOCTRINE_PHRASE, EVENT_NOUN,
  GOVERNMENT_NOUN, LEGALITY_PHRASE, LIFE_EVENT_CLAUSE, POLITICAL_PHRASE, QUEST_PHRASE, RUMOR_PHRASE, SETTLEMENT_NOUN,
  TERRAIN_PHRASE,
} from '../generator/content/prose/lexicon';
import type { Template } from '../generator/content/prose/templates';
import { fill, listOf, render, type RenderContext } from '../generator/render/engine';
import { goalPhrase, fearPhrase, populationWords, pronounsFor, words, yearsAgo, IT } from '../generator/render/words';
import { tradesOffworld } from '../generator/rules/economy';
import { Rng } from '../generator/rng';
import { knows, learn, meet, type FactRef, type HeardRumor, type Knowledge } from './knowledge';
import {
  ANSWER_OPENERS, DONT_KNOW, FACT_LINES, NOTHING_NEW, NO_RUMORS, NO_WORK, REFERRALS, REFUSALS, REWARD_PHRASE, RUMOR_LINES,
  SELF_LINES, WORK_LINES,
} from './lines';
import { isPublicOrg, npcKnows } from './npcKnowledge';

/**
 * Template-driven dialogue: the player picks a topic, the NPC answers from
 * what they know, and everything they state becomes known. Pure functions;
 * the caller keeps the Knowledge object.
 */

export type Topic = 'self' | 'place' | 'leaders' | 'news' | 'rumors' | 'powers' | 'country' | 'world' | 'work' | 'about';

export interface DialogueOption {
  topic: Topic;
  target?: string;
  label: string;
}

export interface DialogueTurn {
  npc_id: string;
  question: string;
  answer: string;
  reveals: FactRef[];
  rumors: HeardRumor['rumor'][];
  /** Another NPC the speaker pointed to, if they could not answer. */
  referral: string | null;
  refused: boolean;
}

/** Minimum disposition (index into DISPOSITIONS) for an NPC to discuss each topic. */
const TOPIC_MIN: Record<Topic, number> = {
  place: 1, leaders: 1, self: 2, news: 2, powers: 2, country: 2, world: 2, about: 2, rumors: 3, work: 3,
};
const FRIENDLY = DISPOSITIONS.indexOf('friendly');
const WELCOMING = DISPOSITIONS.indexOf('welcoming');
const REFERS_FROM = DISPOSITIONS.indexOf('wary');

export const GENERIC_OPTIONS: DialogueOption[] = [
  { topic: 'self', label: 'Tell me about yourself.' },
  { topic: 'place', label: 'Tell me about this place.' },
  { topic: 'leaders', label: 'Who’s in charge around here?' },
  { topic: 'news', label: 'What’s been happening lately?' },
  { topic: 'powers', label: 'Who has power in this town?' },
  { topic: 'rumors', label: 'Heard any rumors?' },
  { topic: 'country', label: 'Tell me about your country.' },
  { topic: 'world', label: 'What should I know about this world?' },
  { topic: 'work', label: 'Any work for me?' },
];

export function aboutOption(b: PlanetBundle, target: string): DialogueOption {
  return { topic: 'about', target, label: `What do you know about ${entityName(b, target)}?` };
}

const tone = (n: Npc) => {
  const i = DISPOSITIONS.indexOf(n.disposition_to_outsiders);
  return i <= 2 ? 'cold' : i <= 4 ? 'neutral' : 'warm';
};

// ---------------------------------------------------------------------------
// Fact sentences

interface Described {
  slots: Record<string, string>;
  facts: Record<string, string>;
  /** Entities named in the sentence, which become known by name. */
  mentions: FactRef[];
  plural?: boolean;
}

const yes = (x: boolean) => (x ? 'yes' : 'no');
const named = (ids: string[], groups: string[] = ['name']): FactRef[] => ids.flatMap((entity) => groups.map((group) => ({ entity, group })));

function describe(b: PlanetBundle, id: string, speaker: string): Described {
  const p = b.planet;
  switch (kindOf(id)) {
    case 'planet': {
      const countries = Object.values(b.countries);
      const history = p.history;
      return {
        facts: {
          unified: yes(!!p.world_government && p.political_structure === 'unified'), federation: yes(p.political_structure === 'federation'),
          has_anomalies: yes(p.anomalies.length > 0),
          trades: yes(tradesOffworld(p)),
        },
        slots: {
          planet: p.name, world_gov: p.world_government?.name ?? '',
          politics: fill(POLITICAL_PHRASE[p.political_structure], { facts: {}, slots: { count: String(p.country_count) } }),
          countries: listOf(countries.map((c) => c.name)), population: populationWords(p.population),
          languages: listOf(p.dominant_languages.map((l) => b.languages[l].name)),
          faiths: listOf(p.dominant_religions_or_ideologies.map((r) => b.religions[r.religion_id].name)),
          species_list: listOf(p.species.map((s) => b.species[s.species_id].plural_name)),
          native: p.native_species_id ? b.species[p.native_species_id].plural_name : '',
          first_event: history[0] ? `${EVENT_NOUN[history[0].event_type]}, ${yearsAgo(history[0].date)}` : 'nothing anyone remembers',
          last_event: history.length > 1 ? EVENT_NOUN[history[history.length - 1].event_type] : '',
          anomalies: listOf(p.anomalies.map((a) => ANOMALY_PHRASE[a.type])), features: listOf(p.notable_features.map((f) => f.name)),
          wealth: p.wealth_level, law: p.law_level, danger: `${p.danger_level === 'safe' ? 'safe' : `${words(p.danger_level)}-risk`}`,
          exports: listOf(p.primary_exports.map(words)), faction: ['none', 'independent'].includes(p.faction_allegiance) ? '' : FACTION_TABLE[p.faction_allegiance].name,
          resources: listOf(p.resources.map((r) => words(r.resource))), hazards: listOf(p.hazards.map((h) => words(h.type))),
        },
        mentions: [
          ...named(countries.map((c) => c.id)), ...named(p.dominant_languages),
          ...named(p.dominant_religions_or_ideologies.map((r) => r.religion_id)), ...named(p.species.map((s) => s.species_id)),
        ],
      };
    }
    case 'country': {
      const c = b.countries[id];
      const ruler = c.ruler_npc_id ? b.npcs[c.ruler_npc_id] : null;
      const capital = c.capital_settlement_id ? b.settlements[c.capital_settlement_id] : null;
      const rels = c.relations.filter((r) => r.target_ref in b.countries);
      const last = c.key_events[c.key_events.length - 1];
      return {
        facts: { speaker: yes(c.ruler_npc_id === speaker) },
        slots: {
          name: c.name, flag: c.flag_description, tech: TECH_LEVEL_LABELS[c.tech_level].toLowerCase(),
          government: GOVERNMENT_NOUN[c.government_type], stability: c.stability,
          ruler_title: c.ruler_title, ruler_name: ruler?.name ?? '', capital: capital?.name ?? '',
          biomes: listOf(c.biomes.slice(0, 3).map((x) => BIOME_PHRASE[x.biome])), neighbors: listOf(c.neighbor_ids.map((n) => b.countries[n].name)),
          population: populationWords(c.population), species: listOf(c.species.map((s) => b.species[s.species_id].plural_name)),
          industries: listOf(c.primary_industries.map(words)), exports: listOf(c.exports.map(words)),
          military: c.military_strength, doctrine: DOCTRINE_PHRASE[c.military_doctrine],
          relations: listOf(rels.map((r) => `${ATTITUDE_PHRASE[r.attitude]} ${b.countries[r.target_ref].name}`)) || 'on no strong terms with anyone',
          values: listOf(c.values.map((v) => CULTURE_VALUE_TABLE[v].noun.toLowerCase())), motto: c.motto,
          founded_ago: yearsAgo(c.founding_date), event: last && last.event_type !== 'founding' ? EVENT_NOUN[last.event_type] : '',
        },
        mentions: [
          ...named(ruler ? [ruler.id] : [], ['name', 'role']), ...named(capital ? [capital.id] : []),
          ...named(c.neighbor_ids), ...named(rels.map((r) => r.target_ref)),
        ],
      };
    }
    case 'settlement': {
      const s = b.settlements[id];
      const leader = s.leader_npc_id ? b.npcs[s.leader_npc_id] : null;
      const orgs = s.organizations_present.map((o) => b.organizations[o]).filter((o) => o.visibility === 'public' && o.legality !== 'outlawed');
      return {
        facts: { has_events: yes(s.current_events.length > 0), has_orgs: yes(orgs.length > 0), speaker: yes(s.leader_npc_id === speaker) },
        plural: orgs.length > 1,
        slots: {
          name: s.name, type: SETTLEMENT_NOUN[s.settlement_type], terrain: TERRAIN_PHRASE[s.terrain], population: populationWords(s.population),
          species: listOf(s.species.map((x) => b.species[x.species_id].plural_name)), languages: listOf(s.languages.map((l) => b.languages[l].name)),
          connections: listOf(s.connections.map((c) => b.settlements[c.settlement_id].name)),
          faith: s.religions_or_ideologies[0] ? b.religions[s.religions_or_ideologies[0].religion_id].name : 'no faith in particular',
          leader_name: leader?.name ?? '', leader_title: s.leader_title, industries: listOf(s.primary_industries.map(words)),
          goods: listOf(s.notable_goods.map(words)), events: listOf(s.current_events.map((e) => CURRENT_EVENT_PHRASE[e.type])),
          orgs: listOf(orgs.map((o) => o.name)), founded_ago: yearsAgo(s.founding_date), nickname: s.nickname,
        },
        mentions: [
          ...named(leader ? [leader.id] : [], ['name', 'role']), ...named(s.connections.map((c) => c.settlement_id)),
          ...named(orgs.map((o) => o.id)), ...named(s.languages), ...named(s.species.map((x) => x.species_id)),
          ...named(s.religions_or_ideologies.slice(0, 1).map((r) => r.religion_id)),
        ],
      };
    }
    case 'organization': {
      const o = b.organizations[id];
      const leader = o.leader_npc_id ? b.npcs[o.leader_npc_id] : null;
      const leaderKnown = !!leader?.leads.find((l) => l.entity_id === o.id)?.public;
      const rels = o.relations.filter((r) => r.target_ref in b.countries || (b.organizations[r.target_ref] && isPublicOrg(b.organizations[r.target_ref])));
      const members = o.member_npc_ids.filter((m) => m !== speaker && (m !== o.leader_npc_id || leaderKnown)).slice(0, 5);
      return {
        facts: {
          leader_known: yes(leaderKnown), speaker: yes(o.leader_npc_id === speaker),
          member: yes(o.member_npc_ids.includes(speaker)), has_members: yes(members.length > 0),
        },
        slots: {
          name: o.name, goal: goalPhrase(b, o.stated_goal, IT), activities: listOf(o.activities.map(words)),
          hq: b.settlements[o.headquarters_settlement_id].name,
          presence: listOf(o.presence.filter((x) => x.settlement_id !== o.headquarters_settlement_id).slice(0, 4).map((x) => b.settlements[x.settlement_id].name)),
          leader_name: leaderKnown ? leader!.name : '', leader_title: o.leader_title, legality: LEGALITY_PHRASE[o.legality],
          influence: o.influence, relations: listOf(rels.map((r) => `${ATTITUDE_PHRASE[r.attitude]} ${entityName(b, r.target_ref)}`)) || 'on no strong terms with anyone',
          members: listOf(members.map((m) => b.npcs[m].name)), founded_ago: yearsAgo(o.founding_date),
        },
        mentions: [
          ...named(leaderKnown ? [leader!.id] : [], ['name', 'role']), ...named([o.headquarters_settlement_id]),
          ...named(o.presence.slice(0, 5).map((x) => x.settlement_id)), ...named(rels.map((r) => r.target_ref)), ...named(members),
        ],
      };
    }
    case 'npc': {
      const n = b.npcs[id];
      const pr = pronounsFor(n);
      const lead = n.leads.find((l) => l.public);
      const orgs = n.organization_ids.map((o) => b.organizations[o]).filter(isPublicOrg);
      return {
        facts: { has_orgs: yes(orgs.length > 0) },
        plural: pr.plural,
        slots: {
          name: n.name, occupation: words(n.occupation), place: b.settlements[n.settlement_id].name,
          title: lead ? `${n.title_or_epithet} of ${entityName(b, lead.entity_id)}` : n.title_or_epithet.startsWith('the ') ? n.title_or_epithet : '',
          they: pr.they, them: pr.them, themself: pr.plural ? 'themselves' : pr.they === 'she' ? 'herself' : 'himself',
          appearance: listOf(n.appearance.slice(0, 2).map((a) => APPEARANCE_PHRASE[a])), traits: listOf(n.traits),
          orgs: listOf(orgs.map((o) => o.name)),
        },
        mentions: [...named([n.settlement_id]), ...named(orgs.map((o) => o.id)), ...named(lead ? [lead.entity_id] : [])],
      };
    }
    case 'species': {
      const s = b.species[id];
      return {
        facts: {}, slots: { plural: s.plural_name, biology: `${words(s.biology)}-based ${words(s.body_plan)} beings`, lifespan: String(s.lifespan_years) },
        mentions: [],
      };
    }
    case 'religion': {
      const r = b.religions[id];
      return { facts: {}, slots: { name: r.name, kind: words(r.kind), tenets: listOf(r.tenets.map(words)) }, mentions: [] };
    }
    case 'language': {
      const l = b.languages[id];
      return { facts: {}, slots: { name: l.name, speakers: listOf(l.speaker_species_ids.map((s) => b.species[s].plural_name)) }, mentions: named(l.speaker_species_ids) };
    }
    default:
      return { facts: {}, slots: {}, mentions: [] };
  }
}

/** Sentences about an entity for the given groups, plus what they mention. */
function factSentences(b: PlanetBundle, rng: Rng, speaker: string, id: string, groups: string[]): { text: string[]; mentions: FactRef[] } {
  const kind = kindOf(id)!;
  const d = describe(b, id, speaker);
  const text: string[] = [];
  for (const g of groups) {
    const pool = FACT_LINES[`${kind}.${g}`];
    if (!pool) continue;
    const line = render(rng.fork(g), pool, { facts: d.facts, slots: d.slots, plural: d.plural });
    if (line) text.push(line);
  }
  return { text, mentions: d.mentions.filter((m) => m.entity !== speaker) };
}

// ---------------------------------------------------------------------------
// Self

function selfSentences(b: PlanetBundle, rng: Rng, n: Npc, groups: string[]): string[] {
  const lead = n.leads.find((l) => l.public);
  const orgs = n.organization_ids.map((o) => b.organizations[o]).filter(isPublicOrg);
  const life = n.key_life_events.find((e) => LIFE_EVENT_CLAUSE[e.event_type]);
  const workplace = n.workplace_poi_id ? b.settlements[n.settlement_id].points_of_interest.find((p) => p.id === n.workplace_poi_id)?.name ?? '' : '';
  const rels = n.relationships.slice(0, 3).map((r) => `my ${words(r.type)} ${b.npcs[r.npc_id].name} lives in ${b.settlements[b.npcs[r.npc_id].settlement_id].name}`);
  const me = { they: 'I', them: 'me', their: 'my', plural: true };
  const ctx: RenderContext = {
    facts: {
      leader: lead ? 'yes' : 'no', has_orgs: yes(orgs.length > 0), has_faith: yes(!!n.religion_or_ideology),
      has_relations: yes(rels.length > 0),
    },
    plural: true,
    slots: {
      occupation: words(n.occupation), workplace, title: n.title_or_epithet, led: lead ? entityName(b, lead.entity_id) : '',
      born_ago: yearsAgo(-n.age), birthplace: b.settlements[n.settlement_id].name,
      life_event: life ? fill(LIFE_EVENT_CLAUSE[life.event_type]![0], { facts: {}, plural: true, slots: { they: 'I', them: 'me', their: 'my', settlement: b.settlements[n.settlement_id].name, country: b.countries[b.settlements[n.settlement_id].country_id].name } }) : '',
      traits: listOf(n.traits), orgs: listOf(orgs.map((o) => o.name)), faith: n.religion_or_ideology ? b.religions[n.religion_or_ideology].name : '',
      relations: listOf(rels), goal: n.goal ? goalPhrase(b, n.goal, me) : '', fear: n.fear ? fearPhrase(b, n.fear, me) : '',
    },
  };
  return groups.map((g) => (SELF_LINES[g] ? render(rng.fork(`self:${g}`), SELF_LINES[g], ctx) : '')).filter(Boolean);
}

function selfMentions(b: PlanetBundle, n: Npc, groups: string[]): FactRef[] {
  const out: FactRef[] = [];
  if (groups.includes('affiliations')) {
    out.push(...named(n.organization_ids.filter((o) => isPublicOrg(b.organizations[o]))));
    if (n.religion_or_ideology) out.push(...named([n.religion_or_ideology]));
  }
  if (groups.includes('relationships')) out.push(...named(n.relationships.slice(0, 3).map((r) => r.npc_id)));
  const lead = n.leads.find((l) => l.public);
  if (groups.includes('role') && lead) out.push(...named([lead.entity_id]));
  for (const t of [n.goal, n.fear]) {
    const target = t && (t.target_npc_id ?? t.target_org_id ?? t.target_settlement_id ?? t.target_country_id);
    if (target && ((groups.includes('goal') && t === n.goal) || (groups.includes('fear') && t === n.fear))) out.push(...named([target]));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Referral

/** The NPC best placed to answer about an entity, if any. Nearby candidates win ties. */
export function findReferral(b: PlanetBundle, k: Knowledge, speaker: Npc, target: string): string | null {
  const home = b.settlements[speaker.settlement_id];
  let best: { id: string; score: number } | null = null;
  for (const c of Object.values(b.npcs)) {
    if (c.id === speaker.id || c.id === target) continue;
    const groups = npcKnows(b, c, target).filter((g) => g !== 'name' && !knows(k, target, g));
    if (groups.length === 0) continue;
    const place = c.settlement_id === home.id ? 3 : home.connections.some((x) => x.settlement_id === c.settlement_id) ? 1.5 : 0;
    const score = groups.length + place + (DISPOSITIONS.indexOf(c.disposition_to_outsiders) >= 3 ? 1 : 0);
    if (!best || score > best.score || (score === best.score && c.id < best.id)) best = { id: c.id, score };
  }
  return best?.id ?? null;
}

// ---------------------------------------------------------------------------
// Rumors

function rumorPool(b: PlanetBundle, n: Npc): Rumor[] {
  const home = b.settlements[n.settlement_id];
  const locals = Object.values(b.npcs).filter((x) => x.settlement_id === home.id && x.id !== n.id);
  return [
    ...home.rumors,
    ...locals.flatMap((x) => x.rumors_about),
    ...home.organizations_present.flatMap((o) => b.organizations[o].rumors),
    ...b.countries[home.country_id].rumors,
    ...b.planet.rumors,
  ];
}

const sameRumor = (a: HeardRumor['rumor'], r: Rumor) => a.subject_ref === r.subject_ref && a.claim_type === r.claim_type && a.target_ref === r.target_ref;

// ---------------------------------------------------------------------------
// Ask

/** The NPC's answer to one option. Does not change knowledge; see applyTurn. */
export function ask(b: PlanetBundle, k: Knowledge, npcId: string, option: DialogueOption): DialogueTurn {
  const n = b.npcs[npcId];
  const home = b.settlements[n.settlement_id];
  const rng = new Rng(`${k.seed}:dialogue:${npcId}:${k.turn}:${option.topic}:${option.target ?? ''}`);
  const disposition = DISPOSITIONS.indexOf(n.disposition_to_outsiders);
  const base = { npc_id: npcId, question: option.label, rumors: [] as HeardRumor['rumor'][], referral: null as string | null, refused: false };
  const ctxTone = { tone: tone(n) };
  const say = (lines: string[]) => [rng.pick(ANSWER_OPENERS[n.speech_style]), ...lines].filter(Boolean).join(' ');
  const line = (pool: Template[], slots: Record<string, string> = {}, facts: Record<string, string> = {}) =>
    render(rng.fork('line'), pool, { facts: { ...ctxTone, ...facts }, slots });

  if (disposition < TOPIC_MIN[option.topic]) {
    return { ...base, answer: line(REFUSALS), reveals: [], refused: true };
  }

  const unknown = (id: string, groups: string[]) => groups.filter((g) => !knows(k, id, g));
  const facts = (id: string, groups: string[]) => {
    const g = unknown(id, groups);
    const s = factSentences(b, rng.fork(id), n.id, id, g);
    return { groups: g, text: s.text, mentions: g.length ? s.mentions : [] };
  };
  const refs = (id: string, groups: string[]) => groups.map((group) => ({ entity: id, group }));
  const nameOrMe = (id: string) => (id === n.id ? 'me' : entityName(b, id));

  switch (option.topic) {
    case 'self': {
      const groups = ['role', 'history', 'personality', 'affiliations', 'relationships'];
      if (disposition >= FRIENDLY) groups.push('goal');
      if (disposition >= WELCOMING || (disposition >= FRIENDLY && n.traits.includes('honest'))) groups.push('fear');
      const g = unknown(n.id, groups);
      if (g.length === 0) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say(selfSentences(b, rng, n, g)), reveals: [...refs(n.id, g), ...selfMentions(b, n, g)] };
    }
    case 'place': {
      const f = facts(home.id, ['appearance', 'people', 'faiths', 'economy', 'history', 'connections']);
      if (!f.groups.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say(f.text), reveals: [...refs(home.id, f.groups), ...f.mentions] };
    }
    case 'leaders': {
      const country = b.countries[home.country_id];
      const a = facts(home.id, ['governance']);
      const c = facts(country.id, ['government', 'ruler']);
      const reveals = [...refs(home.id, a.groups), ...a.mentions, ...refs(country.id, c.groups), ...c.mentions];
      if (b.planet.world_government && !knows(k, PLANET_ID, 'politics')) {
        const w = facts(PLANET_ID, ['politics']);
        reveals.push(...refs(PLANET_ID, w.groups), ...w.mentions);
        c.text.push(...w.text);
      }
      if (!reveals.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say([...a.text, ...c.text]), reveals };
    }
    case 'news': {
      const f = facts(home.id, ['events']);
      if (!f.groups.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      const involved = home.current_events.flatMap((e) => e.involved_refs).filter((r) => {
        const o = b.organizations[r];
        return !o || isPublicOrg(o);
      });
      return { ...base, answer: say(f.text), reveals: [...refs(home.id, f.groups), ...named(involved)] };
    }
    case 'powers': {
      const f = facts(home.id, ['organizations']);
      const orgs = home.organizations_present.map((o) => b.organizations[o])
        .filter((o) => isPublicOrg(o) && (o.visibility === 'public' || disposition >= FRIENDLY));
      const extra = orgs.flatMap((o) => facts(o.id, ['purpose']).text);
      const reveals = [...refs(home.id, f.groups), ...f.mentions, ...orgs.flatMap((o) => refs(o.id, unknown(o.id, ['name', 'purpose'])))];
      if (!reveals.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say([...f.text, ...extra.slice(0, 2)]), reveals };
    }
    case 'country': {
      const country = b.countries[home.country_id];
      const f = facts(country.id, npcKnows(b, n, country.id).filter((g) => g !== 'name'));
      if (!f.groups.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say(f.text.slice(0, 5)), reveals: [...refs(country.id, f.groups.slice(0, 5)), ...f.mentions] };
    }
    case 'world': {
      const f = facts(PLANET_ID, npcKnows(b, n, PLANET_ID).filter((g) => g !== 'name'));
      if (!f.groups.length) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      return { ...base, answer: say(f.text.slice(0, 4)), reveals: [...refs(PLANET_ID, f.groups.slice(0, 4)), ...f.mentions] };
    }
    case 'rumors': {
      const pool = rumorPool(b, n).filter((r) => r.subject_ref !== n.id && !k.rumors.some((h) => sameRumor(h.rumor, r)));
      if (!pool.length) return { ...base, answer: line(NO_RUMORS), reveals: [] };
      const count = disposition >= FRIENDLY ? 2 : 1;
      const picked = rng.sample(pool, count);
      const text = picked.map((r) => line(RUMOR_LINES, {
        subject: entityName(b, r.subject_ref), claim: RUMOR_PHRASE[r.claim_type], target: r.target_ref ? nameOrMe(r.target_ref) : '',
      }));
      // Hearing a rumor teaches only that its subject and target exist, never whether it is true.
      const reveals = picked.flatMap((r) => named([r.subject_ref, ...(r.target_ref && r.target_ref !== n.id ? [r.target_ref] : [])]));
      return {
        ...base, answer: say(text), reveals,
        rumors: picked.map((r) => ({ subject_ref: r.subject_ref, claim_type: r.claim_type, target_ref: r.target_ref })),
      };
    }
    case 'work': {
      if (knows(k, n.id, 'hooks')) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      if (n.quest_hooks.length === 0) return { ...base, answer: line(NO_WORK), reveals: [] };
      const text = n.quest_hooks.map((h) => line(WORK_LINES, {
        quest: fill(QUEST_PHRASE[h.type], { facts: {}, slots: { target: listOf(h.target_refs.map(nameOrMe)) } }),
        reward: REWARD_PHRASE[h.reward_type],
      }));
      return { ...base, answer: say(text), reveals: [...refs(n.id, ['hooks']), ...named(n.quest_hooks.flatMap((h) => h.target_refs))] };
    }
    case 'about': {
      const target = option.target!;
      if (target === n.id) return ask(b, k, npcId, { ...option, topic: 'self' });
      const known = npcKnows(b, n, target);
      const f = facts(target, known.filter((g) => g !== 'name'));
      if (f.groups.length) {
        return { ...base, answer: say(f.text.slice(0, 5)), reveals: [...refs(target, f.groups.slice(0, 5)), ...f.mentions] };
      }
      if (known.length > 1) return { ...base, answer: line(NOTHING_NEW), reveals: [] };
      // They do not know: point to someone who does.
      const referral = disposition >= REFERS_FROM ? findReferral(b, k, n, target) : null;
      if (!referral) return { ...base, answer: line(DONT_KNOW), reveals: [] };
      const r = b.npcs[referral];
      const rp = pronounsFor(r);
      const answer = render(rng.fork('referral'), REFERRALS, {
        facts: { ref_plural: yes(rp.plural) }, plural: rp.plural,
        slots: { ref_name: r.name, ref_role: words(r.occupation), ref_place: b.settlements[r.settlement_id].name, ref_they: rp.they },
      });
      return { ...base, answer, referral, reveals: [...refs(r.id, ['name', 'role']), ...named([r.settlement_id])] };
    }
  }
}

/** Record a turn: learn its facts, remember its rumors, log it. */
export function applyTurn(b: PlanetBundle, k: Knowledge, turn: DialogueTurn): Knowledge {
  const met = meet(b, k, turn.npc_id);
  const { knowledge, learned } = learn(met.knowledge, turn.reveals);
  const rumors = [...knowledge.rumors];
  for (const r of turn.rumors) {
    if (!rumors.some((h) => h.rumor.subject_ref === r.subject_ref && h.rumor.claim_type === r.claim_type && h.rumor.target_ref === r.target_ref)) {
      rumors.push({ rumor: r, heard_from: turn.npc_id, turn: k.turn });
    }
  }
  return {
    ...knowledge,
    rumors,
    turn: k.turn + 1,
    log: [...knowledge.log, { turn: k.turn, npc_id: turn.npc_id, question: turn.question, answer: turn.answer, learned: [...met.learned, ...learned] }],
  };
}

/** Topics on which this NPC could still tell the player something new (used to grey out exhausted options). */
export function exhausted(b: PlanetBundle, k: Knowledge, npcId: string, option: DialogueOption): boolean {
  const t = ask(b, k, npcId, option);
  return !t.refused && t.reveals.every((f) => knows(k, f.entity, f.group)) && t.rumors.length === 0;
}

