import { useState, type ReactNode } from 'react';
import { humanize } from '../format';

export function Section({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={wide ? 'section section-wide' : 'section'}>
      <h3 className="section-title">{title}</h3>
      <div className="section-body">{children}</div>
    </section>
  );
}

/** A label/value row. Empty values render as a muted dash so gaps are visible. */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const empty = children === null || children === undefined || children === false || children === '' || (Array.isArray(children) && children.length === 0);
  return (
    <div className="field">
      <div className="field-label" title={hint}>{label}</div>
      <div className="field-value">{empty ? <span className="muted">none</span> : children}</div>
    </div>
  );
}

/** An enum value. The raw value is shown on hover for debugging. */
export function Enum({ value }: { value: string }) {
  return <span className="chip" title={value}>{humanize(value)}</span>;
}

export function EnumList({ values }: { values: readonly string[] }) {
  if (values.length === 0) return <span className="muted">none</span>;
  return <span className="chip-list">{values.map((v, i) => <Enum key={`${v}-${i}`} value={v} />)}</span>;
}

/** An ordered scale shown as a small meter plus its label. */
export function Scale({ value, scale }: { value: string; scale: readonly string[] }) {
  const idx = scale.indexOf(value);
  return (
    <span className="scale" title={`${idx + 1} of ${scale.length}`}>
      <span className="scale-bar">
        {scale.map((s, i) => <span key={s} className={i <= idx ? 'scale-pip on' : 'scale-pip'} />)}
      </span>
      {humanize(value)}
    </span>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  if (rows.length === 0) return <span className="muted">none</span>;
  return (
    <table className="table">
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function ShareBar({ share }: { share: number }) {
  return (
    <span className="share">
      <span className="share-track"><span className="share-fill" style={{ width: `${Math.max(1, share * 100)}%` }} /></span>
      <span className="share-label">{(share * 100).toFixed(share < 0.01 ? 1 : 0)}%</span>
    </span>
  );
}

export function RawJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="raw-json">
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>{open ? 'Hide raw JSON' : 'Show raw JSON'}</button>
      {open && <pre className="json">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
