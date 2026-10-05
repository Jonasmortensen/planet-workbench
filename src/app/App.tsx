import { useEffect, useMemo, useRef, useState } from 'react';
import { generatePlanet } from '../generator';
import { collectRefs } from '../generator/validate';
import { Sidebar } from './components/Sidebar';
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
  }), [bundle, referencedBy, route.entityId, route.seed, navigate]);

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
            <span className={errors ? 'badge badge-error' : 'badge badge-ok'} title="Validation errors">{errors} errors</span>
            <span className={warnings ? 'badge badge-warn' : 'badge badge-ok'} title="Validation warnings">{warnings} warnings</span>
            <span className="muted small">
              {Object.keys(bundle.countries).length} countries · {Object.keys(bundle.settlements).length} settlements · {ms.toFixed(0)} ms · v{bundle.generator_version}
            </span>
          </div>
        </header>
        <div className="layout">
          <Sidebar />
          <main className="main" ref={mainRef}>
            <EntityPage />
            {bundle.validation.length > 0 && (
              <section className="section validation-preview">
                <h3 className="section-title">Validation</h3>
                <ul className="issue-list">
                  {bundle.validation.map((v, i) => (
                    <li key={i} className={`issue issue-${v.severity}`}>
                      <span className="issue-sev">{v.severity}</span> <code>{v.code}</code>{' '}
                      <a href="#" onClick={(e) => { e.preventDefault(); ctx.open(v.entity_ref === 'planet' ? null : v.entity_ref); }}>{v.entity_ref}</a>: {v.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>
        </div>
      </div>
    </BundleContext.Provider>
  );
}
