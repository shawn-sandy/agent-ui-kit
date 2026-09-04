#!/usr/bin/env node
/**
 * Render the auk role layer as a machine-readable contract, from the component
 * references (through scripts/auk-properties.mjs) and the mapping table in
 * skills/ui-theme/references/ui-theme.md:
 *
 *   skills/ui-theme/references/auk.tokens.json  a DTCG 2025.10 token file - each role
 *                                               is a token, each component property
 *                                               is a token aliased to its role or
 *                                               typed from its shipped fallback
 *   skills/ui-theme/references/auk-roles.css    `@layer auk { :root { … } }` chaining
 *                                               every brand-bearing property to
 *                                               `var(--auk-role-<name>)`
 *
 * Both files are generated and never hand-edited: tests/integration/tokens-file.spec.ts
 * fails when a committed copy differs from render() by a byte.
 *
 *   node scripts/build-tokens.mjs      rewrite both files
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readProperties } from './auk-properties.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const REFS = join(SKILLS, 'ui-theme', 'references');
const REFERENCE = join(REFS, 'ui-theme.md');

/** The reverse-domain `$extensions` key, derived from the repository URL. */
export const EXTENSION = 'com.github.shawn-sandy.agent-ui-skills';

/**
 * A floor is the bound a test in tests/e2e/ asserts, named with the file that asserts
 * it. Nothing here is estimated: a measured property with no assertion carries `none`.
 */
const FLOORS = {
  '--auk-button-min-size': { criterion: '2.5.8', bound: '24px by 24px', spec: 'tests/e2e/ui-button.spec.ts' },
  '--auk-button-focus-width': { criterion: '2.4.7', bound: 'above 0', spec: 'tests/e2e/ui-button.spec.ts' },
  '--auk-dialog-focus-width': { criterion: '2.4.7', bound: 'above 0', spec: 'tests/e2e/ui-dialog.spec.ts' },
  '--auk-popover-focus-width': { criterion: '2.4.7', bound: 'above 0', spec: 'tests/e2e/ui-popover.spec.ts' },
  '--auk-tabs-focus-width': { criterion: '2.4.7', bound: 'above 0', spec: 'tests/e2e/ui-tabs.spec.ts' },
  '--auk-button-transition-duration': { criterion: '2.3.3', bound: '0s under prefers-reduced-motion: reduce', spec: 'tests/e2e/ui-button.spec.ts' },
};

/** The DTCG type a property's category maps to. `string` is not a DTCG type: it is the honest label for a keyword list the format cannot express. */
function category(property) {
  if (/-(?:color|bg)$/.test(property)) return 'color';
  if (property.endsWith('-box-shadow')) return 'shadow';
  if (property.endsWith('-font-family')) return 'fontFamily';
  if (property.endsWith('-font-weight')) return 'fontWeight';
  if (/-(?:line-height|brightness)$/.test(property)) return 'number';
  if (property.endsWith('-duration')) return 'duration';
  if (/-position-(?:area|try-fallbacks)$/.test(property)) return 'string';
  return 'dimension';
}

const round = (n) => Math.round(n * 1000) / 1000;

function rgb(r, g, b, alpha) {
  const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
  return { colorSpace: 'srgb', components: [r, g, b].map((c) => round(c / 255)), alpha, hex };
}

/** An sRGB colour object per the DTCG colour module, or null for a literal it cannot express. */
function color(literal) {
  if (literal === 'transparent') return rgb(0, 0, 0, 0);
  let m = literal.match(/^#([0-9a-f]{6})$/i);
  if (m) return rgb(...[0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)), 1);
  m = literal.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (m) return rgb(Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4]));
  return null;
}

/** A px or rem length; a bare 0 counts as 0px. Anything else - auto, min(), calc() - is null. */
function length(literal) {
  const m = literal.match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m || (m[2] === undefined && Number(m[1]) !== 0)) return null;
  return { value: Number(m[1]), unit: m[2] ?? 'px' };
}

function shadow(literal) {
  const m = literal.match(/^(\S+) (\S+) (\S+)(?: (\S+))? (rgba?\(.*\)|#[0-9a-f]{6})$/i);
  if (!m) return null;
  const [offsetX, offsetY, blur, spread] = [m[1], m[2], m[3], m[4] ?? '0'].map(length);
  const c = color(m[5]);
  return offsetX && offsetY && blur && spread && c ? { color: c, offsetX, offsetY, blur, spread } : null;
}

const number = (literal) => (/^-?\d*\.?\d+$/.test(literal) ? Number(literal) : null);

const PARSE = {
  color,
  dimension: length,
  shadow,
  duration: (literal) => {
    const m = literal.match(/^(\d*\.?\d+)(ms|s)$/);
    return m ? { value: Number(m[1]), unit: m[2] } : null;
  },
  fontWeight: number,
  number,
  fontFamily: (literal) => (/^(?:inherit|initial|unset|revert)$/.test(literal) ? null : literal),
  string: () => null,
};

/**
 * The DTCG shape of one shipped fallback.
 *
 * @param {string} property the `--auk-*` name, which decides the category
 * @param {string} fallback the literal the reference ships
 * @returns {{ $type: string, $value: unknown, raw?: true }} `raw` marks a literal the
 *   format cannot type, carried verbatim as a string under the category type
 */
export function tokenFor(property, fallback) {
  const $type = category(property);
  const $value = PARSE[$type](fallback);
  return $value === null ? { $type, $value: fallback, raw: true } : { $type, $value };
}

/**
 * The `## Mapping table` rows of the ui-theme reference, in table order.
 *
 * @param {string} [markdown] the reference text; read from disk when omitted
 * @returns {{ name: string, meaning: string, properties: string[] }[]}
 */
export function readRoles(markdown = readFileSync(REFERENCE, 'utf8')) {
  const section = markdown.split('\n## Mapping table\n')[1]?.split('\n## ')[0] ?? '';
  return section
    .split('\n')
    .filter((line) => /^\| [a-z][a-z-]* \| /.test(line))
    .map((line) => {
      const [, name, meaning, cell] = line.split('|').map((c) => c.trim());
      return { name, meaning, properties: [...cell.matchAll(/`(--auk-[a-z0-9-]+)`/g)].map((m) => m[1]) };
    });
}

/** The first fenced css block of a component reference. */
function cssOf(component) {
  const md = readFileSync(join(SKILLS, component, 'references', `${component}.md`), 'utf8');
  return md.match(/```css\n([\s\S]*?)```/)?.[1] ?? '';
}

/**
 * The media guard a property's var() sits inside, when it is the reduced-motion one.
 * Every guarded block is walked, so a property declared only in a second block is
 * still reported as guarded.
 *
 * @param {string} css a reference's css block
 * @param {string} property the `--auk-*` name
 * @returns {string | undefined} the media query text, or undefined when unguarded
 */
export function guardOf(css, property) {
  const guard = 'prefers-reduced-motion: no-preference';
  const marker = `@media (${guard})`;
  for (let at = css.indexOf(marker); at !== -1; at = css.indexOf(marker, at + 1)) {
    let depth = 0;
    let i = css.indexOf('{', at);
    for (; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}' && (depth -= 1) === 0) break;
    }
    if (css.slice(at, i).includes(`var(${property}`)) return guard;
  }
  return undefined;
}

/** Both files as strings: `{ json, css }`. */
export function render() {
  const properties = readProperties(SKILLS);
  const roles = readRoles();
  const byName = new Map(properties.map((p) => [p.property, p]));
  const roleOf = new Map(roles.flatMap((r) => r.properties.map((p) => [p, r.name])));

  const auk = {
    $description:
      'The auk role layer. Generated by node scripts/build-tokens.mjs from the component references and the ui-theme mapping table; edit those, not this file.',
    role: { $description: 'Semantic roles. Bind these; every brand-bearing component property below aliases one.' },
  };
  for (const role of roles) {
    const first = byName.get(role.properties[0]);
    if (!first) throw new Error(`role ${role.name} names ${role.properties[0]}, which no reference declares`);
    const { raw, ...token } = tokenFor(first.property, first.fallback);
    const ext = { css: `--auk-role-${role.name}`, kind: 'brand', fallback: first.fallback };
    if (raw) ext.raw = true;
    auk.role[role.name] = { ...token, $description: role.meaning, $extensions: { [EXTENSION]: ext } };
  }

  const cssCache = new Map();
  for (const p of properties) {
    const slug = p.component.replace(/^ui-/, '');
    const group = (auk[slug] ??= {});
    const { raw, ...token } = tokenFor(p.property, p.fallback);
    const ext = { css: p.property, component: slug, kind: p.brand ? 'brand' : 'measured', fallback: p.fallback };
    if (raw) ext.raw = true;
    if (p.brand) {
      const role = roleOf.get(p.property);
      if (!role) throw new Error(`${p.property} is brand-bearing but no role in the mapping table names it`);
      token.$value = `{auk.role.${role}}`;
      ext.role = role;
    } else {
      ext.floor = FLOORS[p.property] ?? 'none';
      if (!cssCache.has(p.component)) cssCache.set(p.component, cssOf(p.component));
      const guard = guardOf(cssCache.get(p.component), p.property);
      if (guard) ext.guard = guard;
    }
    group[p.property.slice(`--auk-${slug}-`.length)] = { ...token, $extensions: { [EXTENSION]: ext } };
  }

  const css = [
    '/* Generated by node scripts/build-tokens.mjs from the component references and the mapping table in ui-theme.md. Edit those, not this file. */',
    '@layer auk {',
    // Anchored on :root only. A custom property resolves its var() where it is
    // declared and children inherit the result, so a block below the root restates
    // the chain lines for the roles it sets; a wider selector here would beat the
    // unlayered :root override docs/theming.md promises. See the theme reference.
    '  :root {',
    ...roles.flatMap((r) => r.properties.map((p) => `    ${p}: var(--auk-role-${r.name});`)),
    '  }',
    '}',
    '',
  ].join('\n');
  return { json: JSON.stringify({ auk }, null, 2) + '\n', css };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { json, css } = render();
  writeFileSync(join(REFS, 'auk.tokens.json'), json);
  writeFileSync(join(REFS, 'auk-roles.css'), css);
  console.log(`wrote ${join(REFS, 'auk.tokens.json')}\nwrote ${join(REFS, 'auk-roles.css')}`);
}
