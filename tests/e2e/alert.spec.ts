import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl } from './support.js';

const VARIANTS = [
  { name: 'error', role: 'alert', live: 'assertive', icon: '⚠', severity: 'Error:' },
  { name: 'warning', role: 'status', live: 'polite', icon: '⚠', severity: 'Warning:' },
  { name: 'success', role: 'status', live: 'polite', icon: '✓', severity: 'Success:' },
  { name: 'info', role: 'status', live: 'polite', icon: 'ℹ', severity: 'Information:' },
];

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('alert'));
});

test('4.1.3 Status Messages: every region is in the document before any message is', async ({ page }) => {
  for (const v of VARIANTS) {
    const region = page.locator(`#alert-${v.name}`);
    await expect(region).toHaveCount(1);
    await expect(region.locator('[data-part="message"]')).toHaveText('');
  }
});

test('4.1.3 Status Messages: the error region resolves to assertive, the rest to polite', async ({ page }) => {
  for (const v of VARIANTS) {
    const region = page.locator(`#alert-${v.name}`);
    await expect(region).toHaveAttribute('role', v.role);
    await expect(region).toHaveAttribute('aria-live', v.live);
    await expect(region).toHaveAttribute('aria-atomic', 'true');
  }
});

test('4.1.3 Status Messages: filling a region reuses it rather than creating one', async ({ page }) => {
  const before = await page.locator('.auk-alert').count();
  // Tag the live element, then check the same element carries the message afterwards.
  await page.evaluate(() => document.getElementById('alert-error')!.setAttribute('data-witness', 'same-node'));

  await page.getByRole('button', { name: 'Fail the save' }).click();

  await expect(page.locator('.auk-alert')).toHaveCount(before);
  await expect(page.locator('[data-witness="same-node"]')).toHaveAttribute('id', 'alert-error');
  await expect(page.locator('[data-witness="same-node"] [data-part="message"]')).not.toHaveText('');
});

test('1.4.1 Use of Color: severity survives with colour removed', async ({ page }) => {
  for (const v of VARIANTS) {
    const region = page.locator(`#alert-${v.name}`);
    // A hidden word for assistive technology...
    await expect(region.locator('[data-part="severity"]')).toHaveText(v.severity);
    // ...and a glyph for everyone else. Neither is a colour.
    await expect(region.locator('[data-part="icon"]')).toHaveText(v.icon);
    await expect(region.locator('[data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
  }
  // The two error-severity variants are told apart by their word, not only their icon.
  expect(new Set(VARIANTS.map((v) => v.severity)).size).toBe(VARIANTS.length);
});

test('1.4.3 Contrast (Minimum): every populated variant passes', async ({ page }) => {
  for (const label of ['Fail the save', 'Warn about the quota', 'Finish the upload', 'Mention the maintenance window']) {
    await page.getByRole('button', { name: label }).click();
  }
  await expect(page.locator('#alert-info [data-part="message"]')).not.toHaveText('');

  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

test('the alert never takes focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Fail the save' }).click();
  const focused = await page.evaluate(() => document.activeElement?.id ?? '');
  expect(focused).not.toContain('alert-');
});
