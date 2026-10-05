import { BIOME_TABLE, SETTLEMENT_TYPE_TABLE, meets, type ConstraintContext } from '../content';
import type { Planet } from '../types/entities';
import type { Biome, SettlementType } from '../types/enums';

/**
 * Settlement type compatibility, shared by the settlements step (to filter
 * choices) and the validator (to warn about incompatible results).
 */

/** Biomes a settlement can stand on by default: land, plus frozen seas. */
export function isSettleableLand(b: Biome): boolean {
  const def = BIOME_TABLE[b];
  return def.water !== 'sea' || def.frozen === true;
}

export function planetHasLand(p: Pick<Planet, 'biomes'>): boolean {
  return p.biomes.some((b) => isSettleableLand(b.biome));
}

/** Whether a settlement type may stand in a biome. Sea is allowed everywhere on worlds with no land at all. */
export function typeAllowsBiome(type: SettlementType, biome: Biome, planet: Pick<Planet, 'biomes'>): boolean {
  const def = SETTLEMENT_TYPE_TABLE[type];
  if (def.biomes) return def.biomes.includes(biome);
  return isSettleableLand(biome) || !planetHasLand(planet);
}

/** Reasons a settlement type is incompatible with its context; empty when compatible. */
export function settlementTypeProblems(
  type: SettlementType, biome: Biome, planet: Pick<Planet, 'biomes'>, ctx: ConstraintContext,
): string[] {
  const def = SETTLEMENT_TYPE_TABLE[type];
  const problems: string[] = [];
  if (!typeAllowsBiome(type, biome, planet)) problems.push(`${type} cannot stand in biome ${biome}`);
  // Biome checks are handled above; the remaining constraints use the shared context.
  if (!meets(def.constraints, { ...ctx, biomes: undefined })) {
    const c = def.constraints ?? {};
    const parts: string[] = [];
    if (c.minTech !== undefined && ctx.techLevel !== undefined && ctx.techLevel < c.minTech) parts.push(`needs tech ${c.minTech}+`);
    if (c.maxTech !== undefined && ctx.techLevel !== undefined && ctx.techLevel > c.maxTech) parts.push(`needs tech ${c.maxTech} or lower`);
    problems.push(`${type} is incompatible with its context${parts.length ? ` (${parts.join(', ')})` : ''}`);
  }
  return problems;
}
