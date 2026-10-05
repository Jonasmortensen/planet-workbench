import { CONFIG } from '../../config';
import { HISTORICAL_EVENT_TABLE, meets } from '../../content';
import type { Rng } from '../../rng';
import type { HistoricalEvent, PlanetBundle } from '../../types/entities';
import { EVENT_OUTCOMES, HISTORICAL_EVENT_TYPES, type HistoricalEventType } from '../../types/enums';
import { biased } from '../util';
import { planetContext } from './geography';

interface Draft {
  type: HistoricalEventType;
  date: number;
  refs: string[];
}

/** Event types that naturally involve a faith. */
const FAITH_EVENTS: HistoricalEventType[] = ['schism', 'persecution', 'miracle', 'renaissance', 'revolution'];
/** Event types that naturally involve a species. */
const SPECIES_EVENTS: HistoricalEventType[] = ['migration', 'plague', 'exodus', 'uprising', 'invasion', 'golden_age'];

/**
 * Planet history: 3 to 5 events in chronological order. Origin fixes the
 * opening beats (colonization, contact, a lost colony's collapse); the rest
 * are drawn from the planet-scope event table. Country references are added
 * when countries exist (milestone 2).
 */
export function rollHistory(bundle: PlanetBundle, rng: Rng): void {
  const p = bundle.planet;
  const natives = p.native_species_id ? [p.native_species_id] : [];
  const colonists = p.species.map((s) => s.species_id).filter((id) => !natives.includes(id));
  const total = rng.int(...CONFIG.planet.historyEvents);
  const fixed: Draft[] = [];
  let earliest: number;

  switch (p.settlement_origin) {
    case 'native':
      earliest = -rng.int(1500, 4000);
      break;
    case 'mixed': {
      earliest = -rng.int(1200, 3000);
      fixed.push({ type: 'contact', date: -rng.int(80, 600), refs: [...natives, rng.pick(colonists)] });
      break;
    }
    case 'colonial': {
      const date = -rng.int(40, 500);
      earliest = date;
      fixed.push({ type: 'colonization', date, refs: colonists.slice(0, 2) });
      break;
    }
    case 'lost_colony': {
      const date = -rng.int(400, 1500);
      earliest = date;
      fixed.push({ type: 'colonization', date, refs: colonists.slice(0, 2) });
      fixed.push({ type: 'collapse', date: date + rng.int(20, 200), refs: [] });
      break;
    }
  }

  const ctx = planetContext(p);
  const used = new Set(fixed.map((f) => f.type));
  const drafts = [...fixed];
  const fillRng = rng.fork('fill');
  const religionIds = p.dominant_religions_or_ideologies.map((r) => r.religion_id);
  const speciesIds = p.species.map((s) => s.species_id);
  while (drafts.length < total) {
    const pool = HISTORICAL_EVENT_TYPES
      .filter((t) => !(HISTORICAL_EVENT_TABLE[t].unique && used.has(t)))
      .filter((t) => meets(HISTORICAL_EVENT_TABLE[t].constraints, ctx))
      .map((t) => ({ value: t, weight: HISTORICAL_EVENT_TABLE[t].weights.planet ?? 0 }));
    const type = fillRng.weighted(pool);
    used.add(type);
    const refs: string[] = [];
    if (FAITH_EVENTS.includes(type) && religionIds.length > 0 && fillRng.chance(0.7)) refs.push(fillRng.pick(religionIds));
    if (SPECIES_EVENTS.includes(type) && fillRng.chance(0.6)) refs.push(fillRng.pick(speciesIds));
    drafts.push({ type, date: -fillRng.int(5, -earliest), refs });
  }

  // Chronological order with distinct years.
  drafts.sort((a, b) => a.date - b.date);
  for (let i = 1; i < drafts.length; i++) {
    if (drafts[i].date <= drafts[i - 1].date) drafts[i].date = drafts[i - 1].date + 1;
  }
  const outRng = rng.fork('outcomes');
  p.history = drafts.map((d, i): HistoricalEvent => ({
    id: `event_planet_${i}`,
    date: Math.min(-1, d.date),
    event_type: d.type,
    involved_refs: Array.from(new Set(d.refs)),
    outcome: outRng.weighted(biased(EVENT_OUTCOMES, HISTORICAL_EVENT_TABLE[d.type].outcomes)),
    parent_event_id: null,
  }));
}
