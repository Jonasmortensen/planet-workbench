import { entityName, kindOf, resolveEntity, type EntityKind } from '../../generator';
import { useBundle } from '../context';
import { useKnow } from '../know';

export const KIND_ICON: Record<EntityKind, string> = {
  planet: '◉',
  country: '⚑',
  settlement: '▣',
  organization: '◆',
  npc: '☺',
  poi: '⌂',
  treasure: '◈',
  species: '✦',
  language: '✎',
  religion: '✧',
};

/** Clickable entity reference. Broken refs render in red so they stand out. `label` replaces the entity's name as the link text. */
export function Ref({ id, icon = false, label }: { id: string; icon?: boolean; label?: string }) {
  const { bundle, open } = useBundle();
  const { isKnown } = useKnow();
  const kind = kindOf(id);
  // In the explorer, unknown entities are not shown at all.
  if (!isKnown(id)) return <span className="muted">unknown</span>;
  if (!resolveEntity(bundle, id) || !kind) {
    return <span className="ref ref-broken" title="Broken reference">{id}</span>;
  }
  return (
    <a
      className="ref"
      href={`#${id}`}
      title={id}
      onClick={(e) => {
        e.preventDefault();
        open(kind === 'planet' ? null : id);
      }}
    >
      {icon && <span className="ref-icon">{KIND_ICON[kind]}</span>}
      {label ?? entityName(bundle, id)}
    </a>
  );
}

export function RefList({ ids: all, icon }: { ids: readonly string[]; icon?: boolean }) {
  const { isKnown } = useKnow();
  const ids = all.filter(isKnown);
  if (ids.length === 0) return <span className="muted">{all.length ? 'unknown' : 'none'}</span>;
  return (
    <span className="ref-list">
      {ids.map((id, i) => <span key={`${id}-${i}`}>{i > 0 && ', '}<Ref id={id} icon={icon} /></span>)}
    </span>
  );
}
