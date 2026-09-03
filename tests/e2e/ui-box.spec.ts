import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl } from './support.js';

/** Every box on the demo page: plain, inverted, and the nested pair. */
const BOXES = ['box-plain', 'box-invert', 'box-outer', 'box-inner'];

/**
 * The padding-box height and the height the content actually needs.
 *
 * With no `height` declared the two are equal, because the box grows to fit. They
 * diverge exactly when something pins the box's height and the content spills out
 * of it - which is the regression 1.4.4 and 1.4.12 both guard against.
 */
function metrics(page: Page, id: string): Promise<{ client: number; scroll: number }> {
  return page.evaluate((elementId) => {
    const el = document.getElementById(elementId)!;
    return { client: el.clientHeight, scroll: el.scrollHeight };
  }, id);
}

/** The computed foreground and background of one box. */
function colourPair(page: Page, id: string): Promise<{ color: string; background: string }> {
  return page.evaluate((elementId) => {
    const style = getComputedStyle(document.getElementById(elementId)!);
    return { color: style.color, background: style.backgroundColor };
  }, id);
}

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('ui-box'));
});

test('1.4.3 Contrast (Minimum): both variants and the nested pair pass', async ({ page }) => {
  // Guard the guard: an empty page would pass a contrast sweep trivially.
  await expect(page.locator('.auk-box')).toHaveCount(BOXES.length);

  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

test('1.4.4 Resize Text: every box grows at 200% text rather than clipping it', async ({ page }) => {
  const before: Record<string, number> = {};
  for (const id of BOXES) before[id] = (await metrics(page, id)).client;

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });

  for (const id of BOXES) {
    const after = await metrics(page, id);
    expect(after.client, `#${id} did not grow when the text doubled`).toBeGreaterThan(before[id]);
    expect(after.scroll, `#${id} clipped its content at 200% text`).toBeLessThanOrEqual(after.client);
  }
});

test('1.4.12 Text Spacing: every box absorbs the overrides rather than clipping', async ({ page }) => {
  const before: Record<string, number> = {};
  for (const id of BOXES) before[id] = (await metrics(page, id)).client;

  // The four overrides the criterion names, at the values it names.
  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-block-end: 2em !important; }
    `,
  });

  for (const id of BOXES) {
    const after = await metrics(page, id);
    expect(after.client, `#${id} did not grow under the text-spacing overrides`).toBeGreaterThan(
      before[id],
    );
    expect(after.scroll, `#${id} clipped its content under the overrides`).toBeLessThanOrEqual(
      after.client,
    );
  }
});

test('the inverted variant swaps both colours, not only the background', async ({ page }) => {
  const plain = await colourPair(page, 'box-plain');
  const inverted = await colourPair(page, 'box-invert');

  expect(inverted.background, 'inverted box kept the plain background').not.toBe(plain.background);
  expect(inverted.color, 'inverted box kept the plain foreground').not.toBe(plain.color);
  // A background the component never set would come back transparent and inherit
  // whatever sits behind it - the exact failure the paired declaration prevents.
  for (const pair of [plain, inverted]) {
    expect(pair.background).not.toMatch(/rgba\([^)]*,\s*0\)/);
  }
});

test('the border stays visible when a reader forces their own colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });

  for (const id of ['box-plain', 'box-invert']) {
    const border = await page.evaluate((elementId) => {
      const style = getComputedStyle(document.getElementById(elementId)!);
      return {
        colour: style.borderTopColor,
        width: parseFloat(style.borderTopWidth),
        style: style.borderTopStyle,
      };
    }, id);

    // Colour alone is not the assertion. A forced palette repaints border-color
    // whether or not a border was ever declared, so `border: none` still reports an
    // opaque colour - measured. Width and style are what go to zero and `none` when
    // the declaration is dropped, which is the regression worth catching.
    expect(border.width, `#${id} has no border to repaint under forced colours`).toBeGreaterThan(0);
    expect(border.style, `#${id} border style is ${border.style}`).not.toBe('none');
    expect(border.colour, `#${id} border is transparent under forced colours`).not.toMatch(
      /rgba\([^)]*,\s*0\)/,
    );
  }
});

test('padding is uniform on all four sides', async ({ page }) => {
  const sides = await page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('box-plain')!);
    return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
  });

  expect(sides.every((side) => parseFloat(side) > 0), `padding was ${sides.join(' ')}`).toBe(true);
  expect(new Set(sides).size, `padding is not uniform: ${sides.join(' ')}`).toBe(1);
});

test('the box declares no height of its own', async ({ page }) => {
  // Read the shipped stylesheet rather than the computed value: a computed height is
  // always a number, so only the declaration says whether the component pinned it.
  const declared = await page.evaluate(() => {
    const sheet = document.styleSheets[0];
    return [...sheet.cssRules]
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .filter((rule) => rule.selectorText.includes('auk-box'))
      .flatMap((rule) => [rule.style.height, rule.style.blockSize])
      .filter(Boolean);
  });

  expect(declared, 'the box pinned its own height').toEqual([]);
});
