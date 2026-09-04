#!/usr/bin/env node
/**
 * Render docs/designs/components/index.html - the component sheet: every component's
 * Structure block painted by its shipped CSS on one self-contained page that opens from
 * disk, plus the 23 roles as chips, one anatomy table and one tokens table per
 * component. The real CSS painting the real markup is the only design record that
 * cannot disagree with the code.
 *
 * The sheet is generated and never hand-edited: tests/integration/design-sheet.spec.ts
 * fails when the committed copy differs from render() by a byte.
 *
 *   node scripts/build-design.mjs                            rewrite the sheet
 *   node scripts/build-design.mjs --roles brand.css -o p.html   preview a brand: the
 *                                                            given roles block after
 *                                                            auk-roles.css, to p.html
 *   node scripts/build-design.mjs --canvas                   also write the Claude
 *                                                            Design projection into
 *                                                            docs/designs/components/canvas/
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readProperties } from './auk-properties.mjs';
import { anatomy } from './build-properties.mjs';
import { readRoles, EXTENSION } from './build-tokens.mjs';
import { skillKind } from './skill-kind.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const REFS = join(SKILLS, 'ui-theme', 'references');
const OUT_DIR = join(ROOT, 'docs', 'designs', 'components');

/** The first fenced block of `lang` in a reference, or ''. Local on purpose: scripts/build-demos.mjs runs its main body on import, so nothing can share its extractor. */
function fenced(markdown, lang) {
  const m = markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)```'));
  return m ? m[1] : '';
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const titleCase = (name) => name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** Sample text for the alert regions, which are display: none while empty. */
export const ALERT_TEXT = ['Could not save changes. The server rejected the request.', 'Upload finished. 14 files added.', 'Storage is at 92 percent of the quota.', 'Scheduled maintenance starts at 02:00 UTC.'];

/** Fill every empty alert message with sample text, cycling so a fifth region never reads "undefined". */
export function fillAlerts(html) {
  let i = 0;
  return html.replace(/<span data-part="message"><\/span>/g, () => `<span data-part="message">${ALERT_TEXT[(i++) % ALERT_TEXT.length]}</span>`);
}

/**
 * Reject a roles block that binds a name outside the 23 roles. A misspelled role is
 * the one mistake the chain hides: the property falls back to its literal and the
 * page looks as if the theme did nothing.
 *
 * @param {string} css a project's roles block
 * @throws {Error} naming each unknown `--auk-role-*`
 */
export function validateRoles(css) {
  const known = new Set(readRoles().map((r) => `--auk-role-${r.name}`));
  const unknown = [...new Set([...css.matchAll(/--auk-role-[a-z0-9-]+/g)].map((m) => m[0]))].filter((n) => !known.has(n));
  if (unknown.length) throw new Error(`not a role: ${unknown.join(', ')} (the roles are ${[...known].join(', ')})`);
}

function components() {
  return readdirSync(SKILLS).filter((d) => skillKind(join(SKILLS, d)) === 'component').sort();
}

/** Everything one component section needs, read from its reference and the two tables. */
function component(name, properties, roles) {
  const md = readFileSync(join(SKILLS, name, 'references', `${name}.md`), 'utf8');
  const slug = name.replace(/^ui-/, '');
  let html = fenced(md, 'html').trim();
  if (slug === 'dialog') html = html.replace('<dialog class=', '<dialog open class=');
  if (slug === 'alert') html = fillAlerts(html);
  const own = properties.filter((p) => p.component === name);
  const roleOf = new Map(roles.flatMap((r) => r.properties.map((p) => [p, r.name])));
  const init = fenced(md, 'js').match(/export function (init\w+)/)?.[1];
  return { name, slug, html, css: fenced(md, 'css').trim(), js: fenced(md, 'js').replace(/^export /gm, '').trim(), init, anatomy: anatomy(md), own, roleOf };
}

function anatomyTable(a) {
  const rows = [
    ...a.parts.map((p) => ['part', p.name, p.code, p.figma]),
    ...a.variants.map((v) => ['variant', v.name, v.code, v.figma]),
    ...a.states.map((s) => ['state', s.name, s.code, s.figma]),
  ];
  return table(['Kind', 'Name', 'In code', 'Figma name'], rows.map(([k, n, c, f]) => [k, n, c === 'no attribute' || c === 'see Structure' ? c : `<code>${escape(c)}</code>`, `<code>${escape(f)}</code>`]));
}

function table(head, rows) {
  return [
    '<div class="table-wrap"><table>',
    `<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>`,
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n')}</tbody>`,
    '</table></div>',
  ].join('\n');
}

const CHROME = `
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111827; background: #f9fafb; line-height: 1.5; }
header, main { max-inline-size: 64rem; margin-inline: auto; padding: 1.5rem; }
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
h2 { font-size: 1.25rem; margin: 0 0 1rem; }
h3 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }
header p { margin: 0; color: #374151; }
.chips { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: 0.75rem; }
.chips li { display: grid; grid-template-columns: 2.5rem 1fr; gap: 0.75rem; align-items: center; padding: 0.5rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.375rem; }
.swatch { inline-size: 2.5rem; block-size: 2.5rem; border-radius: 0.25rem; border: 1px solid #e5e7eb; background: #ffffff; }
.chips code { font-size: 0.8125rem; }
.chips .meaning, .chips .value { display: block; font-size: 0.8125rem; color: #374151; }
section.component { margin-block: 2.5rem; }
.specimen { display: grid; gap: 1rem; justify-items: start; padding: 1.5rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
.specimen dialog[open] { position: static; margin: 0; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; font-size: 0.875rem; inline-size: 100%; }
th, td { text-align: left; padding: 0.375rem 0.5rem; border-block-end: 1px solid #e5e7eb; vertical-align: top; }
@media print { body { background: #ffffff; } section.component { break-inside: avoid; } }
`.trim();

/** Everything the page and the artboards share, computed once per render. */
function model() {
  const properties = readProperties(SKILLS);
  const roles = readRoles();
  const tokens = JSON.parse(readFileSync(join(REFS, 'auk.tokens.json'), 'utf8')).auk.role;
  const rolesCss = readFileSync(join(REFS, 'auk-roles.css'), 'utf8').trim();
  const chips = roles.map((r) => {
    const token = tokens[r.name];
    const value = token.$extensions[EXTENSION].fallback;
    const swatch = token.$type === 'color' ? `<span class="swatch" style="background: ${escape(value)}" aria-hidden="true"></span>`
      : token.$type === 'shadow' ? `<span class="swatch" style="box-shadow: ${escape(value)}" aria-hidden="true"></span>`
      : '<span class="swatch" aria-hidden="true"></span>';
    return `<li data-role-chip="${r.name}">${swatch}<div><code>--auk-role-${r.name}</code><span class="meaning">${escape(r.meaning)}</span><span class="value"><code>${escape(value)}</code></span></div></li>`;
  });
  return { properties, roles, rolesCss, chips, parts: components().map((name) => component(name, properties, roles)) };
}

function section(c) {
  const tokens = table(['Property', 'Kind', 'Role', 'Fallback'], c.own.map((p) => [`<code>${p.property}</code>`, p.brand ? 'brand' : 'measured', c.roleOf.has(p.property) ? `<code>--auk-role-${c.roleOf.get(p.property)}</code>` : '', `<code>${escape(p.fallback)}</code>`]));
  return [
    `<section class="component" id="${c.slug}" aria-labelledby="${c.slug}-heading">`,
    `<h2 id="${c.slug}-heading">${c.name}</h2>`,
    `<div class="specimen">\n${c.html}\n</div>`,
    '<h3>Anatomy</h3>',
    anatomyTable(c.anatomy),
    '<h3>Tokens</h3>',
    tokens,
    '</section>',
  ].join('\n');
}

/**
 * The sheet as a string.
 *
 * @param {{ roles?: string }} [options] a project's roles block to inline after
 *   auk-roles.css, so a team previews its own brand with no design tool
 */
export function render({ roles = '' } = {}) {
  const m = model();
  const script = [
    ...m.parts.filter((c) => c.js).map((c) => c.js),
    '',
    '// Wiring: every root is initialised, the dialog is already open, and the first popover',
    '// is shown with its trigger as the source, so the reference css anchors it under the',
    '// trigger the way a click would. A browser without the source option still shows it.',
    ...m.parts.filter((c) => c.init).map((c) => `document.querySelectorAll('.auk-${c.slug}').forEach((el) => ${c.init}(el));`),
    "document.getElementById('filters-popover').showPopover({ source: document.getElementById('filters-trigger') });",
  ].join('\n');
  return [
    '<!DOCTYPE html>',
    '<!-- Generated by node scripts/build-design.mjs from the component references. Edit the references, not this file. -->',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>auk component sheet</title>',
    '<style>',
    CHROME,
    '',
    ...m.parts.map((c) => c.css),
    '',
    m.rolesCss,
    ...(roles ? ['', '/* The previewed brand. */', roles.trim()] : []),
    '</style>',
    '</head>',
    '<body>',
    '<header>',
    '<h1>auk component sheet</h1>',
    `<p>Every component's Structure block painted by its shipped CSS${roles ? ', under the previewed brand' : ''}. Print to PDF for hand-off. The tokens file, <code>skills/ui-theme/references/auk.tokens.json</code>, is the record this page is a rendering of.</p>`,
    '</header>',
    '<main>',
    '<section class="component" id="foundations" aria-labelledby="foundations-heading">',
    '<h2 id="foundations-heading">Foundations</h2>',
    '<p>The 23 roles, each with its shipped value. Bind a role and every property chained to it follows.</p>',
    `<ul class="chips">\n${m.chips.join('\n')}\n</ul>`,
    '</section>',
    ...m.parts.map(section),
    '</main>',
    '<script>',
    script,
    '</script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/**
 * The Claude Design projection of the sheet: one `.dc.html` artboard per section plus
 * `canvas.json`, keyed by file name. Vendor-specific: the artboards render only inside
 * that editor; the sheet is the record.
 */
export function renderCanvas() {
  const m = model();
  const artboard = (title, css, body, w, h) => [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    '  <script src="./support.js"></script>',
    '</head>',
    '<body>',
    '<x-dc>',
    '<helmet>',
    '  <style>',
    CHROME,
    'a { color: #1a56db; } a:hover { color: #1e429f; }',
    '.specimen [popover] { display: flex; flex-direction: column; position: static; inset: auto; margin: 0; }',
    css,
    m.rolesCss,
    '  </style>',
    '</helmet>',
    `<div style="width: ${w}px; height: ${h}px; box-sizing: border-box; overflow: auto; background: #f9fafb; padding: 24px; display: flex; flex-direction: column; gap: 16px;">`,
    `  <h2 style="margin: 0; font-size: 20px;">${title}</h2>`,
    body,
    '</div>',
    '</x-dc>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
  const files = {};
  const boards = [];
  files['Main.dc.html'] = artboard('Foundations', '', `<ul class="chips">\n${m.chips.join('\n')}\n</ul>`, 1200, 760);
  boards.push({ file: 'Main.dc.html', title: 'Foundations', x: 0, y: 0, w: 1200, h: 760 });
  m.parts.forEach((c, i) => {
    const file = `${titleCase(c.slug).replace(/ /g, '')}.dc.html`;
    files[file] = artboard(c.name, c.css, `<div class="specimen">\n${c.html}\n</div>\n${anatomyTable(c.anatomy)}`, 880, 720);
    boards.push({ file, title: c.name, x: (i % 3) * 960, y: 880 + Math.floor(i / 3) * 840, w: 880, h: 720 });
  });
  files['canvas.json'] = JSON.stringify({ artboards: boards, launch: { view: 'canvas' } }, null, 2) + '\n';
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  // A flag's value is the next argument, and only when it is not itself a flag: a
  // bare `--roles` must fail loudly rather than fall through and rewrite the sheet.
  const flag = (name) => {
    const at = args.indexOf(name);
    const value = at === -1 ? undefined : args[at + 1];
    return value === undefined || value.startsWith('-') ? '' : value;
  };
  if (args.includes('--roles')) {
    const rolesPath = flag('--roles');
    const out = flag('-o');
    if (!rolesPath || !existsSync(rolesPath)) {
      console.error(`--roles: no such file: ${rolesPath || '(missing)'}`);
      process.exit(1);
    }
    if (!out) {
      console.error('--roles needs -o <path>: the preview never overwrites the sheet');
      process.exit(1);
    }
    const roles = readFileSync(rolesPath, 'utf8');
    try {
      validateRoles(roles);
    } catch (error) {
      console.error(`${rolesPath}: ${error.message}`);
      process.exit(1);
    }
    writeFileSync(out, render({ roles }));
    console.log(`wrote ${out} (preview of ${rolesPath}; open it from disk, print to PDF to hand off)`);
  } else {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, 'index.html'), render());
    console.log(`wrote ${join(OUT_DIR, 'index.html')}`);
    if (args.includes('--canvas')) {
      const dir = join(OUT_DIR, 'canvas');
      mkdirSync(dir, { recursive: true });
      for (const [file, text] of Object.entries(renderCanvas())) writeFileSync(join(dir, file), text);
      console.log(`wrote ${dir}/ - the Claude Design projection of the sheet; the sheet is the record`);
    }
  }
}
