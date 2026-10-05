import { NAME_STYLES } from '../../generator/content';
import type { Language, Religion, Species } from '../../generator';
import { Enum, EnumList, Field, RawJson, Section, Table } from '../components/Fields';
import { Ref, RefList } from '../components/Ref';
import { ReferencedBy } from '../components/Shared';
import { useBundle } from '../context';
import { formatTemp } from '../format';

/** Where a species, language or faith shows up: planet, countries and settlements with their shares. */
function Presence({ id, kind }: { id: string; kind: 'species' | 'language' | 'religion' }) {
  const { bundle } = useBundle();
  const holders = [
    ...Object.values(bundle.countries),
    ...Object.values(bundle.settlements),
  ];
  const rows = holders.flatMap((h) => {
    if (kind === 'species') {
      const s = h.species.find((x) => x.species_id === id);
      return s ? [[<Ref id={h.id} icon />, `${(s.share * 100).toFixed(0)}%`]] : [];
    }
    if (kind === 'religion') {
      const r = h.religions_or_ideologies.find((x) => x.religion_id === id);
      return r ? [[<Ref id={h.id} icon />, `${(r.share * 100).toFixed(0)}%`]] : [];
    }
    const i = h.languages.indexOf(id);
    return i >= 0 ? [[<Ref id={h.id} icon />, i === 0 ? 'primary' : 'secondary']] : [];
  });
  return (
    <Section title={`Present in (${rows.length})`} wide>
      <Table head={['Where', kind === 'language' ? 'Status' : 'Share']} rows={rows} />
    </Section>
  );
}

export function SpeciesPage({ species: s }: { species: Species }) {
  const { bundle } = useBundle();
  const share = bundle.planet.species.find((x) => x.species_id === s.id)?.share ?? 0;
  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Species · {s.origin}</div>
        <h1>{s.name}</h1>
        <div className="entity-sub">{s.plural_name} · {(share * 100).toFixed(0)}% of the planet</div>
      </header>
      <div className="sections">
        <Section title="Biology">
          <Field label="Origin"><Enum value={s.origin} /></Field>
          <Field label="Biology"><Enum value={s.biology} /></Field>
          <Field label="Body plan"><Enum value={s.body_plan} /></Field>
          <Field label="Gender system"><Enum value={s.gender_system} /></Field>
          <Field label="Lifespan">{s.lifespan_years} years</Field>
          <Field label="Comfortable at">{formatTemp(s.comfort_temperature[0])} to {formatTemp(s.comfort_temperature[1])}</Field>
          <Field label="Breathes"><EnumList values={s.breathes} /></Field>
          <Field label="Content key">{s.content_key ? <code>{s.content_key}</code> : <span className="muted">generated for this planet</span>}</Field>
        </Section>
        <Section title="Languages">
          <RefList ids={Object.values(bundle.languages).filter((l) => l.speaker_species_ids.includes(s.id)).map((l) => l.id)} />
        </Section>
        <Presence id={s.id} kind="species" />
        <ReferencedBy id={s.id} />
      </div>
      <RawJson data={s} />
    </article>
  );
}

export function LanguagePage({ language: l }: { language: Language }) {
  const ph = l.phonology;
  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Language · {l.origin}</div>
        <h1>{l.name}</h1>
        <div className="entity-sub">{NAME_STYLES[l.style].label}: {NAME_STYLES[l.style].description}</div>
      </header>
      <div className="sections">
        <Section title="Language">
          <Field label="Style"><Enum value={l.style} /></Field>
          <Field label="Origin"><Enum value={l.origin} /></Field>
          <Field label="Speakers"><RefList ids={l.speaker_species_ids} /></Field>
        </Section>
        <Section title="Phonology">
          <Field label="Onsets"><code>{ph.onsets.map((o) => o.value || '∅').join(' ')}</code></Field>
          <Field label="Nuclei"><code>{ph.nuclei.map((o) => o.value).join(' ')}</code></Field>
          <Field label="Codas"><code>{ph.codas.map((o) => o.value || '∅').join(' ')}</code></Field>
          <Field label="Place suffixes"><code>{ph.place_suffixes.join(' ')}</code></Field>
          <Field label="Family suffixes"><code>{ph.family_suffixes.join(' ')}</code></Field>
        </Section>
        <Presence id={l.id} kind="language" />
        <ReferencedBy id={l.id} />
      </div>
      <RawJson data={l} />
    </article>
  );
}

export function ReligionPage({ religion: r }: { religion: Religion }) {
  return (
    <article className="entity-page">
      <header className="entity-header">
        <div className="entity-kind">Faith · {r.kind.replace(/_/g, ' ')}</div>
        <h1>{r.name}</h1>
        <div className="entity-sub">{r.focus_name ? <>Centered on <strong>{r.focus_name}</strong> · </> : null}{r.origin}</div>
      </header>
      <div className="sections">
        <Section title="Faith">
          <Field label="Kind"><Enum value={r.kind} /></Field>
          <Field label="Tenets"><EnumList values={r.tenets} /></Field>
          <Field label="Focus">{r.focus_name}</Field>
          <Field label="Origin"><Enum value={r.origin} /></Field>
          <Field label="Church">{r.church_org_id ? <Ref id={r.church_org_id} /> : <span className="muted">none</span>}</Field>
        </Section>
        <Presence id={r.id} kind="religion" />
        <ReferencedBy id={r.id} />
      </div>
      <RawJson data={r} />
    </article>
  );
}
