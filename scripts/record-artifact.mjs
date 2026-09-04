#!/usr/bin/env node
/**
 * PostToolUse hook for the Artifact tool. Appends a row to docs/artifacts.md for a
 * newly published claude.ai artifact, so the list cannot go stale on a publish made
 * from this checkout. Reads the hook payload on stdin and never fails the tool call.
 *
 * Only a publish counts. The list, read and comments actions mention artifact URLs
 * in their responses too, and none of those is a new page.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DOC = 'docs/artifacts.md';
const ARTIFACT_URL =
  /https:\/\/claude\.ai\/code\/artifact\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/;

/** Title for the table row: the call's title, else the page's <title>, else a stub. */
function rowTitle(input) {
  let title = typeof input.title === 'string' ? input.title : '';
  if (!title && typeof input.file_path === 'string' && existsSync(input.file_path)) {
    title = readFileSync(input.file_path, 'utf8').match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
  }
  title = title.replace(/\s+/g, ' ').trim().replace(/[[\]]/g, '').replace(/\|/g, '\\|');
  return title || 'Untitled artifact';
}

/** Returns null when there is nothing to do, a string to explain a skip, or a hook result. */
function record(payload) {
  if (payload.tool_name !== 'Artifact') return null;
  const input = payload.tool_input ?? {};
  if (input.action && input.action !== 'publish') return null;

  const url =
    JSON.stringify(payload.tool_response ?? '').match(ARTIFACT_URL)?.[0] ??
    (typeof input.url === 'string' ? input.url.match(ARTIFACT_URL)?.[0] : undefined);
  if (!url) return 'no artifact URL in the publish response; nothing recorded';

  const roots = [payload.cwd, process.env.CLAUDE_PROJECT_DIR, process.cwd()].filter(Boolean);
  const doc = roots.map((root) => resolve(root, DOC)).find((path) => existsSync(path));
  if (!doc) return `${DOC} not found; nothing recorded`;

  const text = readFileSync(doc, 'utf8');
  if (text.includes(url)) return null;

  const date = new Date().toISOString().slice(0, 10);
  appendFileSync(doc, `${text.endsWith('\n') ? '' : '\n'}| [${rowTitle(input)}](${url}) | ${date} |\n`);
  return { systemMessage: `Recorded ${url} in ${DOC}. Move its row into the right section.` };
}

let outcome;
try {
  outcome = record(JSON.parse(readFileSync(0, 'utf8')));
} catch (error) {
  outcome = `record-artifact skipped: ${error.message}`;
}
if (typeof outcome === 'string') console.error(outcome);
else if (outcome) console.log(JSON.stringify(outcome));
