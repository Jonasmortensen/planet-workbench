import { INFLUENCE_LEVELS, ORG_SIZES, WEALTH_LEVELS, type Organization } from '../../generator';
import { Enum, EnumList, Field, RawJson, Scale, Section, Table } from '../components/Fields';
import { Ref } from '../components/Ref';
import { MotiveView, RelationTable } from '../components/Relations';
import { HistoryTable, Prose, ReferencedBy, RumorTable } from '../components/Shared';
import { useBundle } from '../context';
import { Known, KnowScope, useKnow } from '../know';
import { formatYearsAgo } from '../format';

export function OrganizationPage({ org: o }: { org: Organization }) {
  const { bundle } = useBundle();
  const { isKnown, explore } = useKnow();
  const leader = o.leader_npc_id ? bundle.npcs[o.leader_npc_id] : null;
  const leadEntry = leader?.leads.find((l) => l.entity_id === o.id);
  const agendaDiffers = JSON.stringify(o.stated_goal) !== JSON.stringify(o.true_goal);

  return (
    <KnowScope id={o.id}>
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Organization · {o.org_type.replace(/_/g, ' ')} · {o.scope_level} scope</div>
        <h1>{o.name}</h1>
        <div className="entity-sub">
          {o.short_name} · <em>“{o.motto}”</em> · {o.visibility}, {o.legality}
          {o.state_role !== 'none' && <> · <strong>{o.state_role.replace(/_/g, ' ')}</strong></>}
        </div>
        <Prose tagline={o.tagline} description={o.description} />
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{o.name}</Field>
          <Field label="Short name">{o.short_name}</Field>
          <Field label="Symbol">{o.symbol_description}</Field>
          <Field label="Motto">“{o.motto}”</Field>
          <Field label="Type"><Enum value={o.org_type} /></Field>
          <Field label="State role">{o.state_role !== 'none' ? <Enum value={o.state_role} /> : <span className="muted">none</span>}</Field>
          <Field label="Faith">{o.religion_id ? <Ref id={o.religion_id} /> : <span className="muted">none</span>}</Field>
          <Field label="Seed"><code>{o.seed}</code></Field>
        </Section>

        <Section title="Scope">
          <Field label="Scope level"><Enum value={o.scope_level} /></Field>
          <Field label="Home"><Ref id={o.home_ref} icon /></Field>
          <Field label="Headquarters"><Ref id={o.headquarters_settlement_id} /></Field>
          <Field label="Presence">
            <Table
              head={['Settlement', 'Country', 'Strength']}
              rows={o.presence.filter((p) => isKnown(p.settlement_id)).map((p) => [<Ref id={p.settlement_id} />, <Ref id={bundle.settlements[p.settlement_id].country_id} />, <Enum value={p.strength} />])}
            />
          </Field>
        </Section>

        <Section title="Leadership">
          <Field label="Leader title">{o.leader_title}</Field>
          <Field label="Leader">
            {leader && (!explore || leadEntry?.public) && <><Ref id={leader.id} />{leadEntry && !leadEntry.public && <span className="chip att-hostile" style={{ marginLeft: 6 }}>hidden</span>}</>}
          </Field>
          <Field label="Structure"><Enum value={o.structure} /></Field>
          <Field label="Ranks">{o.ranks.join(' → ')}</Field>
          <Field label="Recruitment"><Enum value={o.recruitment} /></Field>
        </Section>

        <Section title="Status">
          <Field label="Visibility"><Enum value={o.visibility} /></Field>
          <Field label="Legality"><Enum value={o.legality} /></Field>
          <Field label="Influence"><Scale value={o.influence} scale={INFLUENCE_LEVELS} /></Field>
          <Field label="Wealth"><Scale value={o.wealth_level} scale={WEALTH_LEVELS} /></Field>
          <Field label="Size"><Scale value={o.size} scale={ORG_SIZES} /></Field>
        </Section>

        <Section title="Purpose">
          <Field label="Stated goal"><MotiveView motive={o.stated_goal} /></Field>
          <Field label="True goal">{agendaDiffers ? <><MotiveView motive={o.true_goal} /> <span className="chip att-rival">hidden agenda</span></> : <span className="muted">same as stated</span>}</Field>
          <Field label="Activities"><EnumList values={o.activities} /></Field>
          <Field label="Resources"><EnumList values={o.resources} /></Field>
        </Section>

        <Section title="Relations">
          <RelationTable relations={o.relations} />
        </Section>

        <Section title={`Members (${o.member_npc_ids.length})`} wide>
          <Table
            head={['Member', 'Lives in', 'Occupation', 'Role']}
            rows={o.member_npc_ids.filter((id) => isKnown(id) && (!explore || id !== o.leader_npc_id || !!leadEntry?.public)).map((id) => {
              const n = bundle.npcs[id];
              return [
                <Ref id={id} />, <Ref id={n.settlement_id} />, <Known id={id} group="role"><Enum value={n.occupation} /></Known>,
                id === o.leader_npc_id ? <strong>{o.leader_title}</strong> : explore ? <span className="muted">member</span> : <Enum value={n.role_type} />,
              ];
            })}
          />
        </Section>

        <Section title="History" wide>
          <Field label="Founded">{formatYearsAgo(o.founding_date)}</Field>
          <HistoryTable events={o.key_events} />
        </Section>

        <Section title="Flavor">
          <Field label="Rumors">{o.rumors.length > 0 && <RumorTable rumors={o.rumors} />}</Field>
        </Section>

        <ReferencedBy id={o.id} />
      </div>
      <RawJson data={o} />
    </article>
    </KnowScope>
  );
}
