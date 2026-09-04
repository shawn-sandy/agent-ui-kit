/**
 * The ui-theme mapping table is the skill's product, and it is a copy of facts the
 * component references own: which --auk-* properties exist, and which of them carry
 * brand. This pins the copy to its source, so a colour, radius or font-family
 * property added to any component fails here until the table names it - and so the
 * counts the reference states in prose are measured, never typed on trust.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readProperties } from '../../scripts/auk-properties.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const SKILLS_DIR = resolve(ROOT, 'skills');
const reference = readFileSync(resolve(SKILLS_DIR, 'ui-theme/references/ui-theme.md'), 'utf8');

const COLOUR = /-(?:color|bg|box-shadow)$/;

/**
 * Every --auk-* property the component references read, through the same parser that
 * generates docs/properties.md, so the catalog and this table can never disagree.
 * Brand-bearing is decided there: a colour, a corner radius or a type family.
 */
const properties = readProperties(SKILLS_DIR);
const shipped = new Set(properties.map((p) => p.property));
const brandBearing = properties.filter((p) => p.brand).map((p) => p.property).sort();

/** The table rows under "## Mapping table", and every property their Properties cell names. */
const section = reference.split('\n## Mapping table\n')[1]?.split('\n## ')[0] ?? '';
const rows = section.split('\n').filter((line) => /^\| [a-z][a-z-]* \| /.test(line));
const mapped = rows.flatMap((row) => [...row.split('|')[3].matchAll(/`(--auk-[a-z0-9-]+)`/g)].map((m) => m[1]));

describe('the mapping table is a faithful copy of the component references', () => {
  it('the references declare brand-bearing properties to map', () => {
    expect(shipped.size).toBeGreaterThan(0);
    expect(brandBearing.length).toBeGreaterThan(0);
  });

  it('has twenty-one role rows, each naming at least one property', () => {
    expect(rows.length).toBe(21);
    for (const row of rows) expect(row, 'row names no property').toMatch(/`--auk-/);
  });

  it('every property in the table exists in a shipped component reference', () => {
    expect(mapped.filter((p) => !shipped.has(p))).toEqual([]);
  });

  it('names each property exactly once', () => {
    expect(new Set(mapped).size).toBe(mapped.length);
  });

  it('maps exactly the brand-bearing properties - no size, spacing, duration or placement', () => {
    expect([...mapped].sort()).toEqual(brandBearing);
  });
});

describe('the counts the reference states are the measured ones', () => {
  const counts = reference.match(
    /the (\d+) brand-bearing properties: (\d+) colours, (\d+) corner radii and (\d+)\nfont families\. The other (\d+) properties/,
  );

  it('the Scope paragraph states its counts', () => {
    expect(counts, 'Scope paragraph no longer states the counts').not.toBeNull();
  });

  it('total, colour, radius, font-family and remainder all match the references', () => {
    const [, total, colour, radius, font, rest] = counts!.map(Number);
    expect(total).toBe(brandBearing.length);
    expect(colour).toBe(brandBearing.filter((p) => COLOUR.test(p)).length);
    expect(radius).toBe(brandBearing.filter((p) => p.endsWith('-radius')).length);
    expect(font).toBe(brandBearing.filter((p) => p.endsWith('-font-family')).length);
    expect(rest).toBe(shipped.size - brandBearing.length);
    expect(total).toBe(colour + radius + font);
  });

  it('the intro line under the table agrees with the Scope paragraph', () => {
    expect(section).toMatch(new RegExp(`Twenty-one roles onto ${brandBearing.length} properties`));
  });
});
