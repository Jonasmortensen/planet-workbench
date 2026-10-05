import { useMemo, useState } from 'react';
import { StatTile } from '../components/Charts';
import { Section, Table } from '../components/Fields';
import { Ref } from '../components/Ref';
import { useBundle } from '../context';

/** Validation results for the current planet, filterable, with links to the affected entities. */
export function ValidationPage() {
  const { bundle } = useBundle();
  const [severity, setSeverity] = useState<'all' | 'error' | 'warning'>('all');
  const [code, setCode] = useState('all');
  const [query, setQuery] = useState('');
  const issues = bundle.validation;
  const errors = issues.filter((i) => i.severity === 'error').length;
  const codes = useMemo(() => {
    const m = new Map<string, { severity: string; count: number }>();
    for (const i of issues) {
      const e = m.get(i.code) ?? { severity: i.severity, count: 0 };
      e.count++;
      m.set(i.code, e);
    }
    return [...m].sort((a, b) => b[1].count - a[1].count);
  }, [issues]);
  const q = query.trim().toLowerCase();
  const shown = issues.filter((i) => (severity === 'all' || i.severity === severity) && (code === 'all' || i.code === code)
    && (!q || i.message.toLowerCase().includes(q) || i.entity_ref.toLowerCase().includes(q)));

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">View</div>
        <h1>Validation</h1>
        <div className="entity-sub">Errors mean the generator is broken; warnings flag things worth a look.</div>
      </header>

      <div className="stat-grid">
        <StatTile label="Errors" value={String(errors)} status={errors ? 'critical' : 'good'} />
        <StatTile label="Warnings" value={String(issues.length - errors)} />
        <StatTile label="Checks triggered" value={String(codes.length)} />
      </div>

      {issues.length === 0 ? (
        <Section title="All clear" wide>
          <span className="muted">Every check passed for seed <code>{bundle.seed}</code>.</span>
        </Section>
      ) : (
        <div className="sections">
          <Section title="By check">
            <Table
              head={['Check', 'Severity', 'Count']}
              rows={codes.map(([c, info]) => [
                <a href="#" onClick={(e) => { e.preventDefault(); setCode(c); }}><code>{c}</code></a>,
                <span className={`issue-sev issue-${info.severity}`}>{info.severity}</span>, info.count,
              ])}
            />
          </Section>
          <Section title={`Issues (${shown.length})`} wide>
            <div className="filter-row">
              <select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
                <option value="all">all severities</option>
                <option value="error">errors</option>
                <option value="warning">warnings</option>
              </select>
              <select value={code} onChange={(e) => setCode(e.target.value)}>
                <option value="all">all checks</option>
                {codes.map(([c]) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="search-input" placeholder="Filter messages" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Table
              head={['Severity', 'Check', 'Entity', 'Message']}
              rows={shown.slice(0, 500).map((i) => [
                <span className={`issue-sev issue-${i.severity}`}>{i.severity}</span>, <code>{i.code}</code>, <Ref id={i.entity_ref} icon />, i.message,
              ])}
            />
          </Section>
        </div>
      )}
    </article>
  );
}
