import { CULTURE_VALUE_TABLE, CURRENT_EVENT_TABLE, FACTION_TABLE } from '../content';
import {
  AGE_ADJ, ANOMALY_PHRASE, APPEARANCE_PHRASE, ATMOSPHERE_ADJ, ATTITUDE_PHRASE, BIOME_PHRASE, BIOSPHERE_SENTENCES, CLOTHING_PHRASE,
  CURRENT_EVENT_PHRASE, DISPOSITION_PHRASE, DISTRICT_FLAVOR, DOCTRINE_PHRASE, ORG_STRUCTURE_PHRASE, EVENT_NOUN, GOVERNMENT_NOUN, LEGALITY_PHRASE, LIFE_EVENT_CLAUSE,
  MARK_PHRASE, MEGASTRUCTURE_CONDITION_PHRASE, ORG_NOUN, OUTCOME_PHRASE, PLANET_TYPE_NOUN, POLITICAL_PHRASE,
  REASON_PHRASE, RELATION_REASON_PHRASE, SCOPE_PHRASE, SETTLEMENT_NOUN, SIZE_ADJ, SPEECH_PHRASE, TERRAIN_PHRASE,
  VISIBILITY_PHRASE,
} from '../content/prose/lexicon';
import {
  COUNTRY_DESCRIPTION, COUNTRY_TAGLINES, DISTRICT_DESCRIPTIONS, NPC_BACKSTORY_EVENTS, NPC_BACKSTORY_MOTIVES,
  NPC_BACKSTORY_OPENINGS, NPC_BACKSTORY_ROLES, NPC_DESCRIPTION, NPC_GREETINGS, NPC_TAGLINES, ORG_DESCRIPTION, ORG_TAGLINES,
  PLANET_DESCRIPTION, PLANET_TAGLINES, SETTLEMENT_DESCRIPTION, SETTLEMENT_TAGLINES,
} from '../content/prose/templates';
import type { Rng } from '../rng';
import { isSpacefaring, tradesOffworld } from '../rules/economy';
import { LIQUID_SEA_BIOMES } from '../rules/physical';
import type { Country, Npc, Organization, PlanetBundle, Relation, Settlement } from '../types/entities';
import { entityName } from '../types/ids';
import { eventIndex } from '../validate/refs';
import { renderPoi, renderTreasure, showcasePois } from './places';
import { fill, listOf, render, renderGroups, type RenderContext } from './engine';
import { IT, fearPhrase, goalPhrase, populationWords, pronounsFor, tempWords, words, yearsAgo, yearsShort } from './words';

const yes = (b: boolean) => (b ? 'yes' : 'no');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Pipeline step 11: render every prose field from structured data. Renderers
 * only read the bundle; each field has its own forked stream.
 */
export function renderStep(bundle: PlanetBundle, rng: Rng): void {
  renderPlanet(bundle, rng.fork('planet'));
  for (const c of Object.values(bundle.countries)) renderCountry(bundle, rng.fork(c.id), c);
  for (const s of Object.values(bundle.settlements)) renderSettlement(bundle, rng.fork(s.id), s);
  for (const o of Object.values(bundle.organizations)) renderOrg(bundle, rng.fork(o.id), o);
  const events = eventIndex(bundle);
  for (const n of Object.values(bundle.npcs)) renderNpc(bundle, rng.fork(n.id), n, events);
  for (const poi of Object.values(bundle.pois)) renderPoi(bundle, rng.fork(poi.id), poi);
  for (const t of Object.values(bundle.treasures)) renderTreasure(bundle, rng.fork(t.id), t);
}

function prose(rng: Rng, key: string, fn: (r: Rng) => string): string {
  return fn(rng.fork(key));
}

// ---------------------------------------------------------------------------

function renderPlanet(b: PlanetBundle, rng: Rng): void {
  const p = b.planet;
  const land = p.biomes.filter((x) => !LIQUID_SEA_BIOMES.has(x.biome));
  const biomes = (land.length ? land : p.biomes).map((x) => BIOME_PHRASE[x.biome]);
  const species = p.species.map((s) => b.species[s.species_id].plural_name);
  const wg = p.world_government;
  const seat = wg?.leader_npc_id ? b.settlements[b.npcs[wg.leader_npc_id].settlement_id].name : '';
  const water = p.water_coverage > 0.6 ? 'seas covering most of its surface' : p.water_coverage > 0.15 ? 'scattered seas' : '';
  const [first, last] = [p.history[0], p.history.length > 1 ? p.history[p.history.length - 1] : undefined];
  const flavorAnomaly = p.anomalies[0];
  const feature = p.notable_features[0];
  const mega = p.megastructures[0];
  const ctx: RenderContext = {
    facts: {
      divided: yes(!wg), has_world_gov: yes(!!wg), has_feature: yes(!!feature), has_anomaly: yes(!!flavorAnomaly),
      has_megastructure: yes(!!mega), contacted: yes(p.galactic_connectivity !== 'uncontacted'),
      aligned: yes(!['none', 'independent'].includes(p.faction_allegiance)), has_exports: yes(p.primary_exports.length > 0),
      two_biomes: yes(biomes.length > 1), renamed: yes(p.native_name !== p.name),
      spacefaring: yes(isSpacefaring(p)), trades: yes(tradesOffworld(p)), origin: p.settlement_origin,
    },
    slots: {
      name: p.name, native_name: p.native_name, system: p.star_system, type_noun: PLANET_TYPE_NOUN[p.planet_type],
      size: SIZE_ADJ[p.size_class], atmosphere: ATMOSPHERE_ADJ[p.atmosphere.composition], biome1: biomes[0], biome2: biomes[1] ?? '',
      biomes: listOf(biomes.slice(0, 3)), water, temp_min: tempWords(p.temperature_range.min), temp_max: tempWords(p.temperature_range.max),
      day: p.tidally_locked ? 'unending' : p.day_length_hours < 16 ? 'short' : p.day_length_hours > 40 ? 'long' : 'ordinary',
      moons: p.moons.length === 0 ? '' : p.moons.length === 1 ? `a single moon, ${p.moons[0].name}` : `${p.moons.length} moons`,
      biosphere_sentence: rng.fork('biosphere').pick(BIOSPHERE_SENTENCES[p.biosphere]),
      population: populationWords(p.population), species_main: species[0], species_minor: listOf(species.slice(1)),
      species_list: listOf(species), languages: listOf(p.dominant_languages.map((id) => b.languages[id].name)),
      world_gov: wg?.name ?? '', seat, politics: fill(POLITICAL_PHRASE[p.political_structure], { facts: {}, slots: { count: String(p.country_count) } }),
      stability: p.stability, wealth: p.wealth_level,
      exports: listOf(p.primary_exports.slice(0, 3).map(words)), imports: listOf(p.primary_imports.slice(0, 2).map(words)),
      faction: FACTION_TABLE[p.faction_allegiance].name,
      feature: feature?.name ?? '', anomaly: flavorAnomaly ? ANOMALY_PHRASE[flavorAnomaly.type] : '',
      megastructure: mega?.name ?? '', mega_condition: mega ? MEGASTRUCTURE_CONDITION_PHRASE[mega.condition] : '',
      first_event: first ? EVENT_NOUN[first.event_type] : 'its founding', first_ago: first ? yearsAgo(first.date) : '',
      first_outcome: first ? OUTCOME_PHRASE[first.outcome] : '', last_event: last ? EVENT_NOUN[last.event_type] : '',
      last_ago: last ? yearsAgo(last.date) : '', last_outcome: last ? OUTCOME_PHRASE[last.outcome] : '',
    },
  };
  p.tagline = prose(rng, 'tagline', (r) => render(r, PLANET_TAGLINES, ctx));
  p.description = prose(rng, 'description', (r) => renderGroups(r, PLANET_DESCRIPTION, ctx));
}

// ---------------------------------------------------------------------------

function strongestRelation(relations: Relation[], kinds: (id: string) => boolean): Relation | undefined {
  const order = ['at_war', 'allied', 'hostile', 'friendly', 'rival', 'neutral'];
  return relations.filter((r) => kinds(r.target_ref)).sort((x, y) => order.indexOf(x.attitude) - order.indexOf(y.attitude))[0];
}

function renderCountry(b: PlanetBundle, rng: Rng, c: Country): void {
  const ruler = c.ruler_npc_id ? b.npcs[c.ruler_npc_id] : null;
  const species = c.species.map((s) => b.species[s.species_id].plural_name);
  const rel = strongestRelation(c.relations, (id) => id in b.countries);
  const war = c.relations.find((r) => r.target_ref in b.countries && r.attitude === 'at_war');
  const last = c.key_events.length > 1 ? c.key_events[c.key_events.length - 1] : undefined;
  const ctx: RenderContext = {
    facts: { at_war: yes(!!war), has_feature: yes(c.notable_features.length > 0), has_relation: yes(!!rel), has_events: yes(!!last) },
    slots: {
      name: c.name, government: GOVERNMENT_NOUN[c.government_type], stability: c.stability, ruler_title: c.ruler_title,
      ruler_name: ruler?.name ?? '', capital: c.capital_settlement_id ? b.settlements[c.capital_settlement_id].name : '',
      demonym: c.demonym, motto: c.motto, biome1: BIOME_PHRASE[(c.biomes.find((x) => !LIQUID_SEA_BIOMES.has(x.biome)) ?? c.biomes[0]).biome], industry: words(c.primary_industries[0]),
      species_main: species[0], species_minor: listOf(species.slice(1)), language: b.languages[c.languages[0]].name,
      faith: c.religions_or_ideologies[0] ? b.religions[c.religions_or_ideologies[0].religion_id].name : '',
      values: listOf(c.values.map((v) => CULTURE_VALUE_TABLE[v].noun.toLowerCase())), custom: c.customs[0] ? words(c.customs[0]) : '',
      wealth: c.wealth_level, industries: listOf(c.primary_industries.map(words)), exports: listOf(c.exports.map(words)),
      currency: c.currency_name, military: c.military_strength, doctrine: DOCTRINE_PHRASE[c.military_doctrine],
      relation: rel ? ATTITUDE_PHRASE[rel.attitude] : '', other_country: rel ? entityName(b, rel.target_ref) : '',
      relation_reason: rel ? RELATION_REASON_PHRASE[rel.reason] : '', enemy: war ? entityName(b, war.target_ref) : '',
      founded_ago: yearsAgo(c.founding_date), last_event: last ? EVENT_NOUN[last.event_type] : '',
      last_outcome: last ? OUTCOME_PHRASE[last.outcome] : '', feature: c.notable_features[0]?.name ?? '',
      population: populationWords(c.population),
    },
  };
  c.tagline = prose(rng, 'tagline', (r) => render(r, COUNTRY_TAGLINES, ctx));
  c.description = prose(rng, 'description', (r) => renderGroups(r, COUNTRY_DESCRIPTION, ctx));
}

// ---------------------------------------------------------------------------

function publicOrgs(b: PlanetBundle, ids: string[]): Organization[] {
  return ids.map((id) => b.organizations[id]).filter((o) => o.visibility === 'public' && o.legality !== 'outlawed');
}

function renderSettlement(b: PlanetBundle, rng: Rng, s: Settlement): void {
  const country = b.countries[s.country_id];
  const leader = s.leader_npc_id ? b.npcs[s.leader_npc_id] : null;
  const species = s.species.map((x) => b.species[x.species_id].plural_name);
  const orgs = publicOrgs(b, s.organizations_present);
  const event = s.current_events[0];
  const showcase = showcasePois(b, s);
  const last = s.key_events.length > 1 ? s.key_events[s.key_events.length - 1] : undefined;
  const ctx: RenderContext = {
    facts: {
      has_poi: yes(showcase.length > 0), has_event: yes(!!event), capital: yes(s.settlement_type === 'capital'),
      has_org: yes(orgs.length > 0), has_events: yes(!!last),
      event_fits: yes(!!event && (CURRENT_EVENT_TABLE[event.type].moods?.[s.mood] ?? 0) > 1),
    },
    plural: orgs.length > 1,
    slots: {
      name: s.name, nickname: s.nickname, type_noun: SETTLEMENT_NOUN[s.settlement_type], country: country.name, mood: s.mood,
      wealth: s.wealth_level, goods: listOf(s.notable_goods.map(words)), terrain: TERRAIN_PHRASE[s.terrain],
      poi: showcase[0]?.name ?? '', event: event ? CURRENT_EVENT_PHRASE[event.type] : '',
      species_main: species[0], species_minor: listOf(species.slice(1)), industry: words(s.primary_industries[0]),
      org: orgs[0]?.name ?? '', population: populationWords(s.population), biome: BIOME_PHRASE[s.biome],
      language: b.languages[s.languages[0]].name,
      faith: s.religions_or_ideologies[0] ? b.religions[s.religions_or_ideologies[0].religion_id].name : '',
      leader_title: s.leader_title, leader_name: leader?.name ?? '', corruption: s.corruption_level === 'none' ? '' : s.corruption_level,
      law: s.law_level, governing_body: words(s.governing_body), industries: listOf(s.primary_industries.map(words)),
      pois: listOf(showcase.slice(0, 3).map((x) => x.name)), districts: listOf(s.districts.slice(0, 3).map((d) => d.name)),
      orgs: listOf(orgs.slice(0, 3).map((o) => o.name)), founded_ago: yearsAgo(s.founding_date),
      last_event: last ? EVENT_NOUN[last.event_type] : '',
    },
  };
  s.tagline = prose(rng, 'tagline', (r) => render(r, SETTLEMENT_TAGLINES, ctx));
  s.description = prose(rng, 'description', (r) => renderGroups(r, SETTLEMENT_DESCRIPTION, ctx));

  s.districts.forEach((d, i) => {
    const r = rng.fork(`district:${i}`);
    d.description = render(r, DISTRICT_DESCRIPTIONS, {
      facts: {}, slots: { name: d.name, district: words(d.type), settlement: s.name, flavor: r.pick(DISTRICT_FLAVOR[d.type]) },
    });
  });

}

// ---------------------------------------------------------------------------

function renderOrg(b: PlanetBundle, rng: Rng, o: Organization): void {
  const hq = b.settlements[o.headquarters_settlement_id];
  const leader = o.leader_npc_id ? b.npcs[o.leader_npc_id] : null;
  const leaderKnown = !!leader && !!leader.leads.find((l) => l.entity_id === o.id)?.public;
  const rel = strongestRelation(o.relations, () => true);
  const homeCountry = o.scope_level === 'country' ? b.countries[o.home_ref] : b.countries[hq.country_id];
  const first = o.key_events[0];
  const scope = fill(SCOPE_PHRASE[o.scope_level], {
    facts: {}, slots: { planet: b.planet.name, country: homeCountry.name, settlement: entityName(b, o.home_ref) },
  });
  const ctx: RenderContext = {
    facts: { visibility: o.visibility, state: yes(o.state_role !== 'none'), has_rival: yes(!!rel), leader_known: yes(leaderKnown) },
    slots: {
      name: o.name, org_noun: ORG_NOUN[o.org_type], home: entityName(b, o.home_ref), stated_goal: goalPhrase(b, o.stated_goal, IT),
      hq: hq.name, motto: o.motto, symbol: o.symbol_description, influence: o.influence, wealth: o.wealth_level,
      relation: rel ? ATTITUDE_PHRASE[rel.attitude] : '', relation_short: rel ? words(rel.attitude) : '',
      rival: rel ? entityName(b, rel.target_ref) : '', relation_reason: rel ? RELATION_REASON_PHRASE[rel.reason] : '',
      scope, visibility: VISIBILITY_PHRASE[o.visibility], legality: LEGALITY_PHRASE[o.legality],
      state_role: words(o.state_role).replace(/^state /, ''), country: homeCountry.name,
      leader_title: o.leader_title, leader_name: leaderKnown ? leader!.name : '',
      leader_home: leaderKnown && leader!.settlement_id !== hq.id ? b.settlements[leader!.settlement_id].name : '',
      structure: ORG_STRUCTURE_PHRASE[o.structure], activities: listOf(o.activities.map(words)),
      founded_ago: yearsAgo(o.founding_date), founded_ago_short: yearsShort(o.founding_date),
      first_event: first ? EVENT_NOUN[first.event_type] : '',
    },
  };
  o.tagline = prose(rng, 'tagline', (r) => render(r, ORG_TAGLINES, ctx));
  o.description = prose(rng, 'description', (r) => renderGroups(r, ORG_DESCRIPTION, ctx));
}

// ---------------------------------------------------------------------------

const TONE: Record<string, 'cold' | 'neutral' | 'warm'> = {
  hostile: 'cold', suspicious: 'cold', wary: 'cold', neutral: 'neutral', curious: 'neutral', friendly: 'warm', welcoming: 'warm',
};

function renderNpc(b: PlanetBundle, rng: Rng, n: Npc, events: ReturnType<typeof eventIndex>): void {
  const s = b.settlements[n.settlement_id];
  const country = b.countries[s.country_id];
  const species = b.species[n.species_id];
  const pr = pronounsFor(n);
  // Only public roles appear in prose; hidden leadership stays secret.
  const publicLead = n.leads.find((l) => l.public);
  const led = publicLead ? entityName(b, publicLead.entity_id) : '';
  const orgs = publicOrgs(b, n.organization_ids);
  const workplace = n.workplace_poi_id ? b.pois[n.workplace_poi_id]?.name ?? '' : '';
  const appearance = n.appearance.map((a) => APPEARANCE_PHRASE[a]);
  const ageAdj = AGE_ADJ[n.age_category];
  const slots: Record<string, string> = {
    name: n.name, given: n.given_name, occupation: words(n.occupation), settlement: s.name, country: country.name,
    epithet: n.title_or_epithet.startsWith('the ') ? n.title_or_epithet : '', title: publicLead ? n.title_or_epithet : '',
    led, trait1: n.traits[0], trait2: n.traits[1] ?? n.traits[0], traits: listOf(n.traits),
    species: species.name, species_word: species.name, species_plural: species.plural_name,
    species_age: ageAdj ? `${ageAdj} ${species.name}` : species.name,
    goal: goalPhrase(b, n.goal!, pr), goal_reason: REASON_PHRASE[n.goal!.reason], fear: fearPhrase(b, n.fear!, pr),
    speech: fill(SPEECH_PHRASE[n.speech_style], { facts: {}, slots: {}, plural: pr.plural }),
    disposition: DISPOSITION_PHRASE[n.disposition_to_outsiders], disposition_word: n.disposition_to_outsiders,
    appearance: listOf(appearance), appearance1: appearance[0], appearance_bare: appearance[0].replace(/^(a|an) /, ''),
    mark: MARK_PHRASE[n.distinguishing_mark], clothing: CLOTHING_PHRASE[n.clothing], workplace,
    orgs: listOf(orgs.map((o) => o.name)), faith: n.religion_or_ideology ? b.religions[n.religion_or_ideology].name : '',
    They: pr.they, they: pr.they, them: pr.them, their: pr.their,
    born_ago: yearsAgo(-n.age), birthplace: s.name, age: String(n.age),
  };
  const facts = {
    category: publicLead ? 'leader' : 'notable', has_org: yes(orgs.length > 0), has_faith: yes(!!n.religion_or_ideology),
    tone: TONE[n.disposition_to_outsiders], speech: n.speech_style,
  };
  const ctx: RenderContext = { facts, slots, plural: pr.plural };

  n.tagline = prose(rng, 'tagline', (r) => render(r, NPC_TAGLINES, ctx));
  n.description = prose(rng, 'description', (r) => renderGroups(r, NPC_DESCRIPTION, ctx));
  n.sample_greeting = prose(rng, 'greeting', (r) => render(r, NPC_GREETINGS, ctx));

  // Backstory: birth, a few life events, present role, motives.
  const br = rng.fork('backstory');
  const parts = [render(br.fork('opening'), NPC_BACKSTORY_OPENINGS, ctx)];
  n.key_life_events.filter((e) => e.event_type !== 'birth' && LIFE_EVENT_CLAUSE[e.event_type]).slice(0, 3).forEach((e, i) => {
    const r = br.fork(`event:${i}`);
    const clause = fill(r.pick(LIFE_EVENT_CLAUSE[e.event_type]!), { facts: {}, slots, plural: pr.plural });
    const parent = e.parent_event_id ? events.get(e.parent_event_id) : undefined;
    parts.push(render(r, NPC_BACKSTORY_EVENTS, {
      facts, plural: pr.plural,
      slots: { ...slots, clause, when: yearsAgo(e.date), age_then: `age ${n.age + e.date}`, parent_event: parent ? EVENT_NOUN[parent.event_type] : '' },
    }));
  });
  parts.push(render(br.fork('role'), NPC_BACKSTORY_ROLES, ctx));
  parts.push(render(br.fork('motive'), NPC_BACKSTORY_MOTIVES, ctx));
  n.backstory = parts.map(cap).join(' ');
}
