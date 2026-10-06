import { Fragment, useMemo } from 'react';
import { entityName, kindOf, type PlanetBundle } from '../../generator';
import { useBundle } from '../context';
import { Ref } from './Ref';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Names match exactly, except that the first letter may be capitalized or not ("the Guild" / "The Guild"). */
const keyOf = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const pattern = (key: string) => {
  const c = key.charAt(0);
  return (c.toUpperCase() !== c ? `[${c}${c.toUpperCase()}]` : escape(c)) + escape(key.slice(1));
};

/** Every way an entity's name can appear in running text, most specific first. */
function namesOf(b: PlanetBundle, id: string): string[] {
  const name = entityName(b, id);
  const out = [name];
  // "the Cloister of Babu" may open a sentence, or be written without its article.
  if (/^the /i.test(name)) out.push(name.slice(4));
  if (kindOf(id) === 'species') out.push(b.species[id].plural_name);
  return out;
}

interface Matcher { re: RegExp; byName: Map<string, string> }

function buildMatcher(b: PlanetBundle, ids: readonly string[]): Matcher | null {
  const byName = new Map<string, string>();
  for (const id of ids) {
    for (const n of namesOf(b, id)) {
      const key = keyOf(n);
      if (n.length >= 3 && !byName.has(key)) byName.set(key, id);
    }
  }
  if (byName.size === 0) return null;
  // Longest names first, so "New Varn" wins over "Varn". Whole words only.
  const alts = [...byName.keys()].sort((a, c) => c.length - a.length).map(pattern);
  return { re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts.join('|')})(?![\\p{L}\\p{N}])`, 'gu'), byName };
}

/** Text with the names of the given entities turned into links. */
export function LinkedText({ text, ids }: { text: string; ids: readonly string[] }) {
  const { bundle } = useBundle();
  const m = useMemo(() => buildMatcher(bundle, ids), [bundle, ids]);
  if (!m) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const hit of text.matchAll(m.re)) {
    const id = m.byName.get(keyOf(hit[0]));
    if (!id) continue;
    parts.push(<Fragment key={last}>{text.slice(last, hit.index)}</Fragment>);
    parts.push(<Ref key={`r${hit.index}`} id={id} label={hit[0]} />);
    last = hit.index! + hit[0].length;
  }
  parts.push(<Fragment key="end">{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
