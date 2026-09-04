/**
 * skills/ui-theme/references/auk.tokens.json and auk-roles.css are generated from the
 * component references and the ui-theme mapping table by scripts/build-tokens.mjs. A
 * generated file nothing checks goes stale on the first new property, and the alias,
 * floor and collision rules are the contract's promises - so each has an assertion
 * that fails when it is broken.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { readProperties } from '../../scripts/auk-properties.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const REFS = resolve(ROOT, 'skills/ui-theme/references');
const JSON_PATH = resolve(REFS, 'auk.tokens.json');
const CSS_PATH = resolve(REFS, 'auk-roles.css');
const KEY = 'com.github.shawn-sandy.agent-ui-skills';

/** Every token in the file as [dotted path, token], depth first. */
function tokens(node: Record<string, unknown>, path: string[] = []): [string, Record<string, unknown>][] {
  return Object.entries(node)
    .filter(([k]) => !k.startsWith('$'))
    .flatMap(([k, v]) => {
      const child = v as Record<string, unknown>;
      return '$value' in child ? [[[...path, k].join('.'), child] as [string, Record<string, unknown>]] : tokens(child, [...path, k]);
    });
}

const read = () => JSON.parse(readFileSync(JSON_PATH, 'utf8')) as Record<string, unknown>;
const ext = (t: Record<string, unknown>) => (t.$extensions as Record<string, Record<string, unknown>>)[KEY];

describe('the generated token files are the generator output', () => {
  it('both files exist', () => {
    expect(existsSync(JSON_PATH), 'run: node scripts/build-tokens.mjs').toBe(true);
    expect(existsSync(CSS_PATH), 'run: node scripts/build-tokens.mjs').toBe(true);
  });

  it('each equals render() from scripts/build-tokens.mjs byte for byte', async () => {
    const { render } = await import('../../scripts/build-tokens.mjs');
    const out = render();
    expect(readFileSync(JSON_PATH, 'utf8')).toBe(out.json);
    expect(readFileSync(CSS_PATH, 'utf8')).toBe(out.css);
  });
});

describe('the token contract', () => {
  // Lazy on purpose: a missing file fails the existence case above by name, not this
  // whole file at collection time.
  const all = existsSync(JSON_PATH) ? tokens(read()) : [];
  const roles = all.filter(([p]) => p.startsWith('auk.role.'));
  const brand = all.filter(([, t]) => ext(t).kind === 'brand' && !ext(t).css?.toString().startsWith('--auk-role-'));
  const measured = all.filter(([, t]) => ext(t).kind === 'measured');
  const brandBearing = readProperties(resolve(ROOT, 'skills')).filter((p) => p.brand).map((p) => p.property).sort();

  it('every brand token aliases one role that exists, and together they are the brand-bearing set', () => {
    const roleNames = new Set(roles.map(([p]) => p.replace('auk.role.', '')));
    for (const [path, t] of brand) {
      const alias = String(t.$value).match(/^\{auk\.role\.([a-z-]+)\}$/);
      expect(alias, `${path} does not alias a role: ${JSON.stringify(t.$value)}`).not.toBeNull();
      expect(roleNames.has(alias![1]), `${path} aliases missing role ${alias![1]}`).toBe(true);
      expect(ext(t).role).toBe(alias![1]);
    }
    expect(brand.map(([, t]) => String(ext(t).css)).sort()).toEqual(brandBearing);
  });

  it('every measured token carries a floor that is none or one the browser suite asserts', () => {
    expect(measured.length).toBeGreaterThan(0);
    for (const [path, t] of measured) {
      const floor = ext(t).floor as string | { criterion: string; bound: string; spec: string };
      if (floor === 'none') continue;
      expect(floor, `${path} has no floor`).toMatchObject({ criterion: expect.any(String), bound: expect.any(String), spec: expect.any(String) });
      const specPath = resolve(ROOT, floor.spec);
      expect(existsSync(specPath), `${path}: ${floor.spec} missing`).toBe(true);
      const titles = [...readFileSync(specPath, 'utf8').matchAll(/^test\(\s*'([^']+)'/gm)].map((m) => m[1]);
      expect(titles.some((title) => title.startsWith(floor.criterion + ' ')), `${path}: no test titled "${floor.criterion} ..." in ${floor.spec}`).toBe(true);
    }
  });

  it('no role name is a component slug', () => {
    const slugs = readdirSync(resolve(ROOT, 'skills')).map((d) => d.replace(/^ui-/, ''));
    expect(roles.map(([p]) => p.replace('auk.role.', '')).filter((r) => slugs.includes(r))).toEqual([]);
  });

  it('auk-roles.css lives in the auk layer and chains exactly the brand-bearing properties to their roles', () => {
    const css = existsSync(CSS_PATH) ? readFileSync(CSS_PATH, 'utf8') : '';
    const lines = css.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('/*'));
    expect(lines[0]).toBe('@layer auk {');
    expect(lines.at(-1)).toBe('}');
    const chain = [...css.matchAll(/^\s*(--auk-[a-z0-9-]+):\s*var\((--auk-role-[a-z-]+)\);$/gm)].map((m) => [m[1], m[2]]);
    expect(chain.map(([p]) => p).sort()).toEqual(brandBearing);
    const declared = css.match(/--auk-[a-z0-9-]+:/g) ?? [];
    expect(declared.length, 'a declaration that is not a role chain').toBe(chain.length);
    const roleOf = new Map(brand.map(([, t]) => [String(ext(t).css), `--auk-role-${ext(t).role}`]));
    for (const [property, role] of chain) expect(role, property).toBe(roleOf.get(property));
  });
});
