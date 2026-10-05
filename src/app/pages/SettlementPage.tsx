import {
  CORRUPTION_LEVELS, GARRISON_STRENGTHS, LAW_LEVELS, MARKET_SIZES, WEALTH_LEVELS, type Settlement,
} from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, Table } from '../components/Fields';
import { Ref, RefList } from '../components/Ref';
import { HistoryTable, Prose, ReferencedBy, ReligionTable, RumorTable, SpeciesTable } from '../components/Shared';
import { useBundle } from '../context';
import { formatPopulation, formatYearsAgo } from '../format';

export function SettlementPage({ settlement: s }: { settlement: Settlement }) {
  const { bundle } = useBundle();
  const country = bundle.countries[s.country_id];
  const people = Object.values(bundle.npcs)
    .filter((n) => n.settlement_id === s.id)
    .sort((a, b) => (a.npc_category === b.npc_category ? 0 : a.npc_category === 'leader' ? -1 : 1));

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Settlement · {s.settlement_type.replace(/_/g, ' ')}</div>
        <h1>{s.name}</h1>
        <div className="entity-sub">
          {s.nickname} · <Ref id={s.country_id} />{country?.capital_settlement_id === s.id && ' (capital)'} · {formatPopulation(s.population)}
        </div>
        <Prose tagline={s.tagline} description={s.description} />
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{s.name}</Field>
          <Field label="Nickname">{s.nickname}</Field>
          <Field label="Type"><Enum value={s.settlement_type} /></Field>
          <Field label="Country"><Ref id={s.country_id} /></Field>
          <Field label="Seed"><code>{s.seed}</code></Field>
        </Section>

        <Section title="Location">
          <Field label="Biome"><Enum value={s.biome} /></Field>
          <Field label="Terrain"><Enum value={s.terrain} /></Field>
          <Field label="Position" hint="Normalized planet-surface coordinates">{s.position.x.toFixed(3)}, {s.position.y.toFixed(3)}</Field>
          <Field label="Connections">
            {s.connections.length > 0 && (
              <Table
                head={['To', 'Link', 'Country']}
                rows={s.connections.map((c) => {
                  const other = bundle.settlements[c.settlement_id];
                  return [<Ref id={c.settlement_id} />, <Enum value={c.link_type} />, other && other.country_id !== s.country_id ? <Ref id={other.country_id} /> : <span className="muted">same</span>];
                })}
              />
            )}
          </Field>
        </Section>

        <Section title="Population">
          <Field label="Population">{formatPopulation(s.population)} <span className="muted">({s.population.toLocaleString()})</span></Field>
          <Field label="Species"><SpeciesTable shares={s.species} /></Field>
          <Field label="Languages"><RefList ids={s.languages} /></Field>
          <Field label="Faiths"><ReligionTable shares={s.religions_or_ideologies} /></Field>
          <Field label="Social structure"><Enum value={s.social_structure} /></Field>
        </Section>

        <Section title="Governance">
          <Field label="Governing body"><Enum value={s.governing_body} /></Field>
          <Field label="Leader title">{s.leader_title}</Field>
          <Field label="Leader">{s.leader_npc_id && <Ref id={s.leader_npc_id} />}</Field>
          <Field label="Law level"><Scale value={s.law_level} scale={LAW_LEVELS} /></Field>
          <Field label="Corruption"><Scale value={s.corruption_level} scale={CORRUPTION_LEVELS} /></Field>
        </Section>

        <Section title="Economy">
          <Field label="Wealth"><Scale value={s.wealth_level} scale={WEALTH_LEVELS} /></Field>
          <Field label="Industries"><EnumList values={s.primary_industries} /></Field>
          <Field label="Notable goods"><EnumList values={s.notable_goods} /></Field>
          <Field label="Market size"><Scale value={s.market_size} scale={MARKET_SIZES} /></Field>
        </Section>

        <Section title="Defense">
          <Field label="Defenses"><EnumList values={s.defenses} /></Field>
          <Field label="Garrison"><Scale value={s.garrison_strength} scale={GARRISON_STRENGTHS} /></Field>
        </Section>

        <Section title="Districts" wide>
          <Table head={['Name', 'Type', 'Description']} rows={s.districts.map((d) => [d.name, <Enum value={d.type} />, <span className="small">{d.description}</span>])} />
        </Section>

        <Section title="Points of interest" wide>
          <Table
            head={['Name', 'Type', 'Owner', 'Description']}
            rows={s.points_of_interest.map((poi) => [
              <span title={poi.id}>{poi.name}</span>, <Enum value={poi.type} />,
              poi.owner_npc_id ? <Ref id={poi.owner_npc_id} /> : <span className="muted">-</span>,
              <span className="small">{poi.description}</span>,
            ])}
          />
        </Section>

        <Section title="Atmosphere">
          <Field label="Mood"><Enum value={s.mood} /></Field>
          <Field label="Aesthetic"><Enum value={s.aesthetic} /></Field>
          <Field label="Local customs"><EnumList values={s.local_customs} /></Field>
        </Section>

        <Section title="Current situation">
          <Field label="Current events">
            {s.current_events.length > 0 && (
              <Table head={['Event', 'Involved']} rows={s.current_events.map((e) => [<span title={e.id}><Enum value={e.type} /></span>, <RefList ids={e.involved_refs} icon />])} />
            )}
          </Field>
          <Field label="Organizations present">
            {s.organizations_present.length > 0 && (
              <Table
                head={['Organization', 'Type', 'Presence']}
                rows={s.organizations_present.map((id) => {
                  const o = bundle.organizations[id];
                  return [<Ref id={id} />, <Enum value={o.org_type} />, <Enum value={o.presence.find((p) => p.settlement_id === s.id)!.strength} />];
                })}
              />
            )}
          </Field>
        </Section>

        <Section title={`People (${people.length})`} wide>
          <Table
            head={['Name', 'Category', 'Occupation', 'Species', 'Leads', 'Workplace']}
            rows={people.map((n) => [
              <Ref id={n.id} />, <Enum value={n.npc_category} />, <Enum value={n.occupation} />, <Ref id={n.species_id} />,
              n.leads.length > 0 ? <RefList ids={n.leads.map((l) => l.entity_id)} /> : <span className="muted">-</span>,
              n.workplace_poi_id ? s.points_of_interest.find((p) => p.id === n.workplace_poi_id)?.name : <span className="muted">-</span>,
            ])}
          />
        </Section>

        <Section title="History" wide>
          <Field label="Founded">{formatYearsAgo(s.founding_date)}</Field>
          <HistoryTable events={s.key_events} />
        </Section>

        <Section title="Flavor">
          <Field label="Rumors">{s.rumors.length > 0 && <RumorTable rumors={s.rumors} />}</Field>
        </Section>

        <ReferencedBy id={s.id} />
      </div>

      <RawJson data={s} />
    </article>
  );
}
