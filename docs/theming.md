# Theming

How to restyle a component built from a `ui-` skill, and how a design system binds
its tokens to the whole set once. Three facts make it a short job. Every visual value
in a component is written as `var(--auk-<component>-<property>, <literal>)`, so a
custom property set anywhere above the element changes it. Every brand-bearing
property is chained to one of 23 semantic roles by the generated
`skills/ui-theme/references/auk-roles.css`, so a brand is at most 23 lines. And every
component's shipped CSS, the roles file included, sits inside one cascade layer named
`auk`, so a plain rule written outside any layer beats it. That gives a user four
doors.

## The four doors

| Door | Reach for it when | One line |
| --- | --- | --- |
| Bind a role | The brand: a colour, radius or font every component should agree on | `:root { --auk-role-primary: var(--color-action-primary); }` with `auk-roles.css` loaded |
| Set a component property | One value on one component, or one component that must differ from its role | `:root { --auk-button-bg: #0f766e; }` |
| Write a plain CSS rule | Anything that is not a property, such as `border-style`, or a rule of your own | `.auk-button { border-style: dashed; }` |
| Run `ui-theme` | The whole brand at once from the project's own token file, Figma variables or stylesheets | Invoke the `ui-theme` skill |

A custom property inherits down the page, so where it is set decides how far it reaches:

```css
:root { --auk-button-bg: #0f766e; }            /* every button */
.sidebar { --auk-button-bg: #0f766e; }         /* every button inside .sidebar */
.auk-button.cta { --auk-button-bg: #0f766e; }  /* one button */
```

Every property name and its fallback is catalogued in
[docs/properties.md](properties.md), one table per component, each opening with the
component's anatomy and the roles it reads. The roles themselves - meaning, the
properties each covers, the shipped value - are the mapping table in
`skills/ui-theme/references/ui-theme.md`, and the same facts are machine-readable in
`skills/ui-theme/references/auk.tokens.json`, a DTCG 2025.10 token file.

## Bind the roles, not the properties

`auk-roles.css` is 69 lines, one per brand-bearing property, each set to a role:

```css
@layer auk {
  :root {
    --auk-button-bg: var(--auk-role-primary);
    --auk-button-border-color: var(--auk-role-primary);
    --auk-tabs-selected-tab-color: var(--auk-role-primary);
    /* ... 66 more ... */
  }
}
```

Copy it in once, then bind only the roles your system has a token for:

```css
:root {
  --auk-role-primary: var(--color-action-primary);
  --auk-role-on-primary: var(--color-action-on-primary);
  --auk-role-text: var(--color-text-default);
  --auk-role-surface: var(--color-surface-default);
  --auk-role-border: var(--color-border-default);
  --auk-role-radius: var(--radius-md);
  --auk-role-font: var(--font-sans);
}
```

Three things follow from the shape, and `tests/e2e/ui-theme.spec.ts` measures each:

- An unbound role costs nothing. `--auk-button-focus-color: var(--auk-role-focus)` with
  no `--auk-role-focus` anywhere is invalid at computed-value time, so the component's
  own `var(--auk-button-focus-color, #111827)` falls back to its literal. Binding
  seven roles leaves the other sixteen exactly as shipped.
- A binding is `var(--your-token)` with no fallback, on purpose. Remove the token later
  and the chain falls back to the shipped literal instead of to a stale copy.
- One component that must differ from its role is a component property, unlayered:
  `:root { --auk-button-destructive-bg: var(--brand-red-deep); }` beats the layered
  roles file whatever its order. That is the escape hatch, not the theme.

The `ui-theme` skill does all of this for you from a token file, a Figma file's
variables or the stylesheets, and re-measures the result.

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

Six components and the roles file share the one layer name, so all auk CSS is one bucket.

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

## Blocks below `:root` restate the chain

A custom property resolves where it is declared. The roles file chains
`--auk-button-bg` to `--auk-role-primary` on `:root`, so that chain line is resolved
there, against the root's role value, and inherited by every element as a plain
colour. A role set lower in the tree is never consulted by it:

```css
[data-brand="acme"] { --auk-role-primary: #9f1239; }   /* does nothing on its own */
```

Measured in the prototype and in `tests/e2e/ui-theme.spec.ts`: the button inside the
Acme wrapper keeps the root brand. Any block whose selector is not `:root` therefore
restates the chain lines for each role it sets, copied from that role's group in
`auk-roles.css`:

```css
[data-brand="acme"] {
  --auk-role-primary: #9f1239;
  --auk-button-bg: var(--auk-role-primary);
  --auk-button-border-color: var(--auk-role-primary);
  --auk-tabs-selected-tab-color: var(--auk-role-primary);
  --auk-tabs-selected-tab-border-block-end-color: var(--auk-role-primary);
}
```

Now only that subtree changes, and `:root` is untouched. The same rule covers dark and
high-contrast blocks written as a class or attribute selector - `[data-theme="dark"]`,
`.dark` - and every density or second-brand block. A media query is not a selector:
`@media (prefers-color-scheme: dark) { :root { ... } }` is still on `:root` and needs no
chain lines. When the project has a dark or contrast scheme, the `ui-theme` skill
mirrors it under the project's own selector, restated chain lines included, and never
invents a value the project does not have.

## Integration checklist

For a team bringing the components into an existing design system:

1. Declare the layer order first, before any stylesheet - `@layer reset, auk, utilities;`
   - and put the reset in its layer. Skipping this is the one way the components lose
   their padding.
2. Copy `skills/ui-theme/references/auk-roles.css` in, then bind roles, not properties:
   `--auk-role-primary: var(--your-token)` with no fallback, so removing the token
   falls back to the shipped literal.
3. Bind a component property only to make one component differ from its role.
4. Modes: redeclare roles under your own dark or contrast selector, restating the chain
   lines when that selector is not `:root`. Never write a value your system does not
   have, and never write a `forced-colors` block.
5. A second brand or a density is a scoped block on a subtree root, `[data-brand]` or
   `[data-density]`, that restates the chain lines for the roles it sets. Sizes stay
   out of it until dimension roles exist.
6. Measure after binding: an accessibility scan for text contrast, a computed-style read
   of the focus outline, and the ring's contrast against its surface. Never estimate a
   ratio; `tests/e2e/ui-theme.spec.ts` shows the three reads.
7. On Figma: import `auk.tokens.json` as a collection, set the web code syntax, alias
   the roles to your variables, and name variants and layers as the Anatomy tables in
   [docs/properties.md](properties.md) say. The section below has the steps.

## Floors the suite asserts

A measured property can be changed - door two - but these are the bounds the browser
suite proves and the token file records under `$extensions` as each property's `floor`.
Every other measured property records `none`, never a number nobody measured.

| Property or role | Floor | Criterion | Asserted in |
| --- | --- | --- | --- |
| `--auk-button-min-size` | at least 24 by 24 CSS pixels | 2.5.8 Target Size (Minimum) | `tests/e2e/ui-button.spec.ts` |
| `--auk-button-focus-width`, `--auk-dialog-focus-width`, `--auk-popover-focus-width`, `--auk-tabs-focus-width` | above 0 | 2.4.7 Focus Visible | each component's spec |
| `--auk-role-focus` (the ring colour) | 3:1 against the surface it is drawn over | 1.4.11 Non-text Contrast | `tests/e2e/ui-theme.spec.ts` |
| `--auk-button-transition-duration` | `0s` under `prefers-reduced-motion: reduce` | 2.3.3 Animation from Interactions | `tests/e2e/ui-button.spec.ts` |

Dimension roles - spacing, type and size scales bound as roles, each with a floor - are
a follow-up plan, not part of this contract. Until then a theme binds brand only.

## What a theme must never do

- Set a size, spacing, duration or placement property. Those are measured values.
- Write a `forced-colors` block. Under forced colours the components use the reader's
  system colours, and a theme must not defeat that setting.
- Set `color-scheme`. That is the page's declaration, not a component's or a theme's.
- Invent a dark or high-contrast value the project does not declare itself.
- Copy a shipped fallback into the project's stylesheet. A line that restates the
  default hides the lines that matter.
- Set a role below `:root` without restating its chain lines. The block does nothing.

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

## Review your brand in a browser

The component sheet at `docs/designs/components/index.html` renders every component
painted by its shipped CSS, with its anatomy and tokens, and opens from disk. To see
your own brand on it, no design tool needed:

```
node scripts/build-design.mjs --roles your-roles.css -o preview.html
```

`your-roles.css` is your role block; the generator inlines `auk-roles.css` before it,
refuses a misspelled role by name, and writes a self-contained page. Open it over
`file://` and print to PDF for a hand-off. The sheet itself is regenerated with
`node scripts/build-design.mjs` and pinned by `tests/integration/design-sheet.spec.ts`;
it is the design-side record.

Two projections of the sheet exist, each labelled Vendor-specific and each optional:
`node scripts/build-design.mjs --canvas` writes a Claude Design canvas into
`docs/designs/components/canvas/`, which only Claude Code can publish (the internal
`design-kit` skill does it); and a Figma kit can be built from the sheet with the
Figma server's `figma-generate-design` procedure, on an editing seat, only when a team
asks. Neither is the record, and neither is needed to use the components.

## Figma

Vendor-specific. The neutral record is `skills/ui-theme/references/auk.tokens.json`
plus the Anatomy tables in [docs/properties.md](properties.md); everything below is a
projection of those two onto one tool, and a team on Penpot or a token build uses the
same file without any of it.

1. Import `auk.tokens.json` as a variable collection named `auk` (any plan). The 23
   roles arrive as variables with the shipped value; the component variables arrive
   aliased to them.
2. Set the web code syntax on each role variable to `var(--auk-role-<name>)`, and on
   each component variable to `var(--auk-<component>-<property>)`. The import does not
   set it, and it is what Dev Mode prints beside the design.
3. Alias each role to the matching variable in your own collection: `auk/role/primary`
   to `color/action/primary`, and so on. Figma's guidance says a semantic variable
   should alias a primitive, not another semantic; this is one alias deeper than that,
   and the trade is 23 bindings instead of 137. A team that would rather stay inside
   the guidance binds the component variables directly and skips the roles.
4. Bind component fills, strokes and text to the role variables, never to a raw value.
5. Name variants and layers as the Anatomy tables say: the `Variant` property with
   values `Primary`, `Secondary`, `Destructive`; the `State` property with `Default`,
   `Hover`, `Focus`, `Disabled`; layer names `Icon`, `Header`, `Body`, `Footer`.
6. Modes are per collection and capped by plan. Mirror the project's own dark or
   contrast mode on the role collection only; never add one the CSS does not have.
7. Optional, and only on an Organization or Enterprise plan with a published library:
   a Code Connect template for the button, mapping `Variant` to `data-variant` and
   `State=Disabled` to `aria-disabled="true"`. Its shape below was checked against the
   live Code Connect HTML page on 2026-09-04 and is not verified locally, because the
   package is not installed in this repository and never will be under `skills/`.

```ts
// button.figma.ts - Code Connect for HTML. Organization or Enterprise plan, a
// published library and the Code Connect package in the consuming project.
import figma, { html } from '@figma/code-connect/html'

figma.connect('https://www.figma.com/design/<file>/<name>?node-id=<button-component-set>', {
  props: {
    variant: figma.enum('Variant', { Primary: 'primary', Secondary: 'secondary', Destructive: 'destructive' }),
    disabled: figma.enum('State', { Disabled: 'true' }),
    label: figma.string('Label'),
  },
  example: ({ variant, disabled, label }) =>
    html`<button class="auk-button" type="button" data-variant=${variant} aria-disabled=${disabled}>${label}</button>`,
})
```

An agent with a Figma server connected and an editing seat may instead create the
role collection, its modes and its code syntax through the server's `use_figma` tool;
that is optional too, and the imported file is the same collection.
