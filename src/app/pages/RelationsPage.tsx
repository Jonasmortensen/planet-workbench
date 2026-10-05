import { useMemo, useState } from 'react';
import { ATTITUDES, type Attitude as AttitudeT } from '../../generator';
import { Enum, Section, Table } from '../components/Fields';
import { Ref } from '../components/Ref';
import { Attitude } from '../components/Relations';
import { useBundle } from '../context';

const SHORT: Record<AttitudeT, string> = { allied: 'A', friendly: 'F', neutral: '·', rival: 'R', hostile: 'H', at_war: 'W' };

/** Planet-wide relation tables: country matrix, country list, organization list. */
export function RelationsPage() {
  const { bundle } = useBundle();
  const [filter, setFilter] = useState<'all' | AttitudeT>('all');
  const countries = Object.values(bundle.countries);

  const countryPairs = useMemo(() => countries.flatMap((c) => c.relations
    .filter((r) => r.target_ref in bundle.countries && c.id < r.target_ref)
    .map((r) => ({ a: c.id, ...r }))), [bundle]); // eslint-disable-line react-hooks/exhaustive-deps
  const orgPairs = useMemo(() => Object.values(bundle.organizations).flatMap((o) => o.relations
    .filter((r) => !(r.target_ref in bundle.organizations) || o.id < r.target_ref)
    .map((r) => ({ a: o.id, ...r }))), [bundle]);
  const show = <T extends { attitude: AttitudeT }>(list: T[]) => (filter === 'all' ? list : list.filter((x) => x.attitude === filter));

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">View</div>
        <h1>Relations</h1>
        <div className="entity-sub">
          {countryPairs.length} country relations · {orgPairs.length} organization relations ·{' '}
          <label>
            Show{' '}
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">all attitudes</option>
              {ATTITUDES.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="sections">
        {countries.length > 1 && (
          <Section title="Country matrix" wide>
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr><th />{countries.map((c) => <th key={c.id} title={c.name}><Ref id={c.id} /></th>)}</tr>
                </thead>
                <tbody>
                  {countries.map((row) => (
                    <tr key={row.id}>
                      <th><Ref id={row.id} /></th>
                      {countries.map((col) => {
                        if (row.id === col.id) return <td key={col.id} className="matrix-self" />;
                        const rel = row.relations.find((r) => r.target_ref === col.id);
                        return (
                          <td key={col.id} className={rel ? `matrix-cell att-${rel.attitude === 'at_war' ? 'war' : rel.attitude}` : 'matrix-cell'} title={rel ? `${rel.attitude} (${rel.reason})` : 'no relation'}>
                            {rel ? SHORT[rel.attitude] : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="muted small">A allied · F friendly · · neutral · R rival · H hostile · W at war. Hover a cell for the reason.</div>
          </Section>
        )}

        <Section title="Country relations" wide>
          <Table
            head={['Country', 'Attitude', 'Country', 'Reason']}
            rows={show(countryPairs).map((p) => [<Ref id={p.a} />, <Attitude value={p.attitude} />, <Ref id={p.target_ref} />, <Enum value={p.reason} />])}
          />
        </Section>

        <Section title="Organization relations" wide>
          <Table
            head={['Organization', 'Attitude', 'With', 'Reason']}
            rows={show(orgPairs).map((p) => [<Ref id={p.a} icon />, <Attitude value={p.attitude} />, <Ref id={p.target_ref} icon />, <Enum value={p.reason} />])}
          />
        </Section>
      </div>
    </article>
  );
}
