/**
 * What ui-theme emits, measured. Version two of the skill emits a roles file plus one
 * block of `--auk-role-*` bindings, so that is the shape bound here: the generated
 * skills/ui-theme/references/auk-roles.css chains every brand-bearing --auk-* property
 * to a role, and a project palette of 23 role lines restyles every component through
 * that chain. The two ways it can go wrong - a colour pair that fails contrast, a focus
 * ring that sinks into its surface - are only visible in a browser. Nothing here is
 * estimated: axe judges text contrast, and the focus ring's contrast is computed from
 * the colours the page actually paints.
 *
 * The roles file sets every one of the 69 brand-bearing properties and none of the
 * shipped values, so a component that quietly read a literal instead of its property
 * would show up as an unchanged colour. The role values were chosen so that axe passes
 * them; the assertions below are what say it does.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { demoUrl, tabTo, focusOutlineWidth } from './support.js';
import { skillKind } from '../../scripts/skill-kind.mjs';

const SKILLS_DIR = resolve(import.meta.dirname, '../../skills');
const ROLES_CSS = resolve(SKILLS_DIR, 'ui-theme/references/auk-roles.css');
const components = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => skillKind(resolve(SKILLS_DIR, name)) === 'component')
  .sort();

/** The same tag set tests/e2e/demos.spec.ts scans with. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const FOCUS = '#7c2d12';

/** One value per role, in the mapping table's order, as a project's block would set them. */
const ROLE_BLOCK = `
:root {
  --auk-role-primary: #155e75;
  --auk-role-on-primary: #ffffff;
  --auk-role-text: #1c1917;
  --auk-role-surface: #fafaf9;
  --auk-role-border: #a8a29e;
  --auk-role-divider: #e7e5e4;
  --auk-role-focus: ${FOCUS};
  --auk-role-info: #0c4a6e;
  --auk-role-info-surface: #e0f2fe;
  --auk-role-danger: #9f1239;
  --auk-role-danger-surface: #ffe4e6;
  --auk-role-success: #365314;
  --auk-role-success-surface: #ecfccb;
  --auk-role-warning: #7c2d12;
  --auk-role-warning-surface: #ffedd5;
  --auk-role-muted: #57534e;
  --auk-role-on-muted: #ffffff;
  --auk-role-inverse: #292524;
  --auk-role-on-inverse: #fafaf9;
  --auk-role-overlay: rgba(28, 25, 23, 0.7);
  --auk-role-shadow: 0 12px 28px rgba(28, 25, 23, 0.2);
  --auk-role-radius: 0.75rem;
  --auk-role-font: Georgia, "Times New Roman", serif;
}
`;

/** The generated roles file, read once. Its absence is the first thing this suite reports. */
function rolesCss(): string {
  expect(existsSync(ROLES_CSS), `${ROLES_CSS} missing - run: node scripts/build-tokens.mjs`).toBe(true);
  return readFileSync(ROLES_CSS, 'utf8');
}

/** The version-two palette: the roles file, then the project's 23 role lines. */
const palette = () => rolesCss() + ROLE_BLOCK;

/**
 * Bring each demo to the state where its themed surfaces are actually painted. A
 * closed dialog, a closed popover and an empty live region show none of their
 * colours, so scanning them as loaded would measure nothing the palette touched.
 */
const arrange: Record<string, (page: Page) => Promise<void>> = {
  'ui-alert': async (page) => {
    for (const label of ['Fail the save', 'Warn about the quota', 'Finish the upload', 'Mention the maintenance window']) {
      await page.getByRole('button', { name: label }).click();
    }
    await expect(page.locator('#alert-info [data-part="message"]')).not.toHaveText('');
  },
  'ui-dialog': async (page) => {
    await page.locator('#open-top').click();
    await expect(page.locator('#confirm-delete')).toHaveAttribute('open', '');
  },
  'ui-popover': async (page) => {
    await page.locator('#filters-trigger').click();
    await expect(page.locator('#filters-popover')).toBeVisible();
  },
};

/** Open a demo with the palette bound over it, and prove the binding reached the page. */
async function openThemed(page: Page, skill: string): Promise<void> {
  await page.goto(demoUrl(skill));
  await page.addStyleTag({ content: palette() });
  // Guard the guard: a palette that never reached :root would leave every scan
  // below measuring the shipped colours and passing for the wrong reason. The read
  // goes through the chain - --auk-button-bg is set only by the roles file.
  const bound = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--auk-button-bg').trim(),
  );
  expect(bound, 'the palette did not reach :root through the roles file').toBe('#155e75');
}

/** Relative luminance per WCAG 2.x, from a computed rgb() or rgba() colour string. */
function luminance(color: string): number {
  const m = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) throw new Error(`not a computed rgb colour: ${color}`);
  if (m[4] !== undefined && Number(m[4]) < 1) throw new Error(`translucent colour cannot be measured alone: ${color}`);
  const [r, g, b] = m.slice(1, 4).map((channel) => {
    const s = Number(channel) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque computed colours. */
function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

for (const skill of components) {
  test(`1.4.3 Contrast (Minimum): the bound palette keeps the ${skill} demo axe-clean`, async ({ page }) => {
    await openThemed(page, skill);
    await arrange[skill]?.(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('2.4.7 Focus Visible: a focused control still draws a ring under the palette', async ({ page }) => {
  await openThemed(page, 'ui-button');
  expect(await tabTo(page, 'primary')).toBeGreaterThan(0);
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);
});

test('1.4.11 Non-text Contrast: the focus ring clears 3:1 against the surface it is drawn over', async ({ page }) => {
  await openThemed(page, 'ui-button');
  expect(await tabTo(page, 'primary')).toBeGreaterThan(0);

  const { outline, surface } = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const outline = getComputedStyle(el).outlineColor;
    // The ring is offset outside the control, so it is painted over whatever the
    // nearest ancestor with an opaque background paints - not over the button.
    let surface = '';
    for (let node = el.parentElement; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        surface = bg;
        break;
      }
    }
    return { outline, surface };
  });

  // Both reads are real: the palette's ring colour, and an opaque surface behind it.
  expect(outline).toBe('rgb(124, 45, 18)');
  expect(surface, 'no opaque surface behind the focused control').not.toBe('');
  const ratio = contrastRatio(outline, surface);
  expect(ratio, `${outline} over ${surface} measures ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
});

test("an undefined project token falls back to the component's shipped literal", async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
  const background = () =>
    page.locator('#primary').evaluate((el) => getComputedStyle(el).backgroundColor);

  // Guard the guard: a defined token must change the colour, or the override is not
  // reaching the component and the fallback assertion below would prove nothing.
  await page.addStyleTag({
    content: ':root { --brand-primary: #155e75; --auk-button-bg: var(--brand-primary); }',
  });
  expect(await background()).toBe('rgb(21, 94, 117)');

  // The same binding to a token nobody defines. The auk property is invalid at
  // computed-value time, and the component's own var(--auk-button-bg, #1a56db) wins.
  // The mechanism is identical for every property, so one proof is enough.
  await page.addStyleTag({ content: ':root { --auk-button-bg: var(--brand-primary-undefined); }' });
  expect(await background()).toBe('rgb(26, 86, 219)');
});

// The two-hop chain the roles file adds, measured on the button demo. Each case is one
// promise docs/theming.md makes to a design-system team.

const primaryBackground = (page: Page) =>
  page.locator('#primary').evaluate((el) => getComputedStyle(el).backgroundColor);

test('the roles file with no role bound leaves every component on its shipped literal', async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
  await page.addStyleTag({ content: rolesCss() });
  // --auk-button-bg now reads var(--auk-role-primary), which nobody set: invalid at
  // computed-value time on :root, so the button's own fallback applies.
  expect(await primaryBackground(page)).toBe('rgb(26, 86, 219)');
});

test('a bound role restyles the component, and an unlayered component property still beats it', async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
  await page.addStyleTag({ content: rolesCss() + ':root { --auk-role-primary: #155e75; }' });
  expect(await primaryBackground(page)).toBe('rgb(21, 94, 117)');
  // The escape hatch: the roles file sits in @layer auk, so a plain :root rule written
  // afterwards, outside any layer, outranks its chain for this one property.
  await page.addStyleTag({ content: ':root { --auk-button-bg: rebeccapurple; }' });
  expect(await primaryBackground(page)).toBe('rgb(102, 51, 153)');
});

test('a [data-brand] block that restates the chain themes one element without touching :root, and a bare one does not', async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
  await page.addStyleTag({ content: rolesCss() + ':root { --auk-role-primary: #155e75; }' });
  await page.locator('#primary').evaluate((el) => el.setAttribute('data-brand', 'acme'));

  // A custom property resolves where it is declared: --auk-button-bg was chained on
  // :root, so a role set on the element below never reaches it and nothing changes.
  await page.addStyleTag({ content: '[data-brand="acme"] { --auk-role-primary: #9f1239; }' });
  expect(await primaryBackground(page)).toBe('rgb(21, 94, 117)');

  // The same block with the role's chain lines restated, copied from auk-roles.css.
  await page.addStyleTag({
    content:
      '[data-brand="acme"] { --auk-role-primary: #9f1239; --auk-button-bg: var(--auk-role-primary); --auk-button-border-color: var(--auk-role-primary); }',
  });
  expect(await primaryBackground(page)).toBe('rgb(159, 18, 57)');
  const rootPrimary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--auk-role-primary').trim(),
  );
  expect(rootPrimary).toBe('#155e75');
});
