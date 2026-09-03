/**
 * Whole-kit smoke test. Data-driven over skills/, so a component added later is
 * covered by every rule here without this file being edited.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateSkill } from './lib/frontmatter.js';
import { RULES } from '../scripts/lint-portability.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SKILLS_DIR = resolve(ROOT, 'skills');

const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

/** Pull the first fenced block of a given language out of a markdown file. */
function fencedBlock(markdown: string, lang: string): string | null {
  const match = markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'm'));
  return match ? match[1].replace(/\n$/, '') : null;
}

/** The text inside the first <style> or <script> element of a demo page. */
function htmlBlock(html: string, tag: 'style' | 'script'): string | null {
  const match = html.match(new RegExp('<' + tag + '>\\n([\\s\\S]*?)\\n</' + tag + '>'));
  return match ? match[1] : null;
}

const REQUIRED_SECTIONS = ['Structure', 'Styles', 'Behaviour', 'Accessibility', 'Demo'];
const REQUIRED_CONTRACT_ROWS = ['Element', 'Role', 'Props', 'Slots', 'Variants', 'Behaviour', 'WCAG'];

it('the kit has components in it', () => {
  expect(skills.length).toBeGreaterThan(0);
});

describe.each(skills)('skills/%s', (name) => {
  const dir = join(SKILLS_DIR, name);
  const skillPath = join(dir, 'SKILL.md');
  const referencePath = join(dir, 'references', `${name}.md`);
  const demoPath = join(dir, 'references', 'demo.html');

  it('has the three files the spec requires', () => {
    expect(existsSync(skillPath), `${skillPath} missing`).toBe(true);
    expect(existsSync(referencePath), `${referencePath} missing`).toBe(true);
    expect(existsSync(demoPath), `${demoPath} missing`).toBe(true);
  });

  it('frontmatter conforms to the Agent Skills standard', () => {
    const violations = validateSkill(readFileSync(skillPath, 'utf8'), skillPath);
    expect(violations.map((v) => `${v.rule}: ${v.message}`)).toEqual([]);
  });

  it('SKILL.md body is under 60 lines and holds no component code', () => {
    const source = readFileSync(skillPath, 'utf8');
    const body = source.replace(/^---\n[\s\S]*?\n---\n/, '');
    expect(body.split('\n').length).toBeLessThan(60);
    expect(body).not.toMatch(/```(?:html|css|js|javascript)/);
  });

  it('contains no vendor-specific or framework-specific token', () => {
    for (const file of [skillPath, referencePath, demoPath]) {
      const text = readFileSync(file, 'utf8');
      for (const [rule, pattern] of RULES) {
        expect(pattern.test(text), `${file} breaks ${rule}`).toBe(false);
      }
    }
  });

  it('reference has the full contract table', () => {
    const reference = readFileSync(referencePath, 'utf8');
    for (const row of REQUIRED_CONTRACT_ROWS) {
      expect(reference, `contract row "${row}" missing`).toMatch(new RegExp(`^\\| ${row} \\|`, 'm'));
    }
  });

  it('reference has the five body sections in order', () => {
    const reference = readFileSync(referencePath, 'utf8');
    const headings = [...reference.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    expect(headings.filter((h) => REQUIRED_SECTIONS.includes(h))).toEqual(REQUIRED_SECTIONS);
  });

  it('the Styles section declares its qualifiers', () => {
    const reference = readFileSync(referencePath, 'utf8');
    const styles = reference.split('\n## Styles\n')[1] ?? '';
    expect(styles, 'no "Qualifiers:" line at the top of Styles').toMatch(
      /^\s*Qualifiers: parts .+; variants .+; states .+\.$/m,
    );
  });

  it('every themeable CSS value is a var(--auk-<component>-*) with a literal fallback', () => {
    const css = fencedBlock(readFileSync(referencePath, 'utf8'), 'css');
    expect(css, 'reference has no css block').not.toBeNull();
    const vars = [...css!.matchAll(/var\(([^),]*)(,)?/g)];
    expect(vars.length).toBeGreaterThan(0);
    for (const [whole, propertyName, comma] of vars) {
      expect(propertyName.trim(), `${whole} is not an --auk-${name}-* property`).toMatch(
        new RegExp(`^--auk-${name}-[a-z0-9-]+$`),
      );
      expect(comma, `${whole} has no fallback`).toBe(',');
    }
    // A nested var() inside the fallback would defeat the standalone guarantee.
    expect(css!).not.toMatch(/var\([^)]*var\(/);
  });

  it('demo works with no custom properties defined anywhere', () => {
    const demo = readFileSync(demoPath, 'utf8');
    expect(demo).not.toMatch(/--auk-[a-z0-9-]+\s*:/);
  });

  // The component's code exists twice: once in the reference, which is what a user
  // copies, and once inlined in the demo, which is what the browser suite actually
  // tests. Nothing regenerates one from the other, so the two can drift - and the
  // dangerous direction is silent: patch the demo alone and an accessibility test
  // goes green while the shipped reference still carries the bug.
  //
  // Containment would only catch drift one way. These pin position instead: the
  // demo's stylesheet must END with the reference css, and its script must BEGIN
  // with the reference module. Editing either copy breaks the match.

  it('demo stylesheet ends with the reference css, byte for byte', () => {
    const css = fencedBlock(readFileSync(referencePath, 'utf8'), 'css')!;
    // Guard the guard: every string ends with '', so an emptied fence would make the
    // assertion below pass against any demo at all.
    expect(css.trim().length, 'reference css block is empty').toBeGreaterThan(0);

    const style = htmlBlock(readFileSync(demoPath, 'utf8'), 'style');
    expect(style, 'demo has no <style> block').not.toBeNull();
    expect(style!.trimEnd().endsWith(css.trim()), 'demo css has drifted from the reference').toBe(true);
  });

  it('demo page chrome claims none of this component selectors', () => {
    // The chrome is everything before the injected css. A rule for THIS component
    // hiding up there would style it from a place the reference never ships, so the
    // browser suite would be testing something the user does not get.
    //
    // Another component's selectors are allowed: a demo needs its buttons to look
    // like buttons to stay self-contained, and the dialog demo says so in a comment.
    // Those stand-ins are not what this test is guarding.
    const css = fencedBlock(readFileSync(referencePath, 'utf8'), 'css')!;
    const style = htmlBlock(readFileSync(demoPath, 'utf8'), 'style')!.trimEnd();
    const chrome = style.slice(0, style.length - css.trim().length);
    expect(chrome, `demo chrome styles auk-${name} outside the reference css`).not.toMatch(
      new RegExp(`auk-${name}\\b`),
    );
  });

  it('demo script begins with the reference module, exports stripped', () => {
    const js = fencedBlock(readFileSync(referencePath, 'utf8'), 'js');
    if (js === null) return; // CSS-only component
    const stripped = js.replace(/^export /gm, '').trim();
    // Same trap as the css above: every string starts with ''. `js === null` catches a
    // missing fence but not an empty one.
    expect(stripped.length, 'reference js block is empty').toBeGreaterThan(0);

    const script = htmlBlock(readFileSync(demoPath, 'utf8'), 'script');
    expect(script, 'demo has no <script> block').not.toBeNull();
    expect(script!.trimStart().startsWith(stripped), 'demo module has drifted from the reference').toBe(true);
  });

  it('every WCAG criterion claimed has an assertion in the browser suite', () => {
    const reference = readFileSync(referencePath, 'utf8');
    const row = reference.match(/^\| WCAG \| (.+) \|$/m);
    expect(row, 'contract has no WCAG row').not.toBeNull();
    const criteria = [...row![1].matchAll(/\d+\.\d+\.\d+/g)].map((m) => m[0]);
    expect(criteria.length).toBeGreaterThan(0);

    const specPath = resolve(ROOT, 'tests/e2e', `${name}.spec.ts`);
    expect(existsSync(specPath), `${specPath} missing`).toBe(true);
    const spec = readFileSync(specPath, 'utf8');

    // The criterion must name a test, not merely appear somewhere in the file - a
    // comment mentioning 2.4.7 is not an assertion that 2.4.7 holds.
    const titles = [...spec.matchAll(/^test\(\s*'([^']+)'/gm)].map((m) => m[1]);
    expect(titles.length, 'no tests in the spec file').toBeGreaterThan(0);
    for (const criterion of criteria) {
      const tagged = titles.filter((t) => t.startsWith(criterion + ' '));
      expect(
        tagged.length,
        `no test titled "${criterion} ..." in tests/e2e/${name}.spec.ts; titles are:\n  ${titles.join('\n  ')}`,
      ).toBeGreaterThan(0);
    }
  });

  it('has at least three evaluation scenarios', () => {
    const evalPath = resolve(ROOT, 'evals', `${name}.json`);
    expect(existsSync(evalPath), `${evalPath} missing`).toBe(true);
    const doc = JSON.parse(readFileSync(evalPath, 'utf8'));
    expect(doc.skill).toBe(name);
    expect(doc.scenarios.length).toBeGreaterThanOrEqual(3);
    expect(doc.scenarios.map((s: { kind: string }) => s.kind)).toEqual(
      expect.arrayContaining(['obvious', 'oblique', 'adjacent']),
    );
  });
});
