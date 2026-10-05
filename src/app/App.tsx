import { useEffect, useMemo, useState } from 'react';
import { generatePlanet } from '../generator';
import { PlanetPage } from './pages/PlanetPage';
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

  const errors = bundle.validation.filter((v) => v.severity === 'error').length;
  const warnings = bundle.validation.length - errors;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const seed = draft.trim();
    if (seed) navigate({ seed, entityId: null });
  };

  return (
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
          <span className="muted small">{ms.toFixed(0)} ms · v{bundle.generator_version}</span>
        </div>
      </header>
      <main className="main">
        <PlanetPage bundle={bundle} />
        {bundle.validation.length > 0 && (
          <section className="section validation-preview">
            <h3 className="section-title">Validation</h3>
            <ul className="issue-list">
              {bundle.validation.map((v, i) => (
                <li key={i} className={`issue issue-${v.severity}`}>
                  <span className="issue-sev">{v.severity}</span> <code>{v.code}</code> {v.entity_ref}: {v.message}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
