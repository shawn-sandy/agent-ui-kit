#!/usr/bin/env node
// Portability lint. Scans skills/ only - test fixtures live outside it on purpose,
// so a deliberately broken fixture never trips the real gate.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = resolve(ROOT, process.argv[2] || 'skills');
// Importing this module for its RULES must not run the lint.
const IS_CLI = process.argv[1] && process.argv[1].endsWith('lint-portability.mjs');

/** Each rule is a name, a pattern, and why the pattern is fatal to portability. */
export const RULES = [
  ['claude-plugin-root', /\$\{CLAUDE_PLUGIN_ROOT\}/, 'Claude Code variable; Codex does not expand it'],
  ['disable-model-invocation', /^\s*disable-model-invocation\s*:/m, 'Claude Code frontmatter extension'],
  ['hint-frontmatter', /^\s*hint\s*:/m, 'Claude Code frontmatter extension'],
  ['backslash-path', /(?:\.\.?|[\w-])\\[\w-]+\.(?:md|html|css|js|json)/, 'Windows path separator'],
  ['framework', /\b(?:React|Vue|Svelte|Angular|Next\.js|Tailwind|jQuery|styled-components)\b/, 'names a framework or library'],
  ['preprocessor', /\b(?:SCSS|Sass|LESS|Stylus|PostCSS)\b/, 'names a CSS preprocessor'],
  ['package-import', /\b(?:import\s+.*\s+from\s+['"][^.\/][^'"]*['"]|require\(['"][^.\/])/, 'imports an external package'],
  ['npm-install', /\bnpm\s+(?:i|install|add)\b|\byarn\s+add\b|\bpnpm\s+add\b/, 'tells the reader to install a package'],
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!IS_CLI) {
  // imported for RULES only
} else {
let failures = 0;
let scanned = 0;
for (const file of walk(SKILLS)) {
  const text = readFileSync(file, 'utf8');
  scanned += 1;
  for (const [rule, pattern, why] of RULES) {
    const hit = text.match(pattern);
    if (hit) {
      console.error(`  ${relative(ROOT, file)}: ${rule} - ${why} (found "${hit[0].slice(0, 40)}")`);
      failures += 1;
    }
  }
}

console.log(`  scanned ${scanned} files under ${relative(ROOT, SKILLS)}/`);
if (failures > 0) {
  console.error(`  ${failures} portability violation(s)`);
  process.exit(1);
}
}
