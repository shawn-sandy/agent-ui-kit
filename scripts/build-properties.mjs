#!/usr/bin/env node
/**
 * Render docs/properties.md - every `--auk-*` property with its fallback and kind, and
 * each component's anatomy - from the component references, through
 * scripts/auk-properties.mjs and the mapping table scripts/build-tokens.mjs reads.
 *
 * The file is generated and never hand-edited: tests/integration/properties-doc.spec.ts
 * fails when the committed copy differs from render() by a byte.
 *
 *   node scripts/build-properties.mjs      rewrite docs/properties.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readProperties } from './auk-properties.mjs';
import { readRoles } from './build-tokens.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'properties.md');

/** `no-results` to `No Results`: the Title Case a design tool names a layer or a value with. */
const titleCase = (name) => name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const fenced = (markdown, lang) => markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)```'))?.[1] ?? '';

/**
 * A component's parts, variants and states from its qualifier line, each with the form
 * the code addresses it by and the name a design tool gives it.
 *
 * A part is an attribute only when the Structure block carries `data-part="<name>"`;
 * the dialog's title, close and backdrop and the tabs' tab and panel are declared
 * parts the markup reaches by tag, class, ARIA role or pseudo-element, and the code
 * column says which. A state's form is whichever selector the css block uses for it.
 *
 * @param {string} markdown a component reference
 * @returns {{ parts: {name: string, attribute: boolean, code: string, figma: string}[],
 *   variants: {name: string, code: string, figma: string}[],
 *   states: {name: string, code: string, figma: string}[] }}
 */
export function anatomy(markdown) {
  const q = markdown.match(/^Qualifiers: parts (.+?); variants (.+?); states (.+?)\.$/m);
  if (!q) throw new Error('reference has no qualifier line');
  const list = (cell) => (cell.trim() === 'none' ? [] : [...cell.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]));
  const html = fenced(markdown, 'html');
  const css = fenced(markdown, 'css');
  const slug = css.match(/\.auk-([a-z0-9-]+)/)?.[1] ?? '';

  const partCode = (name) => {
    if (html.includes(`data-part="${name}"`)) return `data-part="${name}"`;
    const role = html.match(new RegExp(`role="([a-z]*${name})"`))?.[1];
    if (role) return `role="${role}"`;
    if (css.includes(`.auk-${slug}-${name}`)) return `class="auk-${slug}-${name}"`;
    if (css.includes(`::${name}`)) return `::${name}`;
    const tag = html.match(new RegExp(`<([a-z0-9]+)[^>]*id="[^"]*-${name}"`))?.[1];
    return tag ? `<${tag}>` : 'see Structure';
  };
  const stateCode = (name) => {
    const forms = [`[aria-${name}="true"]`, `:${name}-visible`, `:popover-${name}`, `:${name}`, `[${name}]`, `[data-state="${name}"]`];
    const hit = forms.find((form) => css.includes(form));
    return hit ? hit.replace(/^\[(.*)\]$/, '$1') : `data-state="${name}"`;
  };

  return {
    parts: list(q[1]).map((name) => ({ name, attribute: html.includes(`data-part="${name}"`), code: partCode(name), figma: titleCase(name) })),
    variants: list(q[2]).map((name) => ({ name, code: `data-variant="${name}"`, figma: `Variant=${titleCase(name)}` })),
    states: [
      { name: 'default', code: 'no attribute', figma: 'State=Default' },
      ...list(q[3]).map((name) => ({ name, code: stateCode(name), figma: `State=${titleCase(name)}` })),
    ],
  };
}

/** The whole document as a string; one section, one anatomy table and one property table per component. */
export function render() {
  const properties = readProperties(join(ROOT, 'skills'));
  const roles = readRoles();
  const components = [...new Set(properties.map((p) => p.component))];
  const lines = [
    '# Custom properties',
    '',
    `Every \`--auk-*\` property the component references read - ${properties.length} across`,
    `${components.length} components - with the literal fallback the browser uses when nobody sets it.`,
    'Kind is `brand` for a colour, corner radius or type family, which `ui-theme` maps through',
    'the auk role layer, and `measured` for a size, spacing, duration or placement that',
    '`tests/e2e/` measures and a theme leaves alone. Where to set one is in',
    '[docs/theming.md](theming.md).',
    '',
    'Each section opens with the component\'s anatomy: its parts, variants and states, the',
    'form the code addresses each by, and the name a design tool gives it. The design-tool',
    'names are the code names by rule - Title Case for a layer, a `Variant` value and a',
    '`State` value - so a designer and an agent can talk about one component without a',
    'translation table. The roles line is the code syntax of every role the component reads',
    'through `skills/ui-theme/references/auk-roles.css`.',
    '',
    'Generated by `node scripts/build-properties.mjs`. Edit the references, not this file.',
  ];
  for (const component of components) {
    const md = readFileSync(join(ROOT, 'skills', component, 'references', `${component}.md`), 'utf8');
    const a = anatomy(md);
    const own = properties.filter((x) => x.component === component);
    const read = roles.filter((r) => r.properties.some((p) => own.some((x) => x.property === p)));
    lines.push('', `## ${component}`, '', '| Kind | Name | In code | Figma name |', '| --- | --- | --- | --- |');
    for (const p of a.parts) lines.push(`| part | ${p.name} | ${p.code === 'see Structure' ? p.code : `\`${p.code}\``} | \`${p.figma}\` |`);
    for (const v of a.variants) lines.push(`| variant | ${v.name} | \`${v.code}\` | \`${v.figma}\` |`);
    for (const s of a.states) lines.push(`| state | ${s.name} | ${s.code === 'no attribute' ? s.code : `\`${s.code}\``} | \`${s.figma}\` |`);
    lines.push('', `Reads roles: ${read.map((r) => `\`var(--auk-role-${r.name})\``).join(', ')}.`);
    lines.push('', '| Property | Fallback | Kind |', '| --- | --- | --- |');
    for (const p of own) lines.push(`| \`${p.property}\` | \`${p.fallback}\` | ${p.brand ? 'brand' : 'measured'} |`);
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(OUT, render());
  console.log(`wrote ${OUT}`);
}
