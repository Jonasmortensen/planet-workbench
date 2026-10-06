import { useEffect, useMemo, useState } from 'react';
import { type EntityKind } from '../../generator';
import { progress } from '../../explore';
import { KIND_ICON } from '../components/Ref';
import { SearchBox, SearchResults } from '../components/Search';
import { TreeGroup, TreeItem } from '../components/Sidebar';
import { useBundle } from '../context';
import type { Explorer } from './useExplorer';

export const RUMORS_VIEW = 'rumors';
export const JOURNAL_VIEW = 'journal';

/** The explorer's left panel: only what the player knows, plus exploration actions. */
export function ExploreSidebar({ explorer }: { explorer: Explorer }) {
  const { bundle, selectedId, open } = useBundle();
  const k = explorer.knowledge;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['countries', 'organizations']));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | EntityKind>('all');
  const known = (id: string) => (k.entities[id]?.length ?? 0) > 0;
  const toggle = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Reveal the selected entity's branch.
  useEffect(() => {
    if (!selectedId) return;
    const npc = bundle.npcs[selectedId];
    const s = npc ? bundle.settlements[npc.settlement_id] : bundle.settlements[selectedId];
    if (s) setExpanded((prev) => new Set([...prev, 'countries', s.country_id, s.id]));
  }, [bundle, selectedId]);

  const { known: knownFacts, total } = useMemo(() => progress(bundle, k), [bundle, k]);
  const countries = Object.values(bundle.countries).filter((c) => known(c.id));
  const orgs = Object.values(bundle.organizations).filter((o) => known(o.id));
  const peoples = [
    ['species', 'Species', Object.values(bundle.species).filter((x) => known(x.id))],
    ['language', 'Languages', Object.values(bundle.languages).filter((x) => known(x.id))],
    ['religion', 'Faiths', Object.values(bundle.religions).filter((x) => known(x.id))],
  ] as const;
  const settlementsOf = (cid: string) => Object.values(bundle.settlements).filter((s) => s.country_id === cid && known(s.id));
  const peopleOf = (sid: string) => Object.values(bundle.npcs).filter((n) => n.settlement_id === sid && known(n.id));
  // NPCs whose home is not yet known still need a place in the tree.
  const drifting = Object.values(bundle.npcs).filter((n) => known(n.id) && !known(n.settlement_id));

  const findRandom = () => open(explorer.meetRandom());
  const reset = () => {
    if (window.confirm('Forget everything learned about this planet?')) {
      explorer.reset();
      open(null);
    }
  };

  return (
    <nav className="sidebar">
      <div className="explore-actions">
        <button className="btn" onClick={findRandom}>Find a random NPC</button>
        <button className="btn btn-ghost btn-small" onClick={reset}>Reset</button>
      </div>
      <div className="explore-progress" title={`${knownFacts} of ${total} facts known`}>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${(knownFacts / total) * 100}%` }} /></div>
        <span className="muted small">{((knownFacts / total) * 100).toFixed(1)}% known · {k.met.length} met</span>
      </div>
      <SearchBox query={query} kind={kind} onQuery={setQuery} onKind={setKind} />
      {query.trim() || kind !== 'all' ? <SearchResults query={query} kind={kind} /> : (<>
        <TreeItem icon={KIND_ICON.planet} label={bundle.planet.name} selected={selectedId === null} onSelect={() => open(null)} />
        <TreeItem icon="❝" label={`Heard rumors (${k.rumors.length})`} selected={selectedId === RUMORS_VIEW} onSelect={() => open(RUMORS_VIEW)} />
        <TreeItem icon="✎" label={`Journal (${k.log.length})`} selected={selectedId === JOURNAL_VIEW} onSelect={() => open(JOURNAL_VIEW)} />
        <TreeGroup label={`Countries (${countries.length})`} open={expanded.has('countries')} onToggle={() => toggle('countries')}>
          {countries.length === 0 && <div className="tree-empty">Meet someone to start exploring.</div>}
          {countries.map((c) => (
            <TreeItem key={c.id} icon={KIND_ICON.country} label={c.name} selected={selectedId === c.id} onSelect={() => open(c.id)}
              expandable open={expanded.has(c.id)} onToggle={() => toggle(c.id)}>
              {settlementsOf(c.id).map((s) => {
                const people = peopleOf(s.id);
                return (
                  <TreeItem key={s.id} icon={KIND_ICON.settlement} label={s.name} selected={selectedId === s.id} onSelect={() => open(s.id)}
                    expandable={people.length > 0} open={expanded.has(s.id)} onToggle={() => toggle(s.id)}>
                    {people.map((n) => (
                      <TreeItem key={n.id} icon={k.met.includes(n.id) ? '●' : '○'} label={n.name} selected={selectedId === n.id}
                        onSelect={() => open(n.id)} meta={k.met.includes(n.id) ? 'met' : undefined} />
                    ))}
                  </TreeItem>
                );
              })}
            </TreeItem>
          ))}
        </TreeGroup>
        {drifting.length > 0 && (
          <TreeGroup label={`People elsewhere (${drifting.length})`} open={expanded.has('drifting')} onToggle={() => toggle('drifting')}>
            {drifting.map((n) => (
              <TreeItem key={n.id} icon="○" label={n.name} selected={selectedId === n.id} onSelect={() => open(n.id)} />
            ))}
          </TreeGroup>
        )}
        <TreeGroup label={`Organizations (${orgs.length})`} open={expanded.has('organizations')} onToggle={() => toggle('organizations')}>
          {orgs.map((o) => (
            <TreeItem key={o.id} icon={KIND_ICON.organization} label={o.name} selected={selectedId === o.id} onSelect={() => open(o.id)} />
          ))}
        </TreeGroup>
        <TreeGroup label="Peoples" open={expanded.has('peoples')} onToggle={() => toggle('peoples')}>
          {peoples.map(([key, label, items]) => (
            <TreeGroup key={key} label={`${label} (${items.length})`} open={expanded.has(key)} onToggle={() => toggle(key)} nested>
              {items.map((x) => (
                <TreeItem key={x.id} icon={KIND_ICON[key]} label={x.name} selected={selectedId === x.id} onSelect={() => open(x.id)} />
              ))}
            </TreeGroup>
          ))}
        </TreeGroup>
      </>)}
    </nav>
  );
}
