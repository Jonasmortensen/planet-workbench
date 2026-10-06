import type * as E from './enums';

// ---------------------------------------------------------------------------
// Ids. All ids are prefixed strings ("country_3", "npc_12") so the entity kind
// can be read from the id alone; see ids.ts.
// ---------------------------------------------------------------------------

export type PlanetId = string;
export type CountryId = string;
export type SettlementId = string;
export type OrgId = string;
export type NpcId = string;
export type SpeciesId = string;
export type LanguageId = string;
export type ReligionId = string;
export type PoiId = string;
export type TreasureId = string;
export type CurrentEventId = string;
export type HistoricalEventId = string;
/** Any entity id (planet, country, settlement, organization, npc, species, language, religion, poi, treasure). */
export type EntityId = string;

// ---------------------------------------------------------------------------
// Shared structured types
// ---------------------------------------------------------------------------

export interface HistoricalEvent {
  id: HistoricalEventId;
  /** Years relative to the present. Negative is the past; -340 means 340 years ago. */
  date: number;
  event_type: E.HistoricalEventType;
  involved_refs: EntityId[];
  outcome: E.EventOutcome;
  /** A larger event this one is part of (e.g. a country event inside a planet-wide war). */
  parent_event_id: HistoricalEventId | null;
}

export interface Rumor {
  subject_ref: EntityId;
  claim_type: E.RumorClaim;
  target_ref: EntityId | null;
  is_true: boolean;
}

export interface Relation {
  target_ref: EntityId;
  attitude: E.Attitude;
  reason: E.RelationReason;
}

export interface Motive<T extends string> {
  type: T;
  target_npc_id: NpcId | null;
  target_org_id: OrgId | null;
  target_settlement_id: SettlementId | null;
  target_country_id: CountryId | null;
  reason: E.MotiveReason;
}

export interface QuestHook {
  type: E.QuestType;
  target_refs: EntityId[];
  reward_type: E.RewardType;
}

export interface SpeciesShare {
  species_id: SpeciesId;
  share: number;
}

export interface ReligionShare {
  religion_id: ReligionId;
  share: number;
}

export interface BiomeShare {
  biome: E.Biome;
  share: number;
}

// ---------------------------------------------------------------------------
// Peoples: species, languages, religions
// ---------------------------------------------------------------------------

export interface Species {
  id: SpeciesId;
  /** Content key for galactic species; null for species generated for this planet. */
  content_key: string | null;
  name: string;
  plural_name: string;
  origin: E.SpeciesOrigin;
  biology: E.Biology;
  body_plan: E.BodyPlan;
  gender_system: E.GenderSystem;
  lifespan_years: number;
  /** Mean surface temperatures (°C) the species tolerates without equipment. */
  comfort_temperature: [number, number];
  breathes: E.AtmosphereComposition[];
}

export interface Phonology {
  onsets: { value: string; weight: number }[];
  nuclei: { value: string; weight: number }[];
  codas: { value: string; weight: number }[];
  syllables: { value: number; weight: number }[];
  coda_chance: number;
  final_coda_chance: number;
  apostrophe_chance: number;
  reduplication_chance: number;
  place_suffixes: string[];
  given_endings_female: string[];
  given_endings_male: string[];
  given_endings_neutral: string[];
  family_suffixes: string[];
}

export interface Language {
  id: LanguageId;
  name: string;
  style: E.LanguageStyle;
  origin: E.LanguageOrigin;
  /** Species that brought or speak this language natively. */
  speaker_species_ids: SpeciesId[];
  phonology: Phonology;
}

export interface Religion {
  id: ReligionId;
  name: string;
  kind: E.ReligionKind;
  tenets: E.ReligionTenet[];
  /** Name of the central deity, prophet or principle, when the kind has one. */
  focus_name: string | null;
  origin: 'native' | 'imported' | 'syncretic';
  /** Church organization of this faith, if one exists (filled in milestone 3). */
  church_org_id: OrgId | null;
}

// ---------------------------------------------------------------------------
// Planet
// ---------------------------------------------------------------------------

export interface Moon {
  name: string;
  size_class: E.SizeClass;
  moon_type: E.MoonType;
}

export interface NotableFeature {
  type: E.FeatureType;
  name: string;
}

export interface ResourceDeposit {
  resource: E.ResourceType;
  abundance: E.Abundance;
}

export interface Hazard {
  type: E.HazardType;
  severity: E.Severity;
}

export interface Anomaly {
  type: E.AnomalyType;
  explanation_key: E.ExplanationKey;
}

export interface Megastructure {
  type: E.MegastructureType;
  name: string;
  condition: E.MegastructureCondition;
  builder: E.Builder;
}

export interface SpecialAbility {
  type: E.SpecialAbilityType;
  prevalence: E.Prevalence;
}

export interface WorldGovernment {
  name: string;
  leader_title: string;
  /** Filled in milestone 3 (leaders step). */
  leader_npc_id: NpcId | null;
}

export interface Planet {
  // Identity
  id: PlanetId;
  seed: string;
  name: string;
  native_name: string;
  star_system: string;
  orbital_position: number;
  orbital_distance_au: number;
  /** Stellar flux relative to a temperate standard (1.0). */
  insolation: number;

  // Physical
  planet_type: E.PlanetType;
  size_class: E.SizeClass;
  radius_km: number;
  /** Surface gravity in standard g. */
  gravity: number;
  day_length_hours: number;
  tidally_locked: boolean;
  /** Orbital period in standard days. */
  year_length_days: number;
  axial_tilt: number;
  seasonality: E.Seasonality;
  moons: Moon[];
  atmosphere: { composition: E.AtmosphereComposition; pressure: E.AtmospherePressure };
  /** Surface temperatures in °C. */
  temperature_range: { min: number; mean: number; max: number };
  /** Fraction of the surface covered by water (liquid or frozen). */
  water_coverage: number;

  // Geography and resources
  biomes: BiomeShare[];
  continent_count: number;
  notable_features: NotableFeature[];
  resources: ResourceDeposit[];
  hazards: Hazard[];

  // Life
  biosphere: E.Biosphere;
  native_sapients: boolean;
  native_species_id: SpeciesId | null;
  settlement_origin: E.SettlementOrigin;
  species: SpeciesShare[];

  // Civilization
  population: number;
  tech_level: number;
  political_structure: E.PoliticalStructure;
  world_government: WorldGovernment | null;
  country_count: number;
  stability: E.StabilityLevel;
  dominant_languages: LanguageId[];
  dominant_religions_or_ideologies: ReligionShare[];
  history: HistoricalEvent[];

  // Economy and galactic relations
  wealth_level: E.WealthLevel;
  primary_exports: E.TradeGood[];
  primary_imports: E.TradeGood[];
  galactic_connectivity: E.GalacticConnectivity;
  faction_allegiance: E.GalacticFaction;
  law_level: E.LawLevel;
  danger_level: E.DangerLevel;

  // Notable oddities
  anomalies: Anomaly[];
  precursor_presence: E.PrecursorPresence;
  megastructures: Megastructure[];
  special_abilities: SpecialAbility[];

  // Flavor (rendered, milestone 4)
  tagline: string;
  description: string;
  rumors: Rumor[];
}

// ---------------------------------------------------------------------------
// Country (milestone 2)
// ---------------------------------------------------------------------------

export interface Country {
  id: CountryId;
  planet_id: PlanetId;
  seed: string;
  name: string;
  demonym: string;
  flag_description: string;
  motto: string;

  area_share: number;
  /** Normalized planet-surface coordinates of the country's heartland, in [0, 1]. */
  center: { x: number; y: number };
  biomes: BiomeShare[];
  capital_settlement_id: SettlementId | null;
  neighbor_ids: CountryId[];
  notable_features: NotableFeature[];

  population: number;
  species: SpeciesShare[];
  languages: LanguageId[];
  religions_or_ideologies: ReligionShare[];

  government_type: E.GovernmentType;
  ruler_title: string;
  ruler_npc_id: NpcId | null;
  stability: E.StabilityLevel;
  law_level: E.LawLevel;
  freedom_level: E.FreedomLevel;

  wealth_level: E.WealthLevel;
  tech_level: number;
  primary_industries: E.Industry[];
  exports: E.TradeGood[];
  imports: E.TradeGood[];
  currency_name: string;

  military_strength: E.MilitaryStrength;
  military_doctrine: E.MilitaryDoctrine;

  relations: Relation[];

  values: E.CultureValue[];
  customs: E.Custom[];
  aesthetic: E.Aesthetic;

  founding_date: number;
  key_events: HistoricalEvent[];

  tagline: string;
  description: string;
  rumors: Rumor[];
}

// ---------------------------------------------------------------------------
// Settlement (milestone 2)
// ---------------------------------------------------------------------------

export interface District {
  name: string;
  type: E.DistrictType;
  description: string;
}

/**
 * A place in a settlement where NPCs can be found. Points of interest exist
 * only to hold NPCs (see steps/places.ts); who is present is derived from
 * Npc.location_poi_id, and treasures from Treasure.holder.
 */
export interface PointOfInterest {
  id: PoiId;
  seed: string;
  settlement_id: SettlementId;
  name: string;
  type: E.PoiType;
  significance: E.PoiSignificance;
  owner_npc_id: NpcId | null;
  /** Set when this is an organization's headquarters. */
  organization_id: OrgId | null;
  description: string;
}

export type TreasureHolder = { poi_id: PoiId } | { npc_id: NpcId };

/** Something rare, valuable or dangerous, held at a point of interest or by an NPC. */
export interface Treasure {
  id: TreasureId;
  seed: string;
  name: string;
  category: E.TreasureCategory;
  rarity: E.TreasureRarity;
  holder: TreasureHolder;
  /** public: known to exist; discreet: known to a few; secret: known only to its keepers. */
  visibility: E.Visibility;
  /** The real entities the treasure is about (required for knowledge, intel, leverage, access and maps). */
  subject_refs: EntityId[];
  guarded_by_npc_ids: NpcId[];
  /** True when the treasure is the holder NPC themself (their gift or what they know), not an object they carry. */
  embodied: boolean;
  description: string;
}

export interface CurrentEvent {
  id: CurrentEventId;
  type: E.CurrentEventType;
  involved_refs: EntityId[];
}

export interface Settlement {
  id: SettlementId;
  country_id: CountryId;
  seed: string;
  name: string;
  nickname: string;
  settlement_type: E.SettlementType;

  biome: E.Biome;
  terrain: E.Terrain;
  /** Normalized planet-surface coordinates in [0, 1]. */
  position: { x: number; y: number };
  connections: { settlement_id: SettlementId; link_type: E.LinkType }[];

  population: number;
  species: SpeciesShare[];
  languages: LanguageId[];
  religions_or_ideologies: ReligionShare[];
  social_structure: E.SocialStructure;

  leader_title: string;
  leader_npc_id: NpcId | null;
  governing_body: E.GoverningBody;
  law_level: E.LawLevel;
  corruption_level: E.CorruptionLevel;

  wealth_level: E.WealthLevel;
  primary_industries: E.Industry[];
  notable_goods: E.TradeGood[];
  market_size: E.MarketSize;

  defenses: E.DefenseType[];
  garrison_strength: E.GarrisonStrength;

  districts: District[];
  /** Filled by the places step. */
  poi_ids: PoiId[];

  mood: E.Mood;
  aesthetic: E.Aesthetic;
  local_customs: E.Custom[];

  current_events: CurrentEvent[];
  organizations_present: OrgId[];

  founding_date: number;
  key_events: HistoricalEvent[];

  tagline: string;
  description: string;
  rumors: Rumor[];
}

// ---------------------------------------------------------------------------
// Organization (milestone 3)
// ---------------------------------------------------------------------------

export interface OrgPresence {
  settlement_id: SettlementId;
  strength: E.PresenceStrength;
}

export interface Organization {
  id: OrgId;
  seed: string;
  name: string;
  short_name: string;
  symbol_description: string;
  motto: string;

  org_type: E.OrgType;
  /** Official tie to the home country (a theocracy's church, a monarch's house, a corporate state's corporation). */
  state_role: E.StateRole;
  /** The faith this organization serves (churches, cults, monastic orders). */
  religion_id: ReligionId | null;

  scope_level: E.ScopeLevel;
  home_ref: EntityId;
  headquarters_settlement_id: SettlementId;
  presence: OrgPresence[];

  leader_title: string;
  leader_npc_id: NpcId | null;
  structure: E.OrgStructure;

  visibility: E.Visibility;
  legality: E.Legality;
  influence: E.InfluenceLevel;
  wealth_level: E.WealthLevel;
  size: E.OrgSize;

  stated_goal: Motive<E.GoalType>;
  true_goal: Motive<E.GoalType>;
  activities: E.OrgActivity[];
  resources: E.OrgResource[];

  relations: Relation[];

  member_npc_ids: NpcId[];
  recruitment: E.Recruitment;
  ranks: string[];

  founding_date: number;
  key_events: HistoricalEvent[];

  tagline: string;
  description: string;
  rumors: Rumor[];
}

// ---------------------------------------------------------------------------
// NPC (milestone 3)
// ---------------------------------------------------------------------------

export interface LeadEntry {
  entity_type: E.LeadEntityType;
  /** For world_government this is the planet id. */
  entity_id: EntityId;
  public: boolean;
}

export interface NpcRelationship {
  npc_id: NpcId;
  type: E.RelationshipType;
  note_key: E.RelationshipNote;
}

export interface Npc {
  id: NpcId;
  seed: string;
  settlement_id: SettlementId;
  name: string;
  given_name: string;
  family_name: string;
  title_or_epithet: string;
  species_id: SpeciesId;
  /** Native tongue; names follow its style. */
  language_id: LanguageId;
  age: number;
  age_category: E.AgeCategory;
  gender: E.Gender;

  npc_category: E.NpcCategory;
  leads: LeadEntry[];

  occupation: E.Occupation;
  social_rank: E.SocialRank;
  role_type: E.RoleType;
  /** Where they work, if that place exists (someone is there). Not always where they are. */
  workplace_poi_id: PoiId | null;
  /** Where they can be found. NPCs are static. Filled by the places step. */
  location_poi_id: PoiId;
  location_reason: E.LocationReason;
  /** The entity that explains a surprising location (the relative visited, the organization met). */
  location_reason_ref: EntityId | null;
  /** False when being there is itself a secret (a mayor at a syndicate's hideout). */
  location_public: boolean;

  appearance: E.AppearanceDetail[];
  clothing: E.ClothingStyle;
  distinguishing_mark: E.DistinguishingMark;

  traits: E.Trait[];
  values: E.CultureValue[];
  quirk: E.Quirk;
  speech_style: E.SpeechStyle;
  disposition_to_outsiders: E.Disposition;

  /** Filled by the motives step (milestone 4). */
  goal: Motive<E.GoalType> | null;
  /** Filled by the motives step (milestone 4). */
  fear: Motive<E.FearType> | null;
  /** A hidden leadership role is recorded here as soon as leaders are assigned. */
  secret: Motive<E.SecretType> | null;

  skills: E.Skill[];
  special_abilities: E.SpecialAbilityType[];
  possessions: E.Possession[];
  wealth_level: E.WealthLevel;

  organization_ids: OrgId[];
  religion_or_ideology: ReligionId | null;
  allegiance_ref: EntityId | null;

  relationships: NpcRelationship[];

  current_event_involvement: CurrentEventId | null;
  quest_hooks: QuestHook[];
  rumors_about: Rumor[];

  key_life_events: HistoricalEvent[];

  tagline: string;
  description: string;
  backstory: string;
  sample_greeting: string;
}

// ---------------------------------------------------------------------------
// Bundle and validation
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  severity: 'error' | 'warning';
  /** Stable machine-readable check id, e.g. "ref.missing". */
  code: string;
  entity_ref: EntityId;
  message: string;
}

export interface PlanetBundle {
  generator_version: string;
  seed: string;
  planet: Planet;
  countries: Record<CountryId, Country>;
  settlements: Record<SettlementId, Settlement>;
  organizations: Record<OrgId, Organization>;
  npcs: Record<NpcId, Npc>;
  species: Record<SpeciesId, Species>;
  languages: Record<LanguageId, Language>;
  religions: Record<ReligionId, Religion>;
  pois: Record<PoiId, PointOfInterest>;
  treasures: Record<TreasureId, Treasure>;
  validation: ValidationIssue[];
}
