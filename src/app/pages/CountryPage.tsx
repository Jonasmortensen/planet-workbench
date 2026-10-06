import {
  FREEDOM_LEVELS, LAW_LEVELS, MILITARY_STRENGTHS, STABILITY_LEVELS, WEALTH_LEVELS, type Country,
} from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, ShareBar, Table } from '../components/Fields';
import { Ref, RefList } from '../components/Ref';
import { RelationTable } from '../components/Relations';
import { HistoryTable, Prose, ReferencedBy, ReligionTable, RumorTable, SpeciesTable } from '../components/Shared';
import { useBundle } from '../context';
import { Known, KnowScope, useKnow } from '../know';
import { capitalize, formatPopulation, formatYearsAgo } from '../format';

export function CountryPage({ country: c }: { country: Country }) {
  const { bundle } = useBundle();
  const { isKnown } = useKnow();
  const settlements = Object.values(bundle.settlements).filter((s) => s.country_id === c.id);
  const settled = settlements.reduce((a, s) => a + s.population, 0);

  return (
    <KnowScope id={c.id}>
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Country</div>
        <h1>{c.name}</h1>
        <div className="entity-sub">
          {c.demonym} · <em>“{c.motto}”</em> · capital {c.capital_settlement_id ? <Ref id={c.capital_settlement_id} /> : 'none'}
        </div>
        <Prose tagline={c.tagline} description={c.description} />
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{c.name}</Field>
          <Field label="Demonym">{c.demonym}</Field>
          <Field label="Flag">{c.flag_description}</Field>
          <Field label="Motto">“{c.motto}”</Field>
          <Field label="Planet"><Ref id={c.planet_id} /></Field>
          <Field label="Seed"><code>{c.seed}</code></Field>
        </Section>

        <Section title="Territory">
          <Field label="Area share"><ShareBar share={c.area_share} /></Field>
          <Field label="Center" hint="Normalized planet-surface coordinates">{c.center.x.toFixed(2)}, {c.center.y.toFixed(2)}</Field>
          <Field label="Biomes">
            <Table head={['Biome', 'Share']} rows={c.biomes.map((b) => [<Enum value={b.biome} />, <ShareBar share={b.share} />])} />
          </Field>
          <Field label="Capital">{c.capital_settlement_id && <Ref id={c.capital_settlement_id} />}</Field>
          <Field label="Neighbors"><RefList ids={c.neighbor_ids} /></Field>
          <Field label="Notable features">
            {c.notable_features.length > 0 && (
              <Table head={['Name', 'Type']} rows={c.notable_features.map((f) => [capitalize(f.name), <Enum value={f.type} />])} />
            )}
          </Field>
        </Section>

        <Section title="Population">
          <Field label="Population">{formatPopulation(c.population)} <span className="muted">({c.population.toLocaleString()})</span></Field>
          <Field label="In settlements" hint="Sum of listed settlements; the rest live in the countryside">
            {formatPopulation(settled)} <span className="muted">({((settled / c.population) * 100).toFixed(0)}%)</span>
          </Field>
          <Field label="Species"><SpeciesTable shares={c.species} /></Field>
          <Field label="Languages"><RefList ids={c.languages} /></Field>
          <Field label="Faiths"><ReligionTable shares={c.religions_or_ideologies} /></Field>
        </Section>

        <Section title="Government">
          <Field label="Government type"><Enum value={c.government_type} /></Field>
          <Field label="Ruler title">{c.ruler_title}</Field>
          <Field label="Ruler">{c.ruler_npc_id && <Ref id={c.ruler_npc_id} />}</Field>
          <Field label="Stability"><Scale value={c.stability} scale={STABILITY_LEVELS} /></Field>
          <Field label="Law level"><Scale value={c.law_level} scale={LAW_LEVELS} /></Field>
          <Field label="Freedom"><Scale value={c.freedom_level} scale={FREEDOM_LEVELS} /></Field>
        </Section>

        <Section title="Economy">
          <Field label="Wealth"><Scale value={c.wealth_level} scale={WEALTH_LEVELS} /></Field>
          <Field label="Tech level">{c.tech_level}{c.tech_level !== bundle.planet.tech_level && <span className="muted"> (planet: {bundle.planet.tech_level})</span>}</Field>
          <Field label="Industries"><EnumList values={c.primary_industries} /></Field>
          <Field label="Exports"><EnumList values={c.exports} /></Field>
          <Field label="Imports"><EnumList values={c.imports} /></Field>
          <Field label="Currency">{c.currency_name}</Field>
        </Section>

        <Section title="Military and relations">
          <Field label="Military strength"><Scale value={c.military_strength} scale={MILITARY_STRENGTHS} /></Field>
          <Field label="Doctrine"><Enum value={c.military_doctrine} /></Field>
        </Section>

        <Section title="Relations with countries">
          <RelationTable relations={c.relations.filter((r) => r.target_ref in bundle.countries)} />
        </Section>

        <Section title="Relations with organizations">
          <RelationTable relations={c.relations.filter((r) => r.target_ref in bundle.organizations)} />
        </Section>

        <Section title="Culture">
          <Field label="Values"><EnumList values={c.values} /></Field>
          <Field label="Customs"><EnumList values={c.customs} /></Field>
          <Field label="Aesthetic"><Enum value={c.aesthetic} /></Field>
        </Section>

        <Section title="Settlements" wide>
          <Table
            head={['Settlement', 'Type', 'Population', 'Biome', 'Mood', 'Founded']}
            rows={settlements.filter((s) => isKnown(s.id)).map((s) => [
              <Ref id={s.id} />, <Known id={s.id} group="appearance"><Enum value={s.settlement_type} /></Known>,
              <Known id={s.id} group="appearance">{formatPopulation(s.population)}</Known>,
              <Known id={s.id} group="appearance"><Enum value={s.biome} /></Known>,
              <Known id={s.id} group="appearance"><Enum value={s.mood} /></Known>,
              <Known id={s.id} group="history">{formatYearsAgo(s.founding_date)}</Known>,
            ])}
          />
        </Section>

        <Section title="History" wide>
          <Field label="Founded">{formatYearsAgo(c.founding_date)}</Field>
          <HistoryTable events={c.key_events} />
        </Section>

        <Section title="Flavor">
          <Field label="Rumors">{c.rumors.length > 0 && <RumorTable rumors={c.rumors} />}</Field>
        </Section>

        <ReferencedBy id={c.id} />
      </div>

      <RawJson data={c} />
    </article>
    </KnowScope>
  );
}
