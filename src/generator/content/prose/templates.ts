/**
 * Prose templates. Syntax (see render/engine.ts):
 *   {slot}            value of a slot; missing slots are an error
 *   {slot|cap}        capitalize first letter; also |a (add a/an), |lower
 *   [ ... ]           optional segment, dropped if any slot inside is empty
 *   <sing/plur>       verb form chosen by the subject's grammatical number
 *   when: {...}       the template is eligible only if every listed fact matches
 * A rendered field picks one eligible template by weight and seeded RNG.
 */
export interface Template {
  text: string;
  weight?: number;
  when?: Record<string, readonly string[]>;
}

/** A description is a sequence of sentence groups, each its own template pool. */
export type TemplateGroups = Template[][];

// ---------------------------------------------------------------------------
// Planet

export const PLANET_TAGLINES: Template[] = [
  { text: '{type_noun|a|cap} of {biome1}, home to {species_list}.' },
  { text: 'A {stability} {type_noun} divided among {politics}.', when: { divided: ['yes'] } },
  { text: 'A {stability} {type_noun} under {world_gov}.', when: { has_world_gov: ['yes'] } },
  { text: 'The {size} {type_noun} of the {system} system.' },
  { text: 'Where {feature} looks down on {population} souls.', when: { has_feature: ['yes'] } },
  { text: '{name}: {biome1}, {biome2} and {population} people.', when: { two_biomes: ['yes'] } },
  { text: 'A {stability} world whose people have never left their own sky.', when: { spacefaring: ['no'], origin: ['native', 'mixed'] } },
  { text: 'A {stability} world that has forgotten the stars its founders came from.', when: { spacefaring: ['no'], origin: ['lost_colony'] } },
  { text: 'A {stability} colony, cut off from the ships that brought it.', when: { spacefaring: ['no'], origin: ['colonial'] } },
  { text: 'A {wealth} world known across the region for {exports}.', when: { contacted: ['yes'], has_exports: ['yes'] } },
  { text: 'Strange things happen on {name}: {anomaly}.', when: { has_anomaly: ['yes'] } },
];

export const PLANET_DESCRIPTION: TemplateGroups = [
  [
    { text: '{name} is {size|a} {type_noun} in the {system} system[, circled by {moons}].' },
    { text: 'Orbiting {system}[ with {moons}], {name} is {size|a} {type_noun} of {biome1} and {biome2}.', when: { two_biomes: ['yes'] } },
    { text: 'Seen from orbit, {name} is {size|a} {type_noun} of {biome1}[ beneath {moons}].' },
    { text: '{native_name|cap}, as its people call it, is {size|a} {type_noun} in the {system} system.', when: { renamed: ['yes'] } },
  ],
  [
    { text: 'Its {atmosphere} air hangs over {biomes}[, with {water}].' },
    { text: 'Beneath {atmosphere} skies lie {biomes}[, and {water}].' },
    { text: 'Temperatures run from {temp_min} to {temp_max} across {biomes}.' },
    { text: 'Its {atmosphere} atmosphere and {day} days shape a land of {biomes}.' },
  ],
  [{ text: '{biosphere_sentence}' }],
  [
    { text: 'Some {population} people live here, mostly {species_main}[, alongside {species_minor}].' },
    { text: '{population} people call it home[, most of them {species_main}].' },
    { text: 'Its {population} inhabitants are {species_list}[, speaking {languages}].' },
  ],
  [
    { text: 'They live under {world_gov}, {stability} for now.', when: { has_world_gov: ['yes'] } },
    { text: 'Power is split among {politics}, and the balance is {stability}.', when: { divided: ['yes'] } },
    { text: 'There is no single government: {politics} contend for land and loyalty.', when: { divided: ['yes'] } },
    { text: '{world_gov|cap} rules them all from {seat}.', when: { has_world_gov: ['yes'] } },
  ],
  [
    { text: 'Its {wealth} economy exports {exports}[ and depends on imports of {imports}].', when: { has_exports: ['yes'] } },
    { text: 'Traders come for {exports}[ and bring {imports} in return].', when: { has_exports: ['yes'], contacted: ['yes'] } },
    { text: 'The wider galaxy knows nothing of it yet.', when: { contacted: ['no'] } },
    { text: 'Its people have not yet reached the stars, and offworlders visit only rarely.', when: { trades: ['no'], contacted: ['yes'], spacefaring: ['no'], origin: ['native', 'mixed'] } },
    { text: 'Its founders came from the stars, but their descendants have lost the means to return.', when: { trades: ['no'], contacted: ['yes'], spacefaring: ['no'], origin: ['lost_colony', 'colonial'] } },
    { text: 'Ships from other worlds are a rare sight here, and nothing is traded between the stars.', when: { trades: ['no'], contacted: ['yes'], spacefaring: ['no'] } },
    { text: 'It owes its allegiance to {faction}.', when: { aligned: ['yes'] } },
  ],
  [
    { text: 'Above everything rises {megastructure}, {mega_condition}.', when: { has_megastructure: ['yes'] } },
    { text: 'Visitors are warned about {anomaly}.', when: { has_anomaly: ['yes'] } },
    { text: 'Its most famous sight is {feature}.', when: { has_feature: ['yes'] } },
    { text: '', when: { has_megastructure: ['no'], has_anomaly: ['no'], has_feature: ['no'] } },
  ],
  [
    { text: 'Its people still remember {first_event}, {first_ago}[, and {last_event} {last_ago}].' },
    { text: 'History here began with {first_event}[; more recently, {last_event} {last_outcome}].' },
    { text: 'The oldest stories tell of {first_event}, which {first_outcome}.' },
  ],
];

// ---------------------------------------------------------------------------
// Country

export const COUNTRY_TAGLINES: Template[] = [
  { text: '{stability|a|cap} {government} ruled from {capital}.' },
  { text: '“{motto}”: the creed of the {demonym}.' },
  { text: 'A land of {biome1} and {industry}, under {ruler_title} {ruler_name}.' },
  { text: '{government|a|cap} of {species_main} that prizes {values}.' },
  { text: '{military|cap} and {wealth}, {name} answers to {ruler_title} {ruler_name}.' },
  { text: 'A {wealth} {government} at war with {enemy}.', when: { at_war: ['yes'] } },
  { text: '{name}, where {feature} marks the border of the known.', when: { has_feature: ['yes'] } },
];

export const COUNTRY_DESCRIPTION: TemplateGroups = [
  [
    { text: '{name} is {stability|a} {government} ruled by {ruler_title} {ruler_name} from {capital}.' },
    { text: 'From its capital at {capital}, {ruler_title} {ruler_name} rules {name}, {stability|a} {government}.' },
    { text: '{name}, {government|a}, is governed from {capital} by {ruler_title} {ruler_name}.' },
  ],
  [
    { text: 'Its {population} people are mostly {species_main}[, with {species_minor} among them], and they speak {language}.' },
    { text: 'Most of its {population} {demonym} are {species_main}; their language is {language}.' },
    { text: 'Its {population} people speak {language}[ and worship according to {faith}].' },
  ],
  [
    { text: 'The {demonym} prize {values}[ and keep the custom of {custom}].' },
    { text: 'Above all, its people value {values}[, and visitors soon learn about {custom}].' },
    { text: 'Its motto, “{motto}”, says much about a people who prize {values}.' },
  ],
  [
    { text: 'Its {wealth} economy rests on {industries}[, and it exports {exports}].' },
    { text: 'Money comes from {industries}[; {exports} leave its borders every season].' },
    { text: 'The {currency} buys {wealth} lives here, earned mostly through {industries}.' },
  ],
  [
    { text: 'Its {military} armed forces favor {doctrine}.' },
    { text: 'It defends itself through {doctrine}, and its army is {military}.' },
  ],
  [
    { text: 'It is {relation} {other_country}[ over {relation_reason}].', when: { has_relation: ['yes'] } },
    { text: 'Its neighbors watch it closely; it is {relation} {other_country}.', when: { has_relation: ['yes'] } },
    { text: 'It keeps to itself, with no strong ties abroad.', when: { has_relation: ['no'] } },
  ],
  [
    { text: 'It was founded {founded_ago}[ and has since known {last_event}, which {last_outcome}].' },
    { text: 'Since its founding {founded_ago}, its defining moment was {last_event}.', when: { has_events: ['yes'] } },
    { text: 'Its founding {founded_ago} is still celebrated.' },
  ],
];

// ---------------------------------------------------------------------------
// Settlement

export const SETTLEMENT_TAGLINES: Template[] = [
  { text: '{nickname|cap}: the {mood} {type_noun} of {country}.' },
  { text: '{wealth|a|cap} {type_noun} known for {goods}.' },
  { text: 'The {mood} {type_noun} {terrain}, home of {poi}.', when: { has_poi: ['yes'] } },
  { text: 'Gripped by {event}, {name} waits to see what comes next.', when: { has_event: ['yes'] } },
  { text: 'The beating heart of {country}.', when: { capital: ['yes'] } },
  { text: '{type_noun|a|cap} {terrain}, where {species_main} live by {industry}.' },
  { text: 'Where {org} holds sway.', when: { has_org: ['yes'] } },
];

export const SETTLEMENT_DESCRIPTION: TemplateGroups = [
  [
    { text: '{name} is {type_noun|a} of {population} people, built {terrain} amid {biome}.' },
    { text: 'Built {terrain} in {biome}, {name} is {type_noun|a} of {population}.' },
    { text: 'Known locally as {nickname}, {name} is {type_noun|a} {terrain}.' },
    { text: 'The capital of {country}, {name} sits {terrain} amid {biome} and holds {population} people.', when: { capital: ['yes'] } },
  ],
  [
    { text: 'Its people are mostly {species_main}[, with {species_minor} among them], and most speak {language}.' },
    { text: 'Most locals are {species_main} who speak {language}[ and follow {faith}].' },
    { text: 'You will hear {language} in its streets[ and see {species_minor} among the {species_main}].' },
  ],
  [
    { text: 'It is governed by its {leader_title}, {leader_name}[, and corruption runs {corruption}].' },
    { text: '{leader_title|cap} {leader_name} holds authority here, and the law is {law}.' },
    { text: 'The {governing_body} rules here, led by {leader_name}.' },
  ],
  [
    { text: 'Its {wealth} economy turns on {industries}, and its markets trade in {goods}.' },
    { text: 'Most work here is in {industries}; {goods} are its pride.' },
    { text: 'It lives by {industries}, and it shows.' },
  ],
  [
    { text: 'Visitors know it for {pois}.', when: { has_poi: ['yes'] } },
    { text: 'Its best-known places are {pois}.', when: { has_poi: ['yes'] } },
    { text: 'Its districts include {districts}.' },
  ],
  [
    { text: 'The mood is {mood}, not least because of {event}.', when: { event_fits: ['yes'] } },
    { text: 'Lately the streets are {mood}; everyone is talking about {event}.', when: { event_fits: ['yes'] } },
    { text: 'The mood is {mood}, even with {event} under way.', when: { event_fits: ['no'], has_event: ['yes'] } },
    { text: 'Despite {event}, the streets feel {mood}.', when: { event_fits: ['no'], has_event: ['yes'] } },
    { text: 'It has a {mood} air these days.' },
  ],
  [
    { text: '{orgs|cap} <operates/operate> openly here.', when: { has_org: ['yes'] } },
    { text: 'Among its powers are {orgs}.', when: { has_org: ['yes'] } },
    { text: '', when: { has_org: ['no'] } },
  ],
  [
    { text: 'It was founded {founded_ago}[ and survived {last_event}].' },
    { text: 'Founded {founded_ago}, it still remembers {last_event}.', when: { has_events: ['yes'] } },
    { text: 'Its founding {founded_ago} is marked every year.' },
  ],
];

export const DISTRICT_DESCRIPTIONS: Template[] = [
  { text: '{name|cap} is the {district} of {settlement}, {flavor}.' },
  { text: 'In {settlement}, {name} is {flavor}.' },
  { text: '{name|cap}: {flavor}.' },
  { text: 'The {district} of {settlement}, {flavor}.' },
];

export const POI_DESCRIPTIONS: Template[] = [
  { text: '{name|cap} is {poi|a} in {settlement}[, run by {owner}], and {significance}. {flavor}' },
  { text: '{poi|a|cap} in {settlement}[ owned by {owner}], and {significance}. {flavor}' },
  { text: '{flavor} {name|cap} is {poi|a}[ belonging to {owner}]: {significance}.' },
];

/** Places out in the wilds: {status} is "abandoned" or "forgotten", {near} the nearest settlement. */
export const WILD_DESCRIPTIONS: Template[] = [
  { text: '{name|cap} is {status|a} {poi} in the wilds near {near}, and {significance}. {flavor}' },
  { text: 'Out beyond {near} lies {name}, {status|a} {poi}: {significance}. {flavor}' },
  { text: '{flavor} {name|cap} is {status|a} {poi} near {near}, {significance}.' },
];

/** Homes: {owner} is the head of the household. */
export const HOME_DESCRIPTIONS: Template[] = [
  { text: '{name|cap} is {poi|a} in {settlement}, home to {residents}. {flavor}' },
  { text: '{owner|cap} lives here[ with {household}]: {poi|a} in {settlement}. {flavor}' },
];

/** Treasures. {where} is "kept at X in Y" or "carried by X"; {detail} explains a fact-based treasure. */
export const TREASURE_DESCRIPTIONS: Template[] = [
  { text: '{name|cap} is {rarity|a} {noun}, {where}.[ {detail}][ It is guarded by {guards}.] {visibility}', when: { embodied: ['no'] } },
  { text: '{rarity|a|cap} {noun}, {where}.[ {detail}][ {guards|cap} keep watch over it.] {visibility}', when: { embodied: ['no'] } },
  { text: '{name|cap} is not something to steal: it is {holder}’s own {gift}, {rarity|a} {noun}.[ {detail}] {visibility}', when: { embodied: ['yes'] } },
];


// ---------------------------------------------------------------------------
// Organization

export const ORG_TAGLINES: Template[] = [
  { text: '{org_noun|a|cap} of {home}, sworn to {stated_goal}.' },
  { text: '“{motto}”: the creed of {name}.' },
  { text: '{org_noun|a|cap} headquartered in {hq}.' },
  { text: 'Known by {symbol|lower}, they work to {stated_goal}.' },
  { text: 'Few know {name} exists.', when: { visibility: ['secret'] }, weight: 2 },
  { text: 'The official {org_noun} of {country}.', when: { state: ['yes'] }, weight: 2 },
  { text: '{influence|cap} and {wealth}, {name} is {relation} {rival}.', when: { has_rival: ['yes'] } },
];

export const ORG_DESCRIPTION: TemplateGroups = [
  [
    { text: '{name} is {org_noun|a} {scope}, headquartered in {hq}.' },
    { text: 'Headquartered in {hq}, {name} is {org_noun|a} {scope}.' },
    { text: 'From {hq}, {name} works as {org_noun|a} {scope}.' },
  ],
  [
    { text: 'It operates {visibility} and {legality}.' },
    { text: 'Operating {visibility}, it {legality}.' },
    { text: 'The {org_noun} is the official {state_role} of {country}.', when: { state: ['yes'] } },
  ],
  [
    { text: 'Its {leader_title}, {leader_name}, presides over a {structure} chain of command.', when: { leader_known: ['yes'] } },
    { text: '{leader_name} leads it as {leader_title}[ from {leader_home}].', when: { leader_known: ['yes'] } },
    { text: 'Who leads it is a closely kept secret.', when: { leader_known: ['no'] } },
    { text: 'Its {leader_title} works in the shadows; no one admits to knowing who that is.', when: { leader_known: ['no'] } },
  ],
  [
    { text: 'It exists, it says, to {stated_goal}, and its members spend their days on {activities}.' },
    { text: 'Publicly its aim is to {stated_goal}; in practice that means {activities}.' },
    { text: 'Its members devote themselves to {activities}, all to {stated_goal}.' },
  ],
  [
    { text: 'It is {relation} {rival}[ over {relation_reason}].', when: { has_rival: ['yes'] } },
    { text: 'Its strongest tie is to {rival}, with whom it is {relation_short}.', when: { has_rival: ['yes'] } },
    { text: '', when: { has_rival: ['no'] } },
  ],
  [
    { text: 'Its symbol is {symbol|lower}, and its motto is “{motto}”.' },
    { text: 'Members wear {symbol|lower} and repeat the words “{motto}”.' },
  ],
  [
    { text: 'It was founded {founded_ago}.' },
    { text: 'It has existed since {founded_ago_short}.' },
    { text: 'Its records go back {founded_ago_short}[, to {first_event}].' },
  ],
];

// ---------------------------------------------------------------------------
// NPC

export const NPC_TAGLINES: Template[] = [
  { text: '{occupation|cap} of {settlement}[, {epithet}].' },
  { text: 'The {trait1} {occupation} of {settlement}.' },
  { text: '{title|cap} of {led}.', when: { category: ['leader'] }, weight: 3 },
  { text: '{species_age|a|cap} {occupation} who wants to {goal}.' },
  { text: '{trait1|cap} and {trait2}, {name} {speech}.' },
  { text: 'The {occupation} everyone in {settlement} knows.', when: { category: ['notable'] } },
  { text: 'A {disposition_word} {occupation} with {appearance1}.' },
];

export const NPC_DESCRIPTION: TemplateGroups = [
  [
    { text: '{name} is {species_age|a} {occupation} from {settlement}.' },
    { text: 'A {trait1} {species} {occupation}, {name} lives in {settlement}[ and works at {workplace}].' },
    { text: '{name} is {title|a} of {led}, {species_age|a} {occupation} by trade.', when: { category: ['leader'] } },
    { text: 'In {settlement}, {name} is known as {species_age|a} {occupation}[ at {workplace}].' },
  ],
  [
    { text: '{They|cap} <has/have> {appearance}[, along with {mark}], and <dresses/dress> in {clothing}.' },
    { text: 'People remember {their} {appearance_bare}[ and {mark}]; {they} usually <wears/wear> {clothing}.' },
    { text: 'Dressed in {clothing}, {they} <stands/stand> out for {appearance}.' },
  ],
  [
    { text: '{They|cap} <is/are> {traits}, {speech}, and <is/are> {disposition}.' },
    { text: '{trait1|cap} and {trait2}, {they} {speech}.' },
    { text: 'Those who meet {them} find {them} {traits}; {they} {speech} and <is/are> {disposition}.' },
  ],
  [
    { text: '{They|cap} <belongs/belong> to {orgs}.', when: { has_org: ['yes'] } },
    { text: '{They|cap} <follows/follow> {faith}.', when: { has_faith: ['yes'], has_org: ['no'] } },
    { text: '', when: { has_faith: ['no'], has_org: ['no'] } },
  ],
];

export const NPC_BACKSTORY_OPENINGS: Template[] = [
  { text: '{name} was born {born_ago} in {birthplace}.' },
  { text: 'Born in {birthplace} some {age} years ago, {name} grew up among {species_plural}.' },
  { text: '{name} came into the world {born_ago}, in {birthplace}.' },
  { text: '{birthplace|cap} is where {name} was born, {born_ago}.' },
  { text: 'Few remember {name} as a child in {birthplace}, {born_ago}.' },
];

export const NPC_BACKSTORY_EVENTS: Template[] = [
  { text: '{when|cap}, {they} {clause}[, during {parent_event}].' },
  { text: '{They|cap} {clause} {when}[, in the days of {parent_event}].' },
  { text: 'At {age_then}, {they} {clause}.' },
];

export const NPC_BACKSTORY_ROLES: Template[] = [
  { text: 'Today {they} <serves/serve> as {title} of {led}.', when: { category: ['leader'] } },
  { text: 'Now {they} <leads/lead> {led} as {title}.', when: { category: ['leader'] } },
  { text: 'These days {they} <works/work> as {occupation|a} in {settlement}.', when: { category: ['notable'] } },
  { text: 'Now {they} <makes/make> a living as {occupation|a}.', when: { category: ['notable'] } },
];

export const NPC_BACKSTORY_MOTIVES: Template[] = [
  { text: '{They|cap} <wants/want> to {goal}, but <fears/fear> {fear}.' },
  { text: 'What {they} <wants/want> most is to {goal}; what {they} <fears/fear> most is {fear}.' },
  { text: 'Driven by {goal_reason}, {they} <hopes/hope> to {goal}.' },
  { text: '{They|cap} <dreams/dream> of the day {they} can {goal}, and <lies/lie> awake fearing {fear}.' },
  { text: 'Everything {they} <does/do> is aimed at one thing: to {goal}.' },
];

/** Greeting tone groups: cold (hostile, suspicious, wary), neutral (neutral, curious), warm (friendly, welcoming). */
export const NPC_GREETINGS: Template[] = [
  // Leaders, regardless of style
  { text: 'I am {name}, {title} of {led}. Speak, and be brief.', when: { category: ['leader'], tone: ['cold'] }, weight: 2 },
  { text: 'You stand before the {title} of {led}. What brings you here?', when: { category: ['leader'], tone: ['neutral'] }, weight: 2 },
  { text: 'Welcome. As {title} of {led}, I am glad to receive you.', when: { category: ['leader'], tone: ['warm'] }, weight: 2 },

  { text: 'State your business in {settlement}, and be brief.', when: { speech: ['formal'], tone: ['cold'] } },
  { text: 'I do not believe we have been introduced. I suggest we keep it that way.', when: { speech: ['formal'], tone: ['cold'] } },
  { text: 'Good day. I am {name}, {occupation} of {settlement}. How may I be of service?', when: { speech: ['formal'], tone: ['neutral'] } },
  { text: 'Welcome to {settlement}. You will find our customs orderly, I trust.', when: { speech: ['formal'], tone: ['neutral'] } },
  { text: 'A pleasure to make your acquaintance. {settlement} is honored by your visit.', when: { speech: ['formal'], tone: ['warm'] } },
  { text: 'Please, be welcome. I am {name}, and I am at your disposal.', when: { speech: ['formal'], tone: ['warm'] } },

  { text: 'What do you want? Say it and go.', when: { speech: ['blunt'], tone: ['cold'] } },
  { text: 'I don’t know you, and I don’t trust you. Talk.', when: { speech: ['blunt'], tone: ['cold'] } },
  { text: 'Name’s {given}. You need something, ask.', when: { speech: ['blunt'], tone: ['neutral'] } },
  { text: 'Welcome to {settlement}. Don’t cause trouble and we’ll get along.', when: { speech: ['blunt'], tone: ['neutral'] } },
  { text: 'You look like you need a drink and a straight answer. I’ve got both.', when: { speech: ['blunt'], tone: ['warm'] } },
  { text: 'Good to see a new face. I’m {given}. What do you need?', when: { speech: ['blunt'], tone: ['warm'] } },

  { text: 'Ah, a stranger, blown in like ash on a bitter wind. What could you possibly want of me?', when: { speech: ['flowery'], tone: ['cold'] } },
  { text: 'How curious, that fate should drag you to my door. Speak, if you must.', when: { speech: ['flowery'], tone: ['cold'] } },
  { text: 'Welcome, traveler, to {settlement}, jewel of {country}, where every stone has a story.', when: { speech: ['flowery'], tone: ['neutral'] } },
  { text: 'Greetings, wanderer! The roads of {country} are long; may yours have led somewhere worthwhile.', when: { speech: ['flowery'], tone: ['neutral'] } },
  { text: 'Oh, what a delight! A new face is like the first light of morning. Come in, come in!', when: { speech: ['flowery'], tone: ['warm'] } },
  { text: 'Welcome, welcome! {settlement} has waited all its life to meet you. Well, perhaps not, but I have.', when: { speech: ['flowery'], tone: ['warm'] } },

  { text: 'Busy. Go away.', when: { speech: ['terse'], tone: ['cold'] } },
  { text: 'No.', when: { speech: ['terse'], tone: ['cold'] } },
  { text: '{given}. You?', when: { speech: ['terse'], tone: ['neutral'] } },
  { text: 'What is it.', when: { speech: ['terse'], tone: ['neutral'] } },
  { text: 'Welcome. Sit.', when: { speech: ['terse'], tone: ['warm'] } },
  { text: 'Good. You’re here. Talk.', when: { speech: ['terse'], tone: ['warm'] } },

  { text: 'Oh, another one. Last stranger who came through here, well, never mind, it’s a long story and you don’t look like you have the time.', when: { speech: ['rambling'], tone: ['cold'] } },
  { text: 'Stranger? We had strangers before, you know, back when things were different in {settlement}. Didn’t end well.', when: { speech: ['rambling'], tone: ['cold'] } },
  { text: 'Ah, hello, you must be new, I’d remember, I remember everyone in {settlement}, well, nearly everyone, now what was I saying?', when: { speech: ['rambling'], tone: ['neutral'] } },
  { text: 'Welcome! You’ll want to know about {settlement}, everyone does, though honestly there’s not much to say, except, well, everything.', when: { speech: ['rambling'], tone: ['neutral'] } },
  { text: 'Oh, wonderful, a visitor! Sit, sit, I’ll tell you everything worth knowing about {settlement}, and a few things that aren’t.', when: { speech: ['rambling'], tone: ['warm'] } },
  { text: 'Come in, come in! I’m {given}, and you’re going to love it here, or at least you’ll leave with stories.', when: { speech: ['rambling'], tone: ['warm'] } },

  { text: 'Oh good, a stranger. Exactly what my day was missing.', when: { speech: ['sarcastic'], tone: ['cold'] } },
  { text: 'Let me guess: you’re here to help. Wonderful.', when: { speech: ['sarcastic'], tone: ['cold'] } },
  { text: 'Welcome to {settlement}. Try to contain your excitement.', when: { speech: ['sarcastic'], tone: ['neutral'] } },
  { text: 'Another visitor. {settlement} must be more famous than I thought.', when: { speech: ['sarcastic'], tone: ['neutral'] } },
  { text: 'Well, you don’t look like trouble, which around here makes you remarkable.', when: { speech: ['sarcastic'], tone: ['warm'] } },
  { text: 'Welcome, friend. Lower your expectations and you’ll love it here.', when: { speech: ['sarcastic'], tone: ['warm'] } },

  { text: 'The wind said someone would come. It did not say they would be welcome.', when: { speech: ['cryptic'], tone: ['cold'] } },
  { text: 'You stand where others have stood. Few of them left.', when: { speech: ['cryptic'], tone: ['cold'] } },
  { text: 'Every road into {settlement} is a question. Which one are you?', when: { speech: ['cryptic'], tone: ['neutral'] } },
  { text: 'Ah. You are early, or perhaps I am late.', when: { speech: ['cryptic'], tone: ['neutral'] } },
  { text: 'I saw you in the smoke last night. You were smiling. Shall we see if it was true?', when: { speech: ['cryptic'], tone: ['warm'] } },
  { text: 'The stars said a friend would come. Sit, and let us find out.', when: { speech: ['cryptic'], tone: ['warm'] } },

  { text: 'Can’t say we get many of your sort round here. Can’t say we want to.', when: { speech: ['folksy'], tone: ['cold'] } },
  { text: 'Mind your manners in {settlement} and we’ll get along fine. Probably.', when: { speech: ['folksy'], tone: ['cold'] } },
  { text: 'Well now, a new face. Welcome to {settlement}. Wipe your feet.', when: { speech: ['folksy'], tone: ['neutral'] } },
  { text: 'How do. Name’s {given}. Folks round here treat you fair if you do the same.', when: { speech: ['folksy'], tone: ['neutral'] } },
  { text: 'Come in out of the weather, friend! There’s always room by the fire in {settlement}.', when: { speech: ['folksy'], tone: ['warm'] } },
  { text: 'Well, look at you! Sit yourself down, you must be half-starved.', when: { speech: ['folksy'], tone: ['warm'] } },

  { text: 'I am in the middle of important work. Unless your question is precise, I must ask you to leave.', when: { speech: ['academic'], tone: ['cold'] } },
  { text: 'Strangers are, statistically, trouble. Prove the exception.', when: { speech: ['academic'], tone: ['cold'] } },
  { text: 'A visitor. You may find {settlement} of some interest, historically speaking.', when: { speech: ['academic'], tone: ['neutral'] } },
  { text: 'Greetings. I am {name}. If you have questions, I may have answers, with appropriate caveats.', when: { speech: ['academic'], tone: ['neutral'] } },
  { text: 'A new perspective! Marvelous. Tell me where you have traveled. I want details.', when: { speech: ['academic'], tone: ['warm'] } },
  { text: 'Welcome! I would be delighted to explain anything about {settlement}, at length.', when: { speech: ['academic'], tone: ['warm'] } },

  { text: 'W-who sent you? I haven’t done anything. Whatever they said, I haven’t.', when: { speech: ['nervous'], tone: ['cold'] } },
  { text: 'Please, I don’t want trouble. Just tell me what you want.', when: { speech: ['nervous'], tone: ['cold'] } },
  { text: 'Oh! Sorry, you startled me. Welcome to, um, to {settlement}.', when: { speech: ['nervous'], tone: ['neutral'] } },
  { text: 'Hello. Sorry. Hello. Can I help? I can probably help.', when: { speech: ['nervous'], tone: ['neutral'] } },
  { text: 'Oh, hello! Sorry, it’s just, it’s nice to meet someone new. Really nice.', when: { speech: ['nervous'], tone: ['warm'] } },
  { text: 'W-welcome! Please, make yourself comfortable. Can I get you anything?', when: { speech: ['nervous'], tone: ['warm'] } },

  { text: 'You’ve wandered into the wrong part of {settlement}, stranger.', when: { speech: ['menacing'], tone: ['cold'] } },
  { text: 'I remember every face that crosses me. Make sure I remember yours fondly.', when: { speech: ['menacing'], tone: ['cold'] } },
  { text: 'Welcome to {settlement}. Behave, and you’ll leave the way you came.', when: { speech: ['menacing'], tone: ['neutral'] } },
  { text: 'We don’t get many visitors. The ones we get, we watch.', when: { speech: ['menacing'], tone: ['neutral'] } },
  { text: 'You’ve got nothing to fear from me. Yet. Sit down.', when: { speech: ['menacing'], tone: ['warm'] } },
  { text: 'Relax, friend. If I wanted you hurt, you’d know.', when: { speech: ['menacing'], tone: ['warm'] } },

  { text: 'Oh! A stranger. No offense, but I’ll keep my eye on you.', when: { speech: ['cheerful'], tone: ['cold'] } },
  { text: 'Hello there! Sorry if we’re careful around new faces lately.', when: { speech: ['cheerful'], tone: ['cold'] } },
  { text: 'Hello and welcome to {settlement}! Lovely day for it, isn’t it?', when: { speech: ['cheerful'], tone: ['neutral'] } },
  { text: 'Hi there! I’m {given}. Anything you need, just ask!', when: { speech: ['cheerful'], tone: ['neutral'] } },
  { text: 'Welcome, welcome! It’s so good to see a new face in {settlement}!', when: { speech: ['cheerful'], tone: ['warm'] } },
  { text: 'Hello, friend! You’re going to love it here, I just know it!', when: { speech: ['cheerful'], tone: ['warm'] } },
];
