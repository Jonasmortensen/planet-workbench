import type {
  AppearanceDetail, ClothingStyle, DistinguishingMark, Occupation, PoiType, Possession, Quirk, RelationshipNote,
  RelationshipType, RoleType, Skill, SocialRank, SpeechStyle, Trait,
} from '../types/enums';
import type { WeightedDef } from './constraints';

export interface OccupationDef extends WeightedDef {
  rank: SocialRank;
  skills: Partial<Record<Skill, number>>;
  possessions: Partial<Record<Possession, number>>;
  clothing: Partial<Record<ClothingStyle, number>>;
  /** Role types this occupation tends to play in stories. */
  roles: Partial<Record<RoleType, number>>;
  /** Points of interest this occupation works at or owns. */
  pois: PoiType[];
}

export const OCCUPATION_TABLE: Record<Occupation, OccupationDef> = {
  administrator: { weight: 3, rank: 'notable', skills: { leadership: 2, negotiation: 2, etiquette: 2, investigation: 1 }, possessions: { ledger_of_debts: 2, forged_papers: 0.5 }, clothing: { fine_robes: 2, practical_workwear: 1 }, roles: { quest_giver: 3, informant: 1 }, pois: ['archive', 'embassy', 'palace'] },
  merchant: { weight: 6, rank: 'skilled', skills: { trade: 4, negotiation: 3, deception: 1, navigation: 1 }, possessions: { ledger_of_debts: 2, hidden_cache: 1, jeweled_ornament: 1 }, clothing: { flamboyant_silks: 2, travel_leathers: 2, practical_workwear: 1 }, roles: { merchant: 6, quest_giver: 2, informant: 1 }, pois: ['market', 'black_market', 'docks'] },
  innkeeper: { weight: 4, rank: 'commoner', skills: { trade: 2, persuasion: 2, investigation: 1, etiquette: 1 }, possessions: { hidden_cache: 1, old_map: 1 }, clothing: { practical_workwear: 4 }, roles: { informant: 4, quest_giver: 3, merchant: 1 }, pois: ['tavern', 'inn', 'bathhouse'] },
  smith: { weight: 3, rank: 'skilled', skills: { crafting: 5, melee: 1, trade: 1 }, possessions: { toolkit: 3, heirloom_blade: 1 }, clothing: { practical_workwear: 4 }, roles: { artisan: 5, merchant: 1 }, pois: ['workshop', 'guild_hall'] },
  farmer: { weight: 4, rank: 'commoner', skills: { survival: 3, animal_handling: 2, crafting: 1 }, possessions: { land_deed: 2, trained_beast: 1 }, clothing: { practical_workwear: 4, patched_rags: 1 }, roles: { ally: 2, quest_giver: 2 }, pois: ['market'] },
  fisher: { weight: 2, rank: 'commoner', skills: { survival: 2, navigation: 2, trade: 1 }, possessions: { old_map: 1, toolkit: 1 }, clothing: { practical_workwear: 4 }, roles: { informant: 2, ally: 2 }, pois: ['docks'], constraints: { requiresLiquidWater: true } },
  miner: { weight: 3, rank: 'commoner', skills: { engineering: 2, survival: 2, melee: 1 }, possessions: { toolkit: 3 }, clothing: { practical_workwear: 4, environment_suit: 1 }, roles: { ally: 2, quest_giver: 1 }, pois: ['salvage_yard'] },
  soldier: { weight: 4, rank: 'commoner', skills: { melee: 3, marksmanship: 3, tactics: 2, survival: 1 }, possessions: { sidearm: 2, rifle: 2, heirloom_blade: 1 }, clothing: { military_uniform: 5, armor_plating: 2 }, roles: { guard: 3, ally: 2, enforcer: 2, rival: 1 }, pois: ['barracks'] },
  guard: { weight: 4, rank: 'commoner', skills: { melee: 3, intimidation: 2, investigation: 1 }, possessions: { sidearm: 2, heirloom_blade: 1 }, clothing: { military_uniform: 3, armor_plating: 2 }, roles: { guard: 6, informant: 1 }, pois: ['barracks', 'prison', 'palace'] },
  priest: { weight: 4, rank: 'notable', skills: { theology: 5, persuasion: 2, medicine: 1, lore: 2 }, possessions: { sacred_text: 4, relic_fragment: 1 }, clothing: { ceremonial_vestments: 5, hooded_cloak: 1 }, roles: { priest: 6, mentor: 2, quest_giver: 2, healer: 1 }, pois: ['temple', 'shrine', 'crypt'] },
  scholar: { weight: 3, rank: 'skilled', skills: { lore: 4, investigation: 2, linguistics: 2, xenobiology: 1 }, possessions: { sacred_text: 1, star_charts: 1, old_map: 1, encrypted_datacore: 1 }, clothing: { fine_robes: 2, lab_coat: 1, hooded_cloak: 1 }, roles: { scholar: 6, mentor: 3, quest_giver: 2 }, pois: ['library', 'archive', 'observatory', 'museum'] },
  physician: { weight: 3, rank: 'skilled', skills: { medicine: 5, chemistry: 2, xenobiology: 1 }, possessions: { medical_kit: 5, poison_vial: 0.5 }, clothing: { practical_workwear: 2, lab_coat: 2 }, roles: { healer: 7, ally: 1 }, pois: ['hospital', 'laboratory'] },
  engineer: { weight: 3, rank: 'skilled', skills: { engineering: 5, hacking: 1, piloting: 1, crafting: 2 }, possessions: { toolkit: 4, prototype_device: 2 }, clothing: { practical_workwear: 3, lab_coat: 1, environment_suit: 1 }, roles: { artisan: 3, ally: 2, quest_giver: 1 }, pois: ['workshop', 'shipyard', 'laboratory'], constraints: { minTech: 3 } },
  pilot: { weight: 2, rank: 'skilled', skills: { piloting: 5, navigation: 3, marksmanship: 1 }, possessions: { personal_ship: 3, star_charts: 2, sidearm: 1 }, clothing: { travel_leathers: 3, sleek_synthetics: 2 }, roles: { ally: 3, smuggler: 2, wanderer: 2 }, pois: ['spaceport', 'docks'], constraints: { minTech: 5 } },
  smuggler: { weight: 2, rank: 'lowborn', skills: { deception: 3, piloting: 2, stealth: 2, trade: 2 }, possessions: { hidden_cache: 3, forged_papers: 2, personal_ship: 1, sidearm: 1 }, clothing: { travel_leathers: 3, hooded_cloak: 2 }, roles: { smuggler: 7, informant: 2, fixer: 1 }, pois: ['black_market', 'docks', 'tavern'] },
  thief: { weight: 2, rank: 'lowborn', skills: { stealth: 4, lockpicking: 4, deception: 2 }, possessions: { hidden_cache: 3, forged_papers: 1 }, clothing: { hooded_cloak: 3, patched_rags: 2, stolen_finery: 1 }, roles: { informant: 3, rival: 2, villain: 1 }, pois: ['black_market', 'gambling_den'] },
  assassin: { weight: 0.6, rank: 'skilled', skills: { stealth: 4, melee: 3, chemistry: 2, deception: 2 }, possessions: { poison_vial: 4, heirloom_blade: 2, forged_papers: 1 }, clothing: { hooded_cloak: 4, fine_robes: 1 }, roles: { villain: 5, enforcer: 3 }, pois: ['gambling_den'] },
  artist: { weight: 2, rank: 'commoner', skills: { performance: 3, crafting: 3, persuasion: 1 }, possessions: { rare_instrument: 1, jeweled_ornament: 1 }, clothing: { flamboyant_silks: 3, patched_rags: 1 }, roles: { artisan: 4, informant: 2 }, pois: ['theater', 'museum', 'workshop'] },
  musician: { weight: 2, rank: 'commoner', skills: { performance: 5, persuasion: 2, etiquette: 1 }, possessions: { rare_instrument: 5 }, clothing: { flamboyant_silks: 3, travel_leathers: 1 }, roles: { informant: 3, wanderer: 2, ally: 1 }, pois: ['tavern', 'theater'] },
  diplomat: { weight: 1.5, rank: 'elite', skills: { negotiation: 4, etiquette: 4, linguistics: 3, deception: 1 }, possessions: { family_signet: 2, encrypted_datacore: 1 }, clothing: { fine_robes: 4 }, roles: { quest_giver: 4, informant: 2, rival: 1 }, pois: ['embassy', 'palace'] },
  spy: { weight: 1, rank: 'skilled', skills: { deception: 4, stealth: 3, investigation: 3, linguistics: 2 }, possessions: { forged_papers: 3, encrypted_datacore: 2, poison_vial: 1 }, clothing: { nothing_notable: 3, hooded_cloak: 2 }, roles: { informant: 5, villain: 1, fixer: 2 }, pois: ['embassy', 'tavern'] },
  courtier: { weight: 1.5, rank: 'elite', skills: { etiquette: 5, persuasion: 3, deception: 2 }, possessions: { jeweled_ornament: 3, family_signet: 2 }, clothing: { fine_robes: 4, flamboyant_silks: 2 }, roles: { informant: 3, rival: 3, quest_giver: 1 }, pois: ['palace', 'theater'] },
  noble: { weight: 1.5, rank: 'noble', skills: { etiquette: 4, leadership: 3, melee: 1, negotiation: 2 }, possessions: { family_signet: 4, land_deed: 3, heirloom_blade: 2, jeweled_ornament: 2 }, clothing: { fine_robes: 5, flamboyant_silks: 2 }, roles: { quest_giver: 3, rival: 3, villain: 1 }, pois: ['palace'] },
  hunter: { weight: 2, rank: 'commoner', skills: { survival: 4, marksmanship: 3, stealth: 2, animal_handling: 1 }, possessions: { rifle: 2, trained_beast: 2, old_map: 1 }, clothing: { travel_leathers: 4 }, roles: { ally: 3, wanderer: 3, quest_giver: 1 }, pois: ['market'], constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  herder: { weight: 2, rank: 'commoner', skills: { animal_handling: 4, survival: 3 }, possessions: { trained_beast: 4 }, clothing: { practical_workwear: 3, tribal_regalia: 1 }, roles: { ally: 3, wanderer: 1 }, pois: ['market'], constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  sailor: { weight: 2, rank: 'commoner', skills: { navigation: 4, survival: 2, melee: 1 }, possessions: { old_map: 2, star_charts: 1 }, clothing: { practical_workwear: 3, travel_leathers: 1 }, roles: { informant: 2, ally: 2, wanderer: 2 }, pois: ['docks', 'tavern'], constraints: { requiresLiquidWater: true } },
  scavenger: { weight: 2, rank: 'lowborn', skills: { survival: 3, engineering: 2, stealth: 1, trade: 1 }, possessions: { toolkit: 2, relic_fragment: 1, hidden_cache: 1 }, clothing: { patched_rags: 4, environment_suit: 1 }, roles: { informant: 2, merchant: 2, wanderer: 2 }, pois: ['salvage_yard', 'ruin'] },
  mechanic: { weight: 2, rank: 'commoner', skills: { engineering: 4, crafting: 2, piloting: 1 }, possessions: { toolkit: 5 }, clothing: { practical_workwear: 5 }, roles: { artisan: 3, ally: 3 }, pois: ['workshop', 'shipyard', 'spaceport'], constraints: { minTech: 4 } },
  archivist: { weight: 1, rank: 'skilled', skills: { lore: 4, investigation: 3, linguistics: 2 }, possessions: { encrypted_datacore: 1, old_map: 2, sacred_text: 1 }, clothing: { fine_robes: 2, hooded_cloak: 1 }, roles: { scholar: 4, informant: 3 }, pois: ['archive', 'library'] },
  alchemist: { weight: 1, rank: 'skilled', skills: { chemistry: 5, medicine: 2, lore: 1 }, possessions: { poison_vial: 2, medical_kit: 1, prototype_device: 1 }, clothing: { lab_coat: 2, hooded_cloak: 2 }, roles: { merchant: 2, healer: 2, villain: 1 }, pois: ['laboratory', 'workshop'] },
  bounty_hunter: { weight: 1, rank: 'skilled', skills: { marksmanship: 4, investigation: 3, survival: 2, intimidation: 2 }, possessions: { rifle: 3, sidearm: 2, personal_ship: 1 }, clothing: { armor_plating: 2, travel_leathers: 3 }, roles: { enforcer: 4, rival: 2, quest_giver: 2 }, pois: ['tavern'] },
  mercenary: { weight: 2, rank: 'commoner', skills: { melee: 3, marksmanship: 3, tactics: 2 }, possessions: { rifle: 2, heirloom_blade: 1, sidearm: 1 }, clothing: { armor_plating: 3, travel_leathers: 2 }, roles: { enforcer: 4, ally: 2, rival: 1 }, pois: ['barracks', 'tavern'] },
  courier: { weight: 2, rank: 'commoner', skills: { navigation: 3, stealth: 1, piloting: 1, survival: 1 }, possessions: { old_map: 2, forged_papers: 1 }, clothing: { travel_leathers: 4 }, roles: { informant: 4, ally: 2 }, pois: ['docks', 'spaceport', 'inn'] },
  banker: { weight: 1.5, rank: 'elite', skills: { trade: 4, negotiation: 3, investigation: 1 }, possessions: { ledger_of_debts: 5, jeweled_ornament: 1 }, clothing: { fine_robes: 4 }, roles: { quest_giver: 3, villain: 1, merchant: 2 }, pois: ['guild_hall', 'market'] },
  judge: { weight: 1, rank: 'elite', skills: { investigation: 3, etiquette: 2, lore: 2, intimidation: 1 }, possessions: { sacred_text: 1, family_signet: 1 }, clothing: { ceremonial_vestments: 2, fine_robes: 3 }, roles: { quest_giver: 4, rival: 1 }, pois: ['archive', 'prison'] },
  explorer: { weight: 1, rank: 'skilled', skills: { survival: 3, navigation: 3, xenobiology: 2, lore: 1 }, possessions: { star_charts: 3, old_map: 3, relic_fragment: 1 }, clothing: { travel_leathers: 4, environment_suit: 2 }, roles: { wanderer: 4, quest_giver: 3, mentor: 1 }, pois: ['observatory', 'museum'] },
  prophet: { weight: 0.7, rank: 'notable', skills: { theology: 4, persuasion: 4, performance: 2 }, possessions: { sacred_text: 3, relic_fragment: 2 }, clothing: { patched_rags: 2, ceremonial_vestments: 3 }, roles: { priest: 3, villain: 2, quest_giver: 2 }, pois: ['shrine', 'temple'] },
  crime_lord: { weight: 0.6, rank: 'elite', skills: { intimidation: 4, negotiation: 3, deception: 3, leadership: 2 }, possessions: { hidden_cache: 3, ledger_of_debts: 3, sidearm: 1 }, clothing: { fine_robes: 3, stolen_finery: 2 }, roles: { villain: 5, fixer: 3, quest_giver: 2 }, pois: ['gambling_den', 'black_market', 'tavern'] },
  artisan: { weight: 3, rank: 'skilled', skills: { crafting: 5, trade: 2 }, possessions: { toolkit: 3, rare_instrument: 0.5 }, clothing: { practical_workwear: 4 }, roles: { artisan: 6, merchant: 2 }, pois: ['workshop', 'guild_hall', 'market'] },
  beast_tamer: { weight: 0.8, rank: 'skilled', skills: { animal_handling: 5, survival: 2, performance: 1 }, possessions: { trained_beast: 5 }, clothing: { travel_leathers: 3, tribal_regalia: 1 }, roles: { ally: 3, wanderer: 2, merchant: 1 }, pois: ['arena', 'market'], constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
};

export interface TraitDef {
  weight: number;
  /** Traits that cannot appear together with this one. */
  opposites: Trait[];
  speech: Partial<Record<SpeechStyle, number>>;
  /** Shift on the disposition scale (hostile .. welcoming). */
  disposition: number;
}

export const TRAIT_TABLE: Record<Trait, TraitDef> = {
  brave: { weight: 3, opposites: ['cowardly', 'cautious'], speech: { blunt: 2 }, disposition: 0 },
  cowardly: { weight: 1.5, opposites: ['brave', 'reckless'], speech: { nervous: 3 }, disposition: -0.5 },
  greedy: { weight: 2.5, opposites: ['generous'], speech: { flowery: 1, sarcastic: 1 }, disposition: 0 },
  generous: { weight: 2.5, opposites: ['greedy', 'cold'], speech: { cheerful: 2, folksy: 1 }, disposition: 1 },
  cunning: { weight: 3, opposites: ['honest'], speech: { cryptic: 2, flowery: 1 }, disposition: 0 },
  honest: { weight: 3, opposites: ['deceitful', 'cunning'], speech: { blunt: 3, folksy: 1 }, disposition: 0.5 },
  deceitful: { weight: 1.5, opposites: ['honest', 'loyal'], speech: { flowery: 2, cheerful: 1 }, disposition: 0.5 },
  ambitious: { weight: 3, opposites: ['lazy', 'humble'], speech: { formal: 2, terse: 1 }, disposition: 0 },
  lazy: { weight: 1.5, opposites: ['ambitious'], speech: { rambling: 2, folksy: 1 }, disposition: 0 },
  curious: { weight: 3, opposites: [], speech: { rambling: 2, academic: 1 }, disposition: 1.5 },
  paranoid: { weight: 1.5, opposites: ['reckless'], speech: { terse: 2, nervous: 2 }, disposition: -2 },
  loyal: { weight: 3, opposites: ['deceitful'], speech: { formal: 1, blunt: 1 }, disposition: 0 },
  ruthless: { weight: 2, opposites: ['compassionate'], speech: { menacing: 3, terse: 2 }, disposition: -1 },
  compassionate: { weight: 2.5, opposites: ['ruthless', 'cold'], speech: { cheerful: 1, folksy: 2 }, disposition: 1.5 },
  proud: { weight: 2.5, opposites: ['humble'], speech: { formal: 3, flowery: 1 }, disposition: -0.5 },
  humble: { weight: 2, opposites: ['proud', 'vain', 'ambitious'], speech: { folksy: 2, terse: 1 }, disposition: 0.5 },
  impulsive: { weight: 2, opposites: ['patient', 'cautious'], speech: { rambling: 2, blunt: 1 }, disposition: 0.5 },
  patient: { weight: 2, opposites: ['impulsive', 'reckless'], speech: { formal: 1, academic: 1 }, disposition: 0.5 },
  cynical: { weight: 2, opposites: ['idealistic'], speech: { sarcastic: 4 }, disposition: -1 },
  idealistic: { weight: 2, opposites: ['cynical'], speech: { flowery: 2, cheerful: 1 }, disposition: 1 },
  charming: { weight: 2.5, opposites: ['cold'], speech: { flowery: 2, cheerful: 2 }, disposition: 1.5 },
  cold: { weight: 1.5, opposites: ['charming', 'compassionate', 'jovial'], speech: { terse: 3, formal: 1 }, disposition: -1.5 },
  zealous: { weight: 1.5, opposites: ['cynical'], speech: { formal: 1, menacing: 1, cryptic: 1 }, disposition: -1 },
  pragmatic: { weight: 3, opposites: ['idealistic'], speech: { blunt: 2, terse: 1 }, disposition: 0 },
  reckless: { weight: 1.5, opposites: ['cautious', 'patient', 'cowardly'], speech: { blunt: 1, cheerful: 1 }, disposition: 1 },
  cautious: { weight: 2.5, opposites: ['reckless', 'impulsive', 'brave'], speech: { formal: 1, nervous: 1 }, disposition: -1 },
  jovial: { weight: 2, opposites: ['melancholic', 'cold'], speech: { cheerful: 4, folksy: 2 }, disposition: 2 },
  melancholic: { weight: 1.5, opposites: ['jovial'], speech: { terse: 1, rambling: 1, cryptic: 1 }, disposition: -0.5 },
  vain: { weight: 1.5, opposites: ['humble'], speech: { flowery: 3 }, disposition: 0 },
  stubborn: { weight: 2.5, opposites: [], speech: { blunt: 2 }, disposition: -0.5 },
};

export const QUIRK_TABLE: Record<Quirk, WeightedDef> = {
  collects_trinkets: { weight: 3 }, hums_constantly: { weight: 2 }, never_sits: { weight: 1.5 }, counts_things: { weight: 1.5 },
  speaks_in_third_person: { weight: 1 }, overly_polite: { weight: 2.5 }, chews_something: { weight: 2 },
  superstitious_rituals: { weight: 2.5 }, quotes_proverbs: { weight: 2.5 }, laughs_at_wrong_moments: { weight: 1.5 },
  avoids_eye_contact: { weight: 2 }, fidgets_with_coin: { weight: 2 }, keeps_odd_pet: { weight: 1.5, constraints: { biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] } },
  talks_to_self: { weight: 2 }, insists_on_titles: { weight: 2 }, always_eating: { weight: 2 }, tells_tall_tales: { weight: 2.5 },
  mispronounces_names: { weight: 1.5 }, distrusts_machines: { weight: 1.5, constraints: { minTech: 3 } }, overdressed: { weight: 1.5 },
  whispers: { weight: 1.5 }, quotes_scripture: { weight: 2 }, sketches_people: { weight: 1.5 }, sniffs_everything: { weight: 1 },
  corrects_grammar: { weight: 1.5 },
};

export const APPEARANCE_TABLE: Record<AppearanceDetail, WeightedDef> = {
  towering: { weight: 3 }, diminutive: { weight: 3 }, wiry: { weight: 3 }, broad: { weight: 3 }, scarred: { weight: 3 },
  weathered: { weight: 3 }, youthful_looking: { weight: 2 }, gaunt: { weight: 2 }, striking_eyes: { weight: 3 },
  graceful: { weight: 2.5 }, hunched: { weight: 1.5 }, ornate_markings: { weight: 2 }, cybernetic_limb: { weight: 1.5, constraints: { minTech: 6 } },
  missing_eye: { weight: 1 }, luminous_patterns: { weight: 1 }, braided_crest: { weight: 1.5 }, faded_colors: { weight: 1.5 },
  restless_hands: { weight: 2 }, perfect_posture: { weight: 2 }, heavy_build: { weight: 2.5 }, iridescent: { weight: 1 },
  cracked_plating: { weight: 1 }, flowing_movements: { weight: 2 }, piercing_voice: { weight: 2 }, soft_spoken_presence: { weight: 2 },
  elaborate_adornments: { weight: 2 }, unsettling_stillness: { weight: 1.5 }, fresh_wounds: { weight: 1.5 },
};

export const DISTINGUISHING_MARK_TABLE: Record<DistinguishingMark, WeightedDef> = {
  none: { weight: 10 }, facial_scar: { weight: 3 }, brand: { weight: 1.5 }, tattoo: { weight: 3 }, missing_finger: { weight: 1.5 },
  heterochromia: { weight: 1.5 }, burn_marks: { weight: 1.5 }, prosthetic: { weight: 1.5, constraints: { minTech: 3 } },
  birthmark: { weight: 2 }, ritual_piercings: { weight: 2 }, gold_tooth: { weight: 1.5 }, limp: { weight: 2 },
  unusual_voice: { weight: 2 }, silvered_hair: { weight: 1.5 }, old_wound: { weight: 2 }, glowing_implant: { weight: 1, constraints: { minTech: 7 } },
};

export const CLOTHING_CONSTRAINTS: Partial<Record<ClothingStyle, WeightedDef>> = {
  lab_coat: { weight: 1, constraints: { minTech: 5 } },
  sleek_synthetics: { weight: 1, constraints: { minTech: 6 } },
  environment_suit: { weight: 1, constraints: { minTech: 5 } },
  armor_plating: { weight: 1, constraints: { minTech: 2 } },
};

export const SKILL_CONSTRAINTS: Partial<Record<Skill, WeightedDef>> = {
  hacking: { weight: 1, constraints: { minTech: 6 } },
  piloting: { weight: 1, constraints: { minTech: 4 } },
  marksmanship: { weight: 1, constraints: { minTech: 2 } },
  engineering: { weight: 1, constraints: { minTech: 3 } },
  psionics: { weight: 1, constraints: { requiresAbility: ['psionics', 'telepathy', 'precognition', 'dream_walking'] } },
  xenobiology: { weight: 1, constraints: { minTech: 5 } },
  chemistry: { weight: 1, constraints: { minTech: 2 } },
};

export const POSSESSION_CONSTRAINTS: Partial<Record<Possession, WeightedDef>> = {
  sidearm: { weight: 1, constraints: { minTech: 4 } },
  rifle: { weight: 1, constraints: { minTech: 4 } },
  personal_ship: { weight: 1, constraints: { minTech: 6 } },
  encrypted_datacore: { weight: 1, constraints: { minTech: 6 } },
  prototype_device: { weight: 1, constraints: { minTech: 4 } },
  star_charts: { weight: 1, constraints: { minTech: 2 } },
  trained_beast: { weight: 1, constraints: { biospheres: ['complex', 'lush', 'exotic'] } },
  relic_fragment: { weight: 1, constraints: { requiresPrecursors: true } },
};

/** Typical clothing by social rank (blended with occupation clothing). */
export const CLOTHING_BY_RANK: Record<SocialRank, Partial<Record<ClothingStyle, number>>> = {
  outcast: { patched_rags: 5, hooded_cloak: 2 },
  lowborn: { patched_rags: 3, practical_workwear: 2, hooded_cloak: 1 },
  commoner: { practical_workwear: 4, nothing_notable: 2 },
  skilled: { practical_workwear: 2, nothing_notable: 2, travel_leathers: 1 },
  notable: { fine_robes: 2, nothing_notable: 1, ceremonial_vestments: 1 },
  elite: { fine_robes: 4, flamboyant_silks: 2, sleek_synthetics: 1 },
  noble: { fine_robes: 4, flamboyant_silks: 3, tribal_regalia: 1 },
  sovereign: { fine_robes: 3, ceremonial_vestments: 3, tribal_regalia: 1 },
};

/** Base speech style weights, before traits and rank. */
export const SPEECH_BASE: Record<SpeechStyle, number> = {
  formal: 2, blunt: 2, flowery: 1.5, terse: 1.5, rambling: 1.5, sarcastic: 1, cryptic: 0.8, folksy: 2, academic: 1,
  nervous: 1, menacing: 0.6, cheerful: 1.5,
};

/** Note keys that fit each relationship type. */
export const RELATIONSHIP_NOTE_TABLE: Record<RelationshipType, Partial<Record<RelationshipNote, number>>> = {
  parent: { devoted: 4, protective: 3, estranged: 2, inheritance_dispute: 1, bitter_separation: 0.5 },
  child: { devoted: 4, protective: 3, estranged: 2, inheritance_dispute: 1, bitter_separation: 0.5 },
  sibling: { childhood_friends: 2, competitive: 3, devoted: 2, inheritance_dispute: 2, estranged: 1, protective: 2 },
  spouse: { devoted: 5, political_alliance: 2, uneasy_truce: 1, shared_secret: 1 },
  friend: { childhood_friends: 4, comrades_in_arms: 2, saved_life: 2, owes_favor: 2, shared_secret: 2, business_partners: 1 },
  rival: { competitive: 5, professional_respect: 2, betrayed_trust: 2, inheritance_dispute: 1 },
  lover: { unrequited_love: 2, shared_secret: 3, devoted: 3, bitter_separation: 1 },
  employer: { business_partners: 2, professional_respect: 3, owes_favor: 2, blackmail: 1, old_debt: 1 },
  employee: { business_partners: 2, professional_respect: 3, owes_favor: 2, blackmail: 1, old_debt: 1 },
  enemy: { blood_feud: 3, betrayed_trust: 4, old_debt: 2, blackmail: 1 },
  mentor: { professional_respect: 4, devoted: 2, owes_favor: 1, competitive: 1 },
  student: { professional_respect: 4, devoted: 2, owes_favor: 1, competitive: 1 },
};
