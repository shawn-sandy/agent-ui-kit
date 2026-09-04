/**
 * What ui-theme emits, measured. A project palette bound over the brand-bearing
 * --auk-* properties is the skill's whole output, and the two ways it can go wrong -
 * a colour pair that fails contrast, a focus ring that sinks into its surface - are
 * only visible in a browser. Nothing here is estimated: axe judges text contrast,
 * and the focus ring's contrast is computed from the colours the page actually
 * paints.
 *
 * The palette sets every one of the 69 properties in the skill's mapping table and
 * none of the shipped values, so a component that quietly read a literal instead of
 * its property would show up as an unchanged colour. Its values were chosen so that
 * axe passes them; the assertions below are what say it does.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { demoUrl, tabTo, focusOutlineWidth } from './support.js';
import { skillKind } from '../../scripts/skill-kind.mjs';

const SKILLS_DIR = resolve(import.meta.dirname, '../../skills');
const components = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => skillKind(resolve(SKILLS_DIR, name)) === 'component')
  .sort();

/** The same tag set tests/e2e/demos.spec.ts scans with. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const FOCUS = '#7c2d12';

/** One value per role, in the mapping table's order, as a project's block would set them. */
const PALETTE = `
:root {
  --auk-button-bg: #155e75;
  --auk-button-border-color: #155e75;
  --auk-tabs-selected-tab-color: #155e75;
  --auk-tabs-selected-tab-border-block-end-color: #155e75;
  --auk-button-color: #ffffff;
  --auk-button-destructive-color: #ffffff;
  --auk-box-color: #1c1917;
  --auk-button-secondary-color: #1c1917;
  --auk-dialog-color: #1c1917;
  --auk-dialog-body-color: #1c1917;
  --auk-dialog-close-color: #1c1917;
  --auk-popover-color: #1c1917;
  --auk-popover-body-color: #1c1917;
  --auk-popover-close-color: #1c1917;
  --auk-tabs-color: #1c1917;
  --auk-tabs-tab-color: #1c1917;
  --auk-box-bg: #fafaf9;
  --auk-button-secondary-bg: #fafaf9;
  --auk-dialog-bg: #fafaf9;
  --auk-dialog-close-bg: #fafaf9;
  --auk-popover-bg: #fafaf9;
  --auk-popover-close-bg: #fafaf9;
  --auk-tabs-tab-bg: #fafaf9;
  --auk-box-border-color: #a8a29e;
  --auk-button-secondary-border-color: #a8a29e;
  --auk-dialog-border-color: #a8a29e;
  --auk-dialog-close-border-color: #a8a29e;
  --auk-popover-border-color: #a8a29e;
  --auk-popover-close-border-color: #a8a29e;
  --auk-tabs-border-color: #a8a29e;
  --auk-dialog-divider-color: #e7e5e4;
  --auk-popover-divider-color: #e7e5e4;
  --auk-button-focus-color: ${FOCUS};
  --auk-dialog-focus-color: ${FOCUS};
  --auk-popover-focus-color: ${FOCUS};
  --auk-tabs-focus-color: ${FOCUS};
  --auk-alert-color: #0c4a6e;
  --auk-alert-border-color: #0c4a6e;
  --auk-alert-bg: #e0f2fe;
  --auk-alert-error-color: #9f1239;
  --auk-alert-error-border-color: #9f1239;
  --auk-button-destructive-bg: #9f1239;
  --auk-alert-error-bg: #ffe4e6;
  --auk-alert-success-color: #365314;
  --auk-alert-success-border-color: #365314;
  --auk-alert-success-bg: #ecfccb;
  --auk-alert-warning-color: #7c2d12;
  --auk-alert-warning-border-color: #7c2d12;
  --auk-alert-warning-bg: #ffedd5;
  --auk-button-disabled-bg: #57534e;
  --auk-button-disabled-border-color: transparent;
  --auk-button-disabled-color: #ffffff;
  --auk-box-invert-bg: #292524;
  --auk-box-invert-color: #fafaf9;
  --auk-box-invert-border-color: transparent;
  --auk-dialog-backdrop-bg: rgba(28, 25, 23, 0.7);
  --auk-popover-box-shadow: 0 12px 28px rgba(28, 25, 23, 0.2);
  --auk-alert-radius: 0.75rem;
  --auk-box-radius: 0.75rem;
  --auk-button-radius: 0.75rem;
  --auk-dialog-radius: 0.75rem;
  --auk-dialog-close-radius: 0.75rem;
  --auk-popover-radius: 0.75rem;
  --auk-popover-close-radius: 0.75rem;
  --auk-alert-font-family: Georgia, "Times New Roman", serif;
  --auk-button-font-family: Georgia, "Times New Roman", serif;
  --auk-dialog-font-family: Georgia, "Times New Roman", serif;
  --auk-popover-font-family: Georgia, "Times New Roman", serif;
  --auk-tabs-font-family: Georgia, "Times New Roman", serif;
}
`;

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
  await page.addStyleTag({ content: PALETTE });
  // Guard the guard: a palette that never reached :root would leave every scan
  // below measuring the shipped colours and passing for the wrong reason.
  const bound = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--auk-button-bg').trim(),
  );
  expect(bound, 'the palette did not reach :root').toBe('#155e75');
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
