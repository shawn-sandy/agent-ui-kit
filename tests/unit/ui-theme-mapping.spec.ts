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

  it('has twenty-three role rows, each naming at least one property', () => {
    expect(rows.length).toBe(23);
    for (const row of rows) expect(row, 'row names no property').toMatch(/`--auk-/);
  });

  it('no role chains a text colour to its own background', () => {
    // Binding one role to one value paints every property in its row the same colour.
    // A row that holds both the `-bg` and the `-color` of one component and qualifier
    // therefore blanks that control's text the moment a project binds the role - which
    // is exactly what `muted` and `inverse` did before on-muted and on-inverse existed.
    const offenders = rows
      .map((row) => {
        const role = row.split('|')[1].trim();
        const names = [...row.split('|')[3].matchAll(/`(--auk-[a-z0-9-]+)`/g)].map((m) => m[1]);
        const stems = (suffix: RegExp) => names.filter((n) => suffix.test(n)).map((n) => n.replace(suffix, ''));
        const bg = new Set(stems(/-bg$/));
        const clash = stems(/-color$/).filter((stem) => bg.has(stem));
        return clash.length ? `${role}: ${clash.join(', ')}` : null;
      })
      .filter(Boolean);
    expect(offenders).toEqual([]);
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
    expect(section).toMatch(new RegExp(`Twenty-three roles onto ${brandBearing.length} properties`));
  });
});

describe('the crosswalk is data an agent can act on', () => {
  // Every cell is a name an agent will bind a role to, so a cell that is not a custom
  // property, or a row that is not a role, would emit a broken binding. The date says
  // when the cells were last read off each system's live documentation.
  const crosswalk = reference.split('\n## Crosswalk\n')[1]?.split('\n## ')[0] ?? '';
  const roles = new Set(rows.map((row) => row.split('|')[1].trim()));
  const tableRows = crosswalk.split('\n').filter((line) => line.startsWith('| '));
  const header = tableRows[0] ?? '';
  const body = tableRows.slice(2);

  it('the section exists and its intro line carries a verification date', () => {
    expect(crosswalk, 'no "## Crosswalk" section').not.toBe('');
    expect(crosswalk.split('\n|')[0]).toMatch(/verified 2026-\d\d-\d\d/);
  });

  it('the header row names at least four systems', () => {
    const systems = header.split('|').slice(2, -1).map((c) => c.trim()).filter(Boolean);
    expect(systems.length).toBeGreaterThanOrEqual(4);
  });

  it('every row is a role from the mapping table', () => {
    expect(body.length).toBeGreaterThan(0);
    expect(body.map((row) => row.split('|')[1].trim()).filter((r) => !roles.has(r))).toEqual([]);
  });

  it('every other cell is blank or one backticked custom property', () => {
    const bad = body.flatMap((row) =>
      row.split('|').slice(2, -1).map((c) => c.trim()).filter((c) => c !== '' && !/^`--[a-z0-9-]+`$/i.test(c)),
    );
    expect(bad).toEqual([]);
  });

  it('a Sources line under the table names the pages read', () => {
    expect(crosswalk).toMatch(/^Sources: .*https:\/\//m);
  });
});
