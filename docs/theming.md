# Theming

How to restyle a component built from a `ui-` skill, and how to bind a whole design
system to every component at once. Four facts make it a short job. Every visual value
in a component is written as `var(--auk-<component>-<property>, <literal>)`, so a
custom property set anywhere above the element changes it. Every component's shipped
CSS sits inside one cascade layer named `auk`, so a plain rule written outside any
layer beats it. Every brand-bearing property - the 69 colours, corner radii and font
families - chains through the generated `skills/ui-theme/references/auk-roles.css` to
one of 23 semantic roles, so a brand is at most 23 lines. And the same roles ship as
`skills/ui-theme/references/auk.tokens.json`, a DTCG 2025.10 token file, so a token
build and a design tool read the same contract the browser does.

## The four doors

| Door | Reach for it when | One line |
| --- | --- | --- |
| Bind a role | Your design system has a token for the job: brand colour, text, surface, border, radius, font | `:root { --auk-role-primary: var(--color-action-primary); }` |
| Set a component property | One value on one component: a colour, a radius, a gap | `:root { --auk-button-bg: #0f766e; }` |
| Write a plain CSS rule | Anything that is not a property, such as `border-style`, or a rule of your own | `.auk-button { border-style: dashed; }` |
| Run `ui-theme` | The whole brand at once, discovered from your token file, Figma variables or stylesheets | Invoke the `ui-theme` skill with the project's tokens |

The first door needs `auk-roles.css` on the page; the other three do not. A custom
property inherits down the page, so where it is set decides how far it reaches:

```css
:root { --auk-button-bg: #0f766e; }            /* every button */
.sidebar { --auk-button-bg: #0f766e; }         /* every button inside .sidebar */
.auk-button.cta { --auk-button-bg: #0f766e; }  /* one button */
```

A role is different. The roles file resolves its chain on `:root`, and a custom
property substitutes its `var()` where it is declared while children inherit the
result, so a role set lower in the tree is never seen by that chain. Bind roles on
`:root`, under a media query, or under a dark class that sits on the root element;
a block under any other selector also restates the chain lines for the roles it
sets, copied from `auk-roles.css`. The roles file is anchored on `:root` alone
because a wider selector would let its layered chain beat the unlayered `:root`
override in the second door.

Every property name and its fallback is catalogued in
[docs/properties.md](properties.md), one table per component, each opening with the
component's anatomy. The `ui-theme` workflow skill under `skills/ui-theme/` binds the
roles and leaves the measured properties alone.

## Why a plain rule always wins

Each reference's CSS is wrapped in `@layer auk { ... }`, and so is the roles file. The
cascade ranks every declaration written outside any layer above every declaration
inside one, whatever its order in the page and whatever its specificity. So
`.auk-button { background-color: rebeccapurple; }` wins even from a stylesheet that
loads before the component, and even though the shipped rule has the same specificity.
Measured in headless Chromium on the button reference, with the user rule placed above
the shipped block:

| Page | `border-style` | `background-color` |
| --- | --- | --- |
| Shipped CSS in `@layer auk`, user rule first | `dashed` | `rgb(102, 51, 153)` |
| Same page with the layer lines removed | `solid` | `rgb(26, 86, 219)` |

The same rule is why a component property beats a role: with the roles file loaded and
`--auk-role-primary` bound, an unlayered `:root { --auk-button-bg: rebeccapurple }`
still computes `rgb(102, 51, 153)` on the button. `tests/e2e/ui-theme.spec.ts`
measures it. Six components and the roles file share the one layer name, so all auk
CSS is one bucket.

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

## Integrating a design system

The checklist a team follows once. Every promise in it is one the browser suite or a
gate measures.

1. Declare the layer order first - `@layer reset, auk, <your layers>;` before any
   stylesheet - and put the reset in its layer. Skipping this is the one way the
   components lose their padding.
2. Copy `skills/ui-theme/references/auk-roles.css` in beside the component CSS, then
   bind roles, not properties: `--auk-role-primary: var(--your-token)` with no
   fallback, so removing the token falls all the way back to the shipped literal. The
   `ui-theme` skill does this for you from a token file, Figma variables or your
   stylesheets; its crosswalk names the token for each role in shadcn/ui, Material
   Web, Primer, Bootstrap 5.3, Web Awesome and Radix Themes.
3. Bind a component property only to make one component differ from its role, and
   write it outside any layer.
4. Modes: redeclare the roles under your own dark or contrast selector, on the root
   element or under a media query. Never write a value your system does not have,
   and never write a `forced-colors` block.
5. A second brand: a `[data-brand="acme"]` block that binds the roles that differ
   and then restates the chain lines for those roles, copied from `auk-roles.css`,
   with `data-brand="acme"` on the subtree's root element. Without the chain lines
   the block does nothing, because the chain already resolved on `:root`; the
   `ui-theme` skill writes them for you. A target size never goes below 24 by 24 CSS
   pixels and a focus ring never below 3:1 against its surface, whatever the brand.
6. Measure after binding: an accessibility scan for text contrast, a computed-style
   read of the focus outline width, and the ring's contrast against its surface.
   Never estimate a ratio. `tests/e2e/ui-theme.spec.ts` shows all three reads.
7. On Figma, see the section below; the token file is the record and the Figma steps
   are a projection of it.

## Dark mode

Redeclare the roles under the project's own dark selector, whichever it uses:

```css
@media (prefers-color-scheme: dark) {
  :root { --auk-role-primary: #5eead4; --auk-role-on-primary: #042f2e; }
}
```

or `[data-theme="dark"] { ... }` on `<html>`, or `html.dark { ... }`. A dark class the
project toggles on `<body>` sits below the chain, so that block also restates the
chain lines for the roles it sets. When the project has a dark scheme, the `ui-theme`
skill mirrors every role whose token differs under it and writes the chain lines
where they are needed. A component property set without the roles file works under
any selector.

## Floors: what the suite measures

Only the bounds a test asserts today. Each is recorded on its token in
`auk.tokens.json` with the criterion and the spec file, and a theme keeps them by
leaving the measured properties alone.

| What | Floor | Asserted by |
| --- | --- | --- |
| Button target size | 24 by 24 CSS pixels (2.5.8) | `tests/e2e/ui-button.spec.ts` |
| Focus outline width | above 0 (2.4.7) | the button, dialog, popover and tabs specs, and `tests/e2e/ui-theme.spec.ts` under a bound palette |
| Focus ring contrast | 3:1 against the surface it is drawn over (1.4.11) | `tests/e2e/ui-theme.spec.ts` |
| Button transition | `0s` under `prefers-reduced-motion: reduce` (2.3.3); it runs only inside the `no-preference` guard, recorded as `guard` on the token | `tests/e2e/ui-button.spec.ts` |

The tab, dialog-close and popover-close target sizes are not asserted, so their tokens
carry `floor: none` rather than a number nobody measured. Dimension roles - spacing
steps, type sizes, target size, focus width as roles with these floors - are a
follow-up plan; today the token file records the floors and `ui-theme` binds brand
only.

## Review your brand in a browser

No design tool is needed to see the whole set under a brand. Put the role block in a
file and render the component sheet with it:

```bash
node scripts/build-design.mjs --roles your-roles.css -o preview.html
```

Open `preview.html` from disk: every component's Structure block is painted by its
shipped CSS with your roles bound, the Foundations section lists the 23 roles, and
print to PDF is the hand-off. The command refuses a file that binds a name outside the
23 roles and says which, because a misspelled role is the one mistake the chain
otherwise hides. Without `--roles` the same command rewrites the record itself,
`docs/designs/components/index.html`, from the references.

Two projections of that sheet exist, both labelled: `node scripts/build-design.mjs
--canvas` also writes a Claude Design canvas (Claude Code only; the maintainer's
`design-kit` skill publishes it), and a team on Figma with an editing seat can have the
Figma MCP server's `figma-generate-design` build a kit from the sheet, only on request.
Neither is maintained by hand and neither is the record.

## What a theme must never do

- Set `color-scheme`. The project decides that, not the theme.
- Write a `forced-colors` block. Under forced colours the components already use the
  system colours, and a theme must not defeat a reader's own high-contrast setting.
- Bind a size, spacing, duration, weight or placement property. Those are the
  measured properties above.
- Put a fallback on a role binding. `var(--token)` alone; the component's literal is
  the fallback.
- Invent a dark or contrast value the project does not declare.
- Restate a shipped default. A role left unbound already keeps it.

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

## Figma

Vendor-specific: everything in this section depends on Figma. The neutral record is
`auk.tokens.json` plus the anatomy tables in [docs/properties.md](properties.md), and a
team on Penpot imports the same token file. Seven steps:

1. Import `skills/ui-theme/references/auk.tokens.json` through the variables panel
   as an `auk` collection. Any plan. The 23 `auk/role/*` variables are the semantics;
   the `auk/<component>/*` variables alias them.
2. Set the web code syntax on each role variable to `var(--auk-role-<name>)`. The
   import does not set it, and the anatomy tables' roles lines carry the exact string
   for each component.
3. Alias each role variable to the variable your own library already has for that
   job, so the roles follow your primitives.
4. Bind component fills, strokes and text to the role variables, never to the
   component variables directly.
5. Name variants and layers as the anatomy tables say: a `Variant` property with
   `Primary`, `Secondary`, `Destructive`; a `State` property with `Default` first,
   then `Hover`, `Focus`, `Disabled`; layers named `Icon`, `Header`, `Close`.
6. One trade, so you can decline it: Figma's guidance is that a semantic variable
   aliases a primitive, never another semantic, and step 3 has a semantic role alias
   a semantic of yours. The alternative is to bind the component variables directly
   to your primitives, 69 aliases instead of 23, and not to use the roles file.
7. On an Organization or Enterprise plan with a published library, add a Code Connect
   template so Dev Mode shows the markup for a variant. The shape below was checked
   against https://developers.figma.com/docs/code-connect/html on 2026-09-04 and is
   unverified locally, because the package is not installed here:

```ts
// button.figma.ts - Vendor-specific: Figma Code Connect for HTML.
import figma, { html } from '@figma/code-connect/html';

figma.connect('https://www.figma.com/design/<file>/<name>?node-id=<button-set>', {
  props: {
    variant: figma.enum('Variant', { Primary: 'primary', Secondary: 'secondary', Destructive: 'destructive' }),
    disabled: figma.enum('State', { Disabled: 'true' }),
    label: figma.string('Label'),
  },
  example: ({ variant, disabled, label }) => html`
    <button class="auk-button" type="button" data-variant=${variant} aria-disabled=${disabled}>
      ${label}
    </button>
  `,
});
```

An agent with a Figma MCP server and an editing seat may create the collection, modes
and code syntax through `use_figma` instead of steps 1 to 3. Optional, and the file
import is the path that needs no seat.
