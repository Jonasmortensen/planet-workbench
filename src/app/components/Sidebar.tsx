import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EntityKind, Npc, PlanetBundle } from '../../generator';
import { SearchBox, SearchResults } from './Search';
import { useBundle } from '../context';
import { formatPopulation } from '../format';
import { KIND_ICON } from './Ref';

export const RELATIONS_VIEW = 'relations';
export const VALIDATION_VIEW = 'validation';
export const BATCH_VIEW = 'batch';

/** Ancestors of an entity in the tree, so the selected entity is always visible. */
function ancestors(bundle: PlanetBundle, id: string | null): string[] {
  if (!id) return [];
  const npc = bundle.npcs[id];
  if (npc) return ['countries', bundle.settlements[npc.settlement_id].country_id, npc.settlement_id];
  const s = bundle.settlements[id];
  if (s) return ['countries', s.country_id, s.id];
  if (bundle.countries[id]) return ['countries', id];
  const o = bundle.organizations[id];
  if (o) return ['organizations', `orgs:${o.scope_level}`];
  if (bundle.species[id]) return ['peoples', 'species'];
  if (bundle.languages[id]) return ['peoples', 'languages'];
  if (bundle.religions[id]) return ['peoples', 'religions'];
  return [];
}

export function Sidebar() {
  const { bundle, selectedId, open } = useBundle();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['countries']));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | EntityKind>('all');
  const searching = query.trim() !== '' || kind !== 'all';
  const errors = bundle.validation.filter((v) => v.severity === 'error').length;
  const warnings = bundle.validation.length - errors;

  // Reveal the selected entity, and reset when the planet changes.
  useEffect(() => {
    setExpanded((prev) => new Set([...prev, ...ancestors(bundle, selectedId)]));
  }, [bundle, selectedId]);
  useEffect(() => setExpanded(new Set(['countries', ...ancestors(bundle, selectedId)])), [bundle.seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const index = useMemo(() => {
    const settlementsByCountry = new Map<string, string[]>();
    for (const s of Object.values(bundle.settlements)) {
      const list = settlementsByCountry.get(s.country_id) ?? [];
      list.push(s.id);
      settlementsByCountry.set(s.country_id, list);
    }
    const peopleBySettlement = new Map<string, Npc[]>();
    for (const n of Object.values(bundle.npcs)) {
      const list = peopleBySettlement.get(n.settlement_id) ?? [];
      list.push(n);
      peopleBySettlement.set(n.settlement_id, list);
    }
    for (const list of peopleBySettlement.values()) {
      list.sort((a, b) => (a.npc_category === b.npc_category ? 0 : a.npc_category === 'leader' ? -1 : 1));
    }
    return { settlementsByCountry, peopleBySettlement };
  }, [bundle]);

  const countries = Object.values(bundle.countries);
  const orgs = Object.values(bundle.organizations);
  const orgGroups = [
    ['planet', 'Planet-wide'],
    ['country', 'National'],
    ['settlement', 'Local'],
  ] as const;

  return (
    <nav className="sidebar">
      <SearchBox query={query} kind={kind} onQuery={setQuery} onKind={setKind} />
      {searching ? <SearchResults query={query} kind={kind} /> : (<>
      <TreeItem
        icon={KIND_ICON.planet} label={bundle.planet.name} selected={selectedId === null}
        onSelect={() => open(null)} meta={formatPopulation(bundle.planet.population)}
      />
      <TreeItem icon="⇄" label="Relations" selected={selectedId === RELATIONS_VIEW} onSelect={() => open(RELATIONS_VIEW)} />
      <TreeItem icon="✓" label="Validation" selected={selectedId === VALIDATION_VIEW} onSelect={() => open(VALIDATION_VIEW)}
        meta={`${errors} err · ${warnings} warn`} />
      <TreeItem icon="▤" label="Batch stats" selected={selectedId === BATCH_VIEW} onSelect={() => open(BATCH_VIEW)} />
      <TreeGroup label={`Countries (${countries.length})`} open={expanded.has('countries')} onToggle={() => toggle('countries')}>
        {countries.map((c) => (
          <TreeItem
            key={c.id} icon={KIND_ICON.country} label={c.name} selected={selectedId === c.id} onSelect={() => open(c.id)}
            expandable open={expanded.has(c.id)} onToggle={() => toggle(c.id)}
          >
            {(index.settlementsByCountry.get(c.id) ?? []).map((sid) => {
              const s = bundle.settlements[sid];
              const people = index.peopleBySettlement.get(sid) ?? [];
              return (
                <TreeItem
                  key={sid} icon={s.settlement_type === 'capital' ? '★' : KIND_ICON.settlement} label={s.name}
                  selected={selectedId === sid} onSelect={() => open(sid)} meta={s.settlement_type.replace(/_/g, ' ')}
                  expandable={people.length > 0} open={expanded.has(sid)} onToggle={() => toggle(sid)}
                >
                  {people.map((n) => (
                    <TreeItem
                      key={n.id} icon={n.npc_category === 'leader' ? '♛' : KIND_ICON.npc} label={n.name}
                      selected={selectedId === n.id} onSelect={() => open(n.id)}
                      meta={n.npc_category === 'leader' ? `leads ${n.leads.length}` : n.occupation.replace(/_/g, ' ')}
                    />
                  ))}
                </TreeItem>
              );
            })}
          </TreeItem>
        ))}
      </TreeGroup>
      <TreeGroup label={`Organizations (${orgs.length})`} open={expanded.has('organizations')} onToggle={() => toggle('organizations')}>
        {orgGroups.map(([scope, label]) => {
          const list = orgs.filter((o) => o.scope_level === scope);
          const key = `orgs:${scope}`;
          return (
            <TreeGroup key={key} label={`${label} (${list.length})`} open={expanded.has(key)} onToggle={() => toggle(key)} nested>
              {list.map((o) => (
                <TreeItem
                  key={o.id} icon={KIND_ICON.organization} label={o.name} selected={selectedId === o.id}
                  onSelect={() => open(o.id)} meta={o.org_type.replace(/_/g, ' ')}
                />
              ))}
            </TreeGroup>
          );
        })}
      </TreeGroup>
      <TreeGroup label="Peoples" open={expanded.has('peoples')} onToggle={() => toggle('peoples')}>
        {([
          ['species', 'Species', Object.values(bundle.species)],
          ['languages', 'Languages', Object.values(bundle.languages)],
          ['religions', 'Faiths', Object.values(bundle.religions)],
        ] as const).map(([key, label, items]) => (
          <TreeGroup key={key} label={`${label} (${items.length})`} open={expanded.has(key)} onToggle={() => toggle(key)} nested>
            {items.map((x) => (
              <TreeItem
                key={x.id} icon={KIND_ICON[key === 'species' ? 'species' : key === 'languages' ? 'language' : 'religion']}
                label={x.name} selected={selectedId === x.id} onSelect={() => open(x.id)}
              />
            ))}
          </TreeGroup>
        ))}
      </TreeGroup>
      </>)}
    </nav>
  );
}

function TreeGroup({ label, open, onToggle, children, nested }: {
  label: string; open: boolean; onToggle: () => void; children: ReactNode; nested?: boolean;
}) {
  return (
    <div className={nested ? 'tree-group tree-group-nested' : 'tree-group'}>
      <button className="tree-group-label" onClick={onToggle}>
        <span className="tree-caret">{open ? '▾' : '▸'}</span>{label}
      </button>
      {open && <div className="tree-children">{children}</div>}
    </div>
  );
}

function TreeItem({ icon, label, meta, selected, onSelect, expandable, open, onToggle, children }: {
  icon: string; label: string; meta?: string; selected: boolean; onSelect: () => void;
  expandable?: boolean; open?: boolean; onToggle?: () => void; children?: ReactNode;
}) {
  return (
    <div className="tree-node">
      <div className={selected ? 'tree-item selected' : 'tree-item'}>
        {expandable
          ? <button className="tree-caret-btn" onClick={onToggle} aria-label={open ? 'Collapse' : 'Expand'}>{open ? '▾' : '▸'}</button>
          : <span className="tree-caret-spacer" />}
        <button className="tree-label" onClick={onSelect} title={label}>
          <span className="tree-icon">{icon}</span>
          <span className="tree-text">{label}</span>
          {meta && <span className="tree-meta">{meta}</span>}
        </button>
      </div>
      {expandable && open && <div className="tree-children">{children}</div>}
    </div>
  );
}
