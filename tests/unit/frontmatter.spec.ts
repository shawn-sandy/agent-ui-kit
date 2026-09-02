/**
 * Proves this repo's frontmatter validator. Every rule is asserted against a fixture
 * that breaks exactly that rule, so a passing test proves the rule can actually fail
 * - a validator that never rejects anything passes a naive suite trivially.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateSkill, NAME_PATTERN, STANDARD_KEYS, MAX_DESCRIPTION } from '../lib/frontmatter.js';

const AT = '/repo/skills/button/SKILL.md';

/** Build a SKILL.md with the given frontmatter lines. */
const skill = (lines: string[]) => `---\n${lines.join('\n')}\n---\n\n# Button\n\nBody.\n`;

const VALID = ['name: button', 'description: Use when building a button that performs an action.'];

const rulesOf = (source: string, at = AT) => validateSkill(source, at).map((v) => v.rule);

it('accepts a conforming skill', () => {
  expect(validateSkill(skill(VALID), AT)).toEqual([]);
});

describe('each rule rejects a fixture that breaks exactly it', () => {
  it('frontmatter-present: no frontmatter at all', () => {
    expect(rulesOf('# Button\n\nBody.\n')).toContain('frontmatter-present');
  });

  it('name-required: name missing', () => {
    expect(rulesOf(skill(['description: Use when building a button.']))).toContain('name-required');
  });

  it('name-pattern: consecutive hyphens', () => {
    expect(rulesOf(skill(['name: icon--button', ...VALID.slice(1)]), '/repo/skills/icon--button/SKILL.md'))
      .toContain('name-pattern');
  });

  it('name-pattern: leading hyphen', () => {
    expect(rulesOf(skill(['name: -button', ...VALID.slice(1)]), '/repo/skills/-button/SKILL.md'))
      .toContain('name-pattern');
  });

  it('name-pattern: trailing hyphen', () => {
    expect(rulesOf(skill(['name: button-', ...VALID.slice(1)]), '/repo/skills/button-/SKILL.md'))
      .toContain('name-pattern');
  });

  it('name-pattern: uppercase', () => {
    expect(rulesOf(skill(['name: Button', ...VALID.slice(1)]), '/repo/skills/Button/SKILL.md'))
      .toContain('name-pattern');
  });

  it('name-length: over 64 characters', () => {
    const long = 'a'.repeat(65);
    expect(rulesOf(skill([`name: ${long}`, ...VALID.slice(1)]), `/repo/skills/${long}/SKILL.md`))
      .toContain('name-length');
  });

  it('name-matches-directory: name disagrees with its folder', () => {
    expect(rulesOf(skill(['name: alert', ...VALID.slice(1)]))).toContain('name-matches-directory');
  });

  it('description-required: description missing', () => {
    expect(rulesOf(skill(['name: button']))).toContain('description-required');
  });

  it('description-required: description empty', () => {
    expect(rulesOf(skill(['name: button', 'description: "   "']))).toContain('description-required');
  });

  it('description-length: over 1024 characters', () => {
    const long = 'a'.repeat(MAX_DESCRIPTION + 1);
    expect(rulesOf(skill(['name: button', `description: ${long}`]))).toContain('description-length');
  });

  it('description-third-person: first person', () => {
    expect(rulesOf(skill(['name: button', 'description: I build buttons for pages.'])))
      .toContain('description-third-person');
  });

  it('description-third-person: second person', () => {
    expect(rulesOf(skill(['name: button', 'description: Use when your page needs a button.'])))
      .toContain('description-third-person');
  });

  it('standard-keys-only: disable-model-invocation', () => {
    expect(rulesOf(skill([...VALID, 'disable-model-invocation: true']))).toContain('standard-keys-only');
  });

  it('standard-keys-only: hint', () => {
    expect(rulesOf(skill([...VALID, 'hint: call this by name']))).toContain('standard-keys-only');
  });

  it('parseable: malformed YAML', () => {
    expect(rulesOf('---\nname: [button\n---\n\n# Button\n')).toContain('parseable');
  });
});

describe('the validator does not over-reject', () => {
  it('allows every optional standard key', () => {
    const source = skill([...VALID, 'license: MIT', 'allowed-tools: Read, Glob', 'metadata:\n  tier: core']);
    expect(validateSkill(source, AT)).toEqual([]);
  });

  it('allows a description at exactly the limit', () => {
    const exact = 'Use when building a control. '.repeat(1).padEnd(MAX_DESCRIPTION, 'x');
    expect(rulesOf(skill(['name: button', `description: ${exact}`]))).not.toContain('description-length');
  });

  it('allows hyphenated names', () => {
    expect(validateSkill(skill(['name: icon-button', ...VALID.slice(1)]), '/repo/skills/icon-button/SKILL.md'))
      .toEqual([]);
  });
});

describe('exported constants match the standard', () => {
  it('lists exactly the standard keys', () => {
    expect([...STANDARD_KEYS]).toEqual(['name', 'description', 'license', 'allowed-tools', 'metadata']);
  });

  it('name pattern rejects what the standard rejects', () => {
    expect(NAME_PATTERN.test('button')).toBe(true);
    expect(NAME_PATTERN.test('icon-button')).toBe(true);
    expect(NAME_PATTERN.test('icon--button')).toBe(false);
    expect(NAME_PATTERN.test('Button')).toBe(false);
    expect(NAME_PATTERN.test('button_group')).toBe(false);
  });
});

describe('the broken fixture that proves the gate', () => {
  it('rejects tests/fixtures/bad-skill', () => {
    const path = resolve(import.meta.dirname, '../fixtures/bad-skill/SKILL.md');
    const rules = validateSkill(readFileSync(path, 'utf8'), path);
    expect(rules.map((v) => v.rule)).toEqual(
      expect.arrayContaining(['standard-keys-only', 'name-matches-directory']),
    );
  });
});
