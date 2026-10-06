import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = [join(__dirname, '..', 'src', 'generator'), join(__dirname, '..', 'src', 'explore')];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const FORBIDDEN: [RegExp, string][] = [
  [/Math\.random/, 'Math.random'],
  [/Date\.now|new Date\(/, 'clock access'],
  [/from ['"]react/, 'React import'],
  [/\bdocument\.|\bwindow\.|localStorage|navigator\./, 'browser API'],
  [/from ['"](\.\.\/)+app/, 'import from the app'],
];

describe('generator purity', () => {
  it('has no UI, DOM, clock or Math.random dependencies', () => {
    const problems: string[] = [];
    for (const file of ROOTS.flatMap(files)) {
      const src = readFileSync(file, 'utf8');
      for (const [re, label] of FORBIDDEN) if (re.test(src)) problems.push(`${file}: ${label}`);
    }
    expect(problems).toEqual([]);
  });
});
