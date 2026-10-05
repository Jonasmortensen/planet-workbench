import { useMemo } from 'react';
import { ENTITY_KINDS, type EntityKind, type PlanetBundle } from '../../generator';
import { useBundle } from '../context';
import { humanize } from '../format';
import { KIND_ICON } from './Ref';

interface Entry {
  id: string;
  kind: EntityKind;
  name: string;
  /** Type words that searches can match ("tavern keeper", "criminal syndicate"). */
  detail: string;
  text: string;
}

function buildIndex(b: PlanetBundle): Entry[] {
  const out: Entry[] = [];
  const add = (id: string, kind: EntityKind, name: string, ...details: string[]) => {
    const detail = details.filter(Boolean).map((d) => humanize(d).toLowerCase()).join(' · ');
    out.push({ id, kind, name, detail, text: `${name} ${detail} ${id} ${kind}`.toLowerCase() });
  };
  add(b.planet.id, 'planet', b.planet.name, b.planet.planet_type, b.planet.native_name);
  for (const c of Object.values(b.countries)) add(c.id, 'country', c.name, c.government_type, c.demonym);
  for (const s of Object.values(b.settlements)) {
    add(s.id, 'settlement', s.name, s.settlement_type, s.nickname);
    // Points of interest are not entities; a hit opens their settlement.
    for (const poi of s.points_of_interest) add(s.id, 'settlement', poi.name, poi.type, `in ${s.name}`);
  }
  for (const o of Object.values(b.organizations)) add(o.id, 'organization', o.name, o.org_type, o.short_name);
  for (const n of Object.values(b.npcs)) add(n.id, 'npc', n.name, n.occupation, n.npc_category, n.title_or_epithet);
  for (const s of Object.values(b.species)) add(s.id, 'species', s.name, s.origin, s.body_plan);
  for (const l of Object.values(b.languages)) add(l.id, 'language', l.name, l.style);
  for (const r of Object.values(b.religions)) add(r.id, 'religion', r.name, r.kind);
  return out;
}

/** Filter all entities of the current planet by name or type. */
export function SearchResults({ query, kind }: { query: string; kind: 'all' | EntityKind }) {
  const { bundle, open, selectedId } = useBundle();
  const index = useMemo(() => buildIndex(bundle), [bundle]);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = index.filter((e) => (kind === 'all' || e.kind === kind) && terms.every((t) => e.text.includes(t)));
  return (
    <div className="search-results">
      <div className="tree-empty">{results.length} match{results.length === 1 ? '' : 'es'}</div>
      {results.slice(0, 300).map((e) => (
        <button key={`${e.id}:${e.name}`} className={selectedId === e.id || (e.kind === 'planet' && selectedId === null) ? 'search-hit selected' : 'search-hit'}
          onClick={() => open(e.kind === 'planet' ? null : e.id)}>
          <span className="tree-icon">{KIND_ICON[e.kind]}</span>
          <span className="search-hit-text">
            <span className="tree-text">{e.name}</span>
            <span className="tree-meta">{e.kind} · {e.detail}</span>
          </span>
        </button>
      ))}
      {results.length > 300 && <div className="tree-empty">Showing the first 300; refine the search.</div>}
    </div>
  );
}

export function SearchBox({ query, kind, onQuery, onKind }: {
  query: string; kind: 'all' | EntityKind; onQuery: (q: string) => void; onKind: (k: 'all' | EntityKind) => void;
}) {
  return (
    <div className="search-box">
      <input className="search-input" placeholder="Search names or types…" value={query} onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { onQuery(''); onKind('all'); } }} />
      <select value={kind} onChange={(e) => onKind(e.target.value as 'all' | EntityKind)} aria-label="Entity type">
        <option value="all">all</option>
        {ENTITY_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>
  );
}
