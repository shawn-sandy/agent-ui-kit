/**
 * Proves the gate partition. A workflow skill is exempt from the component gates by
 * an explicit marker and nothing else, so every way the marker can be missing or
 * unreadable has to land on "component" - the strict side.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_KIND, kindOf, skillKind } from '../../scripts/skill-kind.mjs';

const ROOT = resolve(import.meta.dirname, '../..');

/** Build a SKILL.md with the given frontmatter lines. */
const skill = (lines: string[]) => `---\n${lines.join('\n')}\n---\n\n# Skill\n\nBody.\n`;

const VALID = ['name: ui-thing', 'description: A skill that does a thing.'];

describe('kindOf reads the marker and defaults to component', () => {
  it('returns the declared kind', () => {
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: workflow']))).toBe('workflow');
  });

  it('defaults when metadata carries no kind', () => {
    expect(kindOf(skill([...VALID, 'metadata:', '  tier: core']))).toBe('component');
  });

  it('defaults when there is no metadata at all', () => {
    expect(kindOf(skill(VALID))).toBe('component');
  });

  it('defaults when the kind is not a string', () => {
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: true']))).toBe('component');
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: ""']))).toBe('component');
  });

  it('treats any kind other than workflow as component, so a typo cannot exempt a skill', () => {
    // The gates test kind === 'component', so an unrecognised value that came back
    // verbatim would skip every strict assertion. Only the exact marker is exempt.
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: Workflow']))).toBe('component');
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: plugin']))).toBe('component');
    expect(kindOf(skill([...VALID, 'metadata:', '  kind: workflow ']))).toBe('workflow');
  });

  it('defaults when the frontmatter does not parse', () => {
    expect(kindOf('---\nmetadata: [kind: workflow\n---\n\n# Skill\n')).toBe('component');
  });

  it('defaults when there is no frontmatter', () => {
    expect(kindOf('# Skill\n\nBody.\n')).toBe('component');
  });

  it('the default is the strict side', () => {
    expect(DEFAULT_KIND).toBe('component');
  });
});

describe('skillKind reads a skill directory', () => {
  it('a shipped component skill declares no kind and is a component', () => {
    expect(skillKind(resolve(ROOT, 'skills/ui-button'))).toBe('component');
  });

  it('a directory with no SKILL.md is a component', () => {
    expect(skillKind(resolve(ROOT, 'tests/fixtures/split-component'))).toBe('component');
  });

  it('a directory that does not exist is a component', () => {
    expect(skillKind(resolve(ROOT, 'tests/fixtures/no-such-skill'))).toBe('component');
  });
});

describe('the broken fixture that proves the gate', () => {
  it('rejects tests/fixtures/workflow-skill: the marker exempts it from the component gates, not from evals', () => {
    const dir = resolve(ROOT, 'tests/fixtures/workflow-skill');
    expect(skillKind(dir)).toBe('workflow');
    // The same lookup tests/objective.spec.ts makes for every skill it walks. The
    // fixture ships without one, so the kept evals gate would fail it on arrival.
    expect(existsSync(resolve(ROOT, 'evals', 'workflow-skill.json'))).toBe(false);
  });
});
