/**
 * The anatomy renderer in scripts/build-properties.mjs. The qualifier line declares
 * parts the markup addresses by class, ARIA role or pseudo-element as well as by
 * `data-part`, so the renderer's claim that a name is an attribute is read from the
 * Structure block rather than assumed - and the Figma names it derives are the other
 * half of the contract docs/component-spec.md states, so each shape is pinned here.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { anatomy, render } from '../../scripts/build-properties.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const reference = (skill: string) => readFileSync(resolve(ROOT, 'skills', skill, 'references', `${skill}.md`), 'utf8');

describe('anatomy reads the qualifier line against the Structure and Styles blocks', () => {
  const button = anatomy(reference('ui-button'));

  it('button parts are data-part attributes with Title Case layer names', () => {
    expect(button.parts).toEqual([{ name: 'icon', attribute: true, code: 'data-part="icon"', figma: 'Icon' }]);
  });

  it('button variants become Variant= values', () => {
    expect(button.variants).toEqual([
      { name: 'primary', code: 'data-variant="primary"', figma: 'Variant=Primary' },
      { name: 'secondary', code: 'data-variant="secondary"', figma: 'Variant=Secondary' },
      { name: 'destructive', code: 'data-variant="destructive"', figma: 'Variant=Destructive' },
    ]);
  });

  it('button states open with State=Default and carry the DOM form the Styles block uses', () => {
    expect(button.states).toEqual([
      { name: 'default', code: 'no attribute', figma: 'State=Default' },
      { name: 'hover', code: ':hover', figma: 'State=Hover' },
      { name: 'focus', code: ':focus-visible', figma: 'State=Focus' },
      { name: 'disabled', code: '[aria-disabled="true"]', figma: 'State=Disabled' },
    ]);
  });

  it('dialog parts the markup addresses by class or pseudo-element are not attributes', () => {
    const parts = Object.fromEntries(anatomy(reference('ui-dialog')).parts.map((p) => [p.name, p.attribute]));
    expect(parts).toEqual({ header: true, title: false, body: true, footer: true, close: false, backdrop: false });
  });

  it('tabs and popover states take their selectors from the Styles block', () => {
    expect(anatomy(reference('ui-tabs')).states.map((s) => s.code)).toEqual(['no attribute', '[aria-selected="true"]', ':focus-visible']);
    expect(anatomy(reference('ui-popover')).states.map((s) => s.code)).toEqual(['no attribute', ':popover-open', ':focus-visible']);
  });

  it('a component with no parts, variants or states still opens with State=Default', () => {
    const box = anatomy(reference('ui-box'));
    expect(box.parts).toEqual([]);
    expect(box.variants).toEqual([{ name: 'invert', code: 'data-variant="invert"', figma: 'Variant=Invert' }]);
    expect(box.states).toEqual([{ name: 'default', code: 'no attribute', figma: 'State=Default' }]);
  });
});

describe('render() opens every component section with an Anatomy table and the roles it reads', () => {
  const out = render();

  it('one Anatomy table per component, eight Variant= rows in all', () => {
    expect(out.match(/^\| Kind \| Name \| In code \| Figma name \|$/gm)?.length).toBe(6);
    expect(out.match(/Variant=/g)?.length).toBe(8);
  });

  it('names the roles a component reads with their code syntax', () => {
    expect(out).toMatch(/^Roles read: `var\(--auk-role-primary\)`, `var\(--auk-role-on-primary\)`/m);
  });
});
