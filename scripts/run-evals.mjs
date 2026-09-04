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

/**
 * A private working directory for one run, holding a fresh copy of the fixture
 * project when there is one.
 *
 * Never the shared sandbox: runs execute concurrently under `--permission-mode
 * acceptEdits`, so a shared directory lets one scenario edit files another is
 * reading, and which result you get then depends on scheduling.
 */
function workspaceFor(label) {
  const dir = resolve(SANDBOX, 'run-' + label.replace(/[^a-z0-9]+/gi, '-'));
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (FIXTURE_PROJECT) cpSync(FIXTURE_PROJECT, dir, { recursive: true });
  return dir;
}
/**
 * A private copy of the plugin for one run: `.claude-plugin/` and `skills/` only.
 *
 * Why a copy and not `--plugin-dir ROOT` plus `--add-dir ROOT`: runs execute
 * under `--permission-mode acceptEdits`, which auto-approves edits and `cp`/`mv`
 * inside every added directory, so adding the live checkout would let
 * EVAL_CONCURRENCY runs write into it at once. Without an add-dir at all, every
 * read of the plugin's own `references/` from inside a run is denied and the
 * model builds from the SKILL.md summary instead. Copying only the plugin also
 * keeps `evals/` (the answer key) and `.claude/skills/` out of the run.
 */
function pluginFor(label) {
  const dir = resolve(SANDBOX, 'plugin-' + label.replace(/[^a-z0-9]+/gi, '-'));
  rmSync(dir, { recursive: true, force: true });
  for (const sub of ['.claude-plugin', 'skills']) {
    cpSync(resolve(ROOT, sub), resolve(dir, sub), { recursive: true });
  }
  return dir;
}
const MODELS = (process.env.EVAL_MODELS || 'haiku,sonnet,opus').split(',');
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY || 4);
if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) {
  // Zero workers would write an empty result file and exit 0, which reads exactly
  // like a completed sweep.
  console.error(`EVAL_CONCURRENCY must be a positive integer, got ${JSON.stringify(process.env.EVAL_CONCURRENCY)}`);
  process.exit(2);
}
const mode = process.argv[2];
// "isolated" loads only this plugin's skills, which measures the descriptions.
// "crowded" additionally loads whatever the operator already has installed, which
// measures discovery under competition. Both are worth knowing and they differ.
const ISOLATE = process.env.EVAL_ISOLATE !== '0';
const LABEL = ISOLATE ? 'isolated' : 'crowded';

// EVAL_SKILLS=ui-theme,ui-button narrows a sweep to the named skills' scenarios. A
// full sweep is about 75 model calls; re-measuring one skill's description after an
// edit does not need the other six to run again.
const ONLY = process.env.EVAL_SKILLS ? process.env.EVAL_SKILLS.split(',').map((s) => s.trim()) : null;
const scenarios = readdirSync(resolve(ROOT, 'evals'))
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !ONLY || ONLY.includes(f.replace(/\.json$/, '')))
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
  return {
    id: sc.id, skill: sc.skill, kind: sc.kind, model, error: isError(out),
    ...classify(out, sc.detect), chars: out.length, output: out,
  };
}

/** True when the CLI never produced a usable answer - a spawn failure or non-zero exit. */
function isError(output) {
  return output.startsWith('__EVAL_ERROR__');
}

/** Every parsed stream-json event in the CLI's output, header lines from a failed run skipped. */
function events(streamJson) {
  const out = [];
  for (const line of streamJson.split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    try { out.push(JSON.parse(line)); } catch { /* a partial line */ }
  }
  return out;
}

// The Skill tool call is the activation signal. stream-json emits one assistant
// message per tool use; we look for a Skill invocation and pull the skill name out.
function skillsInvoked(streamJson) {
  const names = new Set();
  for (const evt of events(streamJson)) {
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

/**
 * How the run ended, for the record: the CLI's result subtype (`success`,
 * `error_max_turns`, ...), or the exit header when the process never produced one.
 */
function exitOf(output) {
  const result = events(output).find((evt) => evt.type === 'result');
  if (result?.subtype) return result.subtype;
  return isError(output) ? output.split('\n')[0].replace('__EVAL_ERROR__ ', '') : 'no result event';
}

async function skillsOne(sc, model) {
  const cwd = workspaceFor(`${model}-${sc.id}`);
  const plugin = pluginFor(`${model}-${sc.id}`);
  const out = await claude([
    '-p', '--model', model, '--plugin-dir', plugin,
    // --add-dir is variadic: the option after it is what stops it swallowing the
    // prompt, so never make it the last option before the prompt.
    '--add-dir', plugin,
    '--output-format', 'stream-json', '--verbose', '--max-turns', '8',
    '--strict-mcp-config', '--permission-mode', 'acceptEdits',
    ...(ISOLATE ? ['--setting-sources', 'project'] : []),
    sc.prompt,
  ], 420000, cwd);
  const invoked = skillsInvoked(out);
  const ours = invoked.filter((n) => n.startsWith('agent-ui-skills'));
  const fired = ours.some((n) => n.endsWith(':' + sc.skill));
  // Reached a model: the stream holds at least one assistant message. A non-zero exit
  // after that - the CLI stopping at --max-turns while the model was still working,
  // most often - is recorded under `exit` but is not a crash: the triggering decision
  // this run measures was already made and captured above.
  const reached = events(out).some((evt) => evt.type === 'assistant');
  const error = !reached;
  const exit = exitOf(out);
  // An adjacent scenario asserts that THIS skill stays quiet. Another component
  // skill answering instead is a correct outcome, not a miss - "blocks the page until
  // they confirm" really is the dialog's job, and the alert must not claim it.
  //
  // A run that never reached a model is never correct. Without this an adjacent
  // scenario would score as a pass precisely because the CLI crashed and nothing
  // fired, which is the one outcome that proves nothing.
  const correct = error ? false : sc.expect === null ? !fired : fired;
  return {
    id: sc.id, skill: sc.skill, kind: sc.kind, expect: sc.expect,
    model, mode: LABEL, invoked, error, exit, correct,
  };
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
    console.log(`${r.mode}\t${r.model}\t${r.id}\texpect=${r.expect ?? 'none'}\tinvoked=${r.invoked.join(',') || '-'}\texit=${r.exit}\t${r.correct ? 'PASS' : 'FAIL'}`);
  }
} else {
  console.error('usage: node scripts/run-evals.mjs baseline|skills');
  process.exit(2);
}
