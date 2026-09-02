#!/usr/bin/env node
// Score a stored skills run. Kept separate from the runner so the correctness rule
// can be corrected without paying for another 36 model calls.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || 'evals/results/skills-isolated.json';
const rows = JSON.parse(readFileSync(resolve(ROOT, file), 'utf8'));

const score = (r) => {
  const ours = r.invoked.filter((n) => n.startsWith('agent-ui-kit'));
  const fired = ours.some((n) => n.endsWith(':' + r.skill));
  return r.expect === null ? !fired : fired;
};

const byModel = {};
for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
  const ok = score(r);
  byModel[r.model] = byModel[r.model] || { pass: 0, total: 0 };
  byModel[r.model].total += 1;
  if (ok) byModel[r.model].pass += 1;
  console.log(`${r.model}\t${r.id}\t${r.invoked.join(',') || '-'}\t${ok ? 'PASS' : 'FAIL'}`);
}
console.log('');
for (const [model, s] of Object.entries(byModel)) console.log(`${model}: ${s.pass}/${s.total}`);
