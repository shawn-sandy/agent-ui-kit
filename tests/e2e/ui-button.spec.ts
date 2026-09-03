import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl, activeId, tabTo, focusOutlineWidth } from './support.js';

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
});

test('1.4.3 Contrast (Minimum): every variant and the unavailable state pass', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

test('2.1.1 Keyboard: Enter activates an available button', async ({ page }) => {
  expect(await tabTo(page, 'primary')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '1');
  await page.keyboard.press('Space');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '2');
});

test('2.1.1 Keyboard: an unavailable button is reachable by Tab', async ({ page }) => {
  expect(await tabTo(page, 'unavailable')).toBeGreaterThan(0);
  await expect(page.locator('#unavailable')).toHaveAttribute('aria-disabled', 'true');
});

test('2.1.1 Keyboard: an unavailable button does not fire on Enter or Space', async ({ page }) => {
  expect(await tabTo(page, 'unavailable')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '0');
});

test('2.4.7 Focus Visible: every variant draws a focus ring', async ({ page }) => {
  for (const id of ['primary', 'secondary', 'destructive', 'unavailable', 'iconOnly']) {
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await tabTo(page, id), `never reached ${id}`).toBeGreaterThan(0);
    expect(await activeId(page)).toBe(id);
    expect(await focusOutlineWidth(page), `${id} has no focus ring`).toBeGreaterThan(0);
  }
});

test('2.5.8 Target Size (Minimum): the default size clears 44 by 44', async ({ page }) => {
  for (const id of ['primary', 'secondary', 'destructive', 'iconOnly']) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box, `${id} has no box`).not.toBeNull();
    expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(44);
  }
});

test('4.1.2 Name, Role, Value: an icon-only button still has a name', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  // The glyph itself contributes nothing to the name.
  await expect(page.locator('#iconOnly [data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
});

test('4.1.2 Name, Role, Value: unavailable is exposed without leaving the tab order', async ({ page }) => {
  const unavailable = page.getByRole('button', { name: 'Saving...' });
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  // The native attribute would remove it from the tree's focusable set entirely.
  await expect(unavailable).not.toHaveAttribute('disabled', /.*/);
});
