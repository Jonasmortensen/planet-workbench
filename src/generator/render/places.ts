import { POI_TABLE } from '../content';
import {
  POI_FLAVOR, RARITY_PHRASE, SIGNIFICANCE_PHRASE, TREASURE_CATEGORY_NOUN, TREASURE_VISIBILITY_LINE,
} from '../content/prose/lexicon';
import { HOME_DESCRIPTIONS, POI_DESCRIPTIONS, TREASURE_DESCRIPTIONS } from '../content/prose/templates';
import type { Rng } from '../rng';
import type { PlanetBundle, PointOfInterest, Settlement, Treasure } from '../types/entities';
import { POI_SIGNIFICANCES } from '../types/enums';
import { entityName, kindOf } from '../types/ids';
import { fill, listOf, render } from './engine';
import { pronounsFor, secretPhrase, words } from './words';

const yes = (x: boolean) => (x ? 'yes' : 'no');

/** Places worth naming in a settlement's prose: public venues, grandest first. Homes and hideouts stay out. */
export function showcasePois(b: PlanetBundle, s: Settlement): PointOfInterest[] {
  return s.poi_ids.map((id) => b.pois[id])
    .filter((p) => !POI_TABLE[p.type].residence && p.type !== 'hideout'
      && (!p.organization_id || b.organizations[p.organization_id].visibility !== 'secret'))
    .sort((a, c) => POI_SIGNIFICANCES.indexOf(c.significance) - POI_SIGNIFICANCES.indexOf(a.significance));
}

export function renderPoi(b: PlanetBundle, rng: Rng, poi: PointOfInterest): void {
  const s = b.settlements[poi.settlement_id];
  const owner = poi.owner_npc_id ? b.npcs[poi.owner_npc_id] : null;
  const slots = {
    name: poi.name, poi: words(poi.type), settlement: s.name, owner: owner?.name ?? '', flavor: rng.pick(POI_FLAVOR[poi.type]),
    significance: fill(SIGNIFICANCE_PHRASE[poi.significance], { facts: {}, slots: { settlement: s.name, country: b.countries[s.country_id].name } }),
  };
  if (POI_TABLE[poi.type].residence && owner) {
    // Only the people who live here; visitors may be a secret.
    const household = Object.values(b.npcs).filter((n) => n.location_poi_id === poi.id && n.location_reason === 'lives_here' && n.id !== owner.id);
    poi.description = render(rng.fork('home'), HOME_DESCRIPTIONS, { facts: {}, slots: { ...slots, household: listOf(household.map((n) => n.name)), residents: listOf([owner, ...household].map((n) => n.name)) } });
  } else {
    poi.description = render(rng.fork('venue'), POI_DESCRIPTIONS, { facts: {}, slots });
  }
}

export function renderTreasure(b: PlanetBundle, rng: Rng, t: Treasure): void {
  const carrier = 'npc_id' in t.holder ? b.npcs[t.holder.npc_id] : null;
  const poi = 'poi_id' in t.holder ? b.pois[t.holder.poi_id] : null;
  const where = carrier ? `carried by ${carrier.name}` : `kept at ${poi!.name} in ${b.settlements[poi!.settlement_id].name}`;
  t.description = render(rng.fork('description'), TREASURE_DESCRIPTIONS, {
    facts: { embodied: yes(t.embodied) },
    slots: {
      name: t.name, rarity: RARITY_PHRASE[t.rarity], noun: TREASURE_CATEGORY_NOUN[t.category], where,
      holder: carrier?.name ?? '', gift: t.subject_refs[0] === carrier?.id ? 'gift' : 'knowledge',
      detail: detailOf(b, t), guards: listOf(t.guarded_by_npc_ids.map((id) => b.npcs[id].name)),
      visibility: TREASURE_VISIBILITY_LINE[t.visibility],
    },
  });
}

/** What a fact-based treasure is about, in one sentence. */
function detailOf(b: PlanetBundle, t: Treasure): string {
  const [first] = t.subject_refs;
  if (!first) return '';
  const names = listOf(t.subject_refs.map((id) => entityName(b, id)));
  const kind = kindOf(first);
  switch (t.category) {
    case 'leverage': {
      const n = b.npcs[first];
      return n?.secret ? `It proves that ${n.name} ${secretPhrase(b, n.secret, pronounsFor(n))}.` : `It could ruin ${names}.`;
    }
    case 'intel': {
      const o = b.organizations[first];
      if (o && o.true_goal.type !== o.stated_goal.type) return `It lays bare the true aims of ${o.name}.`;
      return `It holds hard evidence about ${names}.`;
    }
    case 'knowledge':
      // A gift needs no explaining; it is about the holder.
      return 'npc_id' in t.holder && first === t.holder.npc_id ? '' : `It concerns ${names}.`;
    case 'access':
      return kind === 'poi' ? `It opens the way into ${names}.` : kind === 'organization' ? `It opens doors within ${names}.` : `It commands favor and passage in ${names}.`;
    case 'map':
      return kind === 'planet' ? 'It shows a way no one else knows.' : `It shows hidden ways to ${names}.`;
    case 'relic':
      return kind === 'religion' ? `It is sacred to the followers of ${names}.` : `It was taken from ${names}.`;
    default:
      return '';
  }
}
