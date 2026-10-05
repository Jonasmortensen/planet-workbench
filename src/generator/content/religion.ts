import type { ReligionKind, ReligionTenet } from '../types/enums';
import type { WeightedDef } from './constraints';

export interface ReligionKindDef extends WeightedDef {
  /** Which naming pattern family to use. */
  family: 'theistic' | 'mystic' | 'secular' | 'folk';
  /** Whether the faith centers on a named deity, prophet or principle. */
  hasFocus: boolean;
  tenets: Partial<Record<ReligionTenet, number>>;
}

export const RELIGION_KIND_TABLE: Record<ReligionKind, ReligionKindDef> = {
  monotheism: {
    weight: 6, family: 'theistic', hasFocus: true,
    tenets: { conversion: 3, charity: 2, hierarchy: 3, purity: 2, prophecy: 1, pilgrimage: 2 },
  },
  polytheism: {
    weight: 5, family: 'theistic', hasFocus: true,
    tenets: { sacrifice: 3, pilgrimage: 2, prophecy: 2, martial_duty: 1, stewardship: 1 },
    constraints: { maxTech: 8 },
  },
  ancestor_veneration: {
    weight: 5, family: 'folk', hasFocus: false,
    tenets: { ancestor_rites: 6, hierarchy: 2, cyclical_rebirth: 1, stewardship: 1 },
  },
  animism: {
    weight: 4, family: 'folk', hasFocus: false,
    tenets: { stewardship: 5, sacrifice: 1, tech_rejection: 2, contemplation: 1 },
    constraints: { maxTech: 6, biospheres: ['sparse', 'complex', 'lush', 'exotic', 'dying'] },
  },
  philosophy: {
    weight: 4, family: 'mystic', hasFocus: true,
    tenets: { contemplation: 5, asceticism: 2, equality: 2, pacifism: 2 },
  },
  machine_cult: {
    weight: 2, family: 'theistic', hasFocus: true,
    tenets: { tech_reverence: 6, hierarchy: 2, secrecy: 2, purity: 1 },
    constraints: { minTech: 5 },
  },
  star_worship: {
    weight: 3, family: 'theistic', hasFocus: true,
    tenets: { pilgrimage: 3, prophecy: 3, cyclical_rebirth: 2, contemplation: 1 },
  },
  void_mysticism: {
    weight: 1.5, family: 'mystic', hasFocus: false,
    tenets: { contemplation: 4, secrecy: 3, asceticism: 2, prophecy: 2 },
    constraints: { minTech: 6 },
  },
  dualism: {
    weight: 2, family: 'theistic', hasFocus: true,
    tenets: { purity: 3, martial_duty: 2, prophecy: 2, conversion: 1 },
  },
  nature_cult: {
    weight: 2.5, family: 'folk', hasFocus: true,
    tenets: { stewardship: 5, sacrifice: 2, cyclical_rebirth: 2, tech_rejection: 2 },
    constraints: { biospheres: ['complex', 'lush', 'exotic', 'sparse'] },
  },
  secular_ideology: {
    weight: 4, family: 'secular', hasFocus: false,
    tenets: { equality: 3, tech_reverence: 2, charity: 1, hierarchy: 1 },
    constraints: { minTech: 4 },
  },
  prophet_cult: {
    weight: 2, family: 'theistic', hasFocus: true,
    tenets: { prophecy: 5, conversion: 3, secrecy: 1, sacrifice: 1 },
  },
  precursor_worship: {
    weight: 3, family: 'theistic', hasFocus: true,
    tenets: { tech_reverence: 4, pilgrimage: 3, secrecy: 2, prophecy: 2 },
    constraints: { requiresPrecursors: true },
  },
  death_cult: {
    weight: 0.8, family: 'mystic', hasFocus: true,
    tenets: { sacrifice: 4, secrecy: 3, cyclical_rebirth: 2, martial_duty: 1 },
  },
  revolutionary_ideology: {
    weight: 1.5, family: 'secular', hasFocus: true,
    tenets: { equality: 5, martial_duty: 2, conversion: 2 },
    constraints: { minTech: 4 },
  },
  mercantile_creed: {
    weight: 1.5, family: 'secular', hasFocus: false,
    tenets: { charity: 1, hierarchy: 2, pilgrimage: 1, equality: 1 },
    constraints: { minTech: 3 },
  },
  world_soul: {
    weight: 1, family: 'mystic', hasFocus: true,
    tenets: { stewardship: 4, contemplation: 3, pacifism: 2 },
    constraints: { planetTypes: ['living', 'garden', 'fungal', 'hollow', 'crystal'] },
  },
};
