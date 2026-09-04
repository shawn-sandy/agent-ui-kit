/**
 * docs/properties.md is generated from the component references by
 * scripts/build-properties.mjs. A generated file nothing checks goes stale on the first
 * new property, so this pins the committed file to the generator's output byte for byte.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const DOC = resolve(ROOT, 'docs/properties.md');

describe('docs/properties.md is the generator output', () => {
  it('exists', () => {
    expect(existsSync(DOC), 'run: node scripts/build-properties.mjs').toBe(true);
  });

  it('equals render() from scripts/build-properties.mjs byte for byte', async () => {
    // Dynamic import so a missing generator fails this case, not the whole file.
    const { render } = await import('../../scripts/build-properties.mjs');
    expect(readFileSync(DOC, 'utf8')).toBe(render());
  });
});
