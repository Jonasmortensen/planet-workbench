import { useEffect, useMemo, useRef, useState } from 'react';
import { ENTITY_KINDS, entityName, kindOf } from '../../generator';
import { GENERIC_OPTIONS, aboutOption, exhausted } from '../../explore';
import { LinkedText } from '../components/LinkedText';
import { KIND_ICON, Ref } from '../components/Ref';
import { useBundle } from '../context';
import { humanize } from '../format';
import type { Explorer } from './useExplorer';

/** Conversation with one NPC: their greeting, the exchange so far, and what the player can ask. */
export function DialoguePanel({ npcId, explorer }: { npcId: string; explorer: Explorer }) {
  const { bundle } = useBundle();
  const k = explorer.knowledge;
  const n = bundle.npcs[npcId];
  const logRef = useRef<HTMLDivElement>(null);
  const entries = k.log.filter((e) => e.npc_id === npcId);
  const knownIds = useMemo(() => Object.keys(k.entities), [k.entities]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [entries.length]);

  // Options that would teach nothing new are greyed out.
  const done = useMemo(() => new Set(GENERIC_OPTIONS.filter((o) => exhausted(bundle, k, npcId, o)).map((o) => o.topic)), [bundle, k, npcId]);

  return (
    <section className="dialogue">
      <div className="dialogue-log" ref={logRef}>
        <div className="msg msg-npc"><span className="msg-who">{n.name}</span>“<LinkedText text={n.sample_greeting} ids={knownIds} />”</div>
        {entries.map((e) => (
          <div key={e.turn}>
            <div className="msg msg-player"><span className="msg-who">You</span>{e.question}</div>
            <div className="msg msg-npc">
              <span className="msg-who">{n.name}</span>“<LinkedText text={e.answer} ids={knownIds} />”
              {e.learned.length > 0 && (
                <div className="learned">
                  Learned: {groupLearned(e.learned).map(([entity, groups]) => (
                    <span key={entity} className="learned-item"><Ref id={entity} icon /> <span className="muted">({groups.join(', ')})</span></span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="dialogue-options">
        {GENERIC_OPTIONS.map((o) => (
          <button key={o.topic} className={done.has(o.topic) ? 'option option-done' : 'option'} onClick={() => explorer.talk(npcId, o)}>
            {o.label}
          </button>
        ))}
      </div>
      <AskBox ids={knownIds.filter((id) => id !== npcId)} onAsk={(id) => explorer.talk(npcId, aboutOption(bundle, id))} />
    </section>
  );
}

/** Type to find something known, then ask about it (click, or arrow keys and Enter). */
function AskBox({ ids, onAsk }: { ids: string[]; onAsk: (id: string) => void }) {
  const { bundle } = useBundle();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => ids
    .map((id) => {
      const kind = kindOf(id)!;
      const name = entityName(bundle, id);
      return { id, kind, name, text: `${name} ${kind}`.toLowerCase() };
    })
    .sort((a, b) => ENTITY_KINDS.indexOf(a.kind) - ENTITY_KINDS.indexOf(b.kind) || a.name.localeCompare(b.name)), [ids, bundle]);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter((i) => terms.every((t) => i.text.includes(t)));
  const current = matches[Math.min(active, matches.length - 1)];

  useEffect(() => setActive(0), [query]);
  useEffect(() => { listRef.current?.querySelector('.ask-item.active')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  const choose = (id: string | undefined) => {
    if (!id) return;
    onAsk(id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="dialogue-ask">
      <div className="ask-combo">
        <input
          className="search-input"
          value={query}
          placeholder="Ask about someone or something you know…"
          aria-label="Ask about"
          role="combobox"
          aria-expanded={open}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (open) choose(current?.id); else setOpen(true); }
            else if (e.key === 'Escape') { setOpen(false); }
          }}
        />
        {open && (
          <div className="ask-list" ref={listRef} role="listbox">
            {matches.length === 0 && <div className="ask-empty muted">Nothing you know matches.</div>}
            {matches.map((m) => (
              <div
                key={m.id}
                role="option"
                aria-selected={m === current}
                className={m === current ? 'ask-item active' : 'ask-item'}
                // mousedown, not click: the input's blur would close the list first.
                onMouseDown={(e) => { e.preventDefault(); choose(m.id); }}
                onMouseEnter={() => setActive(matches.indexOf(m))}
              >
                <span className="tree-icon">{KIND_ICON[m.kind]}</span>
                <span>{m.name}</span>
                <span className="tree-meta">{humanize(m.kind)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="btn" disabled={!query || !current} onClick={() => choose(current?.id)}>Ask</button>
    </div>
  );
}

function groupLearned(facts: { entity: string; group: string }[]): [string, string[]][] {
  const m = new Map<string, string[]>();
  for (const f of facts) m.set(f.entity, [...(m.get(f.entity) ?? []), f.group]);
  return [...m];
}
