/**
 * The skills CLI offers every SKILL.md it finds to installers, so a maintainer-only
 * skill that does not declare `metadata.internal: true` leaks into the public install
 * list. Walks the whole repository so a skill dropped into any scanned directory is
 * caught, and reuses the packaged-skill boundary from tests/lib/frontmatter.ts so the
 * two tests can never disagree about which skills are public.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { isPackagedSkill } from '../lib/frontmatter.js';

const ROOT = resolve(import.meta.dirname, '../..');

/** Never reaches installers: dependencies, deliberately broken fixtures, git internals, sibling worktrees. */
const SKIP = /^(?:node_modules|tests\/fixtures|\.git|\.claude\/worktrees)(?:\/|$)/;

const skills = readdirSync(ROOT, { recursive: true })
  .map((p) => String(p).replace(/\\/g, '/'))
  .filter((p) => p.endsWith('/SKILL.md') && !SKIP.test(p));

const isInternal = (p: string) =>
  matter(readFileSync(resolve(ROOT, p), 'utf8')).data?.metadata?.internal === true;

describe('the skills CLI sees exactly the packaged skills', () => {
  it('the walk found skills on both sides of the boundary', () => {
    expect(skills.some(isPackagedSkill)).toBe(true);
    expect(skills.some((p) => !isPackagedSkill(p))).toBe(true);
  });

  it('every skill outside skills/ declares metadata.internal true', () => {
    expect(skills.filter((p) => !isPackagedSkill(p) && !isInternal(p))).toEqual([]);
  });

  it('no packaged skill hides itself from installers', () => {
    expect(skills.filter((p) => isPackagedSkill(p) && isInternal(p))).toEqual([]);
  });
});

describe('the README advertises the skills CLI install', () => {
  it('carries the exact install command', () => {
    expect(readFileSync(resolve(ROOT, 'README.md'), 'utf8')).toContain('npx skills add shawn-sandy/agent-ui-skills');
  });
});
