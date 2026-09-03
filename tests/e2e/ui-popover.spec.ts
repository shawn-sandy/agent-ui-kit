import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl, activeId, expectFocus, tabTo, focusOutlineWidth } from './support.js';

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('ui-popover'));
});

/** Whether a popover is in the top layer right now, read from the platform itself. */
const isOpen = (page: Page, id: string) =>
  page.evaluate((popoverId) => document.getElementById(popoverId)!.matches(':popover-open'), id);

const expanded = (page: Page, id: string) =>
  page.evaluate((triggerId) => document.getElementById(triggerId)!.getAttribute('aria-expanded'), id);

test('1.4.3 Contrast (Minimum): no axe violations with a popover open', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('1.4.3 Contrast (Minimum): no axe violations with the manual popover open', async ({ page }) => {
  await page.locator('#notes-trigger').click();
  expect(await isOpen(page, 'notes-popover')).toBe(true);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('2.1.1 Keyboard: the auto popover opens and closes without a pointer', async ({ page }) => {
  expect(await tabTo(page, 'filters-trigger')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  await page.keyboard.press('Escape');
  expect(await isOpen(page, 'filters-popover')).toBe(false);
});

test('2.1.1 Keyboard: the manual popover opens and closes without a pointer', async ({ page }) => {
  expect(await tabTo(page, 'notes-trigger')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await isOpen(page, 'notes-popover')).toBe(true);

  // Escape is the whole difference between the modes: manual must survive it.
  await page.keyboard.press('Escape');
  expect(await isOpen(page, 'notes-popover')).toBe(true);

  expect(await tabTo(page, 'notes-close')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await isOpen(page, 'notes-popover')).toBe(false);
});

test('2.1.2 No Keyboard Trap: Tab leaves an open popover for the page behind', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);
  await page.locator('#filters-apply').focus();

  // The popover is non-modal, so the content after the trigger must still be
  // reachable. A modal would swallow every one of these presses.
  const BEHIND = ['notes-trigger', 'tail-link', 'page-link'];
  const seen: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab');
    seen.push(await activeId(page));
  }
  expect(seen.some((id) => BEHIND.includes(id)), `focus never left the popover: ${seen.join(', ')}`).toBe(
    true,
  );
});

test('2.1.2 No Keyboard Trap: a closed manual popover leaves no focus stranded', async ({ page }) => {
  await page.locator('#notes-trigger').click();
  await page.locator('#notes-close').focus();
  await page.keyboard.press('Enter');
  expect(await isOpen(page, 'notes-popover')).toBe(false);

  // The close button is inside the popover, so closing it makes the focused element
  // display:none. Focus left there is a dead end nothing can tab out of. The module
  // rescues it from the queued `toggle` task, so this polls rather than sampling.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const active = document.activeElement;
          const popover = document.getElementById('notes-popover')!;
          return !active || active === document.body || popover.contains(active);
        }),
      { message: 'focus was left inside the closed popover or on the body', timeout: 2000 },
    )
    .toBe(false);
});

test('2.4.3 Focus Order: the auto popover returns focus to its trigger on Escape', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  await page.locator('#filters-apply').focus();
  await page.keyboard.press('Escape');

  await expectFocus(page, 'filters-trigger');
});

test('2.4.3 Focus Order: the manual popover returns focus to its trigger when closed', async ({
  page,
}) => {
  await page.locator('#notes-trigger').click();
  await page.locator('#notes-close').focus();
  await page.keyboard.press('Enter');

  // The browser restores focus for auto popovers only. This one is the module's work.
  await expectFocus(page, 'notes-trigger');
});

test('2.4.3 Focus Order: autofocus decides where focus lands inside the popover', async ({ page }) => {
  await page.locator('#filters-trigger').click();

  // The popover attribute alone does not move focus in; the native autofocus
  // attribute is what does, which is why the reference insists on it.
  await expectFocus(page, 'filters-apply');
});

test('2.4.7 Focus Visible: a control inside the popover shows a focus outline', async ({ page }) => {
  expect(await tabTo(page, 'filters-trigger')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expectFocus(page, 'filters-apply');

  // Opened from the keyboard, so :focus-visible must match and draw a real ring.
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);
});

test('2.4.7 Focus Visible: the manual popover close button shows a focus outline', async ({ page }) => {
  expect(await tabTo(page, 'notes-trigger')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  expect(await tabTo(page, 'notes-close')).toBeGreaterThan(0);

  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);
});

test('4.1.2 Name, Role, Value: the popover exposes a named group', async ({ page }) => {
  await page.locator('#filters-trigger').click();

  const group = page.getByRole('group', { name: 'Filter results' });
  await expect(group).toHaveAttribute('id', 'filters-popover');

  // A closed popover is display:none and so is out of the accessibility tree
  // entirely - its close button has to be opened before it has a name to check.
  await page.locator('#notes-trigger').click();
  await expect(page.getByRole('group', { name: 'What changed' })).toHaveAttribute(
    'id',
    'notes-popover',
  );
  await expect(page.locator('#notes-close')).toHaveAccessibleName('Close release notes');
});

test('4.1.2 Name, Role, Value: aria-expanded tracks the popover, not the markup', async ({ page }) => {
  const trigger = page.locator('#filters-trigger');

  // The platform queues `toggle` as a task rather than firing it inline, so the
  // attribute lands one task after the state change. These assertions retry for it;
  // they still fail outright if the module never writes the value.
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  // The close button inside the popover also carries popovertarget. It is not a
  // trigger and must never advertise the popover's state as its own.
  expect(await expanded(page, 'notes-close')).toBeNull();
});

test('the page behind an open popover stays interactive', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  const linkOnTop = await page.evaluate(() => {
    const link = document.getElementById('page-link')!;
    const box = link.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === link;
  });
  expect(linkOnTop, 'a modal overlay is covering the page - this component must not be modal').toBe(
    true,
  );
});

test('the auto popover light-dismisses on an outside click, the manual one does not', async ({
  page,
}) => {
  await page.locator('#filters-trigger').click();
  await page.mouse.click(4, 4);
  expect(await isOpen(page, 'filters-popover')).toBe(false);

  await page.locator('#notes-trigger').click();
  await page.mouse.click(4, 4);
  expect(await isOpen(page, 'notes-popover')).toBe(true);
});

test('opening the auto popover a second time closes the first', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  // Both popovers are open at once only because one of them is manual.
  await page.locator('#notes-trigger').click();
  expect(await isOpen(page, 'notes-popover')).toBe(true);
  expect(await isOpen(page, 'filters-popover')).toBe(false);
});

/** Viewport boxes of a trigger and its popover, read together so neither can move between reads. */
const boxes = (page: Page, triggerId: string, popoverId: string) =>
  page.evaluate(
    ([t, p]) => {
      const rect = (id: string) => {
        const b = document.getElementById(id)!.getBoundingClientRect();
        return { x: b.x, y: b.y, right: b.right, bottom: b.bottom };
      };
      return { trigger: rect(t), popover: rect(p) };
    },
    [triggerId, popoverId],
  );

test('the popover opens adjacent to its trigger rather than centred', async ({ page }) => {
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  const { trigger, popover } = await boxes(page, 'filters-trigger', 'filters-popover');
  // Directly below, left edges aligned. The gap between them is the offset property;
  // anything wider than a line of text means the popover is somewhere else entirely.
  expect(popover.x).toBeCloseTo(trigger.x, 0);
  expect(popover.y).toBeGreaterThanOrEqual(trigger.bottom);
  expect(popover.y - trigger.bottom).toBeLessThan(16);
});

test('the popover flips above a trigger that sits near the bottom of the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.evaluate(() => {
    document.getElementById('filters-trigger')!.style.cssText = 'position:fixed;left:32px;bottom:8px;';
  });
  await page.locator('#filters-trigger').click();
  expect(await isOpen(page, 'filters-popover')).toBe(true);

  // No room below, so the fallback places it above. It must still be fully on screen:
  // a popover that flips and then runs off the top is no better than one that overflows.
  const { trigger, popover } = await boxes(page, 'filters-trigger', 'filters-popover');
  expect(popover.bottom).toBeLessThanOrEqual(trigger.y);
  expect(popover.y).toBeGreaterThanOrEqual(0);
  expect(popover.x).toBeCloseTo(trigger.x, 0);
});
