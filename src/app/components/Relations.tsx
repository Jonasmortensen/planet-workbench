import type { Motive, Relation } from '../../generator';
import { humanize } from '../format';
import { Enum, Table } from './Fields';
import { Ref } from './Ref';

const ATTITUDE_CLASS: Record<string, string> = {
  allied: 'att-allied', friendly: 'att-friendly', neutral: 'att-neutral', rival: 'att-rival', hostile: 'att-hostile', at_war: 'att-war',
};

export function Attitude({ value }: { value: string }) {
  return <span className={`chip ${ATTITUDE_CLASS[value] ?? ''}`} title={value}>{humanize(value)}</span>;
}

export function RelationTable({ relations, empty = 'none' }: { relations: Relation[]; empty?: string }) {
  if (relations.length === 0) return <span className="muted">{empty}</span>;
  return (
    <Table
      head={['With', 'Attitude', 'Reason']}
      rows={relations.map((r) => [<Ref id={r.target_ref} icon />, <Attitude value={r.attitude} />, <Enum value={r.reason} />])}
    />
  );
}

/** A structured motive: type, reason and every target it points at. */
export function MotiveView({ motive }: { motive: Motive<string> | null }) {
  if (!motive) return <span className="muted">none</span>;
  const targets = [motive.target_npc_id, motive.target_org_id, motive.target_settlement_id, motive.target_country_id].filter((x): x is string => !!x);
  return (
    <span className="motive">
      <Enum value={motive.type} />
      {targets.map((t) => <span key={t}> → <Ref id={t} /></span>)}
      <span className="muted"> because of </span><Enum value={motive.reason} />
    </span>
  );
}
