import { entityName } from '../../generator';
import { RUMOR_PHRASE } from '../../generator/content/prose/lexicon';
import { Section, Table } from '../components/Fields';
import { LinkedText } from '../components/LinkedText';
import { Ref } from '../components/Ref';
import { useBundle } from '../context';
import type { Explorer } from './useExplorer';

/** Rumors the player has heard. Never marked true or false: that is for the player to find out. */
export function HeardRumorsPage({ explorer }: { explorer: Explorer }) {
  const { bundle } = useBundle();
  const rumors = explorer.knowledge.rumors;
  return (
    <article className="entity-page">
      <header className="entity-header">
        <h1>Heard rumors</h1>
        <p className="muted">Unverified. Some of these are true.</p>
      </header>
      <Section title={`Rumors (${rumors.length})`} wide>
        <Table
          head={['Rumor', 'About', 'Heard from']}
          rows={[...rumors].reverse().map((h) => [
            `${entityName(bundle, h.rumor.subject_ref)} ${RUMOR_PHRASE[h.rumor.claim_type]}${h.rumor.target_ref ? ` (involving ${entityName(bundle, h.rumor.target_ref)})` : ''}`,
            <Ref id={h.rumor.subject_ref} icon />,
            <Ref id={h.heard_from} />,
          ])}
        />
      </Section>
    </article>
  );
}

/** Every exchange so far, newest first. */
export function JournalPage({ explorer }: { explorer: Explorer }) {
  const log = explorer.knowledge.log;
  const knownIds = Object.keys(explorer.knowledge.entities);
  return (
    <article className="entity-page">
      <header className="entity-header">
        <h1>Journal</h1>
        <p className="muted">{log.length} questions asked of {new Set(log.map((e) => e.npc_id)).size} people.</p>
      </header>
      <Section title="Conversations" wide>
        {log.length === 0 && <span className="muted">Nothing yet. Find someone to talk to.</span>}
        {[...log].reverse().map((e) => (
          <div key={e.turn} className="journal-entry">
            <div><Ref id={e.npc_id} /> <span className="muted">· {e.learned.length} facts learned</span></div>
            <div className="msg msg-player">{e.question}</div>
            <div className="msg msg-npc">“<LinkedText text={e.answer} ids={knownIds} />”</div>
          </div>
        ))}
      </Section>
    </article>
  );
}
