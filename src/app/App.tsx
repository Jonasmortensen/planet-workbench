import { useEffect, useMemo, useRef, useState } from 'react';
import { generatePlanet } from '../generator';
import { collectRefs } from '../generator/validate';
import { Sidebar, VALIDATION_VIEW } from './components/Sidebar';
import { BundleContext, buildReverseIndex, type BundleContextValue } from './context';
import { EntityPage } from './pages/EntityPage';
import { randomSeed, useRoute } from './route';

export function App() {
  const [route, navigate] = useRoute();
  const [draft, setDraft] = useState(route.seed);
  useEffect(() => setDraft(route.seed), [route.seed]);

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
    open: (entityId) => navigate({ seed: route.seed, entityId }),
    goSeed: (seed) => navigate({ seed, entityId: null }),
  }), [bundle, referencedBy, route.entityId, route.seed, navigate]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planet-${bundle.seed.replace(/[^\w-]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Scroll the main panel to the top when the selection changes.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [route.entityId, route.seed]);

  const errors = bundle.validation.filter((v) => v.severity === 'error').length;
  const warnings = bundle.validation.length - errors;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const seed = draft.trim();
    if (seed) navigate({ seed, entityId: null });
  };

  return (
    <BundleContext.Provider value={ctx}>
      <div className="app">
        <header className="topbar">
          <div className="brand">Planet Workbench</div>
          <form className="seed-form" onSubmit={submit}>
            <label htmlFor="seed" className="seed-label">Seed</label>
            <input id="seed" className="seed-input" value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} />
            <button className="btn" type="submit">Generate</button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate({ seed: randomSeed(), entityId: null })}>
              Random seed
            </button>
          </form>
          <div className="topbar-status">
            <button className={errors ? 'badge badge-error' : 'badge badge-ok'} title="Open the validation panel" onClick={() => ctx.open(VALIDATION_VIEW)}>{errors} errors</button>
            <button className={warnings ? 'badge badge-warn' : 'badge badge-ok'} title="Open the validation panel" onClick={() => ctx.open(VALIDATION_VIEW)}>{warnings} warnings</button>
            <button className="btn btn-ghost btn-small" onClick={exportJson} title="Download the whole planet bundle as JSON">Export JSON</button>
            <span className="muted small">
              {Object.keys(bundle.countries).length} countries · {Object.keys(bundle.settlements).length} settlements · {ms.toFixed(0)} ms · v{bundle.generator_version}
            </span>
          </div>
        </header>
        <div className="layout">
          <Sidebar />
          <main className="main" ref={mainRef}>
            <EntityPage />
          </main>
        </div>
      </div>
    </BundleContext.Provider>
  );
}
