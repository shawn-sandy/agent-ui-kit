# Theme reference

A workflow, not a component. It reads a project's stylesheet sources, works out which
of the project's existing values play which visual role, and emits one block of CSS
that binds those values to the brand-bearing `--auk-*` custom properties. Every auk
component built into the project then takes on the project's colours, corner radius
and type without a line of its own code changing.

Every component reference ships each themeable value as
`var(--auk-<slug>-<property>, <literal>)`. The literal is the shipped default and the
reason a component works with no custom properties defined anywhere. This skill sets
the property, so the literal stops applying. It never edits a component's own CSS.

## Scope

The mapping covers the 69 brand-bearing properties: 57 colours, 7 corner radii and 5
font families. The other 68 properties - every width, size, gap, padding, offset,
duration, weight, line height, font size, brightness and placement - keep their
shipped literals. They are what `tests/e2e/` measures: minimum target sizes, focus
offsets and reduced-motion timing. A theme that moved them would move the
measurements too, so the emitted block never names one.

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

Static, ordered, and run with ordinary file tools: read the stylesheet sources on
disk, never a rendered page. For each role, stop at the first step that yields a
value.

1. Collect the sources: files ending `.css` under the project, skipping dependency
   and build-output directories. If there are none, take the files whose extension
   marks a language that compiles to CSS - `.scss`, `.less`, `.styl`, `.pcss` -
   named here by extension only. Skip any file that is effectively one line, or
   whose first lines carry a minified or generated marker: a bundle would swamp the
   frequency ranking below with values the project never wrote.
2. Read every `:root`, `:host` and `html` rule and collect the custom properties
   declared there. Match each name against the role words: `primary`, `brand`,
   `accent`; `text`, `foreground`, `fg`; `background`, `surface`, `bg`; `border`;
   `ring`, `focus`; `danger`, `error`, `destructive`; `success`; `warning`;
   `muted`, `disabled`; `radius`, `rounded`; `font`, `family`. A match binds the
   role to `var(--that-property)`. Prefer the name that carries the role word alone
   or with the step the project treats as its default - `--color-primary`,
   `--color-primary-500`, `--radius-md` - over a variant such as
   `--color-primary-hover`.
3. For roles still unbound, count colour literals - hex, `rgb()`, `hsl()`,
   `oklch()` and named colours - across the sources. The most frequent saturated
   colour is `primary`; the most frequent near-black is `text`; the most frequent
   near-white is `surface`; the most frequent low-contrast grey is `border`. A
   literal binds the role to that literal, written into the block as-is.
4. Repeat the frequency ranking for `border-radius` values (`radius`) and
   `font-family` stacks (`font`).
5. Detect a dark scheme: a `prefers-color-scheme: dark` media query, or a `.dark`,
   `[data-theme="dark"]` or `[data-mode="dark"]` selector, that redeclares any of the
   custom properties found in step 2. Record the form verbatim. Which tokens it
   redeclares decides the dark block in the output contract; which form it takes
   decides how that block is wrapped.
6. Roles still unbound go to the interview under the SKILL.md heading "Clarify when
   needed", capped at the six core roles: `primary`, `text`, `surface`, `border`,
   `radius`, `font`. Offer the shipped fallback as the default answer. Every other
   unbound role keeps its shipped fallback without a question - the semantic
   colours, the overlay and the shadow are rarely worth an interruption, and the
   project can bind them later by hand.

## Mapping table

Twenty-one roles onto 69 properties. The fallback column is the literal each
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
| muted | Unavailable control | `--auk-button-disabled-bg`, `--auk-button-disabled-border-color`, `--auk-button-disabled-color` | `#6b7280`; border `transparent`; text `#ffffff` |
| inverse | Inverted box | `--auk-box-invert-bg`, `--auk-box-invert-color`, `--auk-box-invert-border-color` | `#1f2937`; text `#f9fafb`; border `transparent` |
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
difference back binds the odd property by hand after the block is emitted.

`on-primary` is the text drawn over `primary` and over `danger`. When the project
binds `primary` to a light colour, bind `on-primary` to the project's text token
rather than leaving the shipped white, and let the verification step measure it.

## Output contract

One block, placed where the project already keeps its tokens.

- Placement: append to the stylesheet that already declares the project's `:root`
  custom properties. If no stylesheet does, create `auk-theme.css` beside the first
  stylesheet that contains an `auk-` selector, and tell the user it must load the
  way that stylesheet does.
- Shape: a comment line, then a single `:root` rule setting only properties from
  the mapping table, one per line, grouped by role in table order.
- A role bound to a project custom property is written as `var(--project-token)`
  with no fallback. The component's own `var(--auk-*, literal)` is the fallback: if
  the project later removes the token, the auk property becomes invalid at
  computed-value time and the shipped literal applies. `tests/e2e/ui-theme.spec.ts`
  proves this on `--auk-button-bg` rather than trusting the specification.
- A role bound to a literal by frequency ranking or by the interview is written as
  that literal.
- A role with no binding is left out of the block. Never copy a shipped fallback
  into the project's stylesheet: a line that restates the default is noise that
  hides the lines that matter.
- Never a size, spacing, duration, weight or placement property - nothing outside
  the mapping table.
- Never a `forced-colors` media query. Under forced colours the components already
  use the system colours, and a theme must not defeat a reader's own high-contrast
  setting.
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
- Cover only the roles whose bound token differs under dark. A token the project
  itself redeclares under its dark form needs no line at all: the `var()` written
  in the light block already follows it. A line is needed only when dark binds a
  role to a different token - an overlay or shadow token that exists only under
  dark, say.
- Never invent a dark value. A literal the project does not declare under its dark
  form does not go in the dark block. If the project has no dark form, there is no
  dark block.

## Worked example

A project with `--color-primary`, `--color-text`, `--color-bg`, `--color-border`,
`--radius-md` and `--font-sans` declared on `:root`; a `[data-theme="dark"]` rule
that redeclares `--color-bg` and `--color-text` and adds `--overlay-strong` and
`--shadow-elevated`; no danger, success or warning tokens; and auk buttons, boxes,
dialogs and tabs built into `index.html`. Discovery binds primary, text, surface,
border, radius and font in step 2, finds the dark form in step 5, and asks nothing.
The block, appended to the stylesheet that declares those tokens:

```css
/* auk theme: binds project tokens to component properties. See ui-theme. */
:root {
  --auk-button-bg: var(--color-primary);
  --auk-button-border-color: var(--color-primary);
  --auk-tabs-selected-tab-color: var(--color-primary);
  --auk-tabs-selected-tab-border-block-end-color: var(--color-primary);
  --auk-box-color: var(--color-text);
  --auk-button-secondary-color: var(--color-text);
  --auk-dialog-color: var(--color-text);
  --auk-dialog-body-color: var(--color-text);
  --auk-dialog-close-color: var(--color-text);
  --auk-popover-color: var(--color-text);
  --auk-popover-body-color: var(--color-text);
  --auk-popover-close-color: var(--color-text);
  --auk-tabs-color: var(--color-text);
  --auk-tabs-tab-color: var(--color-text);
  --auk-box-bg: var(--color-bg);
  --auk-button-secondary-bg: var(--color-bg);
  --auk-dialog-bg: var(--color-bg);
  --auk-dialog-close-bg: var(--color-bg);
  --auk-popover-bg: var(--color-bg);
  --auk-popover-close-bg: var(--color-bg);
  --auk-tabs-tab-bg: var(--color-bg);
  --auk-box-border-color: var(--color-border);
  --auk-button-secondary-border-color: var(--color-border);
  --auk-dialog-border-color: var(--color-border);
  --auk-dialog-close-border-color: var(--color-border);
  --auk-popover-border-color: var(--color-border);
  --auk-popover-close-border-color: var(--color-border);
  --auk-tabs-border-color: var(--color-border);
  --auk-alert-radius: var(--radius-md);
  --auk-box-radius: var(--radius-md);
  --auk-button-radius: var(--radius-md);
  --auk-dialog-radius: var(--radius-md);
  --auk-dialog-close-radius: var(--radius-md);
  --auk-popover-radius: var(--radius-md);
  --auk-popover-close-radius: var(--radius-md);
  --auk-alert-font-family: var(--font-sans);
  --auk-button-font-family: var(--font-sans);
  --auk-dialog-font-family: var(--font-sans);
  --auk-popover-font-family: var(--font-sans);
  --auk-tabs-font-family: var(--font-sans);
}

[data-theme="dark"] {
  --auk-dialog-backdrop-bg: var(--overlay-strong);
  --auk-popover-box-shadow: var(--shadow-elevated);
}
```

Nothing in the block names an alert colour, the muted control, the inverse box or
the focus ring: the project has no token for them, so they keep their shipped
literals. The dark block has two lines because only two roles bind to a token that
exists solely under dark; `--color-bg` and `--color-text` are redeclared by the
project's own dark rule, and the light block's `var()` already follows them. The
popover properties are set although no popover is built yet, so the first one is
themed on arrival.

## Verification

After the block is written:

1. Open the page and confirm the components changed. A button still painted
   `#1a56db` means a token name is misspelled or the block never reached `:root`.
   Check with the browser's computed-style inspector, never by eye.
2. Re-measure. `tests/e2e/ui-theme.spec.ts` in this skill's repository binds a
   palette over every component demo and measures it: an axe scan for text contrast
   (1.4.3), a computed-style read of the focus outline width (2.4.7), and the
   outline colour's contrast against the surface it is drawn over, computed from
   the two colours' relative luminance (1.4.11). Run the same three measurements
   against the project's page with whatever accessibility scanner and browser
   automation the project has; `tests/e2e/support.ts` shows the reads.
3. No ratio is ever estimated. If a measurement fails on the project's own brand -
   a primary too light for white text, a focus ring too close to the surface - keep
   the binding, report the measured failure plainly with the numbers the tool gave,
   and ask whether to bind that role to a different project token or leave it.
   Never revert a brand value silently: the project chose it, and a quiet revert
   hides the finding the measurement exists to surface.
