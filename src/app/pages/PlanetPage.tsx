import { FACTION_TABLE, TECH_LEVEL_LABELS } from '../../generator/content';
import {
  ATMOSPHERE_PRESSURES, CONNECTIVITY_LEVELS, DANGER_LEVELS, LAW_LEVELS, SEASONALITY_LEVELS, SIZE_CLASSES,
  STABILITY_LEVELS, WEALTH_LEVELS,
} from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, ShareBar, Table } from '../components/Fields';
import { Ref, RefList } from '../components/Ref';
import { HistoryTable, Prose, ReligionTable, RumorTable, SpeciesTable } from '../components/Shared';
import { useBundle } from '../context';
import { Known, KnowScope, useKnow } from '../know';
import { capitalize, formatHours, formatPopulation, formatTemp } from '../format';

export function PlanetPage() {
  const { bundle } = useBundle();
  const { isKnown } = useKnow();
  const p = bundle.planet;
  const countries = Object.values(bundle.countries);

  return (
    <KnowScope id={p.id}>
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Planet</div>
        <h1>{p.name}</h1>
        <div className="entity-sub">
          {p.native_name !== p.name && <>Native name <strong>{p.native_name}</strong> · </>}
          {p.star_system} system, orbit {p.orbital_position}
        </div>
        <Prose tagline={p.tagline} description={p.description} />
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
          <Field label="Native sapients">{p.native_sapients ? <>Yes: <Ref id={p.native_species_id!} /></> : 'No'}</Field>
          <Field label="Settlement origin"><Enum value={p.settlement_origin} /></Field>
          <Field label="Species"><SpeciesTable shares={p.species} /></Field>
        </Section>

        <Section title="Civilization">
          <Field label="Population">{formatPopulation(p.population)} <span className="muted">({p.population.toLocaleString()})</span></Field>
          <Field label="Tech level">{p.tech_level} <span className="muted">· {TECH_LEVEL_LABELS[p.tech_level]}</span></Field>
          <Field label="Political structure"><Enum value={p.political_structure} /></Field>
          <Field label="Country count">{p.country_count}</Field>
          <Field label="World government">
            {p.world_government && (
              <>{p.world_government.name}, led by the {p.world_government.leader_title}
                {p.world_government.leader_npc_id && <> (<Ref id={p.world_government.leader_npc_id} />)</>}</>
            )}
          </Field>
          <Field label="Stability"><Scale value={p.stability} scale={STABILITY_LEVELS} /></Field>
          <Field label="Dominant languages"><RefList ids={p.dominant_languages} /></Field>
          <Field label="Religions and ideologies"><ReligionTable shares={p.dominant_religions_or_ideologies} /></Field>
        </Section>

        <Section title="Countries" wide>
          <Table
            head={['Country', 'Government', 'Ruler', 'Capital', 'Population', 'Area', 'Stability', 'Tech']}
            rows={countries.filter((c) => isKnown(c.id)).map((c) => [
              <Ref id={c.id} />, <Known id={c.id} group="government"><Enum value={c.government_type} /></Known>,
              <Known id={c.id} group="ruler">{c.ruler_npc_id ? <Ref id={c.ruler_npc_id} /> : '-'}</Known>,
              <Known id={c.id} group="ruler">{c.capital_settlement_id ? <Ref id={c.capital_settlement_id} /> : '-'}</Known>,
              <Known id={c.id} group="population">{formatPopulation(c.population)}</Known>,
              <Known id={c.id} group="territory"><ShareBar share={c.area_share} /></Known>,
              <Known id={c.id} group="government"><Enum value={c.stability} /></Known>, <Known id={c.id} group="tech">{c.tech_level}</Known>,
            ])}
          />
        </Section>

        <Section title="History" wide>
          <HistoryTable events={p.history} />
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

        <Section title="Flavor">
          <Field label="Rumors">{p.rumors.length > 0 && <RumorTable rumors={p.rumors} />}</Field>
        </Section>
      </div>

      <RawJson data={p} />
    </article>
    </KnowScope>
  );
}
