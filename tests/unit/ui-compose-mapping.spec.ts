/**
 * The ui-compose mapping table is the skill's product, and it is a copy of facts the
 * component references own: which contract rows exist, and what shape every Props
 * entry takes. This pins the copy to its source, so a Props entry added to any
 * component fails here until one mapping rule covers it - and so the counts the
 * reference states in prose are measured from the contracts, never typed on trust.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { skillKind } from '../../scripts/skill-kind.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SKILLS_DIR = resolve(ROOT, 'skills');
const reference = readFileSync(resolve(SKILLS_DIR, 'ui-compose/references/ui-compose.md'), 'utf8');

/** The seven contract rows tests/objective.spec.ts requires of every component. */
const CONTRACT_ROWS = ['Element', 'Role', 'Props', 'Slots', 'Variants', 'Behaviour', 'WCAG'];
const QUALIFIER = 'Qualifier line';
const PROPS_RULES = ['choice', 'fixed', 'boolean', 'string', 'reference'] as const;
type PropsRule = (typeof PROPS_RULES)[number];

/** Every component skill, so a seventh contract table is measured the day it lands. */
const components = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && skillKind(join(SKILLS_DIR, e.name)) === 'component')
  .map((e) => e.name)
  .sort();

interface PropsEntry {
  skill: string;
  name: string;
  type: string;
  fallback: string;
}

/** The Props row of one contract, split into its `name — type — default` entries. */
function propsEntries(skill: string): PropsEntry[] {
  const source = readFileSync(join(SKILLS_DIR, skill, 'references', `${skill}.md`), 'utf8');
  const row = source.match(/^\| Props \| (.+) \|$/m);
  expect(row, `${skill} has no Props row`).not.toBeNull();
  return row![1].split('; ').map((entry) => {
    const [name, type, fallback] = entry.split(' — ');
    expect(fallback, `${skill}: "${entry}" is not name — type — default`).toBeDefined();
    return { skill, name, type, fallback };
  });
}

/**
 * The five Props rules exactly as the mapping table states them, each an independent
 * predicate over the entry's type and default, so an entry two rules both claim, or
 * none claims, is caught rather than resolved by whichever rule is checked first.
 */
const quoted = (type: string) => type.match(/"[^"]*"/g)?.length ?? 0;
const RULE: Record<PropsRule, (e: PropsEntry) => boolean> = {
  choice: (e) => quoted(e.type) > 1,
  fixed: (e) => quoted(e.type) === 1 && /^required\b/.test(e.fallback),
  boolean: (e) =>
    /\bboolean attribute\b/.test(e.type) || (quoted(e.type) === 1 && /^absent\b/.test(e.fallback)),
  string: (e) => e.type === 'string',
  reference: (e) => /\bid reference\b/.test(e.type) || /="<id>"/.test(e.name),
};
const rulesFor = (e: PropsEntry): PropsRule[] => PROPS_RULES.filter((rule) => RULE[rule](e));

const entries = components.flatMap(propsEntries);

/** The rows under "## Mapping table": the contract row each maps and the Props rule it names. */
const section = reference.split('\n## Mapping table\n')[1]?.split('\n## ')[0] ?? '';
const rows = section.split('\n').filter((line) => /^\| (?:`|Qualifier line)/.test(line));
const mapped = rows.map((row) => {
  const cell = row.split('|')[1].trim();
  const contractRow = cell.startsWith(QUALIFIER) ? QUALIFIER : cell.match(/^`([^`]+)`/)?.[1];
  const rule = cell.match(/\b(choice|fixed|boolean|string|reference)\b/)?.[1] as PropsRule | undefined;
  return { cell, contractRow, rule };
});

describe('the mapping table is a faithful copy of the component contracts', () => {
  it('there are component contracts with Props entries to map', () => {
    expect(components.length).toBeGreaterThan(0);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('has ten rows: one per mapped contract row, five for Props, one for the qualifier line', () => {
    expect(rows.length).toBe(10);
  });

  it('every row names one of the seven contract rows or the qualifier line', () => {
    for (const { cell, contractRow } of mapped) {
      expect(contractRow, `row "${cell}" names no contract row`).toBeDefined();
      expect([...CONTRACT_ROWS, QUALIFIER], `row "${cell}"`).toContain(contractRow);
    }
  });

  it('maps each covered contract row exactly once, and leaves Role and WCAG to the Element row and the browser suite', () => {
    // A bare row count would let one row be deleted and another duplicated in its place.
    const names = mapped.map((m) => m.contractRow);
    for (const row of ['Element', 'Slots', 'Variants', 'Behaviour', QUALIFIER]) {
      expect(names.filter((n) => n === row), `${row} rows`).toHaveLength(1);
    }
    expect(names.filter((n) => n === 'Props'), 'Props rows').toHaveLength(5);
    for (const row of ['Role', 'WCAG']) expect(names, `${row} is mapped by name`).not.toContain(row);
  });

  it('the Props rows name each of the five rules exactly once, and no other row names one', () => {
    const named = mapped.filter((m) => m.contractRow === 'Props').map((m) => m.rule);
    expect([...named].sort()).toEqual([...PROPS_RULES].sort());
    for (const m of mapped.filter((m) => m.contractRow !== 'Props')) {
      expect(m.rule, `row "${m.cell}" names a Props rule`).toBeUndefined();
    }
  });

  it('every Props entry in every shipped contract is covered by exactly one rule', () => {
    const wrong = entries
      .map((e) => ({ ...e, rules: rulesFor(e) }))
      .filter((e) => e.rules.length !== 1)
      .map((e) => `${e.skill} ${e.name}: ${e.rules.join(', ') || 'no rule'}`);
    expect(wrong).toEqual([]);
  });
});

describe('the counts the reference states are the measured ones', () => {
  /** Prose wraps at 88 columns, so the sentences are matched with their newlines folded. */
  const prose = reference.replace(/\s+/g, ' ');
  const byRule = (rule: PropsRule) => entries.filter((e) => rulesFor(e)[0] === rule).length;

  it('the Scope paragraph states the entry count, the table count and one count per rule', () => {
    const counts = prose.match(
      /covers the (\d+) Props entries across the (\d+) shipped contract tables: (\d+) choices, (\d+) fixed values?, (\d+) booleans, (\d+) strings and (\d+) id references/,
    );
    expect(counts, 'Scope paragraph no longer states the counts').not.toBeNull();
    const [, total, tables, choice, fixed, boolean, string, reference] = counts!.map(Number);
    expect(tables).toBe(components.length);
    expect(total).toBe(entries.length);
    expect({ choice, fixed, boolean, string, reference }).toEqual({
      choice: byRule('choice'),
      fixed: byRule('fixed'),
      boolean: byRule('boolean'),
      string: byRule('string'),
      reference: byRule('reference'),
    });
    expect(total).toBe(choice + fixed + boolean + string + reference);
  });

  it('the worked example states the button and dialog entry counts the contracts hold', () => {
    for (const [component, phrase] of [['ui-button', 'The button, as a props table'], ['ui-dialog', 'The dialog, as a parts tree']]) {
      const stated = prose.match(new RegExp(`${phrase}\\. Its contract has (\\d+) Props entries`));
      expect(stated, `no entry count for ${component}`).not.toBeNull();
      expect(Number(stated![1])).toBe(entries.filter((e) => e.skill === component).length);
    }
  });
});
