import type {
  LocationReason, PoiSignificance, TreasureCategory, TreasureRarity,
  AgeCategory, AnomalyType, AppearanceDetail, AtmosphereComposition, Attitude, Biome, Biosphere, ClothingStyle, CurrentEventType,
  Disposition, DistinguishingMark, DistrictType, EventOutcome, FearType, GoalType, GovernmentType, HistoricalEventType,
  Legality, MegastructureCondition, MilitaryDoctrine, MotiveReason, OrgStructure, OrgType, PlanetType, PoiType, PoliticalStructure, QuestType, RelationReason, RumorClaim,
  ScopeLevel, SecretType, SettlementType, SizeClass, SpeechStyle, Terrain, Visibility,
} from '../../types/enums';

/**
 * Lexicon: how each enum value reads in prose. Records are keyed by the
 * full enum, so adding an enum value forces a phrase here. Phrases with
 * {target}, {their}, {them} or {they} are filled by the renderer.
 */

export const PLANET_TYPE_NOUN: Record<PlanetType, string> = {
  terrestrial: 'temperate world', ocean: 'ocean world', archipelago: 'world of scattered islands', desert: 'desert world',
  arctic: 'frozen world', tundra: 'tundra world', jungle: 'jungle world', swamp: 'swamp world', savanna: 'savanna world',
  steppe: 'steppe world', mountainous: 'mountain world', volcanic: 'volcanic world', barren: 'barren rock', toxic: 'poisoned world',
  storm: 'storm-wracked world', tidally_locked: 'tidally locked world', garden: 'garden world', fungal: 'fungal world',
  ash: 'ash-choked world', glass: 'glassed world', moon_world: 'habitable moon', ecumenopolis: 'city-covered world',
  crystal: 'crystal world', hollow: 'hollow world', shattered: 'shattered world', living: 'living world', machine: 'machine world',
};

export const SIZE_ADJ: Record<SizeClass, string> = { tiny: 'tiny', small: 'small', medium: 'mid-sized', large: 'large', huge: 'vast' };

export const ATMOSPHERE_ADJ: Record<AtmosphereComposition, string> = {
  none: 'airless', breathable: 'breathable', tainted: 'tainted', toxic: 'toxic', corrosive: 'corrosive', inert: 'inert',
  methane: 'methane-heavy', spore_laden: 'spore-laden', exotic: 'strange',
};

export const BIOME_PHRASE: Record<Biome, string> = {
  ocean: 'open ocean', shallow_sea: 'shallow seas', reef: 'bright reefs', coast: 'long coastlines', temperate_forest: 'temperate forests',
  rainforest: 'steaming rainforests', boreal_forest: 'dark boreal forests', grassland: 'rolling grasslands', savanna: 'golden savanna',
  steppe: 'windswept steppe', desert: 'deserts', dunes: 'endless dunes', badlands: 'broken badlands', salt_flats: 'white salt flats',
  tundra: 'tundra', ice_sheet: 'ice sheets', mountains: 'mountains', highlands: 'highlands', wetland: 'wetlands',
  volcanic_fields: 'smoking volcanic fields', ash_wastes: 'ash wastes', caverns: 'vast caverns', crystal_fields: 'crystal fields',
  fungal_forest: 'fungal forests', toxic_marsh: 'toxic marshes', glass_plains: 'plains of fused glass', storm_plains: 'storm-lashed plains',
  floating_isles: 'floating isles', flesh_plains: 'plains of living flesh', machine_wastes: 'machine wastes', urban_sprawl: 'endless city',
  shard_fields: 'fields of drifting shards',
};

export const BIOSPHERE_SENTENCES: Record<Biosphere, string[]> = {
  none: ['Nothing grows here without help.', 'No native life has ever been found here.'],
  microbial: ['Life here is microscopic, a film on wet stone.', 'Only microbes have ever called it home.'],
  sparse: ['Life clings on in sparse, hardy patches.', 'Its wildlife is thin and tough.'],
  complex: ['Complex life fills its lands and waters.', 'It teems with plants and animals of every kind.'],
  lush: ['Life runs riot across it.', 'Every surface seems to grow something.'],
  exotic: ['Its life follows rules few visitors recognize.', 'What lives here would puzzle most xenobiologists.'],
  synthetic: ['Its ecology is made of self-repairing machines.', 'Even its wildlife is manufactured.'],
  dying: ['Its biosphere is dying, slowly and visibly.', 'What once lived here is fading.'],
};

export const POLITICAL_PHRASE: Record<PoliticalStructure, string> = {
  unified: 'a single government', federation: 'a federation of {count} states', rival_powers: '{count} rival powers',
  fragmented: '{count} quarrelling states', anarchic: 'no real government at all, only {count} warring factions',
};

export const GOVERNMENT_NOUN: Record<GovernmentType, string> = {
  absolute_monarchy: 'absolute monarchy', constitutional_monarchy: 'constitutional monarchy', elective_monarchy: 'elective monarchy',
  theocracy: 'theocracy', republic: 'republic', democracy: 'democracy', direct_democracy: 'direct democracy', oligarchy: 'oligarchy',
  plutocracy: 'plutocracy', corporate_state: 'corporate state', military_junta: 'military junta', dictatorship: 'dictatorship',
  technocracy: 'technocracy', meritocracy: 'meritocracy', tribal_confederacy: 'tribal confederacy', clan_council: 'council of clans',
  feudal_realm: 'feudal realm', merchant_republic: 'merchant republic', gerontocracy: 'gerontocracy',
  colonial_administration: 'colonial administration', raider_kingdom: 'raider kingdom', anarcho_commune: 'free commune',
  hive_council: 'hive council', ai_administration: 'state run by an artificial mind', psionic_conclave: 'psionic conclave',
  oracle_rule: 'state ruled by oracles',
};

export const SETTLEMENT_NOUN: Record<SettlementType, string> = {
  capital: 'capital', city: 'city', town: 'town', village: 'village', outpost: 'outpost', orbital_station: 'orbital station',
  floating_city: 'floating city', underground: 'underground city', fortress: 'fortress', port: 'port', mining_colony: 'mining colony',
  research_station: 'research station', monastery: 'monastery', nomad_camp: 'nomad camp', arcology: 'arcology',
  submerged_city: 'submerged city', trade_hub: 'trade hub', ruin_town: 'town built in ancient ruins', frontier_camp: 'frontier camp',
  hive_city: 'hive city', tree_city: 'city in the trees', cliff_city: 'cliff city',
};

export const TERRAIN_PHRASE: Record<Terrain, string> = {
  flat: 'on open ground', hills: 'among low hills', mountain: 'high on a mountainside', valley: 'in a sheltered valley',
  coastal: 'on the coast', riverside: 'on a river', island: 'on an island', cliffside: 'into a cliff face', underground: 'underground',
  floating: 'in the sky', crater: 'inside a great crater', plateau: 'on a high plateau', canyon: 'in a canyon', lakeside: 'beside a lake',
  delta: 'on a river delta', glacier: 'on the ice', orbit: 'in orbit', submerged: 'beneath the waves',
};

export const ORG_NOUN: Record<OrgType, string> = {
  guild: 'guild', church: 'church', corporation: 'corporation', criminal_syndicate: 'criminal syndicate', secret_society: 'secret society',
  military_order: 'military order', academy: 'academy', rebel_movement: 'rebel movement', political_party: 'political party',
  noble_house: 'noble house', cult: 'cult', mercenary_company: 'mercenary company', trade_consortium: 'trade consortium',
  monastic_order: 'monastic order', explorers_society: "explorers' society", mutual_aid_society: 'mutual aid society',
  hacker_collective: 'hacker collective',
};

export const SCOPE_PHRASE: Record<ScopeLevel, string> = {
  planet: 'with reach across {planet}', country: 'operating throughout {country}', settlement: 'rooted in {settlement}',
};

export const VISIBILITY_PHRASE: Record<Visibility, string> = { public: 'openly', discreet: 'quietly', secret: 'in deep secrecy' };
export const LEGALITY_PHRASE: Record<Legality, string> = {
  official: 'enjoys official sanction', tolerated: 'is tolerated by the authorities', outlawed: 'is outlawed',
};

export const AGE_ADJ: Record<AgeCategory, string> = {
  youth: 'young', young_adult: 'young', adult: '', middle_aged: 'middle-aged', elder: 'elderly', ancient: 'ancient',
};

/** Goals as verb phrases ("wants to ..."), with and without a target. */
export const GOAL_PHRASE: Record<GoalType, { target: string; alone: string }> = {
  revenge: { target: 'take revenge on {target}', alone: 'settle an old score' },
  wealth: { target: 'grow rich at the expense of {target}', alone: 'grow rich' },
  power: { target: 'gain power over {target}', alone: 'gain real power' },
  love: { target: 'win the heart of {target}', alone: 'find love' },
  knowledge: { target: 'learn the secrets of {target}', alone: 'understand the world' },
  redemption: { target: 'make amends to {target}', alone: 'atone for the past' },
  protect_family: { target: 'keep {target} safe', alone: 'keep {their} family safe' },
  overthrow: { target: 'bring down {target}', alone: 'bring down those in power' },
  expand_influence: { target: 'extend {their} influence over {target}', alone: 'extend {their} influence' },
  find_relic: { target: 'find a relic hidden near {target}', alone: 'find a lost relic' },
  escape: { target: 'escape {target}', alone: 'escape this place' },
  recognition: { target: 'earn the respect of {target}', alone: 'be recognized at last' },
  justice: { target: 'bring {target} to justice', alone: 'see justice done' },
  peace: { target: 'make peace with {target}', alone: 'keep the peace' },
  freedom: { target: 'free {target}', alone: 'live free' },
  spread_faith: { target: 'bring the faith to {target}', alone: 'spread the faith' },
  find_cure: { target: 'find a cure for {target}', alone: 'find a cure' },
  discovery: { target: 'explore {target}', alone: 'discover something new' },
  legacy: { target: 'leave a mark on {target}', alone: 'leave a lasting legacy' },
  survival: { target: 'survive {target}', alone: 'simply survive' },
  restore_honor: { target: 'restore {their} honor in the eyes of {target}', alone: 'restore {their} honor' },
  monopoly: { target: 'drive {target} out of business', alone: 'control the trade' },
  secession: { target: 'see {target} broken apart', alone: 'win independence' },
  rescue: { target: 'rescue {target}', alone: 'rescue someone lost' },
  reform: { target: 'reform {target}', alone: 'change how things are run' },
  reunite: { target: 'reunite with {target}', alone: 'reunite {their} family' },
};

/** Fears as noun phrases ("fears ..."), with and without a target. */
export const FEAR_PHRASE: Record<FearType, { target: string; alone: string }> = {
  exposure: { target: '{target} uncovering {their} secrets', alone: 'being exposed' },
  death: { target: 'dying at the hands of {target}', alone: 'death' },
  poverty: { target: 'losing everything to {target}', alone: 'poverty' },
  loss_of_power: { target: 'losing power to {target}', alone: 'losing power' },
  betrayal: { target: 'betrayal by {target}', alone: 'betrayal' },
  abandonment: { target: 'being abandoned by {target}', alone: 'being abandoned' },
  failure: { target: 'failing {target}', alone: 'failure' },
  disease: { target: 'the sickness in {target}', alone: 'disease' },
  monsters: { target: 'the beasts around {target}', alone: 'monsters' },
  divine_wrath: { target: 'divine punishment falling on {target}', alone: 'divine punishment' },
  offworlders: { target: 'offworlders taking {target}', alone: 'offworlders' },
  machines: { target: 'the machines of {target}', alone: 'machines' },
  the_unknown: { target: 'what lies beneath {target}', alone: 'the unknown' },
  rival_success: { target: '{target} outshining {them}', alone: 'being outshone' },
  imprisonment: { target: 'imprisonment by {target}', alone: 'imprisonment' },
  madness: { target: 'losing {their} mind like {target}', alone: 'losing {their} mind' },
  aging: { target: 'growing old before {target} does', alone: 'growing old' },
  replacement: { target: 'being replaced by {target}', alone: 'being replaced' },
  war: { target: 'war with {target}', alone: 'war' },
  scandal: { target: 'a scandal involving {target}', alone: 'scandal' },
  loss_of_faith: { target: 'losing {their} faith in {target}', alone: 'losing {their} faith' },
  the_past: { target: '{target} learning of {their} past', alone: 'the past catching up with {them}' },
};

/** Secrets as noun phrases. Only used where secrets are meant to be known (debug views, future reveals). */
export const SECRET_PHRASE: Record<SecretType, { target: string; alone: string }> = {
  secret_leadership: { target: 'secretly leads {target}', alone: 'secretly leads a hidden faction' },
  hidden_identity: { target: 'is not who {they} claim to be, as {target} knows', alone: 'lives under a false identity' },
  affair: { target: 'is having an affair with {target}', alone: 'is having an affair' },
  past_crime: { target: 'once committed a crime against {target}', alone: 'has a criminal past' },
  crippling_debt: { target: 'owes a crippling debt to {target}', alone: 'is drowning in debt' },
  forbidden_faith: { target: 'secretly follows {target}', alone: 'secretly follows a forbidden faith' },
  double_agent: { target: 'secretly spies for {target}', alone: 'secretly spies for a foreign power' },
  illegitimate_child: { target: 'has a child, {target}, no one knows about', alone: 'has a child no one knows about' },
  stolen_wealth: { target: 'stole a fortune from {target}', alone: 'lives on stolen wealth' },
  false_credentials: { target: 'forged the credentials {target} accepted', alone: 'forged their credentials' },
  addiction: { target: 'is addicted to what {target} sells', alone: 'hides an addiction' },
  murder: { target: 'murdered someone close to {target}', alone: 'once killed someone' },
  forbidden_power: { target: 'hides a forbidden power from {target}', alone: 'hides a forbidden power' },
  offworld_heritage: { target: 'hides offworld blood from {target}', alone: 'hides an offworld heritage' },
  cowardice: { target: 'once abandoned {target} out of cowardice', alone: 'once fled when it mattered' },
  blackmailed: { target: 'is being blackmailed by {target}', alone: 'is being blackmailed' },
  smuggling: { target: 'smuggles for {target}', alone: 'runs a smuggling sideline' },
  true_loyalty: { target: 'is secretly loyal to {target}', alone: 'is secretly loyal to another' },
  hidden_illness: { target: 'hides an illness from {target}', alone: 'hides a serious illness' },
  prophecy_knowledge: { target: 'knows a prophecy about {target}', alone: 'knows a prophecy no one else does' },
  relic_possession: { target: 'keeps a relic taken from {target}', alone: 'keeps a forbidden relic' },
};

export const REASON_PHRASE: Record<MotiveReason, string> = {
  financial_ruin: 'financial ruin', family_death: 'a death in the family', betrayal: 'an old betrayal', ambition: 'ambition',
  love: 'love', faith: 'faith', duty: 'duty', honor: 'honor', greed: 'greed', fear: 'fear', ideology: 'conviction',
  curiosity: 'curiosity', jealousy: 'jealousy', humiliation: 'an old humiliation', prophecy: 'a prophecy', debt: 'debt',
  survival: 'need', loyalty: 'loyalty', guilt: 'guilt', oath: 'an oath', injustice: 'injustice', boredom: 'boredom',
};

export const APPEARANCE_PHRASE: Record<AppearanceDetail, string> = {
  towering: 'a towering frame', diminutive: 'a slight frame', wiry: 'a wiry build', broad: 'a broad build', scarred: 'a scarred body',
  weathered: 'a weathered look', youthful_looking: 'a youthful look', gaunt: 'a gaunt look', striking_eyes: 'striking eyes',
  graceful: 'a graceful bearing', hunched: 'a hunched posture', ornate_markings: 'ornate markings', cybernetic_limb: 'a cybernetic limb',
  missing_eye: 'a missing eye', luminous_patterns: 'faintly luminous patterns', braided_crest: 'a braided crest',
  faded_colors: 'faded coloring', restless_hands: 'restless limbs', perfect_posture: 'perfect posture', heavy_build: 'a heavy build',
  iridescent: 'an iridescent sheen', cracked_plating: 'cracked plating', flowing_movements: 'flowing movements',
  piercing_voice: 'a piercing voice', soft_spoken_presence: 'a soft-spoken presence', elaborate_adornments: 'elaborate adornments',
  unsettling_stillness: 'an unsettling stillness', fresh_wounds: 'fresh wounds',
};

export const CLOTHING_PHRASE: Record<ClothingStyle, string> = {
  fine_robes: 'fine robes', practical_workwear: 'practical workwear', military_uniform: 'a military uniform', patched_rags: 'patched rags',
  ceremonial_vestments: 'ceremonial vestments', travel_leathers: 'worn travel leathers', sleek_synthetics: 'sleek synthetics',
  armor_plating: 'armor plating', flamboyant_silks: 'flamboyant silks', hooded_cloak: 'a hooded cloak',
  nothing_notable: 'unremarkable clothes', tribal_regalia: 'traditional regalia', stolen_finery: 'finery that does not quite fit',
  lab_coat: 'a lab coat', environment_suit: 'an environment suit',
};

export const MARK_PHRASE: Record<DistinguishingMark, string> = {
  none: '', facial_scar: 'a scar across the face', brand: 'an old brand', tattoo: 'a prominent tattoo', missing_finger: 'a missing finger',
  heterochromia: 'mismatched eyes', burn_marks: 'burn marks', prosthetic: 'a prosthetic', birthmark: 'a vivid birthmark',
  ritual_piercings: 'ritual piercings', gold_tooth: 'a gold tooth', limp: 'a pronounced limp', unusual_voice: 'an unusual voice',
  silvered_hair: 'silvered hair', old_wound: 'an old wound that never healed', glowing_implant: 'a glowing implant',
};

/** Speech styles as verb phrases; <a/b> picks the singular or plural verb. */
export const SPEECH_PHRASE: Record<SpeechStyle, string> = {
  formal: '<speaks/speak> formally', blunt: '<speaks/speak> bluntly', flowery: '<speaks/speak> in flowery phrases',
  terse: '<uses/use> as few words as possible', rambling: '<tends/tend> to ramble', sarcastic: '<has/have> a sarcastic tongue',
  cryptic: '<speaks/speak> in riddles', folksy: '<talks/talk> plainly and warmly', academic: '<lectures/lecture> more than <talks/talk>',
  nervous: '<speaks/speak> nervously', menacing: '<speaks/speak> with quiet menace', cheerful: '<is/are> cheerful in conversation',
};

export const DISPOSITION_PHRASE: Record<Disposition, string> = {
  hostile: 'openly hostile to outsiders', suspicious: 'suspicious of outsiders', wary: 'wary of strangers',
  neutral: 'indifferent to strangers', curious: 'curious about outsiders', friendly: 'friendly to strangers',
  welcoming: 'warmly welcoming to outsiders',
};

export const EVENT_NOUN: Record<HistoricalEventType, string> = {
  war: 'a war', civil_war: 'a civil war', founding: 'the founding', colonization: 'the first colonization', disaster: 'a disaster',
  discovery: 'a great discovery', revolution: 'a revolution', treaty: 'a treaty', plague: 'a plague', contact: 'first contact with offworlders',
  collapse: 'a collapse', golden_age: 'a golden age', invasion: 'an invasion', migration: 'a great migration', famine: 'a famine',
  schism: 'a schism', unification: 'a unification', secession: 'a secession', assassination: 'an assassination', coup: 'a coup',
  reform: 'sweeping reforms', exodus: 'an exodus', awakening: 'the awakening of ancient machines', cataclysm: 'a cataclysm',
  renaissance: 'a renaissance', uprising: 'an uprising', trade_boom: 'a trade boom', persecution: 'a persecution', miracle: 'a miracle',
  birth: 'a birth', apprenticeship: 'an apprenticeship', marriage: 'a marriage', loss: 'a loss', exile: 'an exile',
  promotion: 'a promotion', crime: 'a crime', journey: 'a long journey', conversion: 'a conversion', injury: 'an injury',
};

export const OUTCOME_PHRASE: Record<EventOutcome, string> = {
  victory: 'ended in victory', defeat: 'ended in defeat', stalemate: 'ended in stalemate', prosperity: 'brought prosperity',
  devastation: 'left devastation behind', unification: 'brought unity', division: 'left the land divided',
  independence: 'brought independence', subjugation: 'ended in subjugation', recovery: 'was followed by recovery',
  transformation: 'changed everything', unresolved: 'was never truly resolved', exodus: 'drove many away', reform: 'brought reform',
  decline: 'began a long decline', survival: 'was survived, barely',
};

/** Personal life events as past-tense clauses for backstories. */
export const LIFE_EVENT_CLAUSE: Partial<Record<HistoricalEventType, string[]>> = {
  apprenticeship: ['apprenticed young', 'learned {their} trade from a demanding master'],
  marriage: ['married', 'took a partner'],
  loss: ['lost someone dear', 'suffered a loss {they} still <carries/carry>'],
  exile: ['spent years in exile', 'was driven out of {settlement} for a time'],
  promotion: ['rose in rank', 'earned a promotion few expected'],
  crime: ['fell in with criminals', 'got caught up in a crime'],
  journey: ['travelled far beyond {country}', 'went on a long journey'],
  conversion: ['found a new faith', 'converted, to the surprise of many'],
  injury: ['was badly hurt', 'survived an injury that should have killed {them}'],
  discovery: ['made a discovery', 'stumbled on something remarkable'],
  miracle: ['witnessed something no one could explain', 'saw a miracle, or so {they} <says/say>'],
};

export const ATTITUDE_PHRASE: Record<Attitude, string> = {
  allied: 'allied with', friendly: 'on friendly terms with', neutral: 'neutral toward', rival: 'a rival of', hostile: 'hostile to',
  at_war: 'at war with',
};

export const RELATION_REASON_PHRASE: Record<RelationReason, string> = {
  border_dispute: 'a border dispute', trade: 'trade', religion: 'religion', history: 'old history', ideology: 'ideology',
  resources: 'resources', marriage: 'a royal marriage', betrayal: 'a betrayal', shared_enemy: 'a shared enemy', debt: 'debts',
  cultural_ties: 'shared culture', competition: 'competition', territorial_claim: 'territorial claims', refugees: 'refugees',
  espionage: 'espionage', alliance_treaty: 'an alliance treaty', succession: 'a succession', technology: 'technology', piracy: 'piracy',
};

export const CURRENT_EVENT_PHRASE: Record<CurrentEventType, string> = {
  plague: 'a plague', festival: 'a festival', succession_dispute: 'a succession dispute', monster_sighting: 'monster sightings',
  famine: 'a famine', strike: 'a strike', riot: 'riots', election: 'an election', trade_boom: 'a trade boom', crime_wave: 'a crime wave',
  religious_revival: 'a religious revival', foreign_delegation: 'a foreign delegation', natural_disaster: 'a natural disaster',
  siege: 'a siege', refugee_influx: 'an influx of refugees', murder_investigation: 'a murder investigation', tournament: 'a tournament',
  scandal: 'a scandal', construction: 'a great construction project', disappearances: 'a string of disappearances',
  smuggling_crackdown: 'a crackdown on smugglers', discovery: 'a recent discovery', cult_activity: 'cult activity', protest: 'protests',
};

export const QUEST_PHRASE: Record<QuestType, string> = {
  deliver: 'deliver something to {target}', retrieve: 'retrieve something from {target}', investigate: 'look into {target}',
  eliminate: 'deal with {target} for good', escort: 'escort {target}', persuade: 'win over {target}', protect: 'protect {target}',
  sabotage: 'sabotage {target}',
};

export const RUMOR_PHRASE: Record<RumorClaim, string> = {
  corruption: 'is corrupt', affair: 'is having an affair', hidden_identity: 'is not who they seem', treasure: 'hides a treasure',
  monster: 'is stalked by a monster', conspiracy: 'is part of a conspiracy', betrayal: 'is planning a betrayal', curse: 'is cursed',
  haunting: 'is haunted', secret_weapon: 'is building a secret weapon', smuggling: 'is tied to smugglers',
  assassination_plot: 'is plotting a murder', impostor: 'is an impostor', lost_heir: 'hides a lost heir',
  cult_activity: 'harbors a cult', alien_infiltration: 'has been infiltrated by offworlders', forbidden_tech: 'hoards forbidden technology',
  hidden_wealth: 'is secretly rich', illness: 'is gravely ill', prophecy: 'is the subject of a prophecy', double_agent: 'harbors a spy',
  buried_ruins: 'sits on buried ruins',
};

export const DISTRICT_FLAVOR: Record<DistrictType, string[]> = {
  market: ['where stalls crowd every alley', 'loud with haggling from dawn to dusk'],
  residential: ['where most ordinary folk live', 'rows of homes stacked close together'],
  slums: ['where the poor make do', 'a maze of shacks and debts'],
  noble_quarter: ['where the powerful live behind high walls', 'all gardens, gates and watchful servants'],
  temple: ['thick with incense and prayer', 'where the faithful gather'],
  industrial: ['loud with machines and smoke', 'where the work gets done'],
  docks: ['where cargo and gossip come ashore', 'busy with ships at every hour'],
  spaceport: ['where offworld ships come and go', 'a tangle of landing pads and customs offices'],
  military: ['where the garrison drills', 'behind walls and checkpoints'],
  academic: ['where scholars argue late into the night', 'quiet with study'],
  gardens: ['green and carefully kept', 'a rare place of calm'],
  ruins: ['where older stones still stand', 'full of things best left undisturbed'],
  foreign_quarter: ['where outsiders settle', 'full of strange accents and stranger food'],
  entertainment: ['where the nights never end', 'loud with music and wagers'],
  administrative: ['where decisions are made and filed', 'all offices and officials'],
  artisan: ['where crafters ply their trades', 'ringing with tools'],
  undercity: ['where the light never reaches', 'below the streets, out of sight'],
  farmland: ['where the food is grown', 'fields stretching to the horizon'],
  warehouse: ['where goods wait for buyers', 'stacked high with crates'],
  necropolis: ['where the dead are kept', 'silent and watched'],
  laboratory: ['where experiments run day and night', 'sealed and guarded'],
  old_town: ['where the settlement began', 'narrow, crooked and proud of it'],
};

export const POI_FLAVOR: Record<PoiType, string[]> = {
  tavern: ['Its regulars know everyone’s business.', 'Drinks are cheap and fights are cheaper.'],
  temple: ['Its doors are always open to the faithful.', 'Pilgrims leave offerings at its steps.'],
  guild_hall: ['Deals are struck here that shape the whole settlement.', 'Its members guard their secrets jealously.'],
  ruin: ['Nobody agrees on who built it.', 'Locals avoid it after dark.'],
  spaceport: ['Ships from across the stars set down here.', 'Customs officers here can be persuaded.'],
  black_market: ['Anything can be bought here, for a price.', 'The guards look the other way, mostly.'],
  market: ['It is the beating heart of local trade.', 'Everything from bread to blades is sold here.'],
  palace: ['Power sits behind its gates.', 'Its halls are older than the current rulers.'],
  barracks: ['Soldiers drill in its yard every morning.', 'It is never fully asleep.'],
  library: ['Its shelves hold knowledge found nowhere else.', 'Its keepers are strict about returns.'],
  laboratory: ['Strange smells drift from its vents.', 'Its work is mostly classified.'],
  hospital: ['It never turns anyone away, in theory.', 'Its healers are overworked and underpaid.'],
  arena: ['Crowds roar here every rest day.', 'Champions are made and broken on its sand.'],
  bathhouse: ['Gossip flows as freely as the water.', 'It is where the wealthy relax and plot.'],
  workshop: ['The best work in town comes from here.', 'It is cluttered with half-finished projects.'],
  shrine: ['Small offerings are left here daily.', 'It is older than anyone remembers.'],
  prison: ['Few who enter leave quickly.', 'Its walls have heard many confessions.'],
  embassy: ['Foreign interests are argued here.', 'Its guests are never quite what they seem.'],
  observatory: ['Its instruments watch the sky every night.', 'Its astronomers keep odd hours.'],
  museum: ['It keeps the treasures of the past.', 'Some of its exhibits are not entirely legal.'],
  gambling_den: ['Fortunes change hands here nightly.', 'The house always wins, eventually.'],
  inn: ['Travelers find a bed and a rumor here.', 'Its rooms are clean enough.'],
  docks: ['Ships unload here at all hours.', 'It smells of salt and cargo.'],
  monument: ['It commemorates something most have forgotten.', 'Locals meet beneath it.'],
  archive: ['Its records go back to the founding.', 'Some files are sealed for good reason.'],
  shipyard: ['Hulls take shape here day and night.', 'Its workers build ships they will never ride.'],
  salvage_yard: ['Treasure and junk are sold by weight.', 'Everything here was once something else.'],
  theater: ['Its plays are famous, or infamous.', 'Opening nights here are social events.'],
  garden: ['It is the most peaceful place around.', 'Rare plants are tended here with care.'],
  crypt: ['The honored dead rest here.', 'Something stirs here, say the locals.'],
  city_hall: ['Every permit, tax and grievance passes through it.', 'Its clerks know more than its councillors.'],
  courthouse: ['Justice is done here, or at least announced.', 'Its benches have heard every excuse.'],
  counting_house: ['Fortunes are tallied behind its iron doors.', 'Half the town owes it money.'],
  trading_house: ['Its warehouses smell of distant ports.', 'Its agents haggle in a dozen tongues.'],
  warehouse: ['Crates are stacked to the rafters.', 'No one asks what is inside.'],
  farmstead: ['Its fields feed half the district.', 'It has been in the same family for generations.'],
  mine: ['Its shafts go deeper than anyone admits.', 'The ground hums with distant picks.'],
  hunting_lodge: ['Trophies cover every wall.', 'It smells of smoke and leather.'],
  stables: ['Riders and beasts come and go all day.', 'Its handlers know every road out of town.'],
  meeting_hall: ['Arguments here decide what the town does next.', 'Its benches are worn smooth by debate.'],
  monastery: ['Bells mark the hours here.', 'Its keepers have taken vows of patience.'],
  college: ['Scholars argue in its courtyards.', 'Its libraries are the pride of the region.'],
  citadel: ['Its walls have never fallen.', 'Soldiers watch the town from its towers.'],
  hideout: ['Few know how to find it.', 'The door only opens to the right knock.'],
  estate: ['Its gates keep the world at a polite distance.', 'Servants outnumber the family three to one.'],
  manor: ['It is grand, if a little faded.', 'Its gardens are its owner’s pride.'],
  townhouse: ['It is narrow, tall and respectable.', 'Its windows look over a busy street.'],
  house: ['It is a plain, sturdy home.', 'A lamp burns in its window most nights.'],
  cottage: ['Smoke curls from its chimney.', 'It is small but kept with care.'],
  tenement: ['The stairs creak and the walls are thin.', 'A dozen families share its courtyard.'],
  hovel: ['It keeps out most of the rain.', 'It is barely more than a roof.'],
};

/** Why someone is where they are, as a clause after their name ("Varn is at X, {phrase}"). */
export const LOCATION_REASON_PHRASE: Record<LocationReason, string> = {
  works_here: 'at work', lives_here: 'at home', owns_it: 'minding {their} own business',
  visiting_family: 'visiting family', visiting_lover: 'with a lover', visiting_friend: 'visiting a friend',
  secret_meeting: 'at a secret meeting', hiding: 'in hiding', worshipping: 'at worship', drinking: 'drinking',
  gambling: 'gambling', training: 'training', imprisoned: 'imprisoned', guarding: 'standing guard',
  negotiating: 'negotiating', recovering: 'recovering from illness', studying: 'studying',
};

export const SIGNIFICANCE_PHRASE: Record<PoiSignificance, string> = {
  minor: 'a modest place', notable: 'a place of some note', major: 'one of the most important places in {settlement}',
  landmark: 'a landmark known across {country}',
};

export const TREASURE_CATEGORY_NOUN: Record<TreasureCategory, string> = {
  weapon: 'weapon', armor: 'suit of armor', artifact: 'artifact', technology: 'piece of technology', resource: 'store of riches',
  wealth: 'fortune', relic: 'relic', knowledge: 'body of knowledge', intel: 'cache of intelligence', leverage: 'piece of evidence',
  access: 'key', map: 'map',
};

export const RARITY_PHRASE: Record<TreasureRarity, string> = {
  rare: 'rare', exceptional: 'exceptional', legendary: 'legendary',
};

export const TREASURE_VISIBILITY_LINE: Record<Visibility, string> = {
  public: 'Its existence is common knowledge.', discreet: 'Only a few know it exists.', secret: 'Its keepers have told no one it exists.',
};

export const ANOMALY_PHRASE: Record<AnomalyType, string> = {
  gravity_mismatch: 'gravity that defies its size', atmosphere_retention: 'an atmosphere too thick for so small a world',
  anomalous_liquid_water: 'seas that should not be liquid', life_against_odds: 'life where none should survive',
  unexplained_oxygen: 'oxygen with no living source', climate_mismatch: 'a climate that makes no sense',
  rotation_anomaly: 'a spin that should tear it apart', time_dilation_zone: 'places where time runs slow',
  gravity_wells: 'pockets of crushing gravity', psychic_resonance: 'a psychic hum in the bedrock', phantom_signals: 'phantom signals',
  shifting_geography: 'landscapes that move overnight', null_zones: 'zones where machines fail', perpetual_aurora: 'a perpetual aurora',
  mirrored_sky: 'a sky that sometimes shows another world', temporal_echoes: 'echoes of moments long past',
  silent_zones: 'places where no sound carries', reversed_rivers: 'rivers that run uphill', memory_fog: 'a fog that steals memories',
  wandering_lights: 'wandering lights', impossible_geometry: 'buildings whose angles do not add up',
  artificial_daylight: 'daylight with no sun behind it', spontaneous_growth: 'things that grow overnight from nothing',
  dead_satellites: 'a shell of dead satellites',
};

export const MEGASTRUCTURE_CONDITION_PHRASE: Record<MegastructureCondition, string> = {
  pristine: 'as pristine as the day it was built', active: 'still working', dormant: 'silent and dormant',
  damaged: 'damaged but standing', ruined: 'in ruins',
};

export const DOCTRINE_PHRASE: Record<MilitaryDoctrine, string> = {
  fortification: 'strong fortifications', standing_army: 'a standing army', citizen_militia: 'a citizen militia',
  mercenary_reliance: 'hired mercenaries', naval_power: 'naval power', air_power: 'air power', guerrilla: 'guerrilla tactics',
  orbital_supremacy: 'control of orbit', mechanized: 'mechanized warfare', feudal_levy: 'feudal levies',
  elite_warriors: 'small bands of elite warriors', drone_swarms: 'drone swarms', psionic_corps: 'psionic soldiers',
  deterrence: 'deterrence', expansionist: 'conquest', pacifist: 'avoiding war altogether', beast_cavalry: 'beast-mounted cavalry',
};

export const ORG_STRUCTURE_PHRASE: Record<OrgStructure, string> = {
  hierarchy: 'strictly hierarchical', council: 'council-led', cell_network: 'cell-based', autocracy: 'autocratic',
  democratic: 'democratic', meritocracy: 'merit-based', dynasty: 'dynastic', loose_network: 'loosely organized', hive: 'hive-like',
};
