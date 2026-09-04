/**
 * The role layer's contract, in its two generated forms: skills/ui-theme/references/
 * auk.tokens.json and auk-roles.css, both written by scripts/build-tokens.mjs from the
 * component references and the mapping table in ui-theme.md. A generated file nothing
 * checks goes stale on the first new property, so both are pinned to the generator's
 * output byte for byte - and the promises the contract makes (every brand property
 * aliases one role, every measured property states a floor or none, no role name is a
 * component slug, the stylesheet chains exactly the brand set inside the auk layer)
 * each get an assertion that fails when it is broken.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readProperties } from '../../scripts/auk-properties.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const TOKENS = resolve(ROOT, 'skills/ui-theme/references/auk.tokens.json');
const ROLES = resolve(ROOT, 'skills/ui-theme/references/auk-roles.css');
const EXT = 'com.github.shawn-sandy.agent-ui-skills';

const properties = readProperties(resolve(ROOT, 'skills'));
const brandBearing = properties.filter((p) => p.brand).map((p) => p.property).sort();
const slugs = readdirSync(resolve(ROOT, 'skills'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name.replace(/^ui-/, ''));

type Token = { $type?: string; $value: unknown; $extensions?: Record<string, Record<string, unknown>> };

/** Every token under the file's groups, with its dotted path. A token is an object carrying $value. */
function walk(node: Record<string, unknown>, path: string[] = [], out: { path: string; token: Token }[] = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$') || !value || typeof value !== 'object') continue;
    if ('$value' in value) out.push({ path: [...path, key].join('.'), token: value as Token });
    else walk(value as Record<string, unknown>, [...path, key], out);
  }
  return out;
}

const tokens = existsSync(TOKENS) ? walk(JSON.parse(readFileSync(TOKENS, 'utf8'))) : [];
const ext = (t: { token: Token }) => (t.token.$extensions?.[EXT] ?? {}) as Record<string, any>;
const roles = tokens.filter((t) => t.path.startsWith('auk.role.'));
const components = tokens.filter((t) => !t.path.startsWith('auk.role.'));

describe('the two generated files are the generator output', () => {
  it('exist', () => {
    expect(existsSync(TOKENS), `${TOKENS} missing; run: node scripts/build-tokens.mjs`).toBe(true);
    expect(existsSync(ROLES), `${ROLES} missing; run: node scripts/build-tokens.mjs`).toBe(true);
  });

  it('equal render() from scripts/build-tokens.mjs byte for byte', async () => {
    // Dynamic import so a missing generator fails this case, not the whole file.
    const { render } = await import('../../scripts/build-tokens.mjs');
    const out = render();
    expect(readFileSync(TOKENS, 'utf8')).toBe(out.tokens);
    expect(readFileSync(ROLES, 'utf8')).toBe(out.roles);
  });
});

describe('the token file keeps the contract promises', () => {
  it('has role tokens and component tokens to check', () => {
    expect(roles.length).toBeGreaterThan(0);
    expect(components.length).toBe(properties.length);
  });

  it('every brand token aliases exactly one existing role, and the brand set is the brand-bearing set', () => {
    const roleNames = new Set(roles.map((r) => r.path.replace(/^auk\.role\./, '')));
    const brand = components.filter((t) => ext(t).kind === 'brand');
    for (const t of brand) {
      const alias = String(t.token.$value).match(/^\{auk\.role\.([a-z0-9-]+)\}$/);
      expect(alias, `${t.path} does not alias a role: ${JSON.stringify(t.token.$value)}`).not.toBeNull();
      expect(roleNames.has(alias![1]), `${t.path} aliases unknown role ${alias![1]}`).toBe(true);
      expect(ext(t).role, `${t.path} extension role disagrees with its alias`).toBe(alias![1]);
    }
    expect(brand.map((t) => ext(t).css).sort()).toEqual(brandBearing);
  });

  it('every measured token carries a floor that is none or a bound a named spec asserts', () => {
    const measured = components.filter((t) => ext(t).kind === 'measured');
    expect(measured.length).toBe(properties.length - brandBearing.length);
    for (const t of measured) {
      const floor = ext(t).floor;
      if (floor === 'none') continue;
      expect(floor, `${t.path} has no floor`).toBeTypeOf('object');
      expect(floor.criterion, `${t.path} floor names no criterion`).toMatch(/^\d+\.\d+\.\d+$/);
      expect('min' in floor || 'max' in floor, `${t.path} floor states no bound`).toBe(true);
      const spec = resolve(ROOT, floor.spec);
      expect(existsSync(spec), `${t.path} floor names a missing spec ${floor.spec}`).toBe(true);
      const titles = [...readFileSync(spec, 'utf8').matchAll(/^test\(\s*'([^']+)'/gm)].map((m) => m[1]);
      expect(
        titles.some((title) => title.startsWith(floor.criterion + ' ')),
        `${floor.spec} has no test titled "${floor.criterion} ..." to back ${t.path}`,
      ).toBe(true);
    }
  });

  it('no role name is a component slug', () => {
    expect(roles.map((r) => r.path.replace(/^auk\.role\./, '')).filter((name) => slugs.includes(name))).toEqual([]);
  });
});

describe('the roles stylesheet chains every brand property to its role inside the auk layer', () => {
  const css = existsSync(ROLES) ? readFileSync(ROLES, 'utf8') : '';
  const lines = css.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('/*'));
  const chained = new Map(
    [...css.matchAll(/^\s*(--auk-[a-z0-9-]+): var\(--auk-role-([a-z0-9-]+)\);$/gm)].map((m) => [m[1], m[2]]),
  );

  it('opens with @layer auk { after its generated-file comment', () => {
    expect(lines[0]).toBe('@layer auk {');
    expect(lines[1]).toBe('  :root {');
    expect(lines.at(-1)).toBe('}');
  });

  it('declares exactly the brand-bearing properties, each chained to the role its token names', () => {
    expect([...chained.keys()].sort()).toEqual(brandBearing);
    for (const t of components.filter((c) => ext(c).kind === 'brand')) {
      expect(chained.get(ext(t).css), `${ext(t).css} chains to the wrong role`).toBe(ext(t).role);
    }
    // No declaration that is not a chain line - a literal here would restate a default.
    expect(css.match(/^\s*--auk-[a-z0-9-]+:/gm)?.length).toBe(brandBearing.length);
  });
});
