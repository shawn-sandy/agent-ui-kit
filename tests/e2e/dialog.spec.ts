import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl, activeId, expectFocus, tabTo, focusOutlineWidth } from './support.js';

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('dialog'));
});

const isOpen = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (document.getElementById('confirm-delete') as HTMLDialogElement).open);

test('2.1.1 Keyboard: the dialog opens and closes without a pointer', async ({ page }) => {
  expect(await tabTo(page, 'open-top')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await isOpen(page)).toBe(true);

  await page.keyboard.press('Escape');
  expect(await isOpen(page)).toBe(false);
});

test('2.4.3 Focus Order: focus lands on the safe choice, not the close button', async ({ page }) => {
  await page.locator('#open-top').click();
  expect(await activeId(page)).toBe('keep');
});

test('2.4.3 Focus Order: focus returns to the exact element that opened it', async ({ page }) => {
  await page.locator('#open-second').click();
  expect(await isOpen(page)).toBe(true);
  await page.keyboard.press('Escape');
  await expectFocus(page, 'open-second');

  // ...and to the other opener when that one is used, which is the whole point of
  // storing the opener rather than trusting a single remembered element.
  await page.locator('#open-top').click();
  await page.keyboard.press('Escape');
  await expectFocus(page, 'open-top');
});

test('2.1.2 No Keyboard Trap: Tab never reaches the page behind', async ({ page }) => {
  await page.locator('#open-top').click();

  // Chromium's wrap point for a modal is document.body, which is inert and is not
  // page content. What must never happen is focus landing on something behind the
  // dialog - which is exactly what show() instead of showModal() would allow.
  const BEHIND = ['open-top', 'open-second', 'page-link'];
  const seen = new Set<string>();
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const id = await activeId(page);
    expect(BEHIND, `focus escaped to ${id}`).not.toContain(id);
    if (id) seen.add(id);
  }
  expect([...seen].sort()).toEqual(['confirm-delete-confirm', 'keep']);
});

test('2.1.2 No Keyboard Trap: the trap releases completely on close', async ({ page }) => {
  await page.locator('#open-top').click();
  await page.keyboard.press('Escape');
  expect(await isOpen(page)).toBe(false);
  // Let the deferred focus restoration land before tabbing, or it moves the cursor
  // out from under the walk.
  await expectFocus(page, 'open-top');
  // The page behind is reachable again.
  expect(await tabTo(page, 'page-link')).toBeGreaterThan(0);
});

test('2.4.7 Focus Visible: a keyboard-opened dialog shows its focus ring', async ({ page }) => {
  // Opened from the keyboard, which is the case the criterion is about. Letting the
  // native autofocus attribute place the focus keeps the browser's :focus-visible
  // heuristic intact; a scripted element.focus() would suppress the ring here.
  expect(await tabTo(page, 'open-top')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await activeId(page)).toBe('keep');
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);

  await page.keyboard.press('Tab');
  expect(await activeId(page)).toBe('confirm-delete-confirm');
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);
});

test('4.1.2 Name, Role, Value: the dialog is a named modal', async ({ page }) => {
  await page.locator('#open-top').click();
  const dialog = page.getByRole('dialog', { name: 'Delete this account?' });
  await expect(dialog).toBeVisible();

  // Native <dialog> + showModal() supplies both; neither is written into the markup.
  const written = await page.evaluate(() => {
    const el = document.getElementById('confirm-delete')!;
    return { role: el.getAttribute('role'), modal: el.getAttribute('aria-modal') };
  });
  expect(written).toEqual({ role: null, modal: null });

  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeVisible();
});

test('2.4.3 Focus Order: focus is placed deliberately when the opener is gone', async ({ page }) => {
  // A row deleted, a list re-rendered: the element that opened the dialog can be
  // removed while it is open. Doing nothing drops focus to <body> by accident, which
  // is what the skill promises not to do.
  await page.goto(demoUrl('dialog'));
  await page.evaluate(() => {
    const dialog = document.getElementById('confirm-delete')!;
    const landing = document.createElement('button');
    landing.id = 'fallback-landing';
    landing.textContent = 'Fallback';
    document.body.append(landing);
    dialog.setAttribute('data-dialog-fallback', 'fallback-landing');
  });

  await page.locator('#open-top').click();
  await page.evaluate(() => document.getElementById('open-top')!.remove());
  await page.keyboard.press('Escape');

  await expectFocus(page, 'fallback-landing');
});

test('2.4.3 Focus Order: focus is not stranded when no fallback is declared', async ({ page }) => {
  // Without a declared fallback the browser chooses, and which element it picks is
  // not portable - Linux and macOS Chromium disagree. What must hold everywhere is
  // that focus is not left on the detached opener or anywhere inside the closed
  // dialog, so assert that rather than an element identity.
  await page.goto(demoUrl('dialog'));
  await page.locator('#open-top').click();
  await page.evaluate(() => document.getElementById('open-top')!.remove());
  await page.keyboard.press('Escape');

  // The module moves focus out one task later, so settle before reading.
  await page.waitForFunction(
    () => !document.getElementById('confirm-delete')!.contains(document.activeElement),
    null,
    { timeout: 2000 },
  );
  const landed = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      connected: active ? active.isConnected : false,
      insideDialog: document.getElementById('confirm-delete')!.contains(active),
      tag: active?.tagName ?? 'null',
    };
  });
  expect(landed.connected, `focus was left on a detached element (${landed.tag})`).toBe(true);
  expect(landed.insideDialog, 'focus was left inside the closed dialog').toBe(false);
});

test('1.4.3 Contrast (Minimum): the open dialog passes', async ({ page }) => {
  await page.locator('#open-top').click();
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

test('the backdrop dismisses, and a click on content does not', async ({ page }) => {
  await page.locator('#open-top').click();
  await page.locator('#confirm-delete [data-part="body"]').click();
  expect(await isOpen(page)).toBe(true);

  await page.mouse.click(5, 5);
  expect(await isOpen(page)).toBe(false);
});
