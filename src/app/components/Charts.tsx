import { useState } from 'react';
import type { Distribution } from '../batch/summary';
import { humanize } from '../format';

/**
 * Single-series horizontal bar chart: thin bars from a shared baseline,
 * value at the tip, hover tooltip with share, and a table view.
 * One series, so no legend: the title names what is plotted.
 */
export function BarChart({ title, subtitle, data, total, maxRows = 30, label = humanize }: {
  title: string;
  subtitle?: string;
  data: Distribution;
  /** Denominator for percentages; defaults to the sum of counts. */
  total?: number;
  maxRows?: number;
  label?: (key: string) => string;
}) {
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const rows = data.slice(0, maxRows);
  const hidden = data.length - rows.length;
  const sum = total ?? data.reduce((a, d) => a + d.count, 0);
  const max = Math.max(1, ...rows.map((d) => d.count));
  const pct = (n: number) => (sum ? `${((n / sum) * 100).toFixed(1)}%` : '0%');

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
        <button className="btn btn-ghost btn-small" onClick={() => setAsTable((t) => !t)}>{asTable ? 'Chart' : 'Table'}</button>
      </figcaption>
      {rows.length === 0 && <div className="muted small">No data yet.</div>}
      {asTable ? (
        <table className="table">
          <thead><tr><th>Value</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>Share</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key}><td>{label(d.key)}</td><td className="num">{d.count.toLocaleString()}</td><td className="num">{pct(d.count)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="bars" onMouseLeave={() => setHover(null)}>
          {rows.map((d, i) => (
            <div key={d.key} className={hover === i ? 'bar-row hover' : 'bar-row'} onMouseEnter={() => setHover(i)}>
              <div className="bar-label" title={d.key}>{label(d.key)}</div>
              <div className="bar-track">
                <div className="bar" style={{ width: `${Math.max(0.5, (d.count / max) * 100)}%` }} />
                <span className="bar-value">{d.count.toLocaleString()}</span>
                {hover === i && (
                  <div className="tooltip" role="tooltip">
                    <strong>{label(d.key)}</strong>
                    <span>{d.count.toLocaleString()} · {pct(d.count)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {hidden > 0 && <div className="muted small">+{hidden} more in the table view</div>}
        </div>
      )}
    </figure>
  );
}

export function StatTile({ label, value, detail, status }: { label: string; value: string; detail?: string; status?: 'good' | 'critical' }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {status && <span className={`status-dot status-${status}`} aria-hidden="true" />}
        {value}
      </div>
      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
}
