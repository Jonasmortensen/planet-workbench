import { FACTION_TABLE, TECH_LEVEL_LABELS } from '../../generator/content';
import {
  CONNECTIVITY_LEVELS, DANGER_LEVELS, LAW_LEVELS, SIZE_CLASSES, STABILITY_LEVELS, WEALTH_LEVELS,
  ATMOSPHERE_PRESSURES, SEASONALITY_LEVELS, entityName, type PlanetBundle,
} from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, ShareBar, Table } from '../components/Fields';
import { capitalize, formatHours, formatPopulation, formatTemp, formatYearsAgo } from '../format';

/** Entity reference. Becomes a clickable link once entity pages exist (milestone 2). */
function Ref({ bundle, id }: { bundle: PlanetBundle; id: string }) {
  return <span className="ref" title={id}>{entityName(bundle, id)}</span>;
}

export function PlanetPage({ bundle }: { bundle: PlanetBundle }) {
  const p = bundle.planet;
  const species = Object.values(bundle.species);
  const languages = Object.values(bundle.languages);
  const religions = Object.values(bundle.religions);

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Planet</div>
        <h1>{p.name}</h1>
        <div className="entity-sub">
          {p.native_name !== p.name && <>Native name <strong>{p.native_name}</strong> · </>}
          {p.star_system} system, orbit {p.orbital_position}
        </div>
        <div className="prose">
          {p.tagline || p.description
            ? <><p className="tagline">{p.tagline}</p><p>{p.description}</p></>
            : <p className="muted">Tagline and description are rendered from structured data in milestone 4.</p>}
        </div>
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{p.name}</Field>
          <Field label="Native name">{p.native_name}</Field>
          <Field label="Star system">{p.star_system}</Field>
          <Field label="Orbital position">{p.orbital_position}</Field>
          <Field label="Orbital distance">{p.orbital_distance_au} AU</Field>
          <Field label="Insolation" hint="Stellar flux relative to a temperate standard">{p.insolation}×</Field>
          <Field label="Seed"><code>{p.seed}</code></Field>
        </Section>

        <Section title="Physical">
          <Field label="Planet type"><Enum value={p.planet_type} /></Field>
          <Field label="Size class"><Scale value={p.size_class} scale={SIZE_CLASSES} /></Field>
          <Field label="Radius">{p.radius_km.toLocaleString()} km</Field>
          <Field label="Gravity">{p.gravity} g</Field>
          <Field label="Day length">{p.tidally_locked ? <>Tidally locked ({formatHours(p.day_length_hours)})</> : formatHours(p.day_length_hours)}</Field>
          <Field label="Year length">{p.year_length_days.toLocaleString()} standard days</Field>
          <Field label="Axial tilt">{p.axial_tilt}°</Field>
          <Field label="Seasonality"><Scale value={p.seasonality} scale={SEASONALITY_LEVELS} /></Field>
          <Field label="Atmosphere">
            <Enum value={p.atmosphere.composition} /> <Scale value={p.atmosphere.pressure} scale={ATMOSPHERE_PRESSURES} />
          </Field>
          <Field label="Temperature">
            {formatTemp(p.temperature_range.min)} to {formatTemp(p.temperature_range.max)}, mean {formatTemp(p.temperature_range.mean)}
          </Field>
          <Field label="Water coverage"><ShareBar share={p.water_coverage} /></Field>
          <Field label="Moons">
            {p.moons.length > 0 && (
              <Table head={['Name', 'Size', 'Type']} rows={p.moons.map((m) => [m.name, <Enum value={m.size_class} />, <Enum value={m.moon_type} />])} />
            )}
          </Field>
        </Section>

        <Section title="Geography and resources">
          <Field label="Biomes">
            <Table head={['Biome', 'Share']} rows={p.biomes.map((b) => [<Enum value={b.biome} />, <ShareBar share={b.share} />])} />
          </Field>
          <Field label="Continents">{p.continent_count}</Field>
          <Field label="Notable features">
            {p.notable_features.length > 0 && (
              <Table head={['Name', 'Type']} rows={p.notable_features.map((f) => [capitalize(f.name), <Enum value={f.type} />])} />
            )}
          </Field>
          <Field label="Resources">
            {p.resources.length > 0 && (
              <Table head={['Resource', 'Abundance']} rows={p.resources.map((r) => [<Enum value={r.resource} />, <Enum value={r.abundance} />])} />
            )}
          </Field>
          <Field label="Hazards">
            {p.hazards.length > 0 && (
              <Table head={['Hazard', 'Severity']} rows={p.hazards.map((h) => [<Enum value={h.type} />, <Enum value={h.severity} />])} />
            )}
          </Field>
        </Section>

        <Section title="Life">
          <Field label="Biosphere"><Enum value={p.biosphere} /></Field>
          <Field label="Native sapients">{p.native_sapients ? <>Yes: <Ref bundle={bundle} id={p.native_species_id!} /></> : 'No'}</Field>
          <Field label="Settlement origin"><Enum value={p.settlement_origin} /></Field>
          <Field label="Species">
            <Table head={['Species', 'Share']} rows={p.species.map((s) => [<Ref bundle={bundle} id={s.species_id} />, <ShareBar share={s.share} />])} />
          </Field>
        </Section>

        <Section title="Civilization">
          <Field label="Population">{formatPopulation(p.population)} <span className="muted">({p.population.toLocaleString()})</span></Field>
          <Field label="Tech level">{p.tech_level} <span className="muted">· {TECH_LEVEL_LABELS[p.tech_level]}</span></Field>
          <Field label="Political structure"><Enum value={p.political_structure} /></Field>
          <Field label="Country count">{p.country_count}</Field>
          <Field label="World government">
            {p.world_government && (
              <>{p.world_government.name}, led by the {p.world_government.leader_title}
                {p.world_government.leader_npc_id
                  ? <> (<Ref bundle={bundle} id={p.world_government.leader_npc_id} />)</>
                  : <span className="muted"> (leader assigned in milestone 3)</span>}</>
            )}
          </Field>
          <Field label="Stability"><Scale value={p.stability} scale={STABILITY_LEVELS} /></Field>
          <Field label="Dominant languages">
            {p.dominant_languages.map((id, i) => <span key={id}>{i > 0 && ', '}<Ref bundle={bundle} id={id} /></span>)}
          </Field>
          <Field label="Religions and ideologies">
            <Table
              head={['Faith', 'Share']}
              rows={p.dominant_religions_or_ideologies.map((r) => [<Ref bundle={bundle} id={r.religion_id} />, <ShareBar share={r.share} />])}
            />
          </Field>
        </Section>

        <Section title="History">
          <Table
            head={['When', 'Event', 'Outcome', 'Involved']}
            rows={p.history.map((e) => [
              formatYearsAgo(e.date),
              <Enum value={e.event_type} />,
              <Enum value={e.outcome} />,
              e.involved_refs.length
                ? e.involved_refs.map((r, i) => <span key={r}>{i > 0 && ', '}<Ref bundle={bundle} id={r} /></span>)
                : <span className="muted">none</span>,
            ])}
          />
        </Section>

        <Section title="Economy and galactic relations">
          <Field label="Wealth"><Scale value={p.wealth_level} scale={WEALTH_LEVELS} /></Field>
          <Field label="Exports"><EnumList values={p.primary_exports} /></Field>
          <Field label="Imports"><EnumList values={p.primary_imports} /></Field>
          <Field label="Galactic connectivity"><Scale value={p.galactic_connectivity} scale={CONNECTIVITY_LEVELS} /></Field>
          <Field label="Faction allegiance">
            <span title={FACTION_TABLE[p.faction_allegiance].description}>{FACTION_TABLE[p.faction_allegiance].name}</span>
          </Field>
          <Field label="Law level"><Scale value={p.law_level} scale={LAW_LEVELS} /></Field>
          <Field label="Danger level"><Scale value={p.danger_level} scale={DANGER_LEVELS} /></Field>
        </Section>

        <Section title="Notable oddities">
          <Field label="Anomalies">
            {p.anomalies.length > 0 && (
              <Table head={['Anomaly', 'Explanation']} rows={p.anomalies.map((a) => [<Enum value={a.type} />, <Enum value={a.explanation_key} />])} />
            )}
          </Field>
          <Field label="Precursor presence"><Enum value={p.precursor_presence} /></Field>
          <Field label="Megastructures">
            {p.megastructures.length > 0 && (
              <Table
                head={['Name', 'Type', 'Condition', 'Builder']}
                rows={p.megastructures.map((m) => [capitalize(m.name), <Enum value={m.type} />, <Enum value={m.condition} />, <Enum value={m.builder} />])}
              />
            )}
          </Field>
          <Field label="Special abilities">
            {p.special_abilities.length > 0 && (
              <Table head={['Ability', 'Prevalence']} rows={p.special_abilities.map((s) => [<Enum value={s.type} />, <Enum value={s.prevalence} />])} />
            )}
          </Field>
        </Section>

        <Section title="Peoples" wide>
          <Field label="Species">
            <Table
              head={['Name', 'Origin', 'Biology', 'Body plan', 'Genders', 'Lifespan', 'Comfort']}
              rows={species.map((s) => [
                <span title={s.id}>{s.name} <span className="muted">({s.plural_name})</span></span>,
                <Enum value={s.origin} />, <Enum value={s.biology} />, <Enum value={s.body_plan} />, <Enum value={s.gender_system} />,
                `${s.lifespan_years} y`, `${formatTemp(s.comfort_temperature[0])} to ${formatTemp(s.comfort_temperature[1])}`,
              ])}
            />
          </Field>
          <Field label="Languages">
            <Table
              head={['Name', 'Style', 'Origin', 'Speakers']}
              rows={languages.map((l) => [
                <span title={l.id}>{l.name}</span>, <Enum value={l.style} />, <Enum value={l.origin} />,
                l.speaker_species_ids.map((s, i) => <span key={s}>{i > 0 && ', '}<Ref bundle={bundle} id={s} /></span>),
              ])}
            />
          </Field>
          <Field label="Religions">
            <Table
              head={['Name', 'Kind', 'Tenets', 'Focus', 'Origin']}
              rows={religions.map((r) => [
                <span title={r.id}>{r.name}</span>, <Enum value={r.kind} />, <EnumList values={r.tenets} />,
                r.focus_name ?? <span className="muted">none</span>, <Enum value={r.origin} />,
              ])}
            />
          </Field>
        </Section>
      </div>

      <RawJson data={p} />
    </article>
  );
}

