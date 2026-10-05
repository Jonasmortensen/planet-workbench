import type {
  AtmospherePressure, Biome, Biosphere, GovernmentType, PlanetType, SettlementOrigin, SizeClass,
} from '../types/enums';

/**
 * Tags that restrict where a content entry may be used. Every field is
 * optional, and a field only applies when the generator supplies the matching
 * context value. Generators filter pools with `meets()`.
 */
export interface Constraints {
  minTech?: number;
  maxTech?: number;
  /** Entry is allowed only on these planet types. */
  planetTypes?: PlanetType[];
  /** Entry is never used on these planet types. */
  excludePlanetTypes?: PlanetType[];
  /** At least one of these biomes must be present. */
  anyBiome?: Biome[];
  /** Planet must have an atmosphere of at least thin pressure. */
  requiresAtmosphere?: boolean;
  /** Atmospheric pressure must be one of these. */
  pressures?: AtmospherePressure[];
  /** Planet must have liquid surface water. */
  requiresLiquidWater?: boolean;
  /** Planet biosphere must be one of these. */
  biospheres?: Biosphere[];
  minMeanTemp?: number;
  maxMeanTemp?: number;
  minSize?: SizeClass;
  requiresNatives?: boolean;
  requiresColonists?: boolean;
  origins?: SettlementOrigin[];
  requiresPrecursors?: boolean;
  governments?: GovernmentType[];
}

export interface ConstraintContext {
  techLevel?: number;
  planetType?: PlanetType;
  biomes?: readonly Biome[];
  hasAtmosphere?: boolean;
  pressure?: AtmospherePressure;
  liquidWater?: boolean;
  biosphere?: Biosphere;
  meanTemp?: number;
  sizeIndex?: number;
  natives?: boolean;
  colonists?: boolean;
  origin?: SettlementOrigin;
  precursors?: boolean;
  government?: GovernmentType;
}

const SIZE_ORDER: SizeClass[] = ['tiny', 'small', 'medium', 'large', 'huge'];

export function meets(c: Constraints | undefined, ctx: ConstraintContext): boolean {
  if (!c) return true;
  if (ctx.techLevel !== undefined) {
    if (c.minTech !== undefined && ctx.techLevel < c.minTech) return false;
    if (c.maxTech !== undefined && ctx.techLevel > c.maxTech) return false;
  }
  if (ctx.planetType !== undefined) {
    if (c.planetTypes && !c.planetTypes.includes(ctx.planetType)) return false;
    if (c.excludePlanetTypes && c.excludePlanetTypes.includes(ctx.planetType)) return false;
  }
  if (ctx.biomes !== undefined && c.anyBiome && !c.anyBiome.some((b) => ctx.biomes!.includes(b))) return false;
  if (ctx.hasAtmosphere !== undefined && c.requiresAtmosphere && !ctx.hasAtmosphere) return false;
  if (ctx.pressure !== undefined && c.pressures && !c.pressures.includes(ctx.pressure)) return false;
  if (ctx.liquidWater !== undefined && c.requiresLiquidWater && !ctx.liquidWater) return false;
  if (ctx.biosphere !== undefined && c.biospheres && !c.biospheres.includes(ctx.biosphere)) return false;
  if (ctx.meanTemp !== undefined) {
    if (c.minMeanTemp !== undefined && ctx.meanTemp < c.minMeanTemp) return false;
    if (c.maxMeanTemp !== undefined && ctx.meanTemp > c.maxMeanTemp) return false;
  }
  if (ctx.sizeIndex !== undefined && c.minSize && ctx.sizeIndex < SIZE_ORDER.indexOf(c.minSize)) return false;
  if (ctx.natives !== undefined && c.requiresNatives && !ctx.natives) return false;
  if (ctx.colonists !== undefined && c.requiresColonists && !ctx.colonists) return false;
  if (ctx.origin !== undefined && c.origins && !c.origins.includes(ctx.origin)) return false;
  if (ctx.precursors !== undefined && c.requiresPrecursors && !ctx.precursors) return false;
  if (ctx.government !== undefined && c.governments && !c.governments.includes(ctx.government)) return false;
  return true;
}

/** A content entry with a base weight and optional constraints. */
export interface WeightedDef {
  weight: number;
  constraints?: Constraints;
}

/** Weighted entries for the keys of a content table that meet the context. */
export function eligible<K extends string, D extends WeightedDef>(
  keys: readonly K[],
  table: Record<K, D>,
  ctx: ConstraintContext,
  weightOf: (key: K, def: D) => number = (_k, d) => d.weight,
): { value: K; weight: number }[] {
  const out: { value: K; weight: number }[] = [];
  for (const k of keys) {
    const def = table[k];
    if (!meets(def.constraints, ctx)) continue;
    const w = weightOf(k, def);
    if (w > 0) out.push({ value: k, weight: w });
  }
  return out;
}
