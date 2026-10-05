import {
  ADJECTIVES, FEATURE_NAME_PATTERNS, FEATURE_TABLE, GALACTIC_SPECIES, GOVERNMENT_NOUNS, MEGASTRUCTURE_NAME_PATTERNS,
  MEGASTRUCTURE_TABLE, MOON_NAME_PATTERNS, PLANET_NAME_PATTERNS, ROMAN, STAR_SYSTEM_PATTERNS, WORLD_GOVERNMENT_PATTERNS,
  WORLD_LEADER_TITLES,
} from '../../content';
import { buildPhonology, fillPattern, makeBareName, makePlaceName, makeRoot, pickPattern } from '../../naming';
import type { Rng } from '../../rng';
import type { PlanetBundle } from '../../types/entities';
import { LANGUAGE_STYLES } from '../../types/enums';

/**
 * Naming pass. Runs after all structure is rolled, so names never influence
 * logic. Native names use the dominant language; the catalog name and star
 * system use a galactic surveyor language.
 */
export function rollPlanetNames(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const dominant = bundle.languages[p.dominant_languages[0]];
  const ph = dominant.phonology;

  // Surveyors' language: colonists' style if any, otherwise anyone's.
  const sRng = rng.fork('surveyor');
  const colonistKeys = p.species
    .map((s) => bundle.species[s.species_id].content_key)
    .filter((k): k is string => k !== null);
  const surveyorStyle = colonistKeys.length > 0 && sRng.chance(0.6)
    ? sRng.weightedBy(LANGUAGE_STYLES, (st) => GALACTIC_SPECIES[colonistKeys[0]].styles[st] ?? 0)
    : sRng.pick(LANGUAGE_STYLES);
  const surveyor = buildPhonology(surveyorStyle, sRng.fork('phonology'));

  const nRng = rng.fork('planet');
  p.star_system = fillPattern(pickPattern(nRng, STAR_SYSTEM_PATTERNS), {
    root: () => makeRoot(surveyor, nRng, { minSyllables: 2, maxSyllables: 2 }),
    adjective: () => nRng.pick(ADJECTIVES),
  });
  p.native_name = makePlaceName(ph, nRng.fork('native'));
  const numeral = ROMAN[Math.min(ROMAN.length, p.orbital_position) - 1];
  const contacted = p.galactic_connectivity !== 'uncontacted';
  if (p.settlement_origin !== 'native' && nRng.chance(0.5)) {
    // Colonists usually call the world what they named it.
    p.name = p.native_name;
  } else {
    const patterns = PLANET_NAME_PATTERNS.map((pt) => ({
      ...pt,
      weight: !contacted && pt.pattern.includes('{system}') ? pt.weight * 4 : pt.weight,
    }));
    p.name = fillPattern(pickPattern(nRng, patterns), {
      root: () => makeRoot(surveyor, nRng, { minSyllables: 2, maxSyllables: 3 }),
      system: () => p.star_system,
      numeral: () => numeral,
      adjective: () => nRng.pick(ADJECTIVES),
    });
  }

  p.moons.forEach((m, i) => {
    const r = rng.fork(`moon:${i}`);
    m.name = fillPattern(pickPattern(r, MOON_NAME_PATTERNS), {
      root: () => makeRoot(ph, r, { minSyllables: 1, maxSyllables: 3 }),
      adjective: () => r.pick(ADJECTIVES),
    });
  });

  p.notable_features.forEach((f, i) => {
    const r = rng.fork(`feature:${i}`);
    f.name = fillPattern(pickPattern(r, FEATURE_NAME_PATTERNS), {
      root: () => makeBareName(ph, r),
      feature: () => r.pick(FEATURE_TABLE[f.type].nouns),
      adjective: () => r.pick(ADJECTIVES),
    });
  });

  p.megastructures.forEach((m, i) => {
    const r = rng.fork(`megastructure:${i}`);
    m.name = fillPattern(pickPattern(r, MEGASTRUCTURE_NAME_PATTERNS), {
      root: () => makeBareName(m.builder === 'precursors' || m.builder === 'unknown' ? surveyor : ph, r),
      mega: () => r.pick(MEGASTRUCTURE_TABLE[m.type].nouns),
      adjective: () => r.pick(ADJECTIVES),
    });
  });

  if (p.world_government) {
    const r = rng.fork('world-government');
    const kind = p.political_structure === 'federation' ? 'federation' : 'unified';
    p.world_government.name = fillPattern(pickPattern(r, WORLD_GOVERNMENT_PATTERNS), {
      native: () => p.native_name,
      gov: () => r.pick(GOVERNMENT_NOUNS[kind]),
      adjective: () => r.pick(ADJECTIVES),
    });
    p.world_government.leader_title = r.pick(WORLD_LEADER_TITLES[kind]);
  }
}

