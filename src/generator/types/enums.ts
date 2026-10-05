/**
 * Every enum used for branching logic lives here, as a const array plus a
 * derived union type. Content tables in content/ are typed as
 * Record<EnumValue, Def>, so adding a value here forces a matching content
 * entry (TypeScript will flag the missing key).
 *
 * Arrays marked "ordered" are scales: index order matters (low to high).
 */

const e = <T extends string>(...values: T[]) => values as readonly T[];
type Of<A extends readonly string[]> = A[number];

// ---------------------------------------------------------------------------
// Shared scales (ordered)
// ---------------------------------------------------------------------------

/** ordered */
export const WEALTH_LEVELS = e('destitute', 'poor', 'modest', 'comfortable', 'wealthy', 'opulent');
export type WealthLevel = Of<typeof WEALTH_LEVELS>;

/** ordered */
export const STABILITY_LEVELS = e('collapsing', 'volatile', 'unstable', 'tense', 'stable', 'secure');
export type StabilityLevel = Of<typeof STABILITY_LEVELS>;

/** ordered */
export const LAW_LEVELS = e('lawless', 'lax', 'moderate', 'strict', 'oppressive', 'absolute');
export type LawLevel = Of<typeof LAW_LEVELS>;

/** ordered */
export const FREEDOM_LEVELS = e('subjugated', 'restricted', 'guarded', 'moderate', 'free', 'unbounded');
export type FreedomLevel = Of<typeof FREEDOM_LEVELS>;

/** ordered */
export const DANGER_LEVELS = e('safe', 'low', 'moderate', 'high', 'deadly', 'extreme');
export type DangerLevel = Of<typeof DANGER_LEVELS>;

/** ordered */
export const CORRUPTION_LEVELS = e('none', 'low', 'moderate', 'high', 'rampant');
export type CorruptionLevel = Of<typeof CORRUPTION_LEVELS>;

/** ordered */
export const MILITARY_STRENGTHS = e('negligible', 'weak', 'modest', 'strong', 'formidable', 'overwhelming');
export type MilitaryStrength = Of<typeof MILITARY_STRENGTHS>;

/** ordered */
export const GARRISON_STRENGTHS = e('none', 'token', 'light', 'moderate', 'heavy', 'fortress');
export type GarrisonStrength = Of<typeof GARRISON_STRENGTHS>;

/** ordered */
export const MARKET_SIZES = e('none', 'tiny', 'small', 'medium', 'large', 'vast');
export type MarketSize = Of<typeof MARKET_SIZES>;

/** ordered */
export const INFLUENCE_LEVELS = e('negligible', 'minor', 'moderate', 'major', 'dominant');
export type InfluenceLevel = Of<typeof INFLUENCE_LEVELS>;

/** ordered */
export const ORG_SIZES = e('tiny', 'small', 'medium', 'large', 'massive');
export type OrgSize = Of<typeof ORG_SIZES>;

/** ordered */
export const ABUNDANCE_LEVELS = e('scarce', 'modest', 'plentiful', 'abundant');
export type Abundance = Of<typeof ABUNDANCE_LEVELS>;

/** ordered */
export const SEVERITY_LEVELS = e('minor', 'moderate', 'severe', 'catastrophic');
export type Severity = Of<typeof SEVERITY_LEVELS>;

/** ordered */
export const PREVALENCE_LEVELS = e('rare', 'uncommon', 'common', 'universal');
export type Prevalence = Of<typeof PREVALENCE_LEVELS>;

/** ordered */
export const CONNECTIVITY_LEVELS = e('uncontacted', 'quarantined', 'isolated', 'peripheral', 'connected', 'hub');
export type GalacticConnectivity = Of<typeof CONNECTIVITY_LEVELS>;

// ---------------------------------------------------------------------------
// Planet: physical
// ---------------------------------------------------------------------------

export const PLANET_TYPES = e(
  'terrestrial', 'ocean', 'archipelago', 'desert', 'arctic', 'tundra', 'jungle', 'swamp',
  'savanna', 'steppe', 'mountainous', 'volcanic', 'barren', 'toxic', 'storm', 'tidally_locked',
  'garden', 'fungal', 'ash', 'glass', 'moon_world', 'ecumenopolis', 'crystal', 'hollow',
  'shattered', 'living', 'machine',
);
export type PlanetType = Of<typeof PLANET_TYPES>;

/** ordered */
export const SIZE_CLASSES = e('tiny', 'small', 'medium', 'large', 'huge');
export type SizeClass = Of<typeof SIZE_CLASSES>;

export const ATMOSPHERE_COMPOSITIONS = e(
  'none', 'breathable', 'tainted', 'toxic', 'corrosive', 'inert', 'methane', 'spore_laden', 'exotic',
);
export type AtmosphereComposition = Of<typeof ATMOSPHERE_COMPOSITIONS>;

/** ordered */
export const ATMOSPHERE_PRESSURES = e('none', 'trace', 'thin', 'standard', 'dense', 'crushing');
export type AtmospherePressure = Of<typeof ATMOSPHERE_PRESSURES>;

/** ordered */
export const SEASONALITY_LEVELS = e('none', 'mild', 'moderate', 'strong', 'extreme', 'erratic');
export type Seasonality = Of<typeof SEASONALITY_LEVELS>;

export const MOON_TYPES = e(
  'rocky', 'icy', 'volcanic', 'captured_asteroid', 'dusty', 'oceanic', 'crystalline', 'artificial',
  'shattered', 'habitable', 'metallic',
);
export type MoonType = Of<typeof MOON_TYPES>;

export const BIOMES = e(
  'ocean', 'shallow_sea', 'reef', 'coast', 'temperate_forest', 'rainforest', 'boreal_forest',
  'grassland', 'savanna', 'steppe', 'desert', 'dunes', 'badlands', 'salt_flats', 'tundra',
  'ice_sheet', 'mountains', 'highlands', 'wetland', 'volcanic_fields', 'ash_wastes', 'caverns',
  'crystal_fields', 'fungal_forest', 'toxic_marsh', 'glass_plains', 'storm_plains', 'floating_isles',
  'flesh_plains', 'machine_wastes', 'urban_sprawl', 'shard_fields',
);
export type Biome = Of<typeof BIOMES>;

export const TERRAINS = e(
  'flat', 'hills', 'mountain', 'valley', 'coastal', 'riverside', 'island', 'cliffside', 'underground',
  'floating', 'crater', 'plateau', 'canyon', 'lakeside', 'delta', 'glacier', 'orbit', 'submerged',
);
export type Terrain = Of<typeof TERRAINS>;

export const FEATURE_TYPES = e(
  'great_canyon', 'world_mountain', 'endless_storm', 'ring_system', 'impact_crater', 'bioluminescent_sea',
  'floating_mountains', 'singing_dunes', 'crystal_spires', 'magnetic_vortex', 'great_rift', 'inland_sea',
  'mega_volcano', 'boiling_lake', 'eternal_glacier', 'petrified_forest', 'sinkhole_field', 'world_tree',
  'aurora_belt', 'glass_desert', 'tidal_maze', 'hanging_waterfalls', 'colossal_fossil', 'mirror_lake',
  'storm_spire', 'abyssal_trench', 'living_coral_continent', 'shattered_moon_debris', 'basalt_columns',
  'geyser_basin',
);
export type FeatureType = Of<typeof FEATURE_TYPES>;

export const RESOURCE_TYPES = e(
  'iron', 'copper', 'rare_earths', 'uranium', 'precious_metals', 'gemstones', 'hydrocarbons', 'water_ice',
  'fresh_water', 'timber', 'fertile_soil', 'fish', 'livestock', 'spices', 'medicinal_flora', 'fibers',
  'salt', 'volcanic_glass', 'helium3', 'deuterium', 'resonant_crystals', 'exotic_matter',
  'precursor_relics', 'bio_compounds', 'psychoactive_spores', 'living_alloy', 'geothermal_energy',
  'stone', 'silicates', 'rare_gases',
);
export type ResourceType = Of<typeof RESOURCE_TYPES>;

export const HAZARD_TYPES = e(
  'earthquakes', 'volcanism', 'superstorms', 'radiation', 'toxic_flora', 'apex_predators', 'endemic_disease',
  'floods', 'sandstorms', 'blizzards', 'acid_rain', 'meteor_showers', 'extreme_tides', 'sinkholes',
  'spore_blooms', 'psychic_echoes', 'feral_machines', 'gravity_tides', 'solar_flares', 'wildfires',
  'extreme_cold', 'extreme_heat', 'crushing_pressure', 'vacuum_exposure', 'migratory_swarms',
  'crystal_growth', 'tectonic_shear',
);
export type HazardType = Of<typeof HAZARD_TYPES>;

// ---------------------------------------------------------------------------
// Planet: life
// ---------------------------------------------------------------------------

export const BIOSPHERE_TYPES = e('none', 'microbial', 'sparse', 'complex', 'lush', 'exotic', 'synthetic', 'dying');
export type Biosphere = Of<typeof BIOSPHERE_TYPES>;

export const BIOLOGY_TYPES = e('carbon', 'silicon', 'synthetic', 'fungal', 'crystalline', 'energy', 'gaseous', 'symbiotic');
export type Biology = Of<typeof BIOLOGY_TYPES>;

export const BODY_PLANS = e(
  'humanoid', 'quadruped', 'avian', 'insectoid', 'serpentine', 'cephalopod', 'amorphous', 'colonial',
  'crystalline', 'mechanical', 'plantlike', 'floating',
);
export type BodyPlan = Of<typeof BODY_PLANS>;

export const GENDER_SYSTEMS = e('binary', 'varied', 'none', 'multiple', 'fluid');
export type GenderSystem = Of<typeof GENDER_SYSTEMS>;

export const GENDERS = e('female', 'male', 'nonbinary', 'none', 'other');
export type Gender = Of<typeof GENDERS>;

export const SPECIES_ORIGINS = e('galactic', 'native');
export type SpeciesOrigin = Of<typeof SPECIES_ORIGINS>;

export const SETTLEMENT_ORIGINS = e('native', 'mixed', 'colonial', 'lost_colony');
export type SettlementOrigin = Of<typeof SETTLEMENT_ORIGINS>;

// ---------------------------------------------------------------------------
// Language and naming
// ---------------------------------------------------------------------------

export const LANGUAGE_STYLES = e('harsh', 'flowing', 'clipped', 'melodic', 'guttural', 'alien', 'sibilant', 'mechanical');
export type LanguageStyle = Of<typeof LANGUAGE_STYLES>;

export const LANGUAGE_ORIGINS = e('native', 'colonial', 'creole');
export type LanguageOrigin = Of<typeof LANGUAGE_ORIGINS>;

// ---------------------------------------------------------------------------
// Belief
// ---------------------------------------------------------------------------

export const RELIGION_KINDS = e(
  'monotheism', 'polytheism', 'ancestor_veneration', 'animism', 'philosophy', 'machine_cult', 'star_worship',
  'void_mysticism', 'dualism', 'nature_cult', 'secular_ideology', 'prophet_cult', 'precursor_worship',
  'death_cult', 'revolutionary_ideology', 'mercantile_creed', 'world_soul',
);
export type ReligionKind = Of<typeof RELIGION_KINDS>;

export const RELIGION_TENETS = e(
  'pacifism', 'asceticism', 'charity', 'conversion', 'purity', 'sacrifice', 'pilgrimage', 'ancestor_rites',
  'tech_reverence', 'tech_rejection', 'cyclical_rebirth', 'prophecy', 'hierarchy', 'equality', 'secrecy',
  'stewardship', 'martial_duty', 'contemplation',
);
export type ReligionTenet = Of<typeof RELIGION_TENETS>;

// ---------------------------------------------------------------------------
// Civilization
// ---------------------------------------------------------------------------

export const POLITICAL_STRUCTURES = e('unified', 'federation', 'rival_powers', 'fragmented', 'anarchic');
export type PoliticalStructure = Of<typeof POLITICAL_STRUCTURES>;

export const GOVERNMENT_TYPES = e(
  'absolute_monarchy', 'constitutional_monarchy', 'elective_monarchy', 'theocracy', 'republic', 'democracy',
  'direct_democracy', 'oligarchy', 'plutocracy', 'corporate_state', 'military_junta', 'dictatorship',
  'technocracy', 'meritocracy', 'tribal_confederacy', 'clan_council', 'feudal_realm', 'merchant_republic',
  'gerontocracy', 'colonial_administration', 'raider_kingdom', 'anarcho_commune', 'hive_council',
  'ai_administration', 'psionic_conclave', 'oracle_rule',
);
export type GovernmentType = Of<typeof GOVERNMENT_TYPES>;

export const MILITARY_DOCTRINES = e(
  'fortification', 'standing_army', 'citizen_militia', 'mercenary_reliance', 'naval_power', 'air_power',
  'guerrilla', 'orbital_supremacy', 'mechanized', 'feudal_levy', 'elite_warriors', 'drone_swarms',
  'psionic_corps', 'deterrence', 'expansionist', 'pacifist', 'beast_cavalry',
);
export type MilitaryDoctrine = Of<typeof MILITARY_DOCTRINES>;

export const INDUSTRIES = e(
  'agriculture', 'fishing', 'mining', 'forestry', 'manufacturing', 'shipbuilding', 'trade', 'finance',
  'tourism', 'research', 'mercenary_work', 'crafts', 'herding', 'energy', 'biotech', 'salvage',
  'entertainment', 'pilgrimage', 'smuggling', 'data_services', 'arms', 'textiles', 'construction',
  'education', 'medicine', 'relic_hunting',
);
export type Industry = Of<typeof INDUSTRIES>;

export const TRADE_GOODS = e(
  'grain', 'preserved_food', 'luxury_food', 'fresh_water', 'timber', 'textiles', 'iron', 'copper',
  'rare_earths', 'precious_metals', 'gemstones', 'fuel', 'fusion_fuel', 'machinery', 'weapons',
  'medicine', 'narcotics', 'luxury_goods', 'art', 'crafts', 'data', 'starship_parts', 'electronics',
  'livestock', 'spices', 'crystals', 'exotic_matter', 'relics', 'bio_compounds', 'labor', 'salt',
  'stone', 'chemicals', 'tourism',
);
export type TradeGood = Of<typeof TRADE_GOODS>;

export const CULTURE_VALUES = e(
  'honor', 'tradition', 'progress', 'freedom', 'order', 'faith', 'family', 'wealth', 'knowledge',
  'strength', 'harmony', 'community', 'independence', 'loyalty', 'justice', 'beauty', 'ambition',
  'hospitality', 'survival', 'curiosity', 'discipline', 'compassion', 'glory', 'nature', 'craftsmanship',
  'secrecy',
);
export type CultureValue = Of<typeof CULTURE_VALUES>;

export const CUSTOMS = e(
  'ritual_greetings', 'gift_exchange', 'ancestor_shrines', 'communal_meals', 'blood_oaths', 'masked_festivals',
  'storytelling_nights', 'pilgrimages', 'coming_of_age_trials', 'tattooed_lineages', 'ritual_duels',
  'fasting_seasons', 'sky_burials', 'name_taboos', 'guest_right', 'song_contests', 'tea_ceremonies',
  'silent_days', 'star_vigils', 'trade_blessings', 'beast_bonding', 'debt_ledgers', 'mourning_colors',
  'water_sharing', 'machine_naming',
);
export type Custom = Of<typeof CUSTOMS>;

export const AESTHETICS = e(
  'brutalist', 'ornate', 'organic', 'minimalist', 'gothic', 'crystalline', 'ramshackle', 'industrial',
  'pastoral', 'monumental', 'neon', 'nomadic', 'austere', 'baroque', 'biomechanical', 'stilted',
  'terraced', 'ancestral', 'salvaged', 'luminous',
);
export type Aesthetic = Of<typeof AESTHETICS>;

// ---------------------------------------------------------------------------
// Galaxy
// ---------------------------------------------------------------------------

export const GALACTIC_FACTIONS = e(
  'none', 'independent', 'concord_of_spheres', 'ascendant_hegemony', 'free_trade_compact', 'lattice_directorate',
  'ember_throne', 'pilgrim_synod', 'quiet_covenant', 'drift_marches',
);
export type GalacticFaction = Of<typeof GALACTIC_FACTIONS>;

// ---------------------------------------------------------------------------
// Oddities
// ---------------------------------------------------------------------------

export const ANOMALY_TYPES = e(
  // Physical inconsistencies (recorded by the generator when its own rules are broken)
  'gravity_mismatch', 'atmosphere_retention', 'anomalous_liquid_water', 'life_against_odds',
  'unexplained_oxygen', 'climate_mismatch', 'rotation_anomaly',
  // Flavor anomalies
  'time_dilation_zone', 'gravity_wells', 'psychic_resonance', 'phantom_signals', 'shifting_geography',
  'null_zones', 'perpetual_aurora', 'mirrored_sky', 'temporal_echoes', 'silent_zones', 'reversed_rivers',
  'memory_fog', 'wandering_lights', 'impossible_geometry', 'artificial_daylight', 'spontaneous_growth',
  'dead_satellites',
);
export type AnomalyType = Of<typeof ANOMALY_TYPES>;

export const EXPLANATION_KEYS = e(
  'unknown', 'precursor_engineering', 'terraforming', 'natural_rarity', 'living_world', 'dimensional_breach',
  'ancient_war', 'stellar_event', 'experimental_accident', 'divine_belief', 'misclassified_data',
  'captured_world',
);
export type ExplanationKey = Of<typeof EXPLANATION_KEYS>;

export const PRECURSOR_PRESENCE = e('none', 'ruins', 'active_tech');
export type PrecursorPresence = Of<typeof PRECURSOR_PRESENCE>;

export const MEGASTRUCTURE_TYPES = e(
  'space_elevator', 'orbital_ring', 'planetary_shield', 'weather_engine', 'world_engine', 'great_wall',
  'arcology_spire', 'colossal_statue', 'terraforming_spire', 'core_tap', 'mass_driver', 'sky_bridge',
  'grounded_ark', 'portal_gate', 'signal_beacon', 'tidal_dam', 'sunshade', 'data_vault', 'orbital_mirror',
);
export type MegastructureType = Of<typeof MEGASTRUCTURE_TYPES>;

export const MEGASTRUCTURE_CONDITIONS = e('pristine', 'active', 'dormant', 'damaged', 'ruined');
export type MegastructureCondition = Of<typeof MEGASTRUCTURE_CONDITIONS>;

export const BUILDERS = e('precursors', 'natives', 'colonists', 'offworld_power', 'unknown');
export type Builder = Of<typeof BUILDERS>;

export const SPECIAL_ABILITY_TYPES = e(
  'psionics', 'precognition', 'telepathy', 'biokinesis', 'technopathy', 'empathic_bonding', 'weather_sense',
  'beast_speech', 'longevity', 'regeneration', 'shapeshifting', 'dream_walking', 'gravity_shaping',
  'light_weaving', 'void_sight',
);
export type SpecialAbilityType = Of<typeof SPECIAL_ABILITY_TYPES>;

// ---------------------------------------------------------------------------
// History, rumors, relations
// ---------------------------------------------------------------------------

export const HISTORICAL_EVENT_TYPES = e(
  'war', 'civil_war', 'founding', 'colonization', 'disaster', 'discovery', 'revolution', 'treaty', 'plague',
  'contact', 'collapse', 'golden_age', 'invasion', 'migration', 'famine', 'schism', 'unification',
  'secession', 'assassination', 'coup', 'reform', 'exodus', 'awakening', 'cataclysm', 'renaissance',
  'uprising', 'trade_boom', 'persecution', 'miracle',
  // Personal life events (NPC key_life_events)
  'birth', 'apprenticeship', 'marriage', 'loss', 'exile', 'promotion', 'crime', 'journey', 'conversion',
  'injury',
);
export type HistoricalEventType = Of<typeof HISTORICAL_EVENT_TYPES>;

export const EVENT_OUTCOMES = e(
  'victory', 'defeat', 'stalemate', 'prosperity', 'devastation', 'unification', 'division', 'independence',
  'subjugation', 'recovery', 'transformation', 'unresolved', 'exodus', 'reform', 'decline', 'survival',
);
export type EventOutcome = Of<typeof EVENT_OUTCOMES>;

export const RUMOR_CLAIMS = e(
  'corruption', 'affair', 'hidden_identity', 'treasure', 'monster', 'conspiracy', 'betrayal', 'curse',
  'haunting', 'secret_weapon', 'smuggling', 'assassination_plot', 'impostor', 'lost_heir', 'cult_activity',
  'alien_infiltration', 'forbidden_tech', 'hidden_wealth', 'illness', 'prophecy', 'double_agent',
  'buried_ruins',
);
export type RumorClaim = Of<typeof RUMOR_CLAIMS>;

/** ordered from best to worst */
export const ATTITUDES = e('allied', 'friendly', 'neutral', 'rival', 'hostile', 'at_war');
export type Attitude = Of<typeof ATTITUDES>;

export const RELATION_REASONS = e(
  'border_dispute', 'trade', 'religion', 'history', 'ideology', 'resources', 'marriage', 'betrayal',
  'shared_enemy', 'debt', 'cultural_ties', 'competition', 'territorial_claim', 'refugees', 'espionage',
  'alliance_treaty', 'succession', 'technology', 'piracy',
);
export type RelationReason = Of<typeof RELATION_REASONS>;

// ---------------------------------------------------------------------------
// Motives and hooks
// ---------------------------------------------------------------------------

export const GOAL_TYPES = e(
  'revenge', 'wealth', 'power', 'love', 'knowledge', 'redemption', 'protect_family', 'overthrow',
  'expand_influence', 'find_relic', 'escape', 'recognition', 'justice', 'peace', 'freedom', 'spread_faith',
  'find_cure', 'discovery', 'legacy', 'survival', 'restore_honor', 'monopoly', 'secession', 'rescue',
  'reform', 'reunite',
);
export type GoalType = Of<typeof GOAL_TYPES>;

export const FEAR_TYPES = e(
  'exposure', 'death', 'poverty', 'loss_of_power', 'betrayal', 'abandonment', 'failure', 'disease',
  'monsters', 'divine_wrath', 'offworlders', 'machines', 'the_unknown', 'rival_success', 'imprisonment',
  'madness', 'aging', 'replacement', 'war', 'scandal', 'loss_of_faith', 'the_past',
);
export type FearType = Of<typeof FEAR_TYPES>;

export const SECRET_TYPES = e(
  'secret_leadership', 'hidden_identity', 'affair', 'past_crime', 'crippling_debt', 'forbidden_faith',
  'double_agent', 'illegitimate_child', 'stolen_wealth', 'false_credentials', 'addiction', 'murder',
  'forbidden_power', 'offworld_heritage', 'cowardice', 'blackmailed', 'smuggling', 'true_loyalty',
  'hidden_illness', 'prophecy_knowledge', 'relic_possession',
);
export type SecretType = Of<typeof SECRET_TYPES>;

export const MOTIVE_REASONS = e(
  'financial_ruin', 'family_death', 'betrayal', 'ambition', 'love', 'faith', 'duty', 'honor', 'greed',
  'fear', 'ideology', 'curiosity', 'jealousy', 'humiliation', 'prophecy', 'debt', 'survival', 'loyalty',
  'guilt', 'oath', 'injustice', 'boredom',
);
export type MotiveReason = Of<typeof MOTIVE_REASONS>;

export const QUEST_TYPES = e('deliver', 'retrieve', 'investigate', 'eliminate', 'escort', 'persuade', 'protect', 'sabotage');
export type QuestType = Of<typeof QUEST_TYPES>;

export const REWARD_TYPES = e('money', 'item', 'information', 'favor', 'membership');
export type RewardType = Of<typeof REWARD_TYPES>;

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export const SETTLEMENT_TYPES = e(
  'capital', 'city', 'town', 'village', 'outpost', 'orbital_station', 'floating_city', 'underground',
  'fortress', 'port', 'mining_colony', 'research_station', 'monastery', 'nomad_camp', 'arcology',
  'submerged_city', 'trade_hub', 'ruin_town', 'frontier_camp', 'hive_city', 'tree_city', 'cliff_city',
);
export type SettlementType = Of<typeof SETTLEMENT_TYPES>;

export const SOCIAL_STRUCTURES = e(
  'caste', 'class', 'egalitarian', 'clan', 'guild_based', 'meritocratic', 'feudal', 'hive',
  'religious_hierarchy', 'wealth_tiers', 'age_hierarchy', 'communal',
);
export type SocialStructure = Of<typeof SOCIAL_STRUCTURES>;

export const GOVERNING_BODIES = e(
  'mayor', 'council', 'noble_lord', 'military_governor', 'guild_council', 'elders', 'corporate_board',
  'high_priest', 'assembly', 'warlord', 'appointed_administrator', 'ai_steward', 'crime_boss', 'collective',
);
export type GoverningBody = Of<typeof GOVERNING_BODIES>;

export const LINK_TYPES = e(
  'road', 'river', 'rail', 'sea_route', 'air_route', 'orbital_shuttle', 'tunnel', 'caravan_trail', 'portal',
  'maglev', 'footpath',
);
export type LinkType = Of<typeof LINK_TYPES>;

export const DEFENSE_TYPES = e(
  'walls', 'moat', 'watchtowers', 'shield_generator', 'orbital_defense', 'gun_emplacements', 'militia',
  'minefields', 'natural_barrier', 'fortified_gates', 'drone_patrols', 'psionic_wards', 'beast_guardians',
  'hidden_location',
);
export type DefenseType = Of<typeof DEFENSE_TYPES>;

export const DISTRICT_TYPES = e(
  'market', 'residential', 'slums', 'noble_quarter', 'temple', 'industrial', 'docks', 'spaceport',
  'military', 'academic', 'gardens', 'ruins', 'foreign_quarter', 'entertainment', 'administrative',
  'artisan', 'undercity', 'farmland', 'warehouse', 'necropolis', 'laboratory', 'old_town',
);
export type DistrictType = Of<typeof DISTRICT_TYPES>;

export const POI_TYPES = e(
  'tavern', 'temple', 'guild_hall', 'ruin', 'spaceport', 'black_market', 'market', 'palace', 'barracks',
  'library', 'laboratory', 'hospital', 'arena', 'bathhouse', 'workshop', 'shrine', 'prison', 'embassy',
  'observatory', 'museum', 'gambling_den', 'inn', 'docks', 'monument', 'archive', 'shipyard',
  'salvage_yard', 'theater', 'garden', 'crypt',
);
export type PoiType = Of<typeof POI_TYPES>;

export const MOODS = e(
  'bustling', 'tense', 'festive', 'grim', 'decadent', 'fearful', 'hopeful', 'sleepy', 'militant', 'pious',
  'rowdy', 'secretive', 'mournful', 'defiant', 'serene',
);
export type Mood = Of<typeof MOODS>;

export const CURRENT_EVENT_TYPES = e(
  'plague', 'festival', 'succession_dispute', 'monster_sighting', 'famine', 'strike', 'riot', 'election',
  'trade_boom', 'crime_wave', 'religious_revival', 'foreign_delegation', 'natural_disaster', 'siege',
  'refugee_influx', 'murder_investigation', 'tournament', 'scandal', 'construction', 'disappearances',
  'smuggling_crackdown', 'discovery', 'cult_activity', 'protest',
);
export type CurrentEventType = Of<typeof CURRENT_EVENT_TYPES>;

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export const ORG_TYPES = e(
  'guild', 'church', 'corporation', 'criminal_syndicate', 'secret_society', 'military_order', 'academy',
  'rebel_movement', 'political_party', 'noble_house', 'cult', 'mercenary_company', 'trade_consortium',
  'monastic_order', 'explorers_society', 'mutual_aid_society', 'hacker_collective',
);
export type OrgType = Of<typeof ORG_TYPES>;

export const SCOPE_LEVELS = e('settlement', 'country', 'planet');
export type ScopeLevel = Of<typeof SCOPE_LEVELS>;

export const PRESENCE_STRENGTHS = e('minor', 'established', 'dominant');
export type PresenceStrength = Of<typeof PRESENCE_STRENGTHS>;

export const ORG_STRUCTURES = e(
  'hierarchy', 'council', 'cell_network', 'autocracy', 'democratic', 'meritocracy', 'dynasty', 'loose_network',
  'hive',
);
export type OrgStructure = Of<typeof ORG_STRUCTURES>;

export const VISIBILITY_LEVELS = e('public', 'discreet', 'secret');
export type Visibility = Of<typeof VISIBILITY_LEVELS>;

export const LEGALITY_LEVELS = e('official', 'tolerated', 'outlawed');
export type Legality = Of<typeof LEGALITY_LEVELS>;

export const ORG_ACTIVITIES = e(
  'trade', 'smuggling', 'worship', 'charity', 'research', 'teaching', 'extortion', 'assassination', 'espionage',
  'lobbying', 'protection', 'mercenary_contracts', 'manufacturing', 'mining_operations', 'banking', 'recruitment_drives',
  'propaganda', 'sabotage', 'rituals', 'healing', 'exploration', 'relic_hunting', 'data_theft', 'pilgrimages',
  'arbitration', 'patrols', 'festivals', 'moneylending',
);
export type OrgActivity = Of<typeof ORG_ACTIVITIES>;

export const ORG_RESOURCES = e(
  'wealth', 'land', 'ships', 'weapons', 'informants', 'relics', 'archives', 'political_favors', 'fanatical_followers',
  'safehouses', 'trade_routes', 'laboratories', 'fortresses', 'blackmail_material', 'legal_charters', 'mercenaries',
  'data_networks', 'sacred_sites', 'monopoly_rights', 'trained_beasts',
);
export type OrgResource = Of<typeof ORG_RESOURCES>;

/** Special ties between an organization and the state. */
export const STATE_ROLES = e('none', 'state_church', 'royal_house', 'state_corporation');
export type StateRole = Of<typeof STATE_ROLES>;

export const RECRUITMENT_METHODS = e(
  'open', 'invitation', 'birthright', 'apprenticeship', 'coercion', 'examination', 'initiation_rite',
  'purchase', 'conscription',
);
export type Recruitment = Of<typeof RECRUITMENT_METHODS>;

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------

export const NPC_CATEGORIES = e('leader', 'notable');
export type NpcCategory = Of<typeof NPC_CATEGORIES>;

export const LEAD_ENTITY_TYPES = e('world_government', 'country', 'settlement', 'organization');
export type LeadEntityType = Of<typeof LEAD_ENTITY_TYPES>;

/** ordered */
export const AGE_CATEGORIES = e('youth', 'young_adult', 'adult', 'middle_aged', 'elder', 'ancient');
export type AgeCategory = Of<typeof AGE_CATEGORIES>;

/** ordered */
export const SOCIAL_RANKS = e('outcast', 'lowborn', 'commoner', 'skilled', 'notable', 'elite', 'noble', 'sovereign');
export type SocialRank = Of<typeof SOCIAL_RANKS>;

export const ROLE_TYPES = e(
  'ruler', 'quest_giver', 'merchant', 'rival', 'informant', 'mentor', 'villain', 'ally', 'guard', 'healer',
  'scholar', 'smuggler', 'priest', 'artisan', 'wanderer', 'enforcer', 'fixer',
);
export type RoleType = Of<typeof ROLE_TYPES>;

export const OCCUPATIONS = e(
  'administrator', 'merchant', 'innkeeper', 'smith', 'farmer', 'fisher', 'miner', 'soldier', 'guard',
  'priest', 'scholar', 'physician', 'engineer', 'pilot', 'smuggler', 'thief', 'assassin', 'artist',
  'musician', 'diplomat', 'spy', 'courtier', 'noble', 'hunter', 'herder', 'sailor', 'scavenger',
  'mechanic', 'archivist', 'alchemist', 'bounty_hunter', 'mercenary', 'courier', 'banker', 'judge',
  'explorer', 'prophet', 'crime_lord', 'artisan', 'beast_tamer',
);
export type Occupation = Of<typeof OCCUPATIONS>;

export const APPEARANCE_DETAILS = e(
  'towering', 'diminutive', 'wiry', 'broad', 'scarred', 'weathered', 'youthful_looking', 'gaunt',
  'striking_eyes', 'graceful', 'hunched', 'ornate_markings', 'cybernetic_limb', 'missing_eye',
  'luminous_patterns', 'braided_crest', 'faded_colors', 'restless_hands', 'perfect_posture', 'heavy_build',
  'iridescent', 'cracked_plating', 'flowing_movements', 'piercing_voice', 'soft_spoken_presence',
  'elaborate_adornments', 'unsettling_stillness', 'fresh_wounds',
);
export type AppearanceDetail = Of<typeof APPEARANCE_DETAILS>;

export const CLOTHING_STYLES = e(
  'fine_robes', 'practical_workwear', 'military_uniform', 'patched_rags', 'ceremonial_vestments', 'travel_leathers',
  'sleek_synthetics', 'armor_plating', 'flamboyant_silks', 'hooded_cloak', 'nothing_notable', 'tribal_regalia',
  'stolen_finery', 'lab_coat', 'environment_suit',
);
export type ClothingStyle = Of<typeof CLOTHING_STYLES>;

export const DISTINGUISHING_MARKS = e(
  'none', 'facial_scar', 'brand', 'tattoo', 'missing_finger', 'heterochromia', 'burn_marks', 'prosthetic',
  'birthmark', 'ritual_piercings', 'gold_tooth', 'limp', 'unusual_voice', 'silvered_hair', 'old_wound',
  'glowing_implant',
);
export type DistinguishingMark = Of<typeof DISTINGUISHING_MARKS>;

export const TRAITS = e(
  'brave', 'cowardly', 'greedy', 'generous', 'cunning', 'honest', 'deceitful', 'ambitious', 'lazy',
  'curious', 'paranoid', 'loyal', 'ruthless', 'compassionate', 'proud', 'humble', 'impulsive', 'patient',
  'cynical', 'idealistic', 'charming', 'cold', 'zealous', 'pragmatic', 'reckless', 'cautious', 'jovial',
  'melancholic', 'vain', 'stubborn',
);
export type Trait = Of<typeof TRAITS>;

export const QUIRKS = e(
  'collects_trinkets', 'hums_constantly', 'never_sits', 'counts_things', 'speaks_in_third_person',
  'overly_polite', 'chews_something', 'superstitious_rituals', 'quotes_proverbs', 'laughs_at_wrong_moments',
  'avoids_eye_contact', 'fidgets_with_coin', 'keeps_odd_pet', 'talks_to_self', 'insists_on_titles',
  'always_eating', 'tells_tall_tales', 'mispronounces_names', 'distrusts_machines', 'overdressed', 'whispers',
  'quotes_scripture', 'sketches_people', 'sniffs_everything', 'corrects_grammar',
);
export type Quirk = Of<typeof QUIRKS>;

export const SPEECH_STYLES = e(
  'formal', 'blunt', 'flowery', 'terse', 'rambling', 'sarcastic', 'cryptic', 'folksy', 'academic', 'nervous',
  'menacing', 'cheerful',
);
export type SpeechStyle = Of<typeof SPEECH_STYLES>;

/** ordered from worst to best */
export const DISPOSITIONS = e('hostile', 'suspicious', 'wary', 'neutral', 'curious', 'friendly', 'welcoming');
export type Disposition = Of<typeof DISPOSITIONS>;

export const SKILLS = e(
  'melee', 'marksmanship', 'piloting', 'negotiation', 'deception', 'stealth', 'medicine', 'engineering',
  'hacking', 'lore', 'leadership', 'survival', 'animal_handling', 'trade', 'crafting', 'navigation',
  'intimidation', 'persuasion', 'investigation', 'tactics', 'theology', 'chemistry', 'performance',
  'forgery', 'lockpicking', 'linguistics', 'xenobiology', 'etiquette', 'psionics',
);
export type Skill = Of<typeof SKILLS>;

export const POSSESSIONS = e(
  'heirloom_blade', 'sidearm', 'rifle', 'family_signet', 'ledger_of_debts', 'star_charts', 'relic_fragment',
  'sacred_text', 'personal_ship', 'trained_beast', 'forged_papers', 'medical_kit', 'hidden_cache',
  'rare_instrument', 'encrypted_datacore', 'land_deed', 'jeweled_ornament', 'toolkit', 'old_map',
  'poison_vial', 'prototype_device', 'letter_of_marque',
);
export type Possession = Of<typeof POSSESSIONS>;

/**
 * Relationship types. Asymmetric pairs mirror to their inverse
 * (parent <-> child, mentor <-> student, employer <-> employee);
 * all others mirror to themselves. See RELATIONSHIP_INVERSE.
 */
export const RELATIONSHIP_TYPES = e(
  'parent', 'child', 'sibling', 'spouse', 'friend', 'rival', 'lover', 'employer', 'employee', 'enemy',
  'mentor', 'student',
);
export type RelationshipType = Of<typeof RELATIONSHIP_TYPES>;

export const RELATIONSHIP_INVERSE: Record<RelationshipType, RelationshipType> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
  friend: 'friend',
  rival: 'rival',
  lover: 'lover',
  employer: 'employee',
  employee: 'employer',
  enemy: 'enemy',
  mentor: 'student',
  student: 'mentor',
};

export const RELATIONSHIP_NOTES = e(
  'childhood_friends', 'old_debt', 'saved_life', 'business_partners', 'bitter_separation', 'shared_secret',
  'unrequited_love', 'betrayed_trust', 'comrades_in_arms', 'blood_feud', 'political_alliance',
  'inheritance_dispute', 'estranged', 'devoted', 'uneasy_truce', 'blackmail', 'professional_respect',
  'protective', 'competitive', 'owes_favor',
);
export type RelationshipNote = Of<typeof RELATIONSHIP_NOTES>;
