import { POI_SIGNIFICANCES, TREASURE_RARITIES, npcsAt, treasuresAt, treasuresCarriedBy, type PointOfInterest, type Treasure } from '../../generator';
import { Enum, Field, RawJson, Scale, Section, Table } from '../components/Fields';
import { PresenceChip, TreasureTable, VisibilityChip } from '../components/Places';
import { Ref, RefList } from '../components/Ref';
import { Prose, ReferencedBy } from '../components/Shared';
import { useBundle } from '../context';
import { humanize } from '../format';
import { Known, KnowScope, useKnow } from '../know';

export function PoiPage({ poi }: { poi: PointOfInterest }) {
  const { bundle } = useBundle();
  const { isKnown, knows, explore } = useKnow();
  const s = bundle.settlements[poi.settlement_id];
  // In the explorer, someone is listed here only once the player knows where they can be found.
  const present = npcsAt(bundle, poi.id).filter((n) => !explore || knows(n.id, 'location'));
  const own = treasuresAt(bundle, poi.id);
  const carried = present.flatMap((n) => treasuresCarriedBy(bundle, n.id));
  const org = poi.organization_id ? bundle.organizations[poi.organization_id] : null;
  const seat = org ? (org.headquarters_settlement_id === s.id ? 'Headquarters of' : 'Chapter of') : null;

  return (
    <KnowScope id={poi.id}>
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Point of interest · {humanize(poi.type).toLowerCase()} · {poi.significance}</div>
        <h1>{poi.name}</h1>
        <div className="entity-sub">{humanize(poi.type)} in <Ref id={s.id} />, <Ref id={s.country_id} /></div>
        <Prose tagline="" description={poi.description} />
        {explore && knows(poi.id, 'details') && <div className="prose"><p>{poi.description}</p></div>}
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{poi.name}</Field>
          <Field label="Type"><Enum value={poi.type} /></Field>
          <Field label="Significance"><Scale value={poi.significance} scale={POI_SIGNIFICANCES} /></Field>
          <Field label="Settlement"><Ref id={s.id} /></Field>
          <Field label="Owner">{poi.owner_npc_id && <Ref id={poi.owner_npc_id} />}</Field>
          {/* A secret organization's seat stays hidden until the organization is known. */}
          {org && seat && (!explore || isKnown(org.id)) && <Field label={seat}><Ref id={org.id} /></Field>}
          <Field label="Seed"><code>{poi.seed}</code></Field>
        </Section>

        <Section title={`People present (${present.length})`} wide>
          {present.length > 0
            ? (
              <Table
                head={['Person', 'Occupation', 'Why here', 'Because of', 'Presence']}
                rows={present.map((n) => [
                  <Ref id={n.id} />,
                  <Known id={n.id} group="role"><Enum value={n.occupation} /></Known>,
                  <Enum value={n.location_reason} />,
                  n.location_reason_ref ? <Ref id={n.location_reason_ref} icon /> : <span className="muted">-</span>,
                  <PresenceChip isPublic={n.location_public} />,
                ])}
              />
            )
            : <span className="muted">{explore ? 'You do not know who can be found here.' : 'nobody'}</span>}
        </Section>

        <Section title={`Treasures (${explore ? own.filter((t) => isKnown(t.id)).length : own.length})`} wide>
          <TreasureTable treasures={own} />
        </Section>

        <Section title="Carried by people here" wide>
          <TreasureTable treasures={carried} holder />
        </Section>

        <ReferencedBy id={poi.id} />
        <RawJson data={poi} />
      </div>
    </article>
    </KnowScope>
  );
}

export function TreasurePage({ treasure: t }: { treasure: Treasure }) {
  const { bundle } = useBundle();
  const { explore } = useKnow();
  const carrier = 'npc_id' in t.holder ? bundle.npcs[t.holder.npc_id] : null;
  const poiId = 'poi_id' in t.holder ? t.holder.poi_id : carrier!.location_poi_id;
  const poi = bundle.pois[poiId];

  return (
    <KnowScope id={t.id}>
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Treasure · {t.category} · {t.rarity}</div>
        <h1>{t.name}</h1>
        <div className="entity-sub">
          {carrier ? <>{t.embodied ? 'Is' : 'Carried by'} <Ref id={carrier.id} /></> : <>Kept at <Ref id={poi.id} /></>} in <Ref id={poi.settlement_id} />
          {' · '}<VisibilityChip visibility={t.visibility} />
        </div>
        {/* A known treasure's description is fair game in the explorer: it only says what the treasure is. */}
        {explore ? <div className="prose"><p>{t.description}</p></div> : <Prose tagline="" description={t.description} />}
      </header>

      <div className="sections">
        <Section title="Identity">
          <Field label="Name">{t.name}</Field>
          <Field label="Category"><Enum value={t.category} /></Field>
          <Field label="Rarity"><Scale value={t.rarity} scale={TREASURE_RARITIES} /></Field>
          <Field label="Visibility"><VisibilityChip visibility={t.visibility} /></Field>
          <Field label="Seed"><code>{t.seed}</code></Field>
        </Section>

        <Section title="Where">
          <Field label="Holder">{carrier ? <><Ref id={carrier.id} icon /> <span className="muted">({t.embodied ? 'is the treasure' : 'carries it'})</span></> : <Ref id={poi.id} icon />}</Field>
          <Field label="Location"><Ref id={poi.id} />, <Ref id={poi.settlement_id} /></Field>
          <Field label="Guarded by"><RefList ids={t.guarded_by_npc_ids} /></Field>
        </Section>

        <Section title="About">
          <Field label="Subjects">{t.subject_refs.length > 0 && <RefList ids={t.subject_refs} icon />}</Field>
        </Section>

        <ReferencedBy id={t.id} />
        <RawJson data={t} />
      </div>
    </article>
    </KnowScope>
  );
}
