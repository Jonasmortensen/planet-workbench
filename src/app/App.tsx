import { useEffect, useMemo, useRef, useState } from 'react';
import { generatePlanet, kindOf, type PlanetBundle } from '../generator';
import { collectRefs } from '../generator/validate';
import { Sidebar, VALIDATION_VIEW } from './components/Sidebar';
import { BundleContext, buildReverseIndex, useBundle, type BundleContextValue } from './context';
import { DialoguePanel } from './explore/DialoguePanel';
import { ExploreSidebar, JOURNAL_VIEW, RUMORS_VIEW } from './explore/ExploreSidebar';
import { HeardRumorsPage, JournalPage } from './explore/ExplorePages';
import { useExplorer } from './explore/useExplorer';
import { KnowContext, type KnowValue } from './know';
import { EntityPage } from './pages/EntityPage';
import { randomSeed, useRoute, type Mode } from './route';

export function App() {
  const [route, navigate] = useRoute();
  const mode: Mode = route.mode ?? 'inspect';
  const [draft, setDraft] = useState(route.seed);
  useEffect(() => setDraft(route.seed), [route.seed]);
  // On phones the sidebar is a drawer; any navigation closes it.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => setNavOpen(false), [route.seed, route.entityId, mode]);

  const { bundle, ms } = useMemo(() => {
    const t0 = performance.now();
    const b = generatePlanet(route.seed);
    return { bundle: b, ms: performance.now() - t0 };
  }, [route.seed]);
  const referencedBy = useMemo(() => buildReverseIndex(collectRefs(bundle)), [bundle]);

  const ctx: BundleContextValue = useMemo(() => ({
    bundle,
    referencedBy,
    selectedId: route.entityId,
    open: (entityId) => navigate({ mode, seed: route.seed, entityId }),
    goSeed: (seed) => navigate({ mode, seed, entityId: null }),
  }), [bundle, referencedBy, route.entityId, route.seed, navigate, mode]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planet-${bundle.seed.replace(/[^\w-]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errors = bundle.validation.filter((v) => v.severity === 'error').length;
  const warnings = bundle.validation.length - errors;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const seed = draft.trim();
    if (seed) navigate({ mode, seed, entityId: null });
  };

  return (
    <BundleContext.Provider value={ctx}>
      <div className={navOpen ? 'app nav-open' : 'app'}>
        <header className="topbar">
          <button className="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}>☰</button>
          <div className="brand">Planet Workbench</div>
          <div className="mode-switch" role="tablist">
            <button role="tab" aria-selected={mode === 'inspect'} className={mode === 'inspect' ? 'on' : ''}
              onClick={() => navigate({ mode: 'inspect', seed: route.seed, entityId: route.entityId })}>Inspector</button>
            <button role="tab" aria-selected={mode === 'explore'} className={mode === 'explore' ? 'on' : ''}
              onClick={() => navigate({ mode: 'explore', seed: route.seed, entityId: null })}>Explorer</button>
          </div>
          <form className="seed-form" onSubmit={submit}>
            <label htmlFor="seed" className="seed-label">Seed</label>
            <input id="seed" className="seed-input" value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} />
            <button className="btn" type="submit">Generate</button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate({ mode, seed: randomSeed(), entityId: null })}>
              Random seed
            </button>
          </form>
          {mode === 'inspect' && (
            <div className="topbar-status">
              <button className={errors ? 'badge badge-error' : 'badge badge-ok'} title="Open the validation panel" onClick={() => ctx.open(VALIDATION_VIEW)}>{errors} errors</button>
              <button className={warnings ? 'badge badge-warn' : 'badge badge-ok'} title="Open the validation panel" onClick={() => ctx.open(VALIDATION_VIEW)}>{warnings} warnings</button>
              <button className="btn btn-ghost btn-small" onClick={exportJson} title="Download the whole planet bundle as JSON">Export JSON</button>
              <span className="muted small">
                {Object.keys(bundle.countries).length} countries · {Object.keys(bundle.settlements).length} settlements · {ms.toFixed(0)} ms · v{bundle.generator_version}
              </span>
            </div>
          )}
        </header>
        {mode === 'inspect'
          ? <InspectorLayout routeKey={`${route.seed}/${route.entityId}`} />
          : <ExplorerLayout key={`${bundle.seed}:${bundle.generator_version}`} bundle={bundle} />}
        <div className="nav-backdrop" onClick={() => setNavOpen(false)} />
      </div>
    </BundleContext.Provider>
  );
}

function useScrollTop(key: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); }, [key]);
  return ref;
}

function InspectorLayout({ routeKey }: { routeKey: string }) {
  const mainRef = useScrollTop(routeKey);
  return (
    <div className="layout">
      <Sidebar />
      <main className="main" ref={mainRef}><EntityPage /></main>
    </div>
  );
}

const INSPECTOR_VIEWS = ['relations', 'validation', 'batch'];

/** The explorer: same pages, filtered to what the player knows, with dialogue on NPC pages. */
function ExplorerLayout({ bundle }: { bundle: PlanetBundle }) {
  const ctx = useBundle();
  const explorer = useExplorer(bundle);
  const k = explorer.knowledge;
  const selected = ctx.selectedId;
  const know: KnowValue = useMemo(() => ({
    explore: true,
    knows: (entity, group) => k.entities[entity]?.includes(group) ?? false,
    isKnown: (entity) => (k.entities[entity]?.length ?? 0) > 0,
  }), [k]);

  // Opening a known NPC means talking to them: what is visible around them is revealed.
  useEffect(() => {
    if (selected && kindOf(selected) === 'npc' && know.isKnown(selected)) explorer.meetNpc(selected);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const mainRef = useScrollTop(selected ?? '');
  let content;
  if (selected === RUMORS_VIEW) content = <HeardRumorsPage explorer={explorer} />;
  else if (selected === JOURNAL_VIEW) content = <JournalPage explorer={explorer} />;
  else if (selected && INSPECTOR_VIEWS.includes(selected)) {
    // Inspector-only views are not part of the explorer; show the planet instead.
    content = <BundleContext.Provider value={{ ...ctx, selectedId: null }}><EntityPage /></BundleContext.Provider>;
  } else if (selected && !know.isKnown(selected)) {
    content = (
      <div className="entity-header">
        <h1>Unknown</h1>
        <p className="muted">You have not heard of this yet. Talk to people to learn more.</p>
      </div>
    );
  } else if (selected && kindOf(selected) === 'npc') {
    content = <><DialoguePanel npcId={selected} explorer={explorer} /><EntityPage /></>;
  } else {
    content = <EntityPage />;
  }

  return (
    <KnowContext.Provider value={know}>
      <div className="layout explore">
        <ExploreSidebar explorer={explorer} />
        <main className="main" ref={mainRef}>{content}</main>
      </div>
    </KnowContext.Provider>
  );
}
