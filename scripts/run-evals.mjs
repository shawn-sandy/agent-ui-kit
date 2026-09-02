#!/usr/bin/env node
// Evaluation runner. Two modes:
//   baseline  - runs each scenario with every skill disabled, to record what the
//               model produces unaided.
//   skills    - runs each scenario with this repo loaded as a plugin, and records
//               which skill (if any) the model actually invoked.
// Results land in evals/results/ as JSON. docs/evaluations.md is written by hand
// from those files so the prose stays reviewable.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'evals/results');
// Evals run outside the repo, in a throwaway copy of a small project. A skills run
// only reaches for a skill if it has something concrete to work on, so the model gets
// a real index.html - and its own copy, so runs cannot see each other's edits.
const SANDBOX = process.env.EVAL_SANDBOX || tmpdir();
const FIXTURE_PROJECT = process.env.EVAL_PROJECT || null;

/** A fresh working copy of the fixture project, or the shared sandbox if there is none. */
function workspaceFor(label) {
  mkdirSync(SANDBOX, { recursive: true });
  if (!FIXTURE_PROJECT) return SANDBOX;
  const dir = resolve(SANDBOX, 'run-' + label.replace(/[^a-z0-9]+/gi, '-'));
  rmSync(dir, { recursive: true, force: true });
  cpSync(FIXTURE_PROJECT, dir, { recursive: true });
  return dir;
}
const MODELS = (process.env.EVAL_MODELS || 'haiku,sonnet,opus').split(',');
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY || 4);
const mode = process.argv[2];
// "isolated" loads only this plugin's skills, which measures the descriptions.
// "crowded" additionally loads whatever the operator already has installed, which
// measures discovery under competition. Both are worth knowing and they differ.
const ISOLATE = process.env.EVAL_ISOLATE !== '0';
const LABEL = ISOLATE ? 'isolated' : 'crowded';

const scenarios = readdirSync(resolve(ROOT, 'evals'))
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => {
    const doc = JSON.parse(readFileSync(resolve(ROOT, 'evals', f), 'utf8'));
    return doc.scenarios.map((s) => ({ ...s, skill: doc.skill }));
  });

const BASELINE_PREAMBLE =
  'You are answering a frontend question. Reply with the HTML, CSS and JavaScript ' +
  'you would write, and nothing else. Do not read or write any files.';

// stdin is closed explicitly: the CLI otherwise waits 3s per run for piped input.
function claude(args, timeoutMs = 300000, cwd = SANDBOX) {
  mkdirSync(cwd, { recursive: true });
  return new Promise((done) => {
    const child = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'], cwd });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    // Without this a spawn failure is an unhandled 'error' event and takes the whole
    // run down silently.
    child.on('error', (e) => {
      clearTimeout(timer);
      done(`__EVAL_ERROR__ spawn failed: ${e.message}`);
    });
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => {
      clearTimeout(timer);
      done(code === 0 ? out : `__EVAL_ERROR__ exit ${code}\n${err}\n${out}`);
    });
  });
}

/**
 * Which named signals a baseline answer shows. `detect` maps a human-readable label
 * to a pattern, so the record says what the model did rather than only pass or fail.
 */
function classify(text, detect) {
  const signals = {};
  for (const [label, pattern] of Object.entries(detect || {})) {
    signals[label] = new RegExp(pattern, 'i').test(text);
  }
  return { signals };
}

async function baselineOne(sc, model) {
  const out = await claude([
    '-p', '--model', model, '--disable-slash-commands', '--strict-mcp-config',
    `${BASELINE_PREAMBLE}\n\n${sc.prompt}`,
  ]);
  return { id: sc.id, skill: sc.skill, kind: sc.kind, model, ...classify(out, sc.detect), chars: out.length, output: out };
}

// The Skill tool call is the activation signal. stream-json emits one assistant
// message per tool use; we look for a Skill invocation and pull the skill name out.
function skillsInvoked(streamJson) {
  const names = new Set();
  for (const line of streamJson.split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    let evt;
    try { evt = JSON.parse(line); } catch { continue; }
    const content = evt?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block.type === 'tool_use' && block.name === 'Skill' && block.input?.skill) {
        names.add(String(block.input.skill));
      }
    }
  }
  return [...names];
}

async function skillsOne(sc, model) {
  const cwd = workspaceFor(`${model}-${sc.id}`);
  const out = await claude([
    '-p', '--model', model, '--plugin-dir', ROOT,
    '--output-format', 'stream-json', '--verbose', '--max-turns', '8',
    '--strict-mcp-config', '--permission-mode', 'acceptEdits',
    ...(ISOLATE ? ['--setting-sources', 'project'] : []),
    sc.prompt,
  ], 420000, cwd);
  const invoked = skillsInvoked(out);
  const ours = invoked.filter((n) => n.startsWith('agent-ui-kit'));
  const fired = ours.some((n) => n.endsWith(':' + sc.skill));
  // An adjacent scenario asserts that THIS skill stays quiet. Another skill in the
  // kit answering instead is a correct outcome, not a miss - "blocks the page until
  // they confirm" really is the dialog's job, and the alert must not claim it.
  const correct = sc.expect === null ? !fired : fired;
  return { id: sc.id, skill: sc.skill, kind: sc.kind, expect: sc.expect, model, mode: LABEL, invoked, correct };
}

async function pool(items, worker) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        process.stderr.write(`  ${item.label}\n`);
        results.push(await worker(item));
      }
    }),
  );
  return results;
}

mkdirSync(OUT, { recursive: true });

if (mode === 'baseline') {
  // Adjacent scenarios assert non-triggering; there is nothing to baseline.
  const jobs = MODELS.flatMap((m) =>
    scenarios.filter((s) => s.kind !== 'adjacent').map((s) => ({ sc: s, model: m, label: `baseline ${m} ${s.id}` })),
  );
  const res = await pool(jobs, ({ sc, model }) => baselineOne(sc, model));
  writeFileSync(resolve(OUT, 'baseline.json'), JSON.stringify(res, null, 2));
  for (const r of res) {
    const shown = Object.entries(r.signals).map(([k, v]) => `${v ? 'YES' : 'no '} ${k}`).join(' | ');
    console.log(`${r.model}\t${r.id}\t${shown || '-'}`);
  }
} else if (mode === 'skills') {
  const jobs = MODELS.flatMap((m) => scenarios.map((s) => ({ sc: s, model: m, label: `skills ${m} ${s.id}` })));
  const res = await pool(jobs, ({ sc, model }) => skillsOne(sc, model));
  writeFileSync(resolve(OUT, `skills-${LABEL}.json`), JSON.stringify(res, null, 2));
  for (const r of res) {
    console.log(`${r.mode}\t${r.model}\t${r.id}\texpect=${r.expect ?? 'none'}\tinvoked=${r.invoked.join(',') || '-'}\t${r.correct ? 'PASS' : 'FAIL'}`);
  }
} else {
  console.error('usage: node scripts/run-evals.mjs baseline|skills');
  process.exit(2);
}
