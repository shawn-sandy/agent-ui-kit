/**
 * Both plugin manifests read together. The README's central claim is that one
 * skills/ tree serves every vendor; if the manifests disagree about where that tree
 * is, the claim is false regardless of what the tree contains.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));

const claude = read('.claude-plugin/plugin.json');
const marketplace = read('.claude-plugin/marketplace.json');
const codex = read('.codex-plugin/plugin.json');
const pkg = read('package.json');

/** The directory an agent scans for skills by default, relative to the repo root. */
const DEFAULT_SKILLS_DIR = 'skills';

describe('the manifests agree with each other', () => {
  it('declare the same plugin name', () => {
    expect(codex.name).toBe(claude.name);
    expect(marketplace.plugins[0].name).toBe(claude.name);
  });

  it('declare the same version', () => {
    expect(codex.version).toBe(claude.version);
  });

  it('the package version tracks the plugin version', () => {
    expect(pkg.version).toBe(claude.version);
  });
});

describe('every declared path resolves to a real directory', () => {
  it('the marketplace source is the repo root', () => {
    const source = resolve(ROOT, marketplace.plugins[0].source);
    expect(existsSync(source)).toBe(true);
    expect(resolve(source)).toBe(resolve(ROOT));
  });

  it('the marketplace skills path is the default skills directory', () => {
    for (const declared of marketplace.plugins[0].skills) {
      const path = resolve(ROOT, declared);
      expect(statSync(path).isDirectory()).toBe(true);
      expect(path).toBe(resolve(ROOT, DEFAULT_SKILLS_DIR));
    }
  });

  it('the Codex skills path is the same directory Claude Code scans', () => {
    const path = resolve(ROOT, codex.skills);
    expect(statSync(path).isDirectory()).toBe(true);
    expect(path).toBe(resolve(ROOT, DEFAULT_SKILLS_DIR));
  });

  it('that directory actually holds skills', () => {
    const dirs = readdirSync(resolve(ROOT, DEFAULT_SKILLS_DIR), { withFileTypes: true })
      .filter((e) => e.isDirectory());
    expect(dirs.length).toBeGreaterThan(0);
    for (const dir of dirs) {
      expect(existsSync(resolve(ROOT, DEFAULT_SKILLS_DIR, dir.name, 'SKILL.md'))).toBe(true);
    }
  });
});

describe('no manifest carries a vendor-specific path', () => {
  it('uses forward slashes only', () => {
    const all = JSON.stringify({ claude, marketplace, codex });
    expect(all).not.toMatch(/\\\\/);
    expect(all).not.toContain('${CLAUDE_PLUGIN_ROOT}');
  });
});
