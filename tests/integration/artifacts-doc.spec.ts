/**
 * docs/artifacts.md is the list of every claude.ai artifact published from this
 * repo. The repo already records some of those URLs elsewhere - plan frontmatter
 * and CLAUDE.md - so any URL recorded there and missing from the list is drift.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';

const ROOT = resolve(import.meta.dirname, '../..');
const ARTIFACT_URL = /https:\/\/claude\.ai\/code\/artifact\/[0-9a-f-]+/;

const doc = readFileSync(resolve(ROOT, 'docs/artifacts.md'), 'utf8');
const plansDir = resolve(ROOT, 'docs/plans');
const plans = readdirSync(plansDir).filter((f) => f.endsWith('.md')).sort();

/** Frontmatter keys that carry an artifact URL. */
const URL_KEYS = ['artifact-url', 'design'] as const;

describe('docs/artifacts.md lists every artifact URL the repo records', () => {
  it('has at least one plan to check against', () => {
    expect(plans.length).toBeGreaterThan(0);
  });

  for (const file of plans) {
    const { data } = matter(readFileSync(resolve(plansDir, file), 'utf8'));
    for (const key of URL_KEYS) {
      const url = data[key];
      if (typeof url !== 'string' || !ARTIFACT_URL.test(url)) continue;
      it(`${file} ${key}`, () => {
        expect(doc).toContain(url);
      });
    }
  }

  it('CLAUDE.md overview artifact', () => {
    const urls = readFileSync(resolve(ROOT, 'CLAUDE.md'), 'utf8').match(new RegExp(ARTIFACT_URL, 'g')) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(doc).toContain(url);
  });
});
