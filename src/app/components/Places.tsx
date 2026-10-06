import { TREASURE_RARITIES, treasureSite, type PlanetBundle, type Treasure, type Visibility } from '../../generator';
import { useKnow } from '../know';
import { Enum, Table } from './Fields';
import { Ref } from './Ref';

/** Public / discreet / secret marker. */
export function VisibilityChip({ visibility }: { visibility: Visibility }) {
  const cls = visibility === 'public' ? 'chip' : visibility === 'discreet' ? 'chip att-rival' : 'chip att-hostile';
  return <span className={cls} title={visibility === 'public' ? 'Known to exist' : visibility === 'discreet' ? 'Known to a few' : 'Known only to its keepers'}>{visibility}</span>;
}

/** Whether someone's presence somewhere is public or a secret. */
export function PresenceChip({ isPublic }: { isPublic: boolean }) {
  return isPublic ? <span className="chip" title="Anyone could find them here">public</span> : <span className="chip att-hostile" title="Being here is a secret">secret</span>;
}

/** Treasures, optionally with who holds them. In the explorer only known treasures are listed. */
export function TreasureTable({ treasures, holder = false }: { treasures: Treasure[]; holder?: boolean }) {
  const { isKnown } = useKnow();
  const shown = treasures.filter((t) => isKnown(t.id));
  if (shown.length === 0) return <span className="muted">none</span>;
  return (
    <Table
      head={['Treasure', 'Category', 'Rarity', 'Visibility', ...(holder ? ['Carried by'] : [])]}
      rows={shown.map((t) => [
        <Ref id={t.id} />, <Enum value={t.category} />, <Enum value={t.rarity} />, <VisibilityChip visibility={t.visibility} />,
        ...(holder && 'npc_id' in t.holder ? [<Ref id={t.holder.npc_id} />] : []),
      ])}
    />
  );
}

/** Every treasure in a settlement, rarest first, with who holds it and where it is. */
export function SettlementTreasureTable({ bundle, treasures }: { bundle: PlanetBundle; treasures: Treasure[] }) {
  const { isKnown, knows } = useKnow();
  if (treasures.length === 0) return <span className="muted">none</span>;
  const sorted = [...treasures].sort((a, b) =>
    TREASURE_RARITIES.indexOf(b.rarity) - TREASURE_RARITIES.indexOf(a.rarity) || a.name.localeCompare(b.name));
  return (
    <Table
      head={['Treasure', 'Category', 'Rarity', 'Visibility', 'Held by', 'Where']}
      rows={sorted.map((t) => {
        // In the explorer a carrier's whereabouts show only once the player knows them.
        const carrier = 'npc_id' in t.holder ? t.holder.npc_id : null;
        const site = carrier && !knows(carrier, 'location') ? undefined : treasureSite(bundle, t);
        return [
          <Ref id={t.id} />, <Enum value={t.category} />, <Enum value={t.rarity} />, <VisibilityChip visibility={t.visibility} />,
          carrier ? (isKnown(carrier) ? <Ref id={carrier} /> : <span className="muted">someone</span>) : <span className="muted">the place</span>,
          site && isKnown(site.id) ? <Ref id={site.id} /> : <span className="muted">unknown</span>,
        ];
      })}
    />
  );
}
