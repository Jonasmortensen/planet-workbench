import type { HistoricalEvent, ReligionShare, Rumor, SpeciesShare } from '../../generator';
import { eventOwner, useBundle } from '../context';
import { formatYearsAgo } from '../format';
import { Enum, Section, ShareBar, Table } from './Fields';
import { Ref, RefList } from './Ref';

export function SpeciesTable({ shares }: { shares: SpeciesShare[] }) {
  return <Table head={['Species', 'Share']} rows={shares.map((s) => [<Ref id={s.species_id} />, <ShareBar share={s.share} />])} />;
}

export function ReligionTable({ shares }: { shares: ReligionShare[] }) {
  return <Table head={['Faith', 'Share']} rows={shares.map((r) => [<Ref id={r.religion_id} />, <ShareBar share={r.share} />])} />;
}

export function HistoryTable({ events }: { events: HistoricalEvent[] }) {
  return (
    <Table
      head={['When', 'Event', 'Outcome', 'Involved', 'Part of']}
      rows={events.map((e) => [
        <span title={`year ${e.date} (${e.id})`}>{formatYearsAgo(e.date)}</span>,
        <Enum value={e.event_type} />,
        <Enum value={e.outcome} />,
        <RefList ids={e.involved_refs} />,
        e.parent_event_id ? <span title={e.parent_event_id}><Ref id={eventOwner(e.parent_event_id)} /> event</span> : <span className="muted">-</span>,
      ])}
    />
  );
}

export function RumorTable({ rumors }: { rumors: Rumor[] }) {
  return (
    <Table
      head={['About', 'Claim', 'Target', 'True?']}
      rows={rumors.map((r) => [
        <Ref id={r.subject_ref} />, <Enum value={r.claim_type} />,
        r.target_ref ? <Ref id={r.target_ref} /> : <span className="muted">-</span>,
        r.is_true ? 'true' : <span className="muted">false</span>,
      ])}
    />
  );
}

/** Rendered prose block shown at the top of every entity page. */
export function Prose({ tagline, description }: { tagline: string; description: string }) {
  if (!tagline && !description) {
    return <div className="prose"><p className="muted">Tagline and description are rendered from structured data in milestone 4.</p></div>;
  }
  return <div className="prose"><p className="tagline">{tagline}</p><p>{description}</p></div>;
}

/** Everything in the bundle that references this entity, grouped by the referencing entity. */
export function ReferencedBy({ id }: { id: string }) {
  const { referencedBy } = useBundle();
  const sites = referencedBy.get(id) ?? [];
  const grouped = new Map<string, Set<string>>();
  for (const s of sites) {
    const fields = grouped.get(s.from) ?? new Set<string>();
    fields.add(s.field.replace(/\[\d+\]/g, ''));
    grouped.set(s.from, fields);
  }
  return (
    <Section title={`Referenced by (${grouped.size})`} wide>
      {grouped.size === 0
        ? <span className="muted">Nothing references this entity.</span>
        : (
          <Table
            head={['Entity', 'Via']}
            rows={[...grouped].map(([from, fields]) => [<Ref id={from} icon />, <span className="muted">{[...fields].join(', ')}</span>])}
          />
        )}
    </Section>
  );
}
