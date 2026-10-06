import type { Template } from '../generator/content/prose/templates';
import type { RewardType, SpeechStyle } from '../generator';

/**
 * Dialogue lines. Same template syntax as the prose templates
 * ({slot}, {slot|a|cap}, [optional], <sing/plur>, when-conditions).
 */

/** How an answer opens, by speech style. An empty line means "no preamble". */
export const ANSWER_OPENERS: Record<SpeechStyle, string[]> = {
  formal: ['Certainly.', 'As you wish.'],
  blunt: ['Fine.', 'Short version:'],
  flowery: ['Ah, what a question!', 'Gladly, gladly.'],
  terse: ['', 'Hm.'],
  rambling: ['Oh, well, where to begin.', 'That’s a long story, but here goes.'],
  sarcastic: ['Oh, you want to know that? Fine.', 'Riveting question.'],
  cryptic: ['Some answers are doors.', 'Listen closely.'],
  folksy: ['Well now.', 'Let me tell you.'],
  academic: ['An interesting question.', 'To be precise:'],
  nervous: ['Oh, um, all right.', 'I, well, I suppose I can tell you.'],
  menacing: ['Since you ask nicely.', 'Listen carefully. I won’t repeat it.'],
  cheerful: ['Oh, happy to help!', 'Ooh, good question!'],
};

/** Refusals, by tone (cold: hostile/suspicious/wary, neutral otherwise). */
export const REFUSALS: Template[] = [
  { text: 'I don’t talk to outsiders.', when: { tone: ['cold'] } },
  { text: 'That’s none of your business.', when: { tone: ['cold'] } },
  { text: 'Ask someone else. Better yet, leave.', when: { tone: ['cold'] } },
  { text: 'I’d rather not say.', when: { tone: ['neutral', 'warm'] } },
  { text: 'That’s not something I discuss with strangers.', when: { tone: ['neutral', 'warm'] } },
];

export const REFERRALS: Template[] = [
  { text: 'I couldn’t tell you. {ref_name}, {ref_role|a} in {ref_place}, would know.' },
  { text: 'Not my area. Try {ref_name} in {ref_place}; {ref_they} <knows/know> about that.', when: { ref_plural: ['no'] } },
  { text: 'Not my area. Try {ref_name} in {ref_place}; they know about that.', when: { ref_plural: ['yes'] } },
  { text: 'No idea, but {ref_name} might. Look for {ref_role|a} by that name in {ref_place}.' },
];

export const DONT_KNOW: Template[] = [
  { text: 'I’ve no idea, and I can’t think who would.' },
  { text: 'Never heard of it. Sorry.' },
  { text: 'That’s beyond anything I know.' },
];

export const NOTHING_NEW: Template[] = [
  { text: 'That’s all I know.' },
  { text: 'I’ve told you everything I can about that.' },
  { text: 'I’ve nothing more to add.' },
];

export const NO_RUMORS: Template[] = [
  { text: 'I haven’t heard anything worth repeating.' },
  { text: 'No gossip from me today.' },
];

export const NO_WORK: Template[] = [
  { text: 'Nothing I’d trust a stranger with.' },
  { text: 'I’ve no work for you.' },
];

export const RUMOR_LINES: Template[] = [
  { text: 'They say {subject} {claim}[, and that {target} is mixed up in it].' },
  { text: 'Word is that {subject} {claim}[; {target} comes into it somehow].' },
  { text: 'I heard {subject} {claim}. Don’t say it came from me.' },
];

export const WORK_LINES: Template[] = [
  { text: 'I need someone to {quest}. I’d pay you in {reward}.' },
  { text: 'If you want work: {quest}. You’ll get {reward} for it.' },
];

export const REWARD_PHRASE: Record<RewardType, string> = {
  money: 'coin', item: 'something worth having', information: 'what I know', favor: 'a favor owed', membership: 'a place among us',
};

/**
 * Fact sentences: one pool per entity kind and fact group, in the speaker's
 * voice. Where the speaker could be the person named (a leader, ruler or
 * member), the `speaker`/`member` facts pick a first-person line.
 * Self-description uses SELF_LINES.
 */
export const FACT_LINES: Record<string, Template[]> = {
  // Planet
  'planet.politics': [
    { text: '{world_gov|cap} rules all of {planet}.', when: { unified: ['yes'] } },
    { text: '{planet|cap} is a federation under {world_gov}: {countries}.', when: { unified: ['no'], federation: ['yes'] } },
    { text: '{planet|cap} is split among {politics}: {countries}.', when: { unified: ['no'], federation: ['no'] } },
  ],
  'planet.population': [{ text: 'There are {population} of us on {planet}.' }, { text: 'Some {population} people live on {planet}.' }],
  'planet.faiths_languages': [{ text: 'Most speak {languages}[, and the great faiths are {faiths}].' }],
  'planet.species_mix': [
    { text: '{species_list|cap} share this world[; the {native} were here first].' },
    { text: 'You’ll meet {species_list} here.' },
  ],
  'planet.history': [{ text: 'Long ago there was {first_event}[; more recently, {last_event}].' }],
  'planet.oddities': [
    { text: 'Strange things happen here: {anomalies}.', when: { has_anomalies: ['yes'] } },
    { text: 'Nothing truly strange happens here, whatever the stories say.', when: { has_anomalies: ['no'] } },
  ],
  'planet.features': [{ text: 'People travel far to see {features}.' }],
  'planet.economy': [{ text: 'This is {wealth|a} world; the law is {law}, and travel is {danger}.' }],
  'planet.galactic': [
    { text: 'Offworld traders come for {exports}[, and we answer to {faction}].', when: { trades: ['yes'] } },
    { text: 'Ships from beyond the sky rarely come here.', when: { trades: ['no'] } },
  ],
  'planet.resources': [{ text: 'The land gives {resources}.' }],
  'planet.hazards': [{ text: 'Watch out for {hazards}.' }],

  // Country
  'country.flag': [{ text: 'Its flag shows {flag|lower}.' }],
  'country.tech': [{ text: 'They build at the level of {tech}.' }],
  'country.government': [{ text: '{name|cap} is {government|a}, {stability} these days.' }],
  'country.ruler': [
    { text: '{ruler_title|cap} {ruler_name} rules {name} from {capital}.', when: { speaker: ['no'] } },
    { text: 'I rule {name} from {capital}, as {ruler_title}.', when: { speaker: ['yes'] } },
  ],
  'country.territory': [{ text: '{name|cap} covers {biomes}[ and borders {neighbors}].' }],
  'country.population': [{ text: 'Some {population} people live in {name}, mostly {species}.' }],
  'country.economy': [{ text: '{name|cap} lives by {industries}[ and sells {exports} abroad].' }],
  'country.military': [{ text: 'Its army is {military} and relies on {doctrine}.' }],
  'country.relations': [{ text: '{name|cap} is {relations}.' }],
  'country.culture': [{ text: 'Its people prize {values}; their motto is “{motto}”.' }],
  'country.history': [{ text: '{name|cap} was founded {founded_ago}[ and still remembers {event}].' }],

  // Settlement
  'settlement.appearance': [
    { text: '{name|cap} is {type|a} {terrain}, with {population} people.' },
    { text: '{name|cap}? {type|a|cap} of {population}, built {terrain}.' },
  ],
  'settlement.people': [{ text: 'Mostly {species} in {name}[, speaking {languages}].' }],
  'settlement.connections': [{ text: 'From {name} the roads lead to {connections}.' }],
  'settlement.faiths': [{ text: 'People in {name} mostly follow {faith}.' }],
  'settlement.governance': [
    { text: '{leader_name|cap} runs {name}, as {leader_title}.', when: { speaker: ['no'] } },
    { text: '{name|cap} answers to {leader_title} {leader_name}.', when: { speaker: ['no'] } },
    { text: 'I run {name}, as {leader_title}.', when: { speaker: ['yes'] } },
    { text: '{name|cap} answers to me. I’m its {leader_title}.', when: { speaker: ['yes'] } },
  ],
  'settlement.economy': [{ text: 'Most work in {name} is in {industries}[, and it’s known for {goods}].' }],
  'settlement.events': [
    { text: 'In {name}, everyone’s talking about {events}.', when: { has_events: ['yes'] } },
    { text: 'Nothing much is happening in {name}.', when: { has_events: ['no'] } },
  ],
  'settlement.organizations': [
    { text: '{orgs|cap} <has/have> a hand in things in {name}.', when: { has_orgs: ['yes'] } },
    { text: 'No organization of note runs {name}.', when: { has_orgs: ['no'] } },
  ],
  'settlement.history': [{ text: '{name|cap} was founded {founded_ago}[; folk call it {nickname}].' }],

  // Organization
  'organization.purpose': [{ text: '{name|cap} says it exists to {goal}; mostly that means {activities}.' }],
  'organization.scope': [{ text: '{name|cap} is based in {hq}[ and has people in {presence}].' }],
  'organization.leadership': [
    { text: '{leader_name|cap} leads {name}, as {leader_title}.', when: { leader_known: ['yes'], speaker: ['no'] } },
    { text: 'I lead {name}, as {leader_title}.', when: { leader_known: ['yes'], speaker: ['yes'] } },
    { text: 'No one seems to know who really leads {name}.', when: { leader_known: ['no'] } },
  ],
  'organization.status': [{ text: '{name|cap} {legality}, and its influence is {influence}.' }],
  'organization.relations': [{ text: '{name|cap} is {relations}.' }],
  'organization.members': [
    { text: 'Members of {name} I know of: {members}.', when: { member: ['no'], has_members: ['yes'] } },
    { text: 'I couldn’t name any members of {name}.', when: { member: ['no'], has_members: ['no'] } },
    { text: 'I’m a member of {name}, along with {members}.', when: { member: ['yes'], has_members: ['yes'] } },
    { text: 'I’m a member of {name}, but I couldn’t name any others.', when: { member: ['yes'], has_members: ['no'] } },
  ],
  'organization.history': [{ text: '{name|cap} was founded {founded_ago}.' }],

  // NPC (about someone else)
  'npc.role': [
    { text: '{name|cap} is {occupation|a} in {place}[, {title}].' },
    { text: 'You’ll find {name} in {place}; {they} <works/work> as {occupation|a}.' },
  ],
  'npc.appearance': [{ text: 'You’ll know {them} by {appearance}.' }],
  'npc.personality': [{ text: '{name|cap} is {traits}.' }],
  'npc.location': [
    { text: 'You’ll usually find {name} at {location}[, {reason}].' },
    { text: 'Look for {name} at {location}.' },
  ],
  'npc.affiliations': [{ text: '{name|cap} is with {orgs}.', when: { has_orgs: ['yes'] } }, { text: '{name|cap} keeps to {themself}.', when: { has_orgs: ['no'] } }],

  // Peoples
  'species.biology': [{ text: '{plural|cap} are {biology}[ and live around {lifespan} years].' }],
  'religion.details': [{ text: '{name|cap} is {kind|a}; its followers value {tenets}.' }],
  'language.details': [{ text: '{name|cap} is the tongue of the {speakers}.' }],
};

/** The NPC talking about themself. */
export const SELF_LINES: Record<string, Template[]> = {
  role: [
    { text: 'I’m {occupation|a}[ at {workplace}].', when: { leader: ['no'] } },
    { text: 'I serve as {title} of {led}.', when: { leader: ['yes'] } },
  ],
  history: [{ text: 'I was born {born_ago} in {birthplace}[, and I {life_event}].' }],
  personality: [{ text: 'People say I’m {traits}.' }, { text: 'I suppose I’m {traits}.' }],
  affiliations: [
    { text: 'I’m with {orgs}[, and I follow {faith}].', when: { has_orgs: ['yes'] } },
    { text: 'I follow {faith}.', when: { has_orgs: ['no'], has_faith: ['yes'] } },
    { text: '', when: { has_orgs: ['no'], has_faith: ['no'] } },
  ],
  relationships: [{ text: '{relations|cap}.', when: { has_relations: ['yes'] } }, { text: '', when: { has_relations: ['no'] } }],
  goal: [{ text: 'Truth be told, I want to {goal}.' }, { text: 'What I want most is to {goal}.' }],
  fear: [{ text: 'If I’m honest, I fear {fear}.' }, { text: 'What keeps me up at night is {fear}.' }],
};
