/**
 * scripts/record-artifact.mjs runs as a PostToolUse hook on the Artifact tool and
 * appends a row to docs/artifacts.md for each newly published page. It must add a
 * row once, never twice, and never for a non-publish action whose response merely
 * mentions artifact URLs (list, read).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const SCRIPT = resolve(ROOT, 'scripts/record-artifact.mjs');
const URL = 'https://claude.ai/code/artifact/11111111-2222-3333-4444-555555555555';
const SEED = '# Published artifacts\n\n## Recently published\n\n| Artifact | Date |\n| --- | --- |\n';

const tmp = mkdtempSync(join(tmpdir(), 'record-artifact-'));
const doc = join(tmp, 'docs/artifacts.md');

function run(payload: Record<string, unknown>): string {
  return execFileSync(process.execPath, [SCRIPT], {
    input: JSON.stringify({ hook_event_name: 'PostToolUse', cwd: tmp, ...payload }),
    encoding: 'utf8',
  });
}

const publish = {
  tool_name: 'Artifact',
  tool_input: { file_path: join(tmp, 'page.html'), title: 'Test | Page' },
  tool_response: { content: [{ type: 'text', text: `Published to ${URL} (private)` }] },
};

beforeEach(() => {
  mkdirSync(join(tmp, 'docs'), { recursive: true });
  writeFileSync(doc, SEED);
});

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('record-artifact hook', () => {
  it('appends one row with the title and URL of a publish', () => {
    run(publish);
    const rows = readFileSync(doc, 'utf8').slice(SEED.length).trim().split('\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain(`(${URL})`);
    expect(rows[0]).toContain('Test \\| Page');
    expect(rows[0]).toMatch(/\| \d{4}-\d{2}-\d{2} \|$/);
  });

  it('does not add a second row when the same URL is published again', () => {
    run(publish);
    run(publish);
    const text = readFileSync(doc, 'utf8');
    expect(text.split(URL)).toHaveLength(2);
  });

  it('ignores non-publish actions even when the response lists URLs', () => {
    run({ ...publish, tool_input: { action: 'list' } });
    run({ ...publish, tool_input: { action: 'read', url: URL } });
    expect(readFileSync(doc, 'utf8')).toBe(SEED);
  });

  it('falls back to the page <title> when the call has no title', () => {
    writeFileSync(join(tmp, 'page.html'), '<title>From The File</title><p>x</p>');
    run({ ...publish, tool_input: { file_path: join(tmp, 'page.html') } });
    expect(readFileSync(doc, 'utf8')).toContain('[From The File](');
  });
});
