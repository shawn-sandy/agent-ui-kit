# Theming

How to restyle a component built from a `ui-` skill. Two facts make it a one-line job.
Every visual value in a component is written as
`var(--auk-<component>-<property>, <literal>)`, so a custom property set anywhere above
the element changes it. And every component's shipped CSS sits inside one cascade layer
named `auk`, so a plain rule written outside any layer beats it. That gives a user three
doors, and each one is a single line.

## The three doors

| Door | Reach for it when | One line |
| --- | --- | --- |
| Set a custom property | One value on one component: a colour, a radius, a gap | `:root { --auk-button-bg: #0f766e; }` |
| Write a plain CSS rule | Anything that is not a property, such as `border-style`, or a rule of your own | `.auk-button { border-style: dashed; }` |
| Run `ui-theme` | The whole brand at once: colours, radii and type across every component | Invoke the `ui-theme` skill with the project's tokens |

A custom property inherits down the page, so where it is set decides how far it reaches:

```css
:root { --auk-button-bg: #0f766e; }            /* every button */
.sidebar { --auk-button-bg: #0f766e; }         /* every button inside .sidebar */
.auk-button.cta { --auk-button-bg: #0f766e; }  /* one button */
```

Every property name and its fallback is catalogued in
[docs/properties.md](properties.md), one table per component. The `ui-theme` workflow
skill under `skills/ui-theme/` maps the brand-bearing ones, the colours, corner radii
and font families, and leaves the measured ones alone.

## Why a plain rule always wins

Each reference's CSS is wrapped in `@layer auk { ... }`. The cascade ranks every
declaration written outside any layer above every declaration inside one, whatever its
order in the page and whatever its specificity. So `.auk-button { background-color:
rebeccapurple; }` wins even from a stylesheet that loads before the component, and even
though the shipped rule has the same specificity. Measured in headless Chromium on the
button reference, with the user rule placed above the shipped block:

| Page | `border-style` | `background-color` |
| --- | --- | --- |
| Shipped CSS in `@layer auk`, user rule first | `dashed` | `rgb(102, 51, 153)` |
| Same page with the layer lines removed | `solid` | `rgb(26, 86, 219)` |

Six components share the one layer name, so all auk CSS is one bucket.

## The one condition: keep your reset in a layer declared before `auk`

The rule cuts both ways. A project's own unlayered reset outranks the component too.
With a plain `* { padding: 0 }` above the layered button, the button's computed
`padding-inline` drops from `16px` to `0px`, and a `button { border: 0; background:
none }` reset would strip more. The fix is one line at the top of the project's CSS,
before any stylesheet:

```css
@layer reset, auk, utilities;
```

with the reset itself wrapped in its layer:

```css
@layer reset {
  * { padding: 0; }
}
```

Measured on the same page, `padding-inline` returns to `16px`. A layer's position is
fixed by its first mention, so:

- A project with no layers wraps its reset in one and declares the order above.
- A project that already orders layers adds `auk` after its reset or base layer and
  before its utility or override layers: `@layer reset, base, auk, utilities;`. Not
  first, because the first layer named is the lowest.
- Overrides meant to beat the component can stay unlayered or sit in a layer declared
  after `auk`. Both win.

A browser released before March 2022 ignores the whole `@layer` block and leaves the
component unstyled. MDN lists the feature as Baseline widely available from that date.

## Dark mode

Redeclare the properties under the project's own dark selector, whichever it uses:

```css
@media (prefers-color-scheme: dark) {
  :root { --auk-button-bg: #5eead4; --auk-button-color: #042f2e; }
}
```

or `[data-theme="dark"] { ... }`, or `.dark { ... }`. When the project has a dark
scheme, the `ui-theme` skill mirrors every brand-bearing property under it for you.

## What not to override

`tests/e2e/` measures these against WCAG 2.2 AA, so the shipped value is a value the
component is known to meet. Change them and the guarantee goes with them:

- Focus ring width and offset: `--auk-<component>-focus-width` and
  `--auk-<component>-focus-offset`.
- Minimum target size: `--auk-button-min-size`, `--auk-tabs-tab-min-size`,
  `--auk-dialog-close-size` and `--auk-popover-close-size`.
- Motion: `--auk-button-transition-duration` runs only under
  `@media (prefers-reduced-motion: no-preference)`; a reader who asked for less motion
  gets none, and a theme must not put it back.

The `measured` kind in [docs/properties.md](properties.md) marks every property in this
group.
