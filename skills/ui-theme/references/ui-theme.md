# Theme reference

A workflow, not a component. It reads a project's design tokens - a token file, the
variables of a named design file, or the stylesheet sources - works out which of the
project's existing values play which visual role, copies the generated `auk-roles.css`
into the project, and emits one block of CSS that binds those values to the
`--auk-role-*` custom properties. Every auk component built into the project then
takes on the project's colours, corner radius and type without a line of its own code
changing, and a brand is at most 23 lines.

Every component reference ships each themeable value as
`var(--auk-<slug>-<property>, <literal>)`. The literal is the shipped default and the
reason a component works with no custom properties defined anywhere. The roles file,
generated from the references and the mapping table below, chains each brand-bearing
component property to its role inside the `auk` cascade layer:

```css
@layer auk {
  :root {
    --auk-button-bg: var(--auk-role-primary);
    /* one line per brand-bearing property, 69 in all */
  }
}
```

Binding a role sets every property in its row at once. A role nobody binds leaves the
chained property invalid at computed-value time, so the shipped literal applies and
the component looks exactly as it did before. This skill sets roles; it never edits a
component's own CSS, and no component reference reads a role.

## Scope

The mapping covers the 69 brand-bearing properties: 57 colours, 7 corner radii and 5
font families. The other 68 properties - every width, size, gap, padding, offset,
duration, weight, line height, font size, brightness and placement - keep their
shipped literals. They are what `tests/e2e/` measures: minimum target sizes, focus
offsets and reduced-motion timing. A theme that moved them would move the
measurements too, so the emitted block never names one, and the token file records
for each of them the floor a test asserts or `none`.

`tests/unit/ui-theme-mapping.spec.ts` pins the mapping table below to the component
references: every property it names must exist in a shipped reference, its count
must equal the number of brand-bearing properties the references declare, and the
counts in the paragraph above must agree with both. A new colour, radius or
font-family property in any component fails that test until the table names it.

## The two generated files

`references/auk.tokens.json` and `references/auk-roles.css` sit beside this file. Both
are written by `scripts/build-tokens.mjs` in this skill's repository from the six
component references and the mapping table below, and
`tests/integration/tokens-file.spec.ts` fails when either differs from the generator by
a byte, so neither is ever edited by hand.

- `auk.tokens.json` is a Design Tokens Community Group (DTCG) 2025.10 token file: the
  23 roles as tokens whose value is the shipped fallback, then all 137 component
  properties as tokens - the 69 brand-bearing ones aliased to their role as
  `{auk.role.<name>}`, the 68 measured ones typed by value. Every token carries the
  CSS property name, its kind and its shipped literal under `$extensions`, and a
  measured token carries the floor `tests/e2e/` asserts or `none`. Twelve shipped
  literals the format cannot type - `inherit`, `auto`, `min()` and `calc()`
  expressions, two placement keywords - ride along verbatim as strings flagged `raw`.
  A token build reads the file as a second source and emits the role bindings and the
  chain together; a design tool that imports the format reads it as one variable
  collection. The file has no modes and no resolver, so today's tools build it.
- `auk-roles.css` is the chain shown above: `@layer auk { :root { ... } }`, 69 lines,
  one per brand-bearing property, grouped by role in table order. A project copies it
  in once and binds roles. Because it sits in the `auk` layer, an unlayered
  declaration of any single component property still beats it.

## Guard

Before anything else, search the project's stylesheet sources for a selector that
contains `auk-`. If none exists, no auk component has been built into the project
yet. Say so, point at the component skills - `ui-alert`, `ui-box`, `ui-button`,
`ui-dialog`, `ui-popover`, `ui-tabs` - and emit nothing. A theme block with nothing
to theme is dead code the project would carry forever.

## Discovery

Static, ordered, and run with ordinary file tools: read files on disk, never a
rendered page. Three sources, in order; for each role, stop at the first source and
step that yields a value. A known system short-circuits all three: when the project's
tokens match a column of the crosswalk below, bind each role to the cell in its row
and go straight to the dark and contrast checks.

The role words, matched against a token name's last segments however the name is
written - `--color-primary`, `color/action/primary`, `color.action.primary`: `primary`,
`brand`, `accent`, `action`; `on-primary`, `primary-foreground`, `on-` before any of
those; `text`, `foreground`, `fg`; `background`, `surface`, `bg`; `border`, `outline`;
`divider`, `separator`; `ring`, `focus`; `info`, `notice`; `danger`, `error`,
`destructive`; `success`; `warning`, `attention`; `muted`, `disabled`, `neutral`;
`inverse`, `emphasis`; `overlay`, `backdrop`, `scrim`; `shadow`, `elevation`;
`radius`, `rounded`, `corner`; `font`, `family`, `typeface`. Prefer the name that
carries the role word alone or with the step the project treats as its default -
`--color-primary`, `--color-primary-500`, `--radius-md` - over a variant such as
`--color-primary-hover`.

Source one, a token file. Look for files ending `.tokens` or `.tokens.json` under the
project, skipping dependency and build-output directories. They are DTCG files, the
format every token tool and design tool exports, and the most reliable source because
nothing in them was inferred. Walk each file's tokens and match the role words
against each token's path. A match binds the role to the CSS name the project already
uses for that token: the code syntax the token carries under `$extensions` when the
file has one; otherwise the custom property the project's own stylesheet declares for
it; otherwise the name a build emits from the path, the segments joined with hyphens
after `--`, which is what most builds produce by default - say which of the three was
used. The file also settles the type: bind `radius` only to a `dimension`, `font`
only to a `fontFamily`, `shadow` only to a `shadow`, and every other role only to a
`color`.

Source two, the variables of a named design file. Vendor-specific, and taken only when
the request names a Figma file and a Figma server is connected to the agent: read the
variables the server returns for the named file or selection, and match their names
and web code syntax exactly as source one matches a token file. When no server is
connected, ask for the file's exported token file instead - the neutral path, and the
same file source one reads. Never read colours off a rendered frame.

Source three, the stylesheet sources:

1. Collect the sources: files ending `.css` under the project, skipping dependency
   and build-output directories. If there are none, take the files whose extension
   marks a language that compiles to CSS - `.scss`, `.less`, `.styl`, `.pcss` -
   named here by extension only. Skip any file that is effectively one line, or
   whose first lines carry a minified or generated marker: a bundle would swamp the
   frequency ranking below with values the project never wrote.
2. Read every `:root`, `:host` and `html` rule and collect the custom properties
   declared there. Match each name against the role words. A match binds the role
   to `var(--that-property)`.
3. For roles still unbound, count colour literals - hex, `rgb()`, `hsl()`,
   `oklch()` and named colours - across the sources. The most frequent saturated
   colour is `primary`; the most frequent near-black is `text`; the most frequent
   near-white is `surface`; the most frequent low-contrast grey is `border`. A
   literal binds the role to that literal, written into the block as-is.
4. Repeat the frequency ranking for `border-radius` values (`radius`) and
   `font-family` stacks (`font`).
5. Detect a dark scheme: a `prefers-color-scheme: dark` media query, or a `.dark`,
   `[data-theme="dark"]` or `[data-mode="dark"]` selector, that redeclares any of the
   custom properties bound above. Detect a high-contrast scheme the same way: a
   `prefers-contrast: more` media query, or a `[data-contrast="more"]` or
   `.high-contrast` selector, that redeclares them. Record each form verbatim. Which
   tokens a form redeclares decides its block in the output contract; which shape it
   takes decides how that block is wrapped.
6. Roles still unbound go to the interview under the SKILL.md heading "Clarify when
   needed", capped at the six core roles: `primary`, `text`, `surface`, `border`,
   `radius`, `font`. Offer the shipped fallback as the default answer. Every other
   unbound role keeps its shipped fallback without a question - the semantic
   colours, the overlay and the shadow are rarely worth an interruption, and the
   project can bind them later by hand.

## Mapping table

Twenty-three roles onto 69 properties. The fallback column is the literal each
component reference ships, so a role the project never binds looks exactly as it did
before the theme. The first property in a row is the one whose fallback the token
file records as the role's shipped value.

| Role | Meaning | Properties | Shipped fallback |
| --- | --- | --- | --- |
| primary | Brand action colour | `--auk-button-bg`, `--auk-button-border-color`, `--auk-tabs-selected-tab-color`, `--auk-tabs-selected-tab-border-block-end-color` | `#1a56db`; button border `transparent` |
| on-primary | Text on primary | `--auk-button-color`, `--auk-button-destructive-color` | `#ffffff` |
| text | Body text | `--auk-dialog-color`, `--auk-popover-color`, `--auk-tabs-color`, `--auk-box-color`, `--auk-button-secondary-color`, `--auk-dialog-close-color`, `--auk-popover-close-color`, `--auk-dialog-body-color`, `--auk-popover-body-color`, `--auk-tabs-tab-color` | `#111827` (dialog, popover, tabs); `#1f2937` (box, secondary button, close controls); `#374151` (dialog and popover body, unselected tab) |
| surface | Card and page background | `--auk-box-bg`, `--auk-button-secondary-bg`, `--auk-dialog-bg`, `--auk-dialog-close-bg`, `--auk-popover-bg`, `--auk-popover-close-bg`, `--auk-tabs-tab-bg` | `#ffffff`; close controls and tab `transparent` |
| border | Default border | `--auk-dialog-border-color`, `--auk-popover-border-color`, `--auk-tabs-border-color`, `--auk-button-secondary-border-color`, `--auk-box-border-color`, `--auk-dialog-close-border-color`, `--auk-popover-close-border-color` | `#d1d5db` (dialog, popover, tabs); `#6b7280` (secondary button); `transparent` (box, close controls) |
| divider | Hairline inside a surface | `--auk-dialog-divider-color`, `--auk-popover-divider-color` | `#e5e7eb` |
| focus | Focus ring | `--auk-button-focus-color`, `--auk-dialog-focus-color`, `--auk-popover-focus-color`, `--auk-tabs-focus-color` | `#111827` |
| info | Default alert text and border | `--auk-alert-color`, `--auk-alert-border-color` | `#1e3a8a` |
| info-surface | Default alert background | `--auk-alert-bg` | `#dbeafe` |
| danger | Error text and border, destructive action | `--auk-alert-error-color`, `--auk-alert-error-border-color`, `--auk-button-destructive-bg` | `#b91c1c` |
| danger-surface | Error background | `--auk-alert-error-bg` | `#fee2e2` |
| success | Success text and border | `--auk-alert-success-color`, `--auk-alert-success-border-color` | `#14532d` |
| success-surface | Success background | `--auk-alert-success-bg` | `#dcfce7` |
| warning | Warning text and border | `--auk-alert-warning-color`, `--auk-alert-warning-border-color` | `#78350f` |
| warning-surface | Warning background | `--auk-alert-warning-bg` | `#fef3c7` |
| muted | Unavailable control | `--auk-button-disabled-bg`, `--auk-button-disabled-border-color` | `#6b7280`; border `transparent` |
| on-muted | Text on a muted control | `--auk-button-disabled-color` | `#ffffff` |
| inverse | Inverted box | `--auk-box-invert-bg`, `--auk-box-invert-border-color` | `#1f2937`; border `transparent` |
| on-inverse | Text on an inverted box | `--auk-box-invert-color` | `#f9fafb` |
| overlay | Dialog backdrop | `--auk-dialog-backdrop-bg` | `rgba(17, 24, 39, 0.6)` |
| shadow | Floating surface shadow | `--auk-popover-box-shadow` | `0 10px 25px rgba(17, 24, 39, 0.18)` |
| radius | Corner radius | `--auk-alert-radius`, `--auk-box-radius`, `--auk-button-radius`, `--auk-dialog-radius`, `--auk-dialog-close-radius`, `--auk-popover-radius`, `--auk-popover-close-radius` | `0.375rem`; dialog and popover `0.5rem` |
| font | Type family | `--auk-alert-font-family`, `--auk-button-font-family`, `--auk-dialog-font-family`, `--auk-popover-font-family`, `--auk-tabs-font-family` | `inherit` |

A role binds every property in its row to the same value, including the properties
of components not yet built into the project: a custom property no rule reads costs
nothing, and the next component built from a `ui-` skill arrives themed. Where a
row's fallbacks differ - the dialog's larger radius, the transparent borders - that
difference was a per-component default, and one project value replaces it on
purpose: a theme is what makes the components agree. A project that wants the
difference back sets the odd component property by hand after the block is emitted.

`on-primary` is the text drawn over `primary` and over `danger`. When the project
binds `primary` to a light colour, bind `on-primary` to the project's text token
rather than leaving the shipped white, and let the verification step measure it.
`on-muted` and `on-inverse` follow the same rule over `muted` and `inverse`: a text
colour never shares a role with the background it is drawn over, or binding that role
would paint the text in its own background.

## Crosswalk

Every cell was verified 2026-09-04 against the system's live documentation. A blank
cell means the page read that day named no token for the role, and no cell was
written from memory. When a project's tokens match a column, bind each role to the
cell in its row and skip the matching; a project may still have renamed one, so the
verification step measures the result rather than trusting the table.

| Role | shadcn/ui | Material Web | Primer | Bootstrap 5.3 | Web Awesome | Atlassian |
| --- | --- | --- | --- | --- | --- | --- |
| primary | `--primary` | `--md-sys-color-primary` | `--bgColor-accent-emphasis` | `--bs-primary` | `--wa-color-brand-fill-loud` | |
| on-primary | `--primary-foreground` | `--md-sys-color-on-primary` | `--fgColor-onEmphasis` | | `--wa-color-brand-on-loud` | |
| text | `--foreground` | `--md-sys-color-on-surface` | `--fgColor-default` | `--bs-body-color` | `--wa-color-text-normal` | |
| surface | `--background` | `--md-sys-color-surface` | `--bgColor-default` | `--bs-body-bg` | `--wa-color-surface-default` | |
| border | `--border` | `--md-sys-color-outline` | `--borderColor-default` | `--bs-border-color` | `--wa-color-surface-border` | |
| divider | | | `--borderColor-muted` | | | |
| focus | `--ring` | | `--focus-outlineColor` | `--bs-focus-ring-color` | `--wa-color-focus` | |
| info | | | | `--bs-info` | | |
| info-surface | | | | `--bs-info-bg-subtle` | | |
| danger | `--destructive` | `--md-sys-color-error` | `--fgColor-danger` | `--bs-danger` | `--wa-color-danger-fill-loud` | |
| danger-surface | | | `--bgColor-danger-muted` | `--bs-danger-bg-subtle` | `--wa-color-danger-fill-quiet` | |
| success | | | `--fgColor-success` | `--bs-success` | `--wa-color-success-fill-loud` | |
| success-surface | | | `--bgColor-success-muted` | `--bs-success-bg-subtle` | `--wa-color-success-fill-quiet` | |
| warning | | | `--fgColor-attention` | `--bs-warning` | `--wa-color-warning-fill-loud` | |
| warning-surface | | | `--bgColor-attention-muted` | `--bs-warning-bg-subtle` | `--wa-color-warning-fill-quiet` | |
| muted | `--muted` | | `--bgColor-disabled` | `--bs-secondary` | `--wa-color-neutral-fill-normal` | |
| on-muted | `--muted-foreground` | | `--fgColor-disabled` | | `--wa-color-neutral-on-normal` | |
| inverse | | | `--bgColor-emphasis` | | | |
| on-inverse | | | `--fgColor-onEmphasis` | | | |
| overlay | | | `--overlay-backdrop-bgColor` | | `--wa-color-overlay-modal` | |
| shadow | | | `--shadow-floating-small` | `--bs-box-shadow` | | |
| radius | `--radius` | `--md-sys-shape-corner-medium` | | `--bs-border-radius` | | |
| font | | `--md-ref-typeface-plain` | | `--bs-body-font-family` | `--wa-font-family-body` | `--ds-font-body` |

Sources: https://ui.shadcn.com/docs/theming ; https://material-web.dev/theming/material-theming/ ;
https://material-web.dev/components/button/ ; https://primer.style/product/primitives/color/ ;
https://getbootstrap.com/docs/5.3/customize/css-variables/ ; https://webawesome.com/docs/tokens/ ;
https://webawesome.com/docs/tokens/color/ ; https://atlassian.design/foundations/tokens/use-tokens-in-code/

Not in the table, and why: Radix Colors documents numeric scale steps such as
`--blue-9` and alias patterns a project defines itself, not shipped semantic names;
Carbon's colour token pages could not be read in full on the day (the fetch returned
truncated content); Atlassian's full token list returned only its navigation, so the
column holds the one token its code page names, and the rest of Atlassian's roles
come from the project's own token file. Web Awesome's border page returned 404, so
its `radius` cell is blank.

## Output contract

Two files, placed where the project already keeps its stylesheets.

- The roles file. Copy `auk-roles.css` from this skill's `references/` directory
  beside the first stylesheet that contains an `auk-` selector, and load it on every
  page that stylesheet loads on - a `<link>` after it, or an import from the same
  entry. Load order does not otherwise matter: the chain sits in the `auk` layer and
  reads its roles from `:root` by inheritance. Never edit it; a newer skill version
  ships a newer copy.
- The role block. Append to the stylesheet that already declares the project's `:root`
  custom properties; if none does, create `auk-theme.css` beside the roles file and
  load it the same way. Shape: a comment line, then a single rule under the scope
  selector - `:root` unless the request names one - setting only `--auk-role-*`
  properties from the mapping table, one per line, in table order, at most 23 lines.
- A role bound to a project token is written as `var(--project-token)` with no
  fallback. The component's own `var(--auk-*, literal)` is the fallback: if the
  project later removes the token, the role and the chained property become invalid
  at computed-value time and the shipped literal applies. `tests/e2e/ui-theme.spec.ts`
  proves this two hops deep on `--auk-button-bg` rather than trusting the
  specification.
- A role bound to a literal by frequency ranking or by the interview is written as
  that literal.
- A role with no binding is left out of the block. Never copy a shipped fallback into
  the project's stylesheet: a line that restates the default is noise that hides the
  lines that matter.
- Never a component property in the role block, and never a size, spacing, duration
  or placement property. One component that must differ from its role is the one
  exception, and it is a separate, unlayered rule the project owns -
  `:root { --auk-button-destructive-bg: var(--brand-red-deep); }` - which beats the
  layered roles file whatever its order. That is the escape hatch, not the theme.
- Never a `forced-colors` media query. Under forced colours the components already
  use the system colours, and a theme must not defeat a reader's own high-contrast
  setting. Never `color-scheme`: that is the page's declaration, not a theme's.
- Nothing that loads another file: no at-rule that pulls one in, no function that
  fetches a resource. Both files are declarations only.
- Nesting a `var()` inside another is fine here. The no-nesting rule in
  `docs/component-spec.md` binds component references, where a nested fallback
  would defeat the standalone guarantee; a project stylesheet has no such guarantee
  to keep.

Blocks below `:root` - dark, contrast, a second brand, a density:

- A custom property resolves where it is declared. The roles file chains each
  component property to its role on `:root`, so every chain line is resolved there,
  against the root's role values, and inherited as a plain value; a role set on a
  lower element is never consulted by it. Every block whose selector is not `:root`
  therefore restates the chain lines for each role it sets, copied from that role's
  group in `auk-roles.css`. Without them the block does nothing, and
  `tests/e2e/ui-theme.spec.ts` proves both halves.
- The dark block, only when discovery found a dark form. Mirror the form. A class or
  attribute selector is repeated verbatim as the rule's selector and its chain lines
  are restated. A media query is not a selector and cannot head a rule, so it is
  emitted as `@media (prefers-color-scheme: dark) { :root { ... } }`, and because that
  rule is on `:root` it needs no chain lines.
- Cover only the roles whose bound token differs under dark. A token the project
  itself redeclares under its dark form needs no line at all: the `var()` written in
  the light block already follows it. A line is needed only when dark binds a role to
  a different token - an overlay or shadow token that exists only under dark, say.
- The contrast block, only when discovery found a `prefers-contrast: more` form, is
  emitted the same way and under the same rules as the dark block: mirrored, never
  invented, no line for a token the project already redeclares under it.
- A second brand or a density is a scoped block on a subtree root, such as
  `[data-brand="acme"]`, setting the roles that differ, with their chain lines
  restated. Custom properties inherit, so the block themes that subtree only. Sizes
  stay out of it until dimension roles exist; a density that moved a target size
  would move a measured value.
- Never invent a dark or contrast value. A literal the project does not declare under
  its own form does not go in the block. If the project has no such form, there is no
  such block.

Figma's own guidance says a semantic variable should alias a primitive, not another
semantic; a project that binds `color/action/primary` to `--auk-role-primary` is one
alias deeper than that. The trade is 23 bindings instead of 137, and one place to
change. A project that would rather stay inside the guidance binds component
properties directly - the 69 `--auk-<component>-*` names in the roles file - and skips
the roles file; the components read either.

## Worked example

A project with `--color-primary`, `--color-text`, `--color-bg`, `--color-border`,
`--radius-md` and `--font-sans` declared on `:root`; a `[data-theme="dark"]` rule
that redeclares `--color-bg` and `--color-text` and adds `--overlay-strong` and
`--shadow-elevated`; no danger, success or warning tokens; and auk buttons, boxes,
dialogs and tabs built into `index.html`. No token file, no design file named.
Discovery binds primary, text, surface, border, radius and font in source three step
2, finds the dark form in step 5, and asks nothing. `auk-roles.css` is copied beside
the stylesheet that declares the tokens, and this block is appended to it:

```css
/* auk theme: binds project tokens to the auk roles. See ui-theme. */
:root {
  --auk-role-primary: var(--color-primary);
  --auk-role-text: var(--color-text);
  --auk-role-surface: var(--color-bg);
  --auk-role-border: var(--color-border);
  --auk-role-radius: var(--radius-md);
  --auk-role-font: var(--font-sans);
}

[data-theme="dark"] {
  --auk-role-overlay: var(--overlay-strong);
  --auk-role-shadow: var(--shadow-elevated);
  --auk-dialog-backdrop-bg: var(--auk-role-overlay);
  --auk-popover-box-shadow: var(--auk-role-shadow);
}
```

Six lines replace the 40 a property-by-property block needed. Nothing names an alert
colour, the muted control, the inverse box or the focus ring: the project has no token
for them, so they keep their shipped literals. `on-primary` is left at the shipped
white because `--color-primary` is dark enough for it, which the verification step
measures. The dark block binds two roles because only two bind to a token that exists
solely under dark - `--color-bg` and `--color-text` are redeclared by the project's
own dark rule, and the light block's `var()` already follows them - and it restates
the two chain lines those roles own, because the dark rule is not on `:root`. The
popover lines are set although no popover is built yet, so the first one is themed on
arrival.

## Verification

After the roles file is in place and the block is written:

1. Read computed styles, never the eye. A primary button still painted `#1a56db` has
   one of two causes: a role name misspelled in the block - an unknown `--auk-role-*`
   binds nothing, the chain falls back to the literal, and the result looks exactly
   like a theme that did nothing - or a block that never reached its scope selector,
   because the roles file or the block is not loaded on that page, or the scoped
   element is not the one the selector names. Load order is not a cause: the chain
   reads its roles from `:root` by inheritance whenever the stylesheets load. In the
   browser's computed-style inspector, confirm `--auk-role-primary` on the root
   element holds the project token's value and the button's `background-color`
   follows it. An unbound role falling back to its literal is by design, not a fault.
2. Re-measure. `tests/e2e/ui-theme.spec.ts` in this skill's repository loads the
   roles file, binds 23 role lines over every component demo and measures: an axe
   scan for text contrast (1.4.3), a computed-style read of the focus outline width
   (2.4.7), and the outline colour's contrast against the surface it is drawn over,
   computed from the two colours' relative luminance (1.4.11). Run the same three
   measurements against the project's page with whatever accessibility scanner and
   browser automation the project has; `tests/e2e/support.ts` shows the reads.
3. No ratio is ever estimated. If a measurement fails on the project's own brand -
   a primary too light for white text, a focus ring too close to the surface - keep
   the binding, report the measured failure plainly with the numbers the tool gave,
   and ask whether to bind that role to a different project token or leave it.
   Never revert a brand value silently: the project chose it, and a quiet revert
   hides the finding the measurement exists to surface.
