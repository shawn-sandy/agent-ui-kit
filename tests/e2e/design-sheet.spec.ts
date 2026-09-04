/**
 * The component sheet renders every component at once, so it is the one page where a
 * colour pair or a missing name across components shows up together - and a sheet
 * whose inlined modules failed to run would still pass axe, which is why the open
 * dialog, the shown popover and a keyboard walk are asserted as well.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { focusOutlineWidth } from './support.js';

const SHEET = resolve(import.meta.dirname, '../../docs/designs/components/index.html');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  expect(existsSync(SHEET), `${SHEET} missing - run: node scripts/build-design.mjs`).toBe(true);
  await page.goto(pathToFileURL(SHEET).href);
});

test('the dialog is open and the popover is shown', async ({ page }) => {
  await expect(page.locator('dialog.auk-dialog').first()).toHaveAttribute('open', '');
  await expect(page.locator('.auk-popover').first()).toBeVisible();
});

test('the Foundations section shows the 23 role chips', async ({ page }) => {
  await expect(page.locator('[data-role-chip]')).toHaveCount(23);
});

test('2.4.7 Focus Visible: a keyboard walk reaches one control per interactive component with a ring on each', async ({ page }) => {
  // Box and alert have no control by contract; the other four each get a stop.
  const reached = new Map<string, number>();
  for (let i = 0; i < 40 && reached.size < 4; i += 1) {
    await page.keyboard.press('Tab');
    // The containers first: a button inside the dialog or the popover counts for the
    // container it sits in, not for the button component.
    const root = await page.evaluate(() => {
      const el = document.activeElement;
      const container = el?.closest('.auk-dialog, .auk-popover, .auk-tabs');
      if (container) return container.className.match(/auk-(?:dialog|popover|tabs)/)?.[0] ?? '';
      return el?.closest('.auk-button') ? 'auk-button' : '';
    });
    if (root && !reached.has(root)) reached.set(root, await focusOutlineWidth(page));
  }
  expect([...reached.keys()].sort()).toEqual(['auk-button', 'auk-dialog', 'auk-popover', 'auk-tabs']);
  for (const [root, width] of reached) expect(width, `${root} has no focus ring`).toBeGreaterThan(0);
});

test('1.4.3 Contrast (Minimum): the sheet is axe-clean with every component painted', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
