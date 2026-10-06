import { POI_TABLE, TREASURE_TABLE } from '../content';
import type { Npc, PlanetBundle, PointOfInterest, Treasure } from '../types/entities';
import {
  SOCIAL_RANKS, WEALTH_LEVELS,
  type GoverningBody, type LocationReason, type OrgType, type PoiSignificance, type PoiType, type TreasureCategory,
} from '../types/enums';

/**
 * Rules for points of interest, NPC locations and treasures, shared by the
 * places step and the validator.
 */

export const ORDINARY_REASONS: readonly LocationReason[] = ['works_here', 'lives_here', 'owns_it'];

/** A location that needs explaining (anything but work or home). */
export const isSurprising = (reason: LocationReason) => !ORDINARY_REASONS.includes(reason);

/** Treasures a point of interest holds itself, by significance. NPC-carried treasures do not count. */
export const TREASURES_BY_SIGNIFICANCE: Record<PoiSignificance, [number, number]> = {
  minor: [1, 1], notable: [1, 2], major: [2, 3], landmark: [3, 5],
};

export const needsSubject = (c: TreasureCategory) => TREASURE_TABLE[c].needsSubject;

/** Evidence and secrets can be hidden anywhere; everything else should suit the place. */
export function treasureFits(type: PoiType, c: TreasureCategory): boolean {
  return (POI_TABLE[type].treasures[c] ?? 0) > 0 || c === 'leverage' || c === 'intel';
}

/** Where leaders of each kind of settlement government sit. */
export const GOVERNMENT_SEATS: Record<GoverningBody, PoiType[]> = {
  mayor: ['city_hall', 'meeting_hall'], council: ['city_hall', 'meeting_hall'], noble_lord: ['palace', 'estate', 'manor'],
  military_governor: ['citadel', 'barracks'], guild_council: ['guild_hall', 'city_hall'], elders: ['meeting_hall', 'temple'],
  corporate_board: ['counting_house', 'trading_house'], high_priest: ['temple', 'monastery'], assembly: ['city_hall', 'meeting_hall'],
  warlord: ['citadel', 'barracks', 'hideout'], appointed_administrator: ['city_hall', 'meeting_hall'], ai_steward: ['city_hall', 'laboratory'],
  crime_boss: ['gambling_den', 'hideout'], collective: ['meeting_hall', 'city_hall'],
};

/** An organization's headquarters or local chapter, by organization type. Secret organizations meet in hideouts. */
export const ORG_SEATS: Record<OrgType, PoiType[]> = {
  guild: ['guild_hall', 'workshop'], church: ['temple', 'monastery'], corporation: ['trading_house', 'counting_house', 'shipyard', 'laboratory'],
  criminal_syndicate: ['hideout', 'gambling_den', 'black_market'], secret_society: ['hideout', 'crypt', 'library'],
  military_order: ['citadel', 'barracks'], academy: ['college', 'library', 'observatory'], rebel_movement: ['hideout', 'warehouse'],
  political_party: ['meeting_hall', 'theater'], noble_house: ['estate', 'manor', 'palace'], cult: ['hideout', 'crypt', 'shrine'],
  mercenary_company: ['barracks', 'tavern'], trade_consortium: ['trading_house', 'warehouse', 'docks'],
  monastic_order: ['monastery', 'temple'], explorers_society: ['museum', 'observatory', 'trading_house'],
  mutual_aid_society: ['meeting_hall', 'hospital'], hacker_collective: ['hideout', 'workshop', 'salvage_yard'],
};

/** Places for each surprising reason (some reasons go to a specific place instead, such as a relative's home). */
export const REASON_PLACES: Partial<Record<LocationReason, PoiType[]>> = {
  worshipping: ['temple', 'shrine', 'monastery'],
  drinking: ['tavern', 'inn'],
  gambling: ['gambling_den', 'tavern'],
  training: ['barracks', 'arena', 'citadel'],
  recovering: ['hospital', 'monastery', 'bathhouse'],
  studying: ['library', 'archive', 'college', 'observatory'],
  secret_meeting: ['crypt', 'warehouse', 'bathhouse', 'garden', 'ruin', 'hideout'],
  hiding: ['hideout', 'ruin', 'crypt', 'hovel'],
  imprisoned: ['prison'],
  negotiating: ['meeting_hall', 'guild_hall', 'city_hall', 'trading_house'],
};

/** Homes by standing, grandest first. */
export function residencesFor(n: Pick<Npc, 'wealth_level' | 'social_rank'>, size: number): PoiType[] {
  const w = WEALTH_LEVELS.indexOf(n.wealth_level);
  const r = SOCIAL_RANKS.indexOf(n.social_rank);
  if (r >= SOCIAL_RANKS.indexOf('noble') || w >= 5) return ['estate', 'manor'];
  if (w >= 4 || r >= SOCIAL_RANKS.indexOf('elite')) return ['manor', 'townhouse'];
  if (w >= 3) return ['townhouse', 'house'];
  if (w >= 2) return ['house', 'cottage'];
  if (w >= 1) return size >= 3 ? ['tenement', 'cottage'] : ['cottage'];
  return ['hovel'];
}

export const npcsAt = (b: PlanetBundle, poiId: string): Npc[] => Object.values(b.npcs).filter((n) => n.location_poi_id === poiId);

export const treasuresAt = (b: PlanetBundle, poiId: string): Treasure[] =>
  Object.values(b.treasures).filter((t) => 'poi_id' in t.holder && t.holder.poi_id === poiId);

export const treasuresCarriedBy = (b: PlanetBundle, npcId: string): Treasure[] =>
  Object.values(b.treasures).filter((t) => 'npc_id' in t.holder && t.holder.npc_id === npcId);

export const holderId = (t: Treasure): string => ('poi_id' in t.holder ? t.holder.poi_id : t.holder.npc_id);

/** The point of interest a treasure is at: its own, or the one its carrier is at. */
export function treasureSite(b: PlanetBundle, t: Treasure): PointOfInterest | undefined {
  if ('poi_id' in t.holder) return b.pois[t.holder.poi_id];
  const n = b.npcs[t.holder.npc_id];
  return n ? b.pois[n.location_poi_id] : undefined;
}
