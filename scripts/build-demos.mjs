#!/usr/bin/env node
/**
 * Rewrite each demo page's component code from its reference.
 *
 * The component's CSS and JavaScript live in the reference as fenced blocks - that
 * is the copy a user takes. The demo needs the same code inlined rather than pulled
 * from a sibling file, because a split demo runs under headless Chrome and then
 * fails in a real browser opened from disk. So the code exists twice, and the two
 * copies have to stay identical.
 *
 * Rather than a separate template that would be a third near-copy of the page, the
 * demo IS the template. Each generated region is delimited by one marker line plus
 * the surrounding tag:
 *
 *   <style>   page chrome ... MARKER, then the reference css, to </style>
 *   <script>  the reference module, to MARKER, then the demo wiring
 *
 * Everything outside those regions - the markup, the page chrome, the wiring - is
 * hand-written and left untouched.
 *
 *   node scripts/build-demos.mjs               rewrite every demo
 *   node scripts/build-demos.mjs --check       report stale demos, write nothing, exit 1
 *   node scripts/build-demos.mjs --check <dir>  the same against another tree, so the
 *                                               gate can be proven against a fixture
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
// An explicit directory is only ever used to prove this gate can fail; the real run
// takes the default. Mirrors scripts/lint-portability.mjs, which takes one for the
// same reason.
const target = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const SKILLS_DIR = target ? resolve(ROOT, target) : join(ROOT, 'skills');

/** The first fenced block of a given language, without its trailing newline. */
function fencedBlock(markdown, lang) {
  const match = markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'm'));
  return match ? match[1].replace(/\n$/, '') : null;
}

/** Escape a literal for use inside a RegExp. */
function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function build(name) {
  const dir = join(SKILLS_DIR, name, 'references');
  const referencePath = join(dir, `${name}.md`);
  const demoPath = join(dir, 'demo.html');
  if (!existsSync(referencePath) || !existsSync(demoPath)) {
    throw new Error(`${name}: expected ${name}.md and demo.html under references/`);
  }

  const reference = readFileSync(referencePath, 'utf8');
  const before = readFileSync(demoPath, 'utf8');
  const marker = `/* Generated from ${name}.md by scripts/build-demos.mjs. Edit the reference, not this. */`;
  let after = before;

  const css = fencedBlock(reference, 'css');
  if (css === null) throw new Error(`${name}: reference has no css block`);
  const cssRegion = new RegExp(`(${escape(marker)}\\n)[\\s\\S]*?(\\n</style>)`);
  if (!cssRegion.test(after)) throw new Error(`${name}: demo has no generated css region`);
  after = after.replace(cssRegion, `$1${css}$2`);

  // A CSS-only component has no module, and its demo carries only hand-written
  // wiring - there is no generated script region to rewrite.
  const js = fencedBlock(reference, 'js');
  if (js !== null) {
    const jsRegion = new RegExp(`(<script>\\n)[\\s\\S]*?(\\n${escape(marker)})`);
    if (!jsRegion.test(after)) throw new Error(`${name}: demo has no generated script region`);
    after = after.replace(jsRegion, `$1${js.replace(/^export /gm, '')}$2`);
  }

  return { name, demoPath, changed: after !== before, after };
}

const names = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const results = names.map(build);
const stale = results.filter((r) => r.changed);

if (CHECK) {
  for (const r of stale) console.error(`stale: ${r.name}/references/demo.html`);
  if (stale.length > 0) {
    console.error(`\n${stale.length} demo(s) out of date. Run: node scripts/build-demos.mjs`);
    process.exit(1);
  }
  console.log(`${results.length} demo(s) up to date`);
} else {
  for (const r of stale) writeFileSync(r.demoPath, r.after);
  console.log(
    stale.length === 0
      ? `${results.length} demo(s) already up to date`
      : `rewrote ${stale.map((r) => r.name).join(', ')}`,
  );
}
