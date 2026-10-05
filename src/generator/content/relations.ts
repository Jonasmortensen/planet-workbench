import type { GovernmentType, OrgType, RelationReason } from '../types/enums';

/**
 * Relation tendencies. Scores add up; the total maps to an attitude
 * (see ATTITUDE_THRESHOLDS). Positive is friendlier.
 */

/** Organization type pairs with a natural tendency. Order within a pair does not matter. */
export const ORG_AFFINITY: { a: OrgType; b: OrgType; score: number; reason: RelationReason }[] = [
  { a: 'church', b: 'cult', score: -2, reason: 'religion' },
  { a: 'church', b: 'monastic_order', score: 0.8, reason: 'religion' },
  { a: 'church', b: 'secret_society', score: -0.8, reason: 'ideology' },
  { a: 'church', b: 'academy', score: -0.3, reason: 'ideology' },
  { a: 'military_order', b: 'criminal_syndicate', score: -2, reason: 'ideology' },
  { a: 'military_order', b: 'rebel_movement', score: -2, reason: 'ideology' },
  { a: 'military_order', b: 'mercenary_company', score: -0.5, reason: 'competition' },
  { a: 'criminal_syndicate', b: 'trade_consortium', score: -0.8, reason: 'trade' },
  { a: 'criminal_syndicate', b: 'mercenary_company', score: 0.6, reason: 'trade' },
  { a: 'criminal_syndicate', b: 'hacker_collective', score: 0.5, reason: 'trade' },
  { a: 'corporation', b: 'guild', score: -1, reason: 'competition' },
  { a: 'corporation', b: 'hacker_collective', score: -1.5, reason: 'espionage' },
  { a: 'corporation', b: 'trade_consortium', score: 0.3, reason: 'trade' },
  { a: 'corporation', b: 'mutual_aid_society', score: -0.8, reason: 'ideology' },
  { a: 'guild', b: 'trade_consortium', score: 0.4, reason: 'trade' },
  { a: 'academy', b: 'explorers_society', score: 1.2, reason: 'technology' },
  { a: 'academy', b: 'secret_society', score: -0.5, reason: 'espionage' },
  { a: 'noble_house', b: 'rebel_movement', score: -1.8, reason: 'ideology' },
  { a: 'noble_house', b: 'political_party', score: -0.4, reason: 'ideology' },
  { a: 'rebel_movement', b: 'mutual_aid_society', score: 0.8, reason: 'ideology' },
  { a: 'rebel_movement', b: 'hacker_collective', score: 0.8, reason: 'shared_enemy' },
  { a: 'cult', b: 'secret_society', score: 0.3, reason: 'history' },
  { a: 'monastic_order', b: 'mutual_aid_society', score: 0.8, reason: 'ideology' },
];

/** Same-type organizations in the same area compete. */
export const SAME_TYPE_RIVALRY: Partial<Record<OrgType, { score: number; reason: RelationReason }>> = {
  guild: { score: -0.8, reason: 'competition' },
  corporation: { score: -1.2, reason: 'competition' },
  criminal_syndicate: { score: -1.8, reason: 'territorial_claim' },
  trade_consortium: { score: -0.8, reason: 'trade' },
  noble_house: { score: -1, reason: 'succession' },
  political_party: { score: -1.2, reason: 'ideology' },
  church: { score: -1, reason: 'religion' },
  mercenary_company: { score: -0.6, reason: 'competition' },
  cult: { score: -1.2, reason: 'religion' },
};

/** Broad government families; different families distrust each other. */
export const GOVERNMENT_FAMILY: Record<GovernmentType, 'popular' | 'autocratic' | 'traditional' | 'mercantile' | 'exotic'> = {
  absolute_monarchy: 'traditional', constitutional_monarchy: 'popular', elective_monarchy: 'traditional', theocracy: 'traditional',
  republic: 'popular', democracy: 'popular', direct_democracy: 'popular', oligarchy: 'mercantile', plutocracy: 'mercantile',
  corporate_state: 'mercantile', military_junta: 'autocratic', dictatorship: 'autocratic', technocracy: 'exotic',
  meritocracy: 'popular', tribal_confederacy: 'traditional', clan_council: 'traditional', feudal_realm: 'traditional',
  merchant_republic: 'mercantile', gerontocracy: 'traditional', colonial_administration: 'autocratic', raider_kingdom: 'autocratic',
  anarcho_commune: 'popular', hive_council: 'exotic', ai_administration: 'exotic', psionic_conclave: 'exotic', oracle_rule: 'exotic',
};

/** Score thresholds, best attitude first: score >= threshold picks that attitude. */
export const ATTITUDE_THRESHOLDS: { attitude: 'allied' | 'friendly' | 'neutral' | 'rival' | 'hostile'; min: number }[] = [
  { attitude: 'allied', min: 1.6 },
  { attitude: 'friendly', min: 0.6 },
  { attitude: 'neutral', min: -0.5 },
  { attitude: 'rival', min: -1.3 },
  { attitude: 'hostile', min: -2.3 },
];
