import { entityName, kindOf, resolveEntity, type EntityKind } from '../../generator';
import { useBundle } from '../context';

export const KIND_ICON: Record<EntityKind, string> = {
  planet: '◉',
  country: '⚑',
  settlement: '▣',
  organization: '◆',
  npc: '☺',
  species: '✦',
  language: '✎',
  religion: '✧',
};

/** Clickable entity reference. Broken refs render in red so they stand out. */
export function Ref({ id, icon = false }: { id: string; icon?: boolean }) {
  const { bundle, open } = useBundle();
  const kind = kindOf(id);
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
      {entityName(bundle, id)}
    </a>
  );
}

export function RefList({ ids, icon }: { ids: readonly string[]; icon?: boolean }) {
  if (ids.length === 0) return <span className="muted">none</span>;
  return (
    <span className="ref-list">
      {ids.map((id, i) => <span key={`${id}-${i}`}>{i > 0 && ', '}<Ref id={id} icon={icon} /></span>)}
    </span>
  );
}
