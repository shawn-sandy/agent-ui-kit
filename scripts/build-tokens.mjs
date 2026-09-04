#!/usr/bin/env node
/**
 * Render the role layer's two generated forms from the component references and the
 * mapping table in skills/ui-theme/references/ui-theme.md:
 *
 *   skills/ui-theme/references/auk.tokens.json   DTCG 2025.10. The 23 roles as tokens
 *                                                whose value is the shipped fallback,
 *                                                then every component property as a
 *                                                token - brand-bearing ones aliased to
 *                                                their role, measured ones typed by value
 *                                                and carrying the floor a test asserts.
 *   skills/ui-theme/references/auk-roles.css     @layer auk { :root { ... } } chaining
 *                                                each brand-bearing property to its role,
 *                                                so a project binds roles, not properties.
 *
 * Both are generated and never hand-edited: tests/integration/tokens-file.spec.ts fails
 * when a committed copy differs from render() by a byte. The references stay the source
 * of every property and fallback, and the mapping table stays the source of every role.
 *
 *   node scripts/build-tokens.mjs      rewrite both files
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readProperties } from './auk-properties.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const REFERENCE = join(SKILLS, 'ui-theme', 'references', 'ui-theme.md');
export const TOKENS_OUT = join(SKILLS, 'ui-theme', 'references', 'auk.tokens.json');
export const ROLES_OUT = join(SKILLS, 'ui-theme', 'references', 'auk-roles.css');

/** The reverse-domain key DTCG asks vendor data under $extensions to use, from the repository URL. */
export const EXT = 'com.github.shawn-sandy.agent-ui-skills';

/**
 * The floors tests/e2e/ asserts today, by property. A floor is a bound a test proves,
 * named with the spec that proves it - never a number nobody measured - so every other
 * measured property carries `none`. The tab, dialog-close and popover-close targets and
 * any dimension role are a follow-up plan's call, once their assertions exist.
 */
const aboveZero = (skill) => ({ criterion: '2.4.7', min: { value: 0, unit: 'px', exclusive: true }, spec: `tests/e2e/${skill}.spec.ts` });
const FLOORS = {
  '--auk-button-min-size': { criterion: '2.5.8', min: { value: 24, unit: 'px' }, spec: 'tests/e2e/ui-button.spec.ts' },
  '--auk-button-focus-width': aboveZero('ui-button'),
  '--auk-dialog-focus-width': aboveZero('ui-dialog'),
  '--auk-popover-focus-width': aboveZero('ui-popover'),
  '--auk-tabs-focus-width': aboveZero('ui-tabs'),
  '--auk-button-transition-duration': {
    criterion: '2.3.3',
    max: { value: 0, unit: 'ms' },
    when: '(prefers-reduced-motion: reduce)',
    spec: 'tests/e2e/ui-button.spec.ts',
  },
};

const HEX = /^#([0-9a-f]{6})$/i;
const RGBA = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/;
const LENGTH = /^(-?\d*\.?\d+)(px|rem)$/;
const TIME = /^(\d*\.?\d+)(ms|s)$/;
const NUMBER = /^-?\d*\.?\d+$/;

/** sRGB fractions of an 8-bit channel, to three places - enough to round-trip the hex. */
const fraction = (channel) => Math.round((channel / 255) * 1000) / 1000;
const hexOf = (r, g, b) => '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

/** A DTCG colour value, or undefined for a literal that is not a colour we can read. */
function colour(text) {
  if (text === 'transparent') return { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0, hex: '#000000' };
  const hex = text.match(HEX);
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16));
    return { colorSpace: 'srgb', components: [r, g, b].map(fraction), hex: text.toLowerCase() };
  }
  const rgba = text.match(RGBA);
  if (rgba) {
    const [r, g, b] = rgba.slice(1, 4).map(Number);
    const value = { colorSpace: 'srgb', components: [r, g, b].map(fraction) };
    if (rgba[4] !== undefined) value.alpha = Number(rgba[4]);
    value.hex = hexOf(r, g, b);
    return value;
  }
  return undefined;
}

/** A DTCG dimension, or undefined. A bare 0 is a length too. */
function length(text) {
  if (text === '0') return { value: 0, unit: 'px' };
  const m = text.match(LENGTH);
  return m ? { value: Number(m[1]), unit: m[2] } : undefined;
}

/** A DTCG shadow from a CSS box-shadow with one layer: offsets, blur, optional spread, colour last. */
function shadow(text) {
  const m = text.match(/^(.*?)\s*(rgba?\(.*\)|#[0-9a-f]{6}|transparent)$/i);
  if (!m) return undefined;
  const lengths = m[1].trim().split(/\s+/).map(length);
  const color = colour(m[2]);
  if (!color || lengths.length < 3 || lengths.some((l) => l === undefined)) return undefined;
  const [offsetX, offsetY, blur, spread = { value: 0, unit: 'px' }] = lengths;
  return { color, offsetX, offsetY, blur, spread };
}

/**
 * The DTCG type a property's values belong to, by the property's last segments. The two
 * popover placement properties hold `position-area` and `position-try-fallbacks`
 * keywords, which no DTCG type describes, so they return undefined.
 */
function category(property) {
  if (/-(?:color|bg)$/.test(property)) return 'color';
  if (property.endsWith('-box-shadow')) return 'shadow';
  if (property.endsWith('-font-family')) return 'fontFamily';
  if (property.endsWith('-font-weight')) return 'fontWeight';
  if (/-(?:line-height|brightness)$/.test(property)) return 'number';
  if (property.endsWith('-duration')) return 'duration';
  if (/-position-(?:area|try-fallbacks)$/.test(property)) return undefined;
  return 'dimension';
}

/** The typed value for a fallback, or undefined when the text is not one the type can hold. */
function valueFor(type, text) {
  switch (type) {
    case 'color': return colour(text);
    case 'dimension': return length(text);
    case 'duration': { const m = text.match(TIME); return m ? { value: Number(m[1]), unit: m[2] } : undefined; }
    case 'fontWeight':
    case 'number': return NUMBER.test(text) ? Number(text) : undefined;
    case 'fontFamily': return text === 'inherit' ? undefined : text.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    case 'shadow': return shadow(text);
    default: return undefined;
  }
}

/**
 * Type one shipped fallback.
 *
 * A literal DTCG cannot hold - `inherit`, `auto`, a `min()` or `calc()` expression, a
 * placement keyword - keeps the category type, carries the literal verbatim as a string
 * value, and is flagged raw so a strict validator's complaint points at a known list
 * (tests/unit/build-tokens.spec.ts names all twelve). Nothing is invented.
 *
 * @param {string} property the --auk-* name, which decides the category
 * @param {string} fallback the literal the reference ships
 * @returns {{ $type?: string, $value: unknown, raw: boolean }}
 */
export function tokenFor(property, fallback) {
  const type = category(property);
  const value = valueFor(type, fallback);
  if (value !== undefined) return { $type: type, $value: value, raw: false };
  return type ? { $type: type, $value: fallback, raw: true } : { $value: fallback, raw: true };
}

/**
 * The mapping table in ui-theme.md, one entry per role in table order. The fallback is
 * the first property's shipped literal, which is what the role token records as its
 * value; the table's row order carries that meaning on purpose.
 *
 * @returns {{ name: string, meaning: string, properties: string[], fallback: string }[]}
 */
export function readRoles() {
  const section = readFileSync(REFERENCE, 'utf8').split('\n## Mapping table\n')[1]?.split('\n## ')[0] ?? '';
  const fallbacks = new Map(readProperties(SKILLS).map((p) => [p.property, p.fallback]));
  return section
    .split('\n')
    .filter((line) => /^\| [a-z][a-z-]* \| /.test(line))
    .map((line) => {
      const [, name, meaning, cell] = line.split('|').map((c) => c.trim());
      const properties = [...cell.matchAll(/`(--auk-[a-z0-9-]+)`/g)].map((m) => m[1]);
      return { name, meaning, properties, fallback: fallbacks.get(properties[0]) };
    });
}

/** One DTCG token object in a fixed member order, vendor data under the repository's key. */
function token(typed, description, ext) {
  const out = {};
  if (typed.$type) out.$type = typed.$type;
  out.$value = typed.$value;
  if (description) out.$description = description;
  out.$extensions = { [EXT]: typed.raw ? { ...ext, raw: true } : ext };
  return out;
}

/**
 * Both files as strings.
 *
 * @returns {{ tokens: string, roles: string }}
 */
export function render() {
  const properties = readProperties(SKILLS);
  const roles = readRoles();
  const roleOf = new Map(roles.flatMap((r) => r.properties.map((p) => [p, r])));

  const tokens = {
    auk: {
      role: {
        $description:
          'Semantic roles. Bind these: every brand-bearing component property below aliases one, so a brand is at most one line per role and an unbound role leaves the shipped fallback in place.',
      },
    },
  };
  for (const role of roles) {
    tokens.auk.role[role.name] = token(tokenFor(role.properties[0], role.fallback), role.meaning, {
      css: `--auk-role-${role.name}`,
      kind: 'brand',
      fallback: role.fallback,
    });
  }
  for (const p of properties) {
    // readProperties names the skill directory; the token path and the extension carry
    // the component slug, the same name the custom property and the root class use.
    const slug = p.component.replace(/^ui-/, '');
    const group = (tokens.auk[slug] ??= {});
    const name = p.property.slice(`--auk-${slug}-`.length);
    const ext = { css: p.property, component: slug, kind: p.brand ? 'brand' : 'measured', fallback: p.fallback };
    if (p.brand) {
      const role = roleOf.get(p.property);
      if (!role) throw new Error(`${p.property} is brand-bearing but no mapping-table row names it`);
      group[name] = token({ $type: tokens.auk.role[role.name].$type, $value: `{auk.role.${role.name}}`, raw: false }, undefined, { ...ext, role: role.name });
    } else {
      group[name] = token(tokenFor(p.property, p.fallback), undefined, { ...ext, floor: FLOORS[p.property] ?? 'none' });
    }
  }

  const css = [
    '/* Generated from the component references and the ui-theme mapping table by scripts/build-tokens.mjs. Edit those, not this. See ui-theme.md for how to bind the roles. */',
    '@layer auk {',
    '  :root {',
    ...roles.flatMap((r) => [`    /* ${r.name} */`, ...r.properties.map((p) => `    ${p}: var(--auk-role-${r.name});`)]),
    '  }',
    '}',
    '',
  ].join('\n');

  return { tokens: JSON.stringify(tokens, null, 2) + '\n', roles: css };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = render();
  writeFileSync(TOKENS_OUT, out.tokens);
  writeFileSync(ROLES_OUT, out.roles);
  console.log(`wrote ${TOKENS_OUT}\nwrote ${ROLES_OUT}`);
}
