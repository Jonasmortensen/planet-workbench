import { CONFIG } from '../../config';
import {
  ADJECTIVES, GALACTIC_SPECIES, NATIVE_BIOLOGY_BY_BIOSPHERE, NATIVE_BIOLOGY_BY_TYPE, NATIVE_BIOLOGY_TABLE, NOUNS,
  RELIGION_KIND_TABLE, RELIGION_NAME_PATTERNS, SPECIES_NAME_SUFFIXES, eligible,
} from '../../content';
import { attachSuffix, buildPhonology, fillPattern, makeGivenName, makeLanguageName, makeRoot, pickPattern } from '../../naming';
import { normalizeShares, type Rng } from '../../rng';
import type { Language, PlanetBundle, Religion, Species } from '../../types/entities';
import {
  BIOLOGY_TYPES, BODY_PLANS, GENDER_SYSTEMS, LANGUAGE_STYLES, RELIGION_KINDS, RELIGION_TENETS,
  type LanguageOrigin, type LanguageStyle, type ReligionKind,
} from '../../types/enums';
import { makeId } from '../../types/ids';
import { biased } from '../util';
import { planetContext } from './geography';

export function addLanguage(
  bundle: PlanetBundle, rng: Rng, style: LanguageStyle, origin: LanguageOrigin, speakers: string[],
): Language {
  const id = makeId('language', Object.keys(bundle.languages).length);
  const lRng = rng.fork(id);
  const phonology = buildPhonology(style, lRng.fork('phonology'));
  const lang: Language = {
    id,
    name: makeLanguageName(phonology, style, lRng.fork('name')),
    style,
    origin,
    speaker_species_ids: speakers,
    phonology,
  };
  bundle.languages[id] = lang;
  return lang;
}

/**
 * Species present on the planet, their languages, and the planet's faiths.
 * Natives come first; colonists are drawn from the galactic pool, weighted
 * by how comfortable the world is for them.
 */
export function rollPeoples(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const speciesShares: { id: string; weight: number }[] = [];

  // Native species and their language(s)
  if (p.native_sapients) {
    const nRng = rng.fork('natives');
    const biologyWeights = NATIVE_BIOLOGY_BY_TYPE[p.planet_type] ?? NATIVE_BIOLOGY_BY_BIOSPHERE[p.biosphere] ?? { carbon: 1 };
    const biology = nRng.weighted(biased(BIOLOGY_TYPES, biologyWeights));
    const bdef = NATIVE_BIOLOGY_TABLE[biology];
    const id = makeId('species', 0);
    const style = nRng.weighted(biased(LANGUAGE_STYLES, bdef.styles));
    const lang = addLanguage(bundle, nRng, style, 'native', [id]);
    const root = makeRoot(lang.phonology, nRng.fork('species-name'), { minSyllables: 1, maxSyllables: 2 });
    const name = nRng.chance(0.6) ? attachSuffix(root, nRng.pick(SPECIES_NAME_SUFFIXES)) : root;
    const plural = /[sx']$/i.test(name) || nRng.chance(0.4) ? name : name + 's';
    const mean = p.temperature_range.mean;
    const species: Species = {
      id,
      content_key: null,
      name,
      plural_name: plural,
      origin: 'native',
      biology,
      body_plan: nRng.weighted(biased(BODY_PLANS, bdef.bodyPlans)),
      gender_system: nRng.weighted(biased(GENDER_SYSTEMS, bdef.genders)),
      lifespan_years: Math.round(nRng.float(bdef.lifespan[0], bdef.lifespan[1]) / 5) * 5,
      comfort_temperature: [Math.round(mean - bdef.comfortSpread / 2), Math.round(mean + bdef.comfortSpread / 2)],
      breathes: Array.from(new Set([p.atmosphere.composition, ...bdef.breathesExtra])),
    };
    bundle.species[id] = species;
    speciesShares.push({ id, weight: 1 });
    // A second (related or unrelated) native tongue.
    if (nRng.chance(0.4)) {
      const secondStyle = nRng.chance(0.6) ? style : nRng.weighted(biased(LANGUAGE_STYLES, bdef.styles));
      addLanguage(bundle, nRng.fork('second'), secondStyle, 'native', [id]);
    }
  }

  // Colonist species
  if (p.settlement_origin !== 'native') {
    const cRng = rng.fork('colonists');
    const countWeights = p.settlement_origin === 'lost_colony' ? [0, 6, 2] : p.settlement_origin === 'mixed' ? [0, 5, 2, 1] : [0, 5, 3, 1.5];
    const count = cRng.weighted(countWeights.map((w, i) => ({ value: i, weight: w })));
    const keys = Object.keys(GALACTIC_SPECIES);
    const mean = p.temperature_range.mean;
    const pool = keys.map((k) => {
      const d = GALACTIC_SPECIES[k];
      const comfy = mean >= d.comfort[0] && mean <= d.comfort[1] ? 1 : 0.15;
      const breathes = d.breathes.includes(p.atmosphere.composition) ? 1 : 0.3;
      return { value: k, weight: d.weight * (d.favors?.[p.planet_type] ?? 1) * comfy * breathes };
    });
    const chosen = cRng.weightedSample(pool, count);
    const colonistWeights = cRng.shares(chosen.length, 0.7);
    const nativeShare = p.native_sapients ? cRng.float(0.4, 0.9) : 0;
    if (p.native_sapients) speciesShares[0].weight = nativeShare;
    chosen.forEach((key, i) => {
      const d = GALACTIC_SPECIES[key];
      const id = makeId('species', Object.keys(bundle.species).length);
      bundle.species[id] = {
        id,
        content_key: key,
        name: d.name,
        plural_name: d.plural,
        origin: 'galactic',
        biology: d.biology,
        body_plan: d.body_plan,
        gender_system: d.gender_system,
        lifespan_years: d.lifespan,
        comfort_temperature: d.comfort,
        breathes: d.breathes,
      };
      speciesShares.push({ id, weight: (1 - nativeShare) * colonistWeights[i] });
      const sRng = cRng.fork(`lang:${key}`);
      const style = sRng.weighted(biased(LANGUAGE_STYLES, d.styles));
      addLanguage(bundle, sRng, style, 'colonial', [id]);
      // Large colonist populations sometimes keep two tongues.
      if (Object.keys(bundle.languages).length < CONFIG.planet.maxLanguages && colonistWeights[i] > 0.5 && sRng.chance(0.25)) {
        addLanguage(bundle, sRng.fork('second'), sRng.weighted(biased(LANGUAGE_STYLES, d.styles)), 'colonial', [id]);
      }
    });
    // Contact zones breed creoles.
    if (p.settlement_origin === 'mixed' && cRng.chance(0.3) && Object.keys(bundle.languages).length < CONFIG.planet.maxLanguages) {
      const langs = Object.values(bundle.languages);
      const style = cRng.pick(langs).style;
      const partner = cRng.pick(Object.keys(bundle.species).filter((id) => id !== makeId('species', 0)));
      addLanguage(bundle, cRng.fork('creole'), style, 'creole', [makeId('species', 0), partner]);
    }
  }

  const shareValues = normalizeShares(speciesShares.map((s) => s.weight));
  p.species = speciesShares
    .map((s, i) => ({ species_id: s.id, share: shareValues[i] }))
    .sort((a, b) => b.share - a.share);
  p.native_species_id = p.native_sapients ? makeId('species', 0) : null;

  // Dominant languages: estimate speakers from species shares.
  const languages = Object.values(bundle.languages);
  const speakerWeight = (lang: Language) => {
    let w = 0;
    for (const sid of lang.speaker_species_ids) {
      const share = p.species.find((s) => s.species_id === sid)?.share ?? 0;
      const tongues = languages.filter((l) => l.speaker_species_ids.includes(sid)).length;
      w += share / tongues;
    }
    return lang.origin === 'creole' ? w * 0.35 : w;
  };
  const ranked = languages.map((l) => ({ id: l.id, w: speakerWeight(l) })).sort((a, b) => b.w - a.w || a.id.localeCompare(b.id));
  p.dominant_languages = ranked.filter((r, i) => i === 0 || (i < 3 && r.w >= 0.15)).map((r) => r.id);

  rollReligions(bundle, rng.fork('religions'));
}

/** Create a faith of the given kind, named in the given language, and add it to the bundle. */
export function addReligion(bundle: PlanetBundle, rng: Rng, kind: ReligionKind, lang: Language): Religion {
  const id = makeId('religion', Object.keys(bundle.religions).length);
  const r = rng.fork(id);
  const def = RELIGION_KIND_TABLE[kind];
  const ph = lang.phonology;
  const focus = def.hasFocus ? makeGivenName(ph, r.fork('focus'), 'none') : null;
  const name = fillPattern(pickPattern(r, RELIGION_NAME_PATTERNS[def.family]), {
    focus: () => focus ?? makeRoot(ph, r, { maxSyllables: 2 }),
    root: () => makeRoot(ph, r, { maxSyllables: 2 }),
    adjective: () => r.pick(ADJECTIVES),
    noun: () => r.pick(NOUNS),
  });
  const tenets = r.weightedSample(biased(RELIGION_TENETS, def.tenets), r.int(2, 3));
  const origin = lang.origin === 'creole' || (bundle.planet.settlement_origin === 'mixed' && r.chance(0.2))
    ? 'syncretic'
    : lang.origin === 'native' ? 'native' : 'imported';
  const religion: Religion = { id, name, kind, tenets, focus_name: focus, origin, church_org_id: null };
  bundle.religions[id] = religion;
  return religion;
}

function rollReligions(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const ctx = planetContext(p);
  const pool = eligible(RELIGION_KINDS, RELIGION_KIND_TABLE, ctx);
  const count = rng.weighted([{ value: 1, weight: 3 }, { value: 2, weight: 4 }, { value: 3, weight: 2 }, { value: 4, weight: 1 }]);
  const kinds = rng.weightedSample(pool, Math.min(count, CONFIG.planet.religions[1]));
  const dominant = p.dominant_languages.map((id) => bundle.languages[id]);
  const allLanguages = Object.values(bundle.languages);

  const religions: Religion[] = kinds.map((kind, i) => {
    const r = rng.fork(makeId('religion', i));
    const lang = r.chance(0.75) ? r.pick(dominant) : r.pick(allLanguages);
    return addReligion(bundle, r, kind, lang);
  });

  // Shares of the population; the remainder is unaffiliated.
  const affiliated = rng.float(0.6, 0.98);
  const shares = normalizeShares(religions.map(() => rng.float(0.1, 1) ** 1.5), Math.round(affiliated * 1000) / 1000);
  p.dominant_religions_or_ideologies = religions
    .map((r, i) => ({ religion_id: r.id, share: shares[i] }))
    .sort((a, b) => b.share - a.share);
}
