/**
 * Every `var(--auk-*, fallback)` the component references read.
 *
 * Two consumers need the same list - docs/properties.md through
 * scripts/build-properties.mjs, and tests/unit/ui-theme-mapping.spec.ts - and one
 * parser keeps them from disagreeing about which properties exist. A regex cannot stop
 * at the right `)` once a fallback holds its own parentheses, as `rgba(17, 24, 39, 0.6)`
 * and `min(22rem, calc(100vw - 2rem))` do, so this walks the parentheses instead.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { skillKind } from './skill-kind.mjs';

/**
 * Brand-bearing: a colour, a corner radius or a type family. Everything else is a size,
 * spacing, duration or placement that tests/e2e/ measures and a theme leaves alone.
 */
export const BRAND = /-(?:color|bg|box-shadow|radius|font-family)$/;

/**
 * Parse every `var()` call in one css text.
 *
 * @param {string} css
 * @returns {{ property: string, fallback: string }[]} one entry per name, first-seen order
 * @throws {Error} when one name carries two different fallbacks, or a `var(` never closes
 */
export function parseVars(css) {
  const seen = new Map();
  let at = css.indexOf('var(');
  while (at !== -1) {
    let depth = 1;
    let comma = -1;
    let i = at + 4;
    for (; i < css.length && depth > 0; i += 1) {
      const ch = css[i];
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ',' && depth === 1 && comma === -1) comma = i;
    }
    if (depth !== 0) throw new Error(`unclosed var( at offset ${at}`);
    const close = i - 1;
    const property = css.slice(at + 4, comma === -1 ? close : comma).trim();
    const fallback = comma === -1 ? '' : css.slice(comma + 1, close).trim();
    const prior = seen.get(property);
    if (prior !== undefined && prior !== fallback) {
      throw new Error(`${property} has two fallbacks: "${prior}" and "${fallback}"`);
    }
    seen.set(property, fallback);
    at = css.indexOf('var(', i);
  }
  return [...seen].map(([property, fallback]) => ({ property, fallback }));
}

/** The first fenced css block of a markdown file, or an empty string. */
function fencedCss(markdown) {
  return markdown.match(/```css\n([\s\S]*?)```/)?.[1] ?? '';
}

/**
 * Every property across the component skills under `skillsDir`, in skill order.
 *
 * @param {string} skillsDir absolute path to the skills/ tree
 * @returns {{ component: string, property: string, fallback: string, brand: boolean }[]}
 */
export function readProperties(skillsDir) {
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => skillKind(join(skillsDir, name)) === 'component')
    .sort()
    .flatMap((component) => {
      const md = readFileSync(join(skillsDir, component, 'references', `${component}.md`), 'utf8');
      return parseVars(fencedCss(md)).map((v) => ({ component, ...v, brand: BRAND.test(v.property) }));
    });
}
