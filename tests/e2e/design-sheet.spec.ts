/**
 * The component sheet opens from disk and renders every component at once, so it is
 * the one page where a colour pair or a missing name across components shows up
 * together - and a sheet whose inlined modules failed to run would still pass axe, so
 * the open dialog, the visible popover and a focus ring per section are asserted too.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { focusOutlineWidth } from './support.js';

const SHEET = pathToFileURL(resolve(import.meta.dirname, '../../docs/designs/components/index.html')).href;

/** The same tag set tests/e2e/demos.spec.ts scans with. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Press Tab until focus lands on a control inside `selector`; how many presses it took, or -1. */
async function tabInto(page: Page, selector: string, limit = 60): Promise<number> {
  for (let i = 1; i <= limit; i += 1) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate((sel) => !!document.activeElement?.closest(sel), selector);
    if (inside) return i;
  }
  return -1;
}

test.beforeEach(async ({ page }) => {
  await page.goto(SHEET);
});

test('the dialog is shown open and the popover is visible', async ({ page }) => {
  await expect(page.locator('.auk-dialog').first()).toHaveAttribute('open', '');
  await expect(page.locator('.auk-popover').first()).toBeVisible();
});

test('the Foundations section shows the 23 roles', async ({ page }) => {
  await expect(page.locator('#foundations [data-role]')).toHaveCount(23);
});

test('2.4.7 Focus Visible: a control in each interactive component section draws a focus ring when tabbed to', async ({ page }) => {
  // alert and box ship no control, so there is nothing in their sections to focus.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const skill of ['ui-button', 'ui-dialog', 'ui-popover', 'ui-tabs']) {
    expect(await tabInto(page, `#${skill}`), `never tabbed into #${skill}`).toBeGreaterThan(0);
    expect(await focusOutlineWidth(page), `${skill} control has no focus ring`).toBeGreaterThan(0);
  }
});

test('1.4.3 Contrast (Minimum): the sheet loads from disk with zero axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
