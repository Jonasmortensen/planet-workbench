import { useMemo, useState, useSyncExternalStore } from 'react';
import { aggregate } from '../batch/summary';
import { batchRunner } from '../batch/runner';
import { BarChart, StatTile } from '../components/Charts';
import { Section, Table } from '../components/Fields';
import { useBundle } from '../context';
import { humanize } from '../format';

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/** Generate N planets from sequential seeds in a worker and show their distributions. */
export function BatchPage() {
  const { goSeed } = useBundle();
  const state = useSyncExternalStore(batchRunner.subscribe, batchRunner.getState);
  const [count, setCount] = useState(100);
  const [start, setStart] = useState(0);
  const [prefix, setPrefix] = useState('');
  const stats = useMemo(() => aggregate(state.rows), [state.rows]);
  const done = state.rows.length + state.failures.length;
  const elapsed = state.startedAt ? ((state.finishedAt ?? performance.now()) - state.startedAt) / 1000 : 0;

  const run = () => {
    const seeds = Array.from({ length: Math.max(1, Math.min(5000, count)) }, (_, i) => `${prefix}${start + i}`);
    batchRunner.start(seeds, `${prefix}${start} … ${prefix}${start + seeds.length - 1}`);
  };

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">View</div>
        <h1>Batch stats</h1>
        <div className="entity-sub">Generate many planets from sequential seeds and check the generator’s balance.</div>
        <div className="batch-controls">
          <label>Planets <input type="number" min={1} max={5000} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <label>Seed prefix <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="none" spellCheck={false} /></label>
          <label>First number <input type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} /></label>
          {state.running
            ? <button className="btn btn-ghost" onClick={() => batchRunner.cancel()}>Cancel</button>
            : <button className="btn" onClick={run}>Run batch</button>}
        </div>
        {state.total > 0 && (
          <div className="progress" aria-label="Batch progress">
            <div className="progress-track"><div className="progress-fill" style={{ width: `${(done / state.total) * 100}%` }} /></div>
            <span className="muted small">
              {done} / {state.total} planets · seeds {state.label} · {elapsed.toFixed(1)} s{state.running ? '' : ' · done'}
            </span>
          </div>
        )}
      </header>

      {state.rows.length > 0 && (
        <>
          <div className="stat-grid">
            <StatTile label="Planets" value={stats.planets.toLocaleString()} detail={`${stats.avgMs.toFixed(0)} ms each on average`} />
            <StatTile label="Validation errors" value={stats.errors.toLocaleString()} status={stats.errors ? 'critical' : 'good'}
              detail={`${stats.planetsWithErrors.length} planets affected · ${state.failures.length} crashes`} />
            <StatTile label="Validation warnings" value={stats.warnings.toLocaleString()} detail={`${(stats.warnings / stats.planets).toFixed(2)} per planet`} />
            <StatTile label="NPCs per planet" value={stats.avgNpcs.toFixed(0)} detail={`${stats.avgOrgs.toFixed(0)} orgs · ${stats.avgSettlements.toFixed(0)} settlements`} />
            <StatTile label="Leadership overlap" value={pct(stats.overlapRate)} detail={`of ordinary slots reused · ${pct(stats.multiRoleShare)} of leaders hold 2+ roles`} />
            <StatTile label="Hidden roles" value={stats.hiddenRoles.toLocaleString()} detail={`${(stats.hiddenRoles / stats.planets).toFixed(1)} per planet`} />
            <StatTile label="True rumors" value={pct(stats.trueRumorShare)} detail="share of all rumors" />
            <StatTile label="Treasures per place" value={stats.treasuresPerPoi.toFixed(2)} detail={`${stats.avgPois.toFixed(0)} places · ${stats.avgTreasures.toFixed(0)} treasures per planet`} />
            <StatTile label="Surprising locations" value={pct(stats.surprisingShare)} detail="NPCs not at work or home (target 20–30%)" />
            <StatTile label="NPCs with treasure" value={pct(stats.carryingShare)} detail="carry or are a treasure (target 10–20%)" />
          </div>

          <div className="chart-grid">
            <BarChart title="Planet types" subtitle="Planets per type" data={stats.planetTypes} />
            <BarChart title="Political structures" subtitle="Planets per structure" data={stats.politicalStructures} />
            <BarChart title="Country counts" subtitle="Planets by number of countries" data={stats.countryCounts} label={(k) => k} />
            <BarChart title="NPC counts" subtitle="Planets by number of NPCs" data={stats.npcCounts} label={(k) => k} />
            <BarChart title="Tech levels" subtitle="Planets per tech level" data={stats.techLevels} label={(k) => k} />
            <BarChart title="Settlement origins" subtitle="Planets per origin" data={stats.origins} />
            <BarChart title="Government types" subtitle="Countries per government" data={stats.governmentTypes} />
            <BarChart title="Organization types" subtitle="Organizations per type" data={stats.orgTypes} />
            <BarChart title="Settlement types" subtitle="Settlements per type" data={stats.settlementTypes} />
            <BarChart title="Treasure categories" subtitle="Treasures per category" data={stats.treasureCategories} />
            <BarChart title="Treasure rarity" subtitle="Treasures per rarity" data={stats.treasureRarities} />
            <BarChart title="Treasures per place" subtitle="Places by number of their own treasures" data={stats.treasuresPerPoiDist} label={(k) => k} />
            <BarChart title="Place significance" subtitle="Points of interest per significance" data={stats.poiSignificances} />
            <BarChart title="Why NPCs are where they are" subtitle="NPCs per location reason" data={stats.locationReasons} />
            <BarChart title="Validation issues" subtitle="Issues per check across the batch" data={stats.issueCodes} label={(k) => k} />
          </div>

          {(stats.planetsWithErrors.length > 0 || state.failures.length > 0) && (
            <Section title="Planets with errors" wide>
              <Table
                head={['Seed', 'Planet', 'Errors', 'Checks']}
                rows={[
                  ...state.failures.map((f) => [<code>{f.seed}</code>, <span className="att-war chip">crashed</span>, '-', f.message]),
                  ...stats.planetsWithErrors.map((r) => [
                    <a href="#" onClick={(e) => { e.preventDefault(); goSeed(r.seed); }}><code>{r.seed}</code></a>, r.name, r.errors,
                    Object.keys(r.codes).filter((k) => k.startsWith('error:')).map((k) => k.slice(6)).join(', '),
                  ]),
                ]}
              />
            </Section>
          )}

          <Section title={`All planets (${state.rows.length})`} wide>
            <div className="scroll-box">
              <Table
                head={['Seed', 'Planet', 'Type', 'Structure', 'Countries', 'NPCs', 'Tech', 'Errors', 'Warnings']}
                rows={state.rows.slice(0, 1000).map((r) => [
                  <a href="#" onClick={(e) => { e.preventDefault(); goSeed(r.seed); }}><code>{r.seed}</code></a>,
                  r.name, humanize(r.planet_type), humanize(r.political_structure), r.country_count, r.npc_count, r.tech_level,
                  r.errors ? <span className="chip att-war">{r.errors}</span> : 0, r.warnings,
                ])}
              />
            </div>
          </Section>
        </>
      )}
    </article>
  );
}
