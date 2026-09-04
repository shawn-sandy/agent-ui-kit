# Theme reference

A workflow, not a component. It reads a project's design system - a token file, the
variables in a named Figma file, or the project's stylesheet sources - works out
which of the project's values play which visual role, and emits one block of CSS that
binds those values to the `--auk-role-*` custom properties. The shipped roles file,
`auk-roles.css` in this directory, chains every brand-bearing `--auk-*` property to
one of those roles, so every auk component built into the project then takes on the
project's colours, corner radius and type without a line of its own code changing.

Every component reference ships each themeable value as
`var(--auk-<slug>-<property>, <literal>)`. The literal is the shipped default and the
reason a component works with no custom properties defined anywhere. The roles file
sets the property to `var(--auk-role-<name>)`, and this skill sets the role, so the
literal stops applying. Neither edits a component's own CSS, and a role nobody binds
falls all the way back to the literal by design.

## Scope

The mapping covers the 69 brand-bearing properties: 57 colours, 7 corner radii and 5
font families. The other 68 properties - every width, size, gap, padding, offset,
duration, weight, line height, font size, brightness and placement - keep their
shipped literals. They are what `tests/e2e/` measures: minimum target sizes, focus
offsets and reduced-motion timing. A theme that moved them would move the
measurements too, so the emitted block never names one.

The 69 properties are grouped into the 23 roles of the mapping table below, and the
skill binds roles, never properties. `auk-roles.css` is generated from the same
table and the component references by the repository's `scripts/build-tokens.mjs`,
beside `auk.tokens.json`, a Design Tokens Community Group (DTCG) file in which each
role is a token and each component property is a token aliased to its role. A token
build or a design tool reads that file; a browser reads the roles file; this skill
writes the one block that binds the two to the project.

`tests/unit/ui-theme-mapping.spec.ts` pins the mapping table below to the component
references: every property it names must exist in a shipped reference, its count
must equal the number of brand-bearing properties the references declare, and the
counts in the paragraph above must agree with both. A new colour, radius or
font-family property in any component fails that test until the table names it.

## Guard

Before anything else, search the project's stylesheet sources for a selector that
contains `auk-`. If none exists, no auk component has been built into the project
yet. Say so, point at the component skills - `ui-alert`, `ui-box`, `ui-button`,
`ui-dialog`, `ui-popover`, `ui-tabs` - and emit nothing. A theme block with nothing
to theme is dead code the project would carry forever.

## Discovery

Static, ordered, and run with ordinary file tools: read files on disk, never a
rendered page. Three sources, tried in this order. For each role, stop at the first
source and step that yields a value. A project that runs a system named in the
crosswalk below skips discovery for every cell that row fills.

The role words, used by every source. Match a name's last segments against them:
`primary`, `brand`, `accent`; `text`, `foreground`, `fg`; `background`, `surface`,
`bg`; `border`; `ring`, `focus`; `danger`, `error`, `destructive`; `success`;
`warning`; `info`; `muted`, `disabled`; `inverse`; `overlay`, `backdrop`; `shadow`;
`radius`, `rounded`; `font`, `family`. The paired roles `on-primary`, `on-muted` and
`on-inverse` match a name that joins the base word with `on`, `foreground` or
`contrast`: `--primary-foreground`, `--wa-color-brand-on-normal`, `--accent-contrast`.
Prefer the name that carries the role word alone or with the step the project treats
as its default - `--color-primary`, `--color-primary-500`, `--radius-md` - over a
variant such as `--color-primary-hover`.

Source 1, a token file on disk. Collect the files ending `.tokens` or
`.tokens.json` under the project, skipping dependency and build-output directories.
These are DTCG files, the format every design tool and token build exports, so one is
the most reliable statement of the project's system. Walk every token, reading its
group path and name as one slash- or dot-separated name - `color/action/primary` or
`color.action.primary` - and match the role words against its last segments. A match
binds the role to the CSS custom property the token's code-syntax extension names,
when the file carries one; failing that, to the project's own declaration of the same
name found in source 3. Never bind a role to the token's raw value: the project's
stylesheet is where a token becomes a custom property, and the block must follow that
property so the two never disagree.

Source 2, Figma variables, only when the request names a Figma file and a Figma MCP
server is connected. Vendor-specific: a Figma server is one client's tool, and the
token file of source 1 - which Figma exports natively - is the neutral path that
stands in for it. Ask the server for the variable definitions of the named selection
(`get_variable_defs`), match each variable's name the same way, and bind the role to
the variable's web code syntax when one is set, or to the project's own declaration
of the same name. A variable with neither is reported to the user, not bound.

Source 3, the stylesheet sources:

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
   custom properties found in step 2. Record the form verbatim, and which element
   the project puts the class or attribute on. Detect a contrast scheme the same
   way: a `prefers-contrast: more` media query or a selector the project switches
   for high contrast. Which tokens each form redeclares decides its block in the
   output contract; which form it takes decides how that block is wrapped.
6. Roles still unbound go to the interview under the SKILL.md heading "Clarify when
   needed", capped at the six core roles: `primary`, `text`, `surface`, `border`,
   `radius`, `font`. Offer the shipped fallback as the default answer. Every other
   unbound role keeps its shipped fallback without a question - the semantic
   colours, the overlay and the shadow are rarely worth an interruption, and the
   project can bind them later by hand.

## Mapping table

Twenty-three roles onto 69 properties. The fallback column is the literal each
component reference ships, so a role the project never binds looks exactly as it did
before the theme.

| Role | Meaning | Properties | Shipped fallback |
| --- | --- | --- | --- |
| primary | Brand action colour | `--auk-button-bg`, `--auk-button-border-color`, `--auk-tabs-selected-tab-color`, `--auk-tabs-selected-tab-border-block-end-color` | `#1a56db`; button border `transparent` |
| on-primary | Text on primary | `--auk-button-color`, `--auk-button-destructive-color` | `#ffffff` |
| text | Body text | `--auk-box-color`, `--auk-button-secondary-color`, `--auk-dialog-color`, `--auk-dialog-body-color`, `--auk-dialog-close-color`, `--auk-popover-color`, `--auk-popover-body-color`, `--auk-popover-close-color`, `--auk-tabs-color`, `--auk-tabs-tab-color` | `#111827` (dialog, popover, tabs); `#1f2937` (box, secondary button, close controls); `#374151` (dialog and popover body, unselected tab) |
| surface | Card and page background | `--auk-box-bg`, `--auk-button-secondary-bg`, `--auk-dialog-bg`, `--auk-dialog-close-bg`, `--auk-popover-bg`, `--auk-popover-close-bg`, `--auk-tabs-tab-bg` | `#ffffff`; close controls and tab `transparent` |
| border | Default border | `--auk-box-border-color`, `--auk-button-secondary-border-color`, `--auk-dialog-border-color`, `--auk-dialog-close-border-color`, `--auk-popover-border-color`, `--auk-popover-close-border-color`, `--auk-tabs-border-color` | `#d1d5db` (dialog, popover, tabs); `#6b7280` (secondary button); `transparent` (box, close controls) |
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
difference back sets the odd property by hand, outside any layer, after the block is
emitted.

`on-primary` is the text drawn over `primary` and over `danger`. When the project
binds `primary` to a light colour, bind `on-primary` to the project's text token
rather than leaving the shipped white, and let the verification step measure it.
`on-muted` and `on-inverse` follow the same rule over `muted` and `inverse`. The
split exists because a role binds its whole row to one value: a row holding both a
control's background and its text would paint the text in its own background the
moment the role was bound, which is why no row does.

## Crosswalk

Where a project runs a known design system, the bindings are looked up rather than
discovered: the column for that system settles every cell it fills, and only the
blank cells go through discovery. Every filled cell was read off the system's live
documentation on the day named here (verified 2026-09-04); a blank cell means the
pages read document no token for that role, or the page could not be read. Nothing
in this table was written from memory.

| Role | shadcn/ui | Material Web | Primer | Bootstrap 5.3 | Web Awesome | Radix Themes | Atlassian |
| --- | --- | --- | --- | --- | --- | --- | --- |
| primary | `--primary` | `--md-sys-color-primary` | `--bgColor-accent-emphasis` | `--bs-primary` | `--wa-color-brand-fill-normal` | `--accent-9` | |
| on-primary | `--primary-foreground` | `--md-sys-color-on-primary` | `--fgColor-onEmphasis` | | `--wa-color-brand-on-normal` | `--accent-contrast` | |
| text | `--foreground` | `--md-sys-color-on-surface` | `--fgColor-default` | `--bs-body-color` | `--wa-color-text-normal` | `--gray-12` | |
| surface | `--background` | `--md-sys-color-surface` | `--bgColor-default` | `--bs-body-bg` | `--wa-color-surface-default` | `--color-background` | |
| border | `--border` | `--md-sys-color-outline` | `--borderColor-default` | `--bs-border-color` | `--wa-color-surface-border` | `--gray-6` | |
| divider | | `--md-sys-color-outline-variant` | `--borderColor-muted` | `--bs-border-color-translucent` | | | |
| focus | `--ring` | | `--focus-outlineColor` | `--bs-focus-ring-color` | `--wa-color-focus` | `--focus-8` | |
| info | | | `--fgColor-accent` | `--bs-info-text-emphasis` | | | |
| info-surface | | | | `--bs-info-bg-subtle` | | | |
| danger | `--destructive` | `--md-sys-color-error` | `--fgColor-danger` | `--bs-danger` | `--wa-color-danger-on-quiet` | | |
| danger-surface | | `--md-sys-color-error-container` | `--bgColor-danger-muted` | `--bs-danger-bg-subtle` | | `--red-surface` | |
| success | | | `--fgColor-success` | `--bs-success` | | | |
| success-surface | | | `--bgColor-success-muted` | `--bs-success-bg-subtle` | | | |
| warning | | | `--fgColor-attention` | `--bs-warning` | | | |
| warning-surface | | | `--bgColor-attention-muted` | `--bs-warning-bg-subtle` | | | |
| muted | `--muted` | | `--bgColor-disabled` | `--bs-secondary-bg` | | | |
| on-muted | `--muted-foreground` | | `--fgColor-disabled` | `--bs-secondary-color` | | | |
| inverse | | | `--bgColor-inverse` | | | | |
| on-inverse | | | `--fgColor-onInverse` | | | | |
| overlay | | | `--overlay-backdrop-bgColor` | | `--wa-color-overlay-modal` | `--color-overlay` | |
| shadow | | | `--shadow-floating-small` | `--bs-box-shadow` | | `--shadow-4` | |
| radius | `--radius` | `--md-sys-shape-corner-small` | `--borderRadius-medium` | `--bs-border-radius` | | `--radius-2` | |
| font | | `--md-sys-typescale-body-medium-font` | `--fontStack-sansSerif` | `--bs-body-font-family` | `--wa-font-family-body` | `--default-font-family` | |

Blocked or partial pages, so their cells stay blank: Atlassian's full token list at
https://atlassian.design/components/tokens/all-tokens renders by script and yields no
names to a static read, and the overview, design-tokens and use-tokens-in-code pages
name only `--ds-background-neutral`, `--ds-space-200` and `--ds-font-body`, none of
which fills a role. Carbon's colour token, colour usage, colour overview and theme
code pages were each truncated before any token name, so Carbon has no column. Web
Awesome's border-radius page returned 404 and its tokens index names no radius or
shadow token, so those two cells stay blank.

Sources: https://ui.shadcn.com/docs/theming ; https://material-web.dev/theming/color/ ; https://material-web.dev/theming/typography/ ; https://material-web.dev/theming/shape/ ; https://primer.style/foundations/primitives/color ; https://primer.style/foundations/primitives/typography ; https://primer.style/foundations/primitives/size ; https://getbootstrap.com/docs/5.3/customize/css-variables/ ; https://webawesome.com/docs/tokens/ ; https://webawesome.com/docs/tokens/color/ ; https://webawesome.com/docs/tokens/typography/ ; https://www.radix-ui.com/themes/docs/theme/color ; https://www.radix-ui.com/themes/docs/theme/radius ; https://www.radix-ui.com/themes/docs/theme/shadows ; https://www.radix-ui.com/themes/docs/theme/typography ; https://atlassian.design/foundations/tokens/ ; https://atlassian.design/foundations/tokens/design-tokens/ ; https://atlassian.design/foundations/tokens/use-tokens-in-code/

## Output contract

Two things go into the project: the roles file, copied once, and one block of role
bindings.

The roles file. Copy `auk-roles.css` from this skill's `references/` directory
beside the first stylesheet that contains an `auk-` selector, and load it the way
that stylesheet loads; if the project bundles its CSS, say where it must be imported.
The file is generated from the component references, sits in `@layer auk`, and
chains every brand-bearing `--auk-<component>-<property>` to `var(--auk-role-<name>)`
on `:root`. Never edit it: a project that wants one component to differ from its role
sets that component's own property, below, and a block below the root copies lines
from it rather than changing it.

The role block. One rule, placed where the project already keeps its tokens: append
it to the stylesheet that declares the project's `:root` custom properties, or, if
none does, put it in `auk-theme.css` beside the roles file and load it after.

- Shape: a comment line, then a single rule under the scope selector, which defaults
  to `:root`, setting only `--auk-role-*` properties from the mapping table, one per
  line, in table order. At most 23 lines.
- A role bound to a project custom property is written as `var(--project-token)`
  with no fallback. The component's own `var(--auk-*, literal)` is the fallback: if
  the project later removes the token, the role and then the chained property become
  invalid at computed-value time and the shipped literal applies.
  `tests/e2e/ui-theme.spec.ts` proves both hops rather than trusting the specification.
- A role bound to a literal by frequency ranking or by the interview is written as
  that literal.
- A role with no binding is left out of the block. Never copy a shipped fallback
  into the project's stylesheet: a line that restates the default is noise that
  hides the lines that matter.
- Never a component property, and never a size, spacing, duration, weight or
  placement property - the block names roles only. Binding a component property by
  hand, outside any layer, is how a project makes one component differ from its
  role; that is the user's line to write, and the roles file is built to lose to it.
- The scope selector defaults to `:root`, and a block on the root element needs
  nothing more. A custom property substitutes its `var()` where it is declared and
  children inherit the result, so the chain in the roles file resolves on `:root`
  and a role set on any lower element is never seen by it. Every block below the
  root - a second brand's wrapper, a dark or contrast class the project toggles on
  `<body>` - therefore also restates the chain lines for each role it sets, copied
  from that role's group in `auk-roles.css`, after the role lines. The roles file
  is anchored on `:root` alone on purpose: a wider selector would let its layered
  chain beat the unlayered component-property override the guide promises.
- Never a `forced-colors` media query. Under forced colours the components already
  use the system colours, and a theme must not defeat a reader's own high-contrast
  setting. Never `color-scheme` either: the project decides that, not the theme.
- Nothing that loads another file: no at-rule that pulls one in, no function that
  fetches a resource. The block is declarations only.
- Nesting a `var()` inside another is fine here. The no-nesting rule in
  `docs/component-spec.md` binds component references, where a nested fallback
  would defeat the standalone guarantee; a project stylesheet has no such guarantee
  to keep.

The dark block, only when discovery step 5 found a dark form:

- Mirror the form. A class or attribute selector is repeated verbatim as the rule's
  selector. A media query is not a selector and cannot head a rule, so it is
  emitted as `@media (prefers-color-scheme: dark) { :root { ... } }`.
- A class the project toggles on `<html>` sits on the root, so the block needs only
  its role lines. A class it toggles on `<body>` or a wrapper sits below the chain,
  so that block also restates the chain lines for the roles it sets, and the report
  says so.
- Cover only the roles whose bound token differs under dark. A token the project
  itself redeclares under its dark form needs no line at all: the `var()` written
  in the light block already follows it. A line is needed only when dark binds a
  role to a different token - an overlay or shadow token that exists only under
  dark, say.
- Never invent a dark value. A literal the project does not declare under its dark
  form does not go in the dark block. If the project has no dark form, there is no
  dark block.

The contrast block, only when discovery found a `prefers-contrast: more` form or a
high-contrast selector, is mirrored the same way with the same three rules: the
project's own form, only the roles whose token differs, never an invented value.

A second brand, only when the request asks for one. The role lines come first, then
the chain lines of each role it sets, copied from that role's group in the roles
file:

```css
[data-brand="acme"] {
  --auk-role-primary: var(--acme-red);
  --auk-role-on-primary: var(--acme-white);
  --auk-button-bg: var(--auk-role-primary);
  --auk-button-border-color: var(--auk-role-primary);
  --auk-tabs-selected-tab-color: var(--auk-role-primary);
  --auk-tabs-selected-tab-border-block-end-color: var(--auk-role-primary);
  --auk-button-color: var(--auk-role-on-primary);
  --auk-button-destructive-color: var(--auk-role-on-primary);
}
```

Set `data-brand="acme"` on the subtree's root element. Without the chain lines the
block does nothing, because the chain already resolved on `:root` with the first
brand; with them it themes that subtree and nothing above it.
`tests/e2e/ui-theme.spec.ts` measures both.

One trade, stated so the project can decline it. Figma's own guidance is that a
semantic variable aliases a primitive, never another semantic. A role is a semantic
and a project's token usually is too, so the chain bends that rule to make a brand
23 bindings instead of 137. A project that wants to keep the rule binds the component
properties directly instead, one line per property from the repository's
`docs/properties.md`, and does not copy the roles file.

## Worked example

A project with `--color-primary`, `--color-text`, `--color-bg`, `--color-border`,
`--radius-md` and `--font-sans` declared on `:root`; a `[data-theme="dark"]` rule on
`<html>` that redeclares `--color-bg` and `--color-text` and adds `--overlay-strong`
and `--shadow-elevated`; no token file; no danger, success or warning tokens; and
auk buttons, boxes, dialogs and tabs built into `index.html`. Discovery binds
primary, text, surface, border, radius and font in source 3 step 2, finds the dark
form in step 5, and asks nothing. `auk-roles.css` is copied beside the stylesheet
that contains the first `auk-` selector, and this block is appended to the
stylesheet that declares the tokens:

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
}
```

Eight lines, where the same project once needed 69. Nothing in the block names an
alert colour, the muted control, the inverse box or the focus ring: the project has
no token for them, so they keep their shipped literals through the chain. `on-primary`
is not bound either, so the shipped white stays over the project's primary and the
verification step measures whether it still reads. The dark block has two lines
because only two roles bind to a token that exists solely under dark; `--color-bg`
and `--color-text` are redeclared by the project's own dark rule, and the light
block's `var()` already follows them. The popover properties are chained by the roles
file although no popover is built yet, so the first one is themed on arrival.

## Verification

After the roles file is copied and the block is written:

1. Open the page and confirm the components changed. A button still painted
   `#1a56db` has one of two causes: a misspelled role name - `--auk-role-primry`,
   say, which the chain reads as an unbound role and falls back from by design - or
   a block that never reached its scope selector, because it sits below the root
   without restating the chain lines, or because the roles file is not loaded at
   all. Load order is not a cause: a custom property on `:root` is read by
   inheritance whenever a component's style is computed. Check with the browser's
   computed-style inspector - `--auk-role-primary` and `--auk-button-bg` on the root
   element, then `background-color` on the button - never by eye.
2. Re-measure. `tests/e2e/ui-theme.spec.ts` in this skill's repository loads the
   roles file, binds all 23 roles over every component demo and measures it: an axe
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
