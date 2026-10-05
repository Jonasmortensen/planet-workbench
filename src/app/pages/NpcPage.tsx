import { DISPOSITIONS, SOCIAL_RANKS, WEALTH_LEVELS, type Npc } from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, Table } from '../components/Fields';
import { Ref, RefList } from '../components/Ref';
import { MotiveView } from '../components/Relations';
import { HistoryTable, Prose, ReferencedBy, RumorTable } from '../components/Shared';
import { useBundle } from '../context';
import { humanize } from '../format';

export function NpcPage({ npc: n }: { npc: Npc }) {
  const { bundle } = useBundle();
  const settlement = bundle.settlements[n.settlement_id];
  const species = bundle.species[n.species_id];
  const workplace = n.workplace_poi_id ? settlement.points_of_interest.find((p) => p.id === n.workplace_poi_id) : null;
  const event = n.current_event_involvement ? settlement.current_events.find((e) => e.id === n.current_event_involvement) : null;

  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">NPC · {n.npc_category}</div>
        <h1>{n.name}{n.title_or_epithet && <span className="title-suffix">, {n.title_or_epithet}</span>}</h1>
        <div className="entity-sub">
          {species.name} {humanize(n.occupation).toLowerCase()}, {n.age} ({n.age_category.replace(/_/g, ' ')}) · lives in <Ref id={n.settlement_id} />
        </div>
        <Prose tagline={n.tagline} description={n.description} />
        {n.backstory && <div className="prose"><p>{n.backstory}</p></div>}
        {n.sample_greeting && <div className="prose"><p className="greeting">“{n.sample_greeting}”</p></div>}
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{n.name}</Field>
          <Field label="Given / family">{n.given_name} / {n.family_name || <span className="muted">none</span>}</Field>
          <Field label="Title or epithet">{n.title_or_epithet}</Field>
          <Field label="Species"><Ref id={n.species_id} /></Field>
          <Field label="Native tongue"><Ref id={n.language_id} /></Field>
          <Field label="Age">{n.age} <span className="muted">· {n.age_category.replace(/_/g, ' ')} (lifespan {species.lifespan_years})</span></Field>
          <Field label="Gender"><Enum value={n.gender} /></Field>
          <Field label="Home"><Ref id={n.settlement_id} />, <Ref id={settlement.country_id} /></Field>
          <Field label="Seed"><code>{n.seed}</code></Field>
        </Section>

        <Section title="Category and role">
          <Field label="Category"><Enum value={n.npc_category} /></Field>
          <Field label="Leads">
            {n.leads.length > 0 && (
              <Table
                head={['Entity', 'Type', 'Public']}
                rows={n.leads.map((l) => [<Ref id={l.entity_id} icon />, <Enum value={l.entity_type} />, l.public ? 'public' : <span className="chip att-hostile">hidden</span>])}
              />
            )}
          </Field>
          <Field label="Occupation"><Enum value={n.occupation} /></Field>
          <Field label="Social rank"><Scale value={n.social_rank} scale={SOCIAL_RANKS} /></Field>
          <Field label="Story role"><Enum value={n.role_type} /></Field>
          <Field label="Workplace">{workplace ? <>{workplace.name} <span className="muted">({humanize(workplace.type)}{workplace.owner_npc_id === n.id ? ', owner' : ''})</span></> : null}</Field>
        </Section>

        <Section title="Appearance">
          <Field label="Details"><EnumList values={n.appearance} /></Field>
          <Field label="Clothing"><Enum value={n.clothing} /></Field>
          <Field label="Distinguishing mark"><Enum value={n.distinguishing_mark} /></Field>
        </Section>

        <Section title="Personality">
          <Field label="Traits"><EnumList values={n.traits} /></Field>
          <Field label="Values"><EnumList values={n.values} /></Field>
          <Field label="Quirk"><Enum value={n.quirk} /></Field>
          <Field label="Speech style"><Enum value={n.speech_style} /></Field>
          <Field label="Disposition to outsiders"><Scale value={n.disposition_to_outsiders} scale={DISPOSITIONS} /></Field>
        </Section>

        <Section title="Motivation">
          <Field label="Goal"><MotiveView motive={n.goal} /></Field>
          <Field label="Fear"><MotiveView motive={n.fear} /></Field>
          <Field label="Secret">{n.secret ? <><MotiveView motive={n.secret} /> <span className="chip att-rival">hidden</span></> : <span className="muted">none</span>}</Field>
        </Section>

        <Section title="Capabilities">
          <Field label="Skills"><EnumList values={n.skills} /></Field>
          <Field label="Special abilities"><EnumList values={n.special_abilities} /></Field>
          <Field label="Possessions"><EnumList values={n.possessions} /></Field>
          <Field label="Wealth"><Scale value={n.wealth_level} scale={WEALTH_LEVELS} /></Field>
        </Section>

        <Section title="Affiliations">
          <Field label="Organizations"><RefList ids={n.organization_ids} /></Field>
          <Field label="Faith">{n.religion_or_ideology ? <Ref id={n.religion_or_ideology} /> : <span className="muted">unaffiliated</span>}</Field>
          <Field label="Allegiance">{n.allegiance_ref && <Ref id={n.allegiance_ref} icon />}</Field>
        </Section>

        <Section title={`Relationships (${n.relationships.length})`}>
          {n.relationships.length > 0
            ? (
              <Table
                head={['Person', 'Is their', 'Note', 'Lives in']}
                rows={n.relationships.map((r) => [
                  <Ref id={r.npc_id} />, <Enum value={r.type} />, <Enum value={r.note_key} />, <Ref id={bundle.npcs[r.npc_id].settlement_id} />,
                ])}
              />
            )
            : <span className="muted">none</span>}
        </Section>

        <Section title="Story hooks">
          <Field label="Current event">
            {event && <><Enum value={event.type} /> <span className="muted">with</span> <RefList ids={event.involved_refs.filter((x) => x !== n.id)} /></>}
          </Field>
          <Field label="Quest hooks">
            {n.quest_hooks.length > 0 && (
              <Table head={['Type', 'Targets', 'Reward']} rows={n.quest_hooks.map((h) => [<Enum value={h.type} />, <RefList ids={h.target_refs} icon />, <Enum value={h.reward_type} />])} />
            )}
          </Field>
          <Field label="Rumors about">{n.rumors_about.length > 0 && <RumorTable rumors={n.rumors_about} />}</Field>
        </Section>

        <Section title="Life" wide>
          <HistoryTable events={n.key_life_events} />
        </Section>

        <ReferencedBy id={n.id} />
      </div>
      <RawJson data={n} />
    </article>
  );
}
