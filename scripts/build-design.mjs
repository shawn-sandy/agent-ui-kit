#!/usr/bin/env node
/**
 * Render the component sheet, docs/designs/components/index.html: every component's
 * Structure block painted live by its own shipped CSS, beside its anatomy and the roles
 * it reads, under a Foundations section of the 23 roles. The real CSS paints the real
 * markup, so the sheet cannot disagree with the code, which is what makes it the
 * design-side record. It opens from disk with no network, exactly as the demos do, and
 * print to PDF is the hand-off. tests/integration/design-sheet.spec.ts pins it to
 * render() byte for byte; tests/e2e/design-sheet.spec.ts opens it.
 *
 *   node scripts/build-design.mjs                            rewrite the sheet
 *   node scripts/build-design.mjs --roles <file> -o <path>   a brand preview: the same
 *                                sheet with auk-roles.css and the given role block
 *                                inlined, written to <path>; the sheet is untouched
 *   node scripts/build-design.mjs --canvas                   also write the Claude Design
 *                                projection - one artboard per section plus canvas.json -
 *                                into docs/designs/components/canvas/
 *
 * The canvas is a projection of the sheet, and Claude-only: any other agent runs the
 * generator and opens the sheet, and loses nothing but the pan-and-zoom page. A Figma
 * kit, when a team asks for one, is built from the sheet with figma-generate-design.
 *
 * The fenced-block helper is local on purpose: scripts/build-demos.mjs runs its main
 * body on import, so nothing can share code with it.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readProperties } from './auk-properties.mjs';
import { anatomy } from './build-properties.mjs';
import { readRoles, ROLES_OUT } from './build-tokens.mjs';
import { skillKind } from './skill-kind.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const OUT_DIR = join(ROOT, 'docs', 'designs', 'components');
export const OUT = join(OUT_DIR, 'index.html');
export const CANVAS_DIR = join(OUT_DIR, 'canvas');

/** The first fenced block of a given language, without its trailing newline, or null. */
const fenced = (markdown, lang) => markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'm'))?.[1]?.replace(/\n$/, '') ?? null;
const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const titleCase = (name) => name.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

/** Every component skill with the three blocks the sheet paints from. */
function components() {
  return readdirSync(SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => skillKind(join(SKILLS, name)) === 'component')
    .sort()
    .map((skill) => {
      const md = readFileSync(join(SKILLS, skill, 'references', `${skill}.md`), 'utf8');
      const slug = skill.replace(/^ui-/, '');
      return { skill, slug, title: titleCase(slug), md, html: fenced(md, 'html') ?? '', css: fenced(md, 'css') ?? '', js: fenced(md, 'js') };
    });
}

/**
 * Throw when a role block names a role the mapping table does not have. A misspelled
 * role binds nothing and looks like a theme that did nothing, so the preview refuses it.
 *
 * @param {string} css a block of --auk-role-* declarations
 */
export function validateRoles(css) {
  const known = readRoles().map((r) => r.name);
  const unknown = [...new Set([...css.matchAll(/--auk-role-([a-z0-9-]+)/g)].map((m) => m[1]))].filter((n) => !known.includes(n));
  if (unknown.length > 0) {
    throw new Error(`unknown role${unknown.length > 1 ? 's' : ''} ${unknown.map((n) => `--auk-role-${n}`).join(', ')}; the roles are ${known.join(', ')}`);
  }
}

/** Page chrome. Scoped to sheet classes so nothing here styles a component's own elements, except the one rule that lets an open dialog sit in the flow. */
const CHROME = `  :root { color-scheme: light; }
  body { margin: 0; padding: 2rem 2.5rem 4rem; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111827; background: #ffffff; line-height: 1.5; }
  .sheet-header { border-block-end: 1px solid #e5e7eb; padding-block-end: 1rem; margin-block-end: 2rem; }
  .sheet-header h1 { margin: 0 0 .25rem; font-size: 1.75rem; }
  .sheet-header p, .sheet-meta { margin: .25rem 0; color: #4b5563; max-width: 72ch; font-size: .9375rem; }
  .sheet-section { margin-block: 2.5rem; }
  .sheet-section > h2 { font-size: 1.25rem; margin: 0 0 .25rem; }
  .chips { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: .75rem; }
  .chip { display: flex; gap: .75rem; align-items: flex-start; border: 1px solid #e5e7eb; border-radius: .375rem; padding: .625rem; font-size: .8125rem; }
  .swatch { flex: none; inline-size: 2.5rem; block-size: 2.5rem; border-radius: .25rem; border: 1px solid #e5e7eb; background: #ffffff; }
  .swatch-radius { border: 2px solid #111827; }
  .swatch-font { text-align: center; line-height: 2.5rem; font-weight: 600; }
  .chip-body { display: grid; gap: .1rem; min-inline-size: 0; }
  .chip-name { font-weight: 600; }
  .chip code, .sheet-table code, .sheet-meta code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .8125em; }
  .chip-value { color: #4b5563; overflow-wrap: anywhere; }
  .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 1.25rem; align-items: start; margin-block-start: 1rem; }
  .panel { border: 1px solid #e5e7eb; border-radius: .375rem; padding: 1rem; min-inline-size: 0; }
  .panel > h3 { margin: 0 0 .5rem; font-size: .9375rem; }
  .panel > p { margin: 0 0 .75rem; color: #4b5563; font-size: .875rem; }
  .stage { display: flex; flex-wrap: wrap; gap: .75rem; align-items: flex-start; padding: 1rem; background: #f9fafb; border-radius: .25rem; }
  .stage .auk-tabs, .stage .auk-dialog[open] { flex: 1 1 100%; }
  .stage .auk-dialog[open] { position: static; margin: 0; max-inline-size: 100%; }
  .sheet-table { border-collapse: collapse; inline-size: 100%; font-size: .8125rem; }
  .sheet-table th, .sheet-table td { text-align: start; padding: .3rem .5rem; border-block-end: 1px solid #e5e7eb; vertical-align: top; }
  .sheet-table th { color: #4b5563; font-weight: 600; }
  @media print { body { padding: 0; } .panel, .stage, .chip { break-inside: avoid; } }`;

/** One role chip: name, property, a painted swatch for a colour or shadow, text for a radius or font. */
function chip(role) {
  const kind = ['shadow', 'radius', 'font'].includes(role.name) ? role.name : 'colour';
  const style = { colour: `background: ${role.fallback};`, shadow: `box-shadow: ${role.fallback};`, radius: `border-radius: ${role.fallback};`, font: '' }[kind];
  const swatch = `<span class="swatch swatch-${kind}"${style ? ` style="${escape(style)}"` : ''} aria-hidden="true">${kind === 'font' ? 'Aa' : ''}</span>`;
  return `<li class="chip" data-role="${role.name}">${swatch}<span class="chip-body"><span class="chip-name">${role.name}</span><code>--auk-role-${role.name}</code><span class="chip-value">${escape(role.fallback)}</span><span>${escape(role.meaning)}</span></span></li>`;
}

/** The Foundations section: the 23 roles with their shipped values. */
function foundations(roles) {
  return `<section class="sheet-section" id="foundations" aria-labelledby="h-foundations">
  <h2 id="h-foundations">Foundations</h2>
  <p class="sheet-meta">The ${roles.length} semantic roles every brand-bearing component property chains to, with the shipped value each role starts from. A project binds these and nothing else; <code>skills/ui-theme/references/auk.tokens.json</code> is the same list as a token file.</p>
  <ul class="chips">
${roles.map(chip).join('\n')}
  </ul>
</section>`;
}

/** The three panels of one component section; the markup for the dialog is shown open. */
function sectionBody(c, roles, properties) {
  const a = anatomy(c.md);
  const own = properties.filter((p) => p.component === c.skill);
  const read = roles.filter((r) => r.properties.some((p) => p.startsWith(`--auk-${c.slug}-`)));
  const roleOf = new Map(roles.flatMap((r) => r.properties.map((p) => [p, r.name])));
  const code = (text) => (text.startsWith('no ') ? escape(text) : `<code>${escape(text)}</code>`);
  const row = (cells) => `        <tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
  const html = c.slug === 'dialog' ? c.html.replace('<dialog class="auk-dialog"', '<dialog open class="auk-dialog"') : c.html;
  return `  <h2 id="h-${c.skill}">${c.title}</h2>
  <p class="sheet-meta">Skill <code>${c.skill}</code>, root class <code>auk-${c.slug}</code>, ${own.length} properties of which ${own.filter((p) => p.brand).length} carry brand.</p>
  <div class="panels">
    <div class="panel" id="specimen-${c.skill}">
      <h3>Specimen</h3>
      <p>The reference's Structure block, painted by its own Styles block: every variant and state the contract names.</p>
      <div class="stage">
${html}
      </div>
    </div>
    <div class="panel">
      <h3>Anatomy</h3>
      <p>The same names in code and in a design tool, by rule.</p>
      <table class="sheet-table">
        <thead><tr><th>Kind</th><th>Name</th><th>In code</th><th>Figma name</th></tr></thead>
        <tbody>
${[
  ...a.parts.map((p) => row(['part', p.name, code(p.code), `<code>${escape(p.figma)}</code>`])),
  ...a.variants.map((v) => row(['variant', v.name, code(v.code), `<code>${escape(v.figma)}</code>`])),
  ...a.states.map((s) => row(['state', s.name, code(s.code), `<code>${escape(s.figma)}</code>`])),
].join('\n')}
        </tbody>
      </table>
    </div>
    <div class="panel">
      <h3>Tokens</h3>
      <p>Roles read: ${read.map((r) => `<code>var(--auk-role-${r.name})</code>`).join(', ')}.</p>
      <table class="sheet-table">
        <thead><tr><th>Property</th><th>Shipped fallback</th><th>Kind</th><th>Role</th></tr></thead>
        <tbody>
${own.map((p) => row([`<code>${p.property}</code>`, `<code>${escape(p.fallback)}</code>`, p.brand ? 'brand' : 'measured', roleOf.get(p.property) ?? '-'])).join('\n')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/** The inlined modules, exports stripped, then the wiring that brings every specimen to its painted state. */
function script(list) {
  const modules = list.filter((c) => c.js).map((c) => c.js.replace(/^export /gm, ''));
  const inits = list.filter((c) => c.js).map((c) => `document.querySelectorAll('.auk-${c.slug}').forEach(init${c.title.replace(/ /g, '')});`);
  return [
    ...modules,
    '// Bring each specimen to the state where its surfaces are painted: modules wired, the',
    '// auto popover shown against its trigger, a message written into every alert region.',
    ...inits,
    "document.querySelectorAll('.auk-popover[popover=\"auto\"]').forEach((el) => {",
    "  const trigger = document.querySelector('[popovertarget=\"' + el.id + '\"]');",
    '  try { el.showPopover(trigger ? { source: trigger } : undefined); } catch (e) { el.showPopover(); }',
    '});',
    "document.querySelectorAll('.auk-alert [data-part=\"message\"]').forEach((el) => {",
    "  el.textContent = 'Written into the region after load, the way a page would.';",
    '});',
  ].join('\n');
}

/**
 * The sheet as a string.
 *
 * @param {{ roles?: string }} [options] a role block to preview a brand with; auk-roles.css is inlined before it
 * @returns {string}
 */
export function render(options = {}) {
  const list = components();
  const roles = readRoles();
  const properties = readProperties(SKILLS);
  const preview = options.roles
    ? `<style>\n/* Brand preview: the generated roles file, then the project's role block. */\n${readFileSync(ROLES_OUT, 'utf8').trimEnd()}\n${options.roles.trim()}\n</style>\n`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>auk component sheet</title>
<style>
${CHROME}
</style>
<style>
${list.map((c) => c.css).join('\n\n')}
</style>
${preview}</head>
<body>
<header class="sheet-header">
  <h1>auk component sheet</h1>
  <p>Every component from the <code>ui-</code> skills, painted by its own shipped CSS${options.roles ? ' with a brand bound through the role layer' : ' with nothing bound'}: the ${roles.length} roles first, then each component's specimen, anatomy and tokens. The dialog and the auto popover are shown open, and the alert regions carry a message written after load.</p>
  <p>Generated by <code>node scripts/build-design.mjs</code> from the six component references. It opens from disk with no network; print it for a hand-off. A design canvas or a design-tool kit built from this page is a projection of it, never the record.</p>
</header>
<main>
${foundations(roles)}
${list.map((c) => `<section class="sheet-section" id="${c.skill}" aria-labelledby="h-${c.skill}">\n${sectionBody(c, roles, properties)}\n</section>`).join('\n')}
</main>
<script>
${script(list)}
</script>
</body>
</html>
`;
}

/**
 * The Claude Design projection: one artboard per sheet section plus canvas.json, in the
 * shape docs/designs/add-ui-theme-workflow-skill/ uses. Keyed by file name.
 *
 * @returns {Record<string, string>}
 */
export function renderCanvas() {
  const list = components();
  const roles = readRoles();
  const properties = readProperties(SKILLS);
  const artboard = (body, css, js, height) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
${CHROME}
${css}
  </style>
</helmet>
<div style="width: 1200px; height: ${height}px; box-sizing: border-box; overflow: auto; background: #ffffff; padding: 32px 36px; color: #111827;">
${body}
</div>
${js ? `<script>\n${js}\n</script>\n` : ''}</x-dc>
</body>
</html>
`;
  const files = {};
  const boards = [{ file: 'foundations.dc.html', title: 'Foundations - the 23 roles', x: 0, y: 0, w: 1200, h: 640 }];
  files['foundations.dc.html'] = artboard(foundations(roles), '', '', 640);
  list.forEach((c, i) => {
    const file = `${c.skill}.dc.html`;
    boards.push({ file, title: `${c.title} - specimen, anatomy, tokens`, x: (i % 3) * 1280, y: 780 + Math.floor(i / 3) * 840, w: 1200, h: 760 });
    files[file] = artboard(sectionBody(c, roles, properties), c.css, script([c]), 760);
  });
  files['canvas.json'] = JSON.stringify(
    {
      artboards: boards,
      annotations: [
        {
          id: 'projection-note',
          x: 1260,
          y: 40,
          w: 320,
          text: 'Claude Design projection of docs/designs/components/index.html, written by scripts/build-design.mjs --canvas.\nThe sheet is the record; regenerate, never edit these artboards.',
        },
      ],
      launch: { view: 'canvas' },
    },
    null,
    2,
  ) + '\n';
  return files;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const after = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  if (args.includes('--roles')) {
    const file = after('--roles');
    const out = after('-o');
    if (!file || !out) fail('usage: node scripts/build-design.mjs --roles <file> -o <path>');
    if (!existsSync(file)) fail(`roles file not found: ${file}`);
    const block = readFileSync(file, 'utf8');
    try {
      validateRoles(block);
    } catch (error) {
      fail(error.message);
    }
    writeFileSync(out, render({ roles: block }));
    console.log(`wrote ${out} - a brand preview; the sheet at ${OUT} is unchanged`);
  } else {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT, render());
    console.log(`wrote ${OUT}`);
    if (args.includes('--canvas')) {
      mkdirSync(CANVAS_DIR, { recursive: true });
      const files = renderCanvas();
      for (const [name, text] of Object.entries(files)) writeFileSync(join(CANVAS_DIR, name), text);
      console.log(`wrote ${Object.keys(files).length} files into ${CANVAS_DIR} - the Claude Design projection of the sheet; the sheet is the record`);
    }
  }
}
