# Compose reference

A workflow, not a component. It takes one auk component's contract table and turns it
into a public component surface for a project that is built from components: typed
props, a split only where a prop changes which parts render, sibling auk components
composed rather than re-typed, and a component that renders alone. Those are the
four rules Component Driven Design states - a well-defined API, a fixed series of
states, one component at a time in isolation, then combination - applied to a
contract the component reference already carries.

The component reference stays the source. Its Structure block is still the markup,
its Styles block is still copied as-is, and its Behaviour module is still the
behaviour. This skill only decides what shape the wrapper around them takes, and it
emits no `--auk-*` binding - that is `ui-theme`.

## Scope

The mapping table below covers the 31 Props entries across the 6 shipped contract
tables: 11 choices, 1 fixed value, 7 booleans, 4 strings and 8 id references. Every
entry matches exactly one of the five Props rules, decided by the entry's type,
name and default and nothing else, so two authors map the same entry the same way.

`tests/unit/ui-compose-mapping.spec.ts` pins the table to the component references:
every row it maps must be one of the seven contract rows or the qualifier line, each
mapped row appears exactly once, every Props entry in every shipped contract must
fall under exactly one rule, and the counts in the paragraph above are measured from
the contracts rather than typed on trust. A seventh component, or a new Props entry
in an existing one, fails that test until the table covers it.

## Guard

Before anything else, decide whether the project is component-based; the Discovery
section says how. If it is not, stop: say so, point at the component skill's own
Build it - the Structure block copied into the page is the whole answer there - and
emit nothing. A component wrapper in a project with no component model is a file
nothing imports.

Then read the component's contract table in
`ui-<component>/references/ui-<component>.md`. The mapping starts from that table
and from nothing else: a component this kit does not ship has no contract to map,
and a wrapper written from memory of some other library's surface is the habit this
skill exists to replace.

## Discovery

Structural and static, with ordinary file tools. A project is component-based when
either holds:

1. A `components` directory exists under the project's source tree, at any depth,
   outside dependency and build-output directories.
2. Source files carry a component file extension: `.jsx`, `.tsx`, `.vue`, `.svelte`
   or `.astro`. The extension names a file type, not a library, which is why it may
   appear here.

Then read the project's conventions from the components it already owns: where they
live, how props are typed, how a component and its props are named and exported,
and whether a story harness is present - a stories directory, or files named
`*.stories.*`. Match those conventions; where the project has none, use the
defaults in the output contract. Finally, note which sibling auk components the
project already owns by searching its components for the `auk-` class roots. Those
are what the compose rule composes.

## Mapping table

Ten rules: one for each contract row this skill maps, five for the shapes a Props
entry can take, and one for the qualifier line. The Role row travels with the
Element row; the WCAG row is what the browser suite measures and maps to nothing in
the surface.

| Contract row | Mapping rule | Real example |
| --- | --- | --- |
| `Element` | The component owns exactly one root, carrying the `auk-<slug>` class verbatim, plus the `role` attribute wherever the Role row writes one rather than inheriting it | `ui-button`: `<button>`; `ui-dialog`: `<dialog>`; `ui-popover`: `<div role="group">`; `ui-tabs`: a `<div>` wrapping the tablist and the panels |
| `Props`, a choice - a quoted union of two or more values | A prop named without its `data-` or `aria-` prefix, typed as the union, with the contract's default | `data-variant` `"primary"` or `"secondary"` or `"destructive"` becomes `variant`; `popover` `"auto"` or `"manual"` becomes `mode` |
| `Props`, a fixed value - one quoted value, marked required | Hard-coded on the element, never a prop | `ui-alert` `aria-atomic="true"` |
| `Props`, a boolean - a boolean attribute, or one quoted value that is absent by default | A boolean prop named for the state it expresses | `aria-disabled="true"` becomes `unavailable`; `data-icon-only` becomes `iconOnly`; `ui-box` `data-variant="invert"` becomes `invert` |
| `Props`, a string | A string prop, required when the contract marks it required, otherwise optional | `id` on the dialog, the popover and every tab and panel; `aria-label` on an icon-only button |
| `Props`, an id reference - typed `id reference`, or written `attribute="<id>"` | Generated inside the component when the referent is one of its own parts; a prop when the referent lives outside it, required when the contract marks it required and otherwise optional | `aria-labelledby` on the dialog is generated from its heading; `aria-controls` on a tab is generated from its panel; `data-dialog-open="<id>"` on an opener is a required prop of the opener; `data-dialog-fallback` on the dialog is an optional `fallbackId` |
| `Slots` | Children, or a named slot per `data-part`; the part attribute is emitted verbatim | `ui-dialog`: `header`, `body`, `footer`; `ui-button`: children are the label, and an icon child carries `data-part="icon"` |
| `Variants` | The `variant` union - styling only, passed through to `data-variant`, never one boolean per variant. A one-member union is the boolean rule above | `ui-alert`: `info`, `success`, `warning`, `error`; `ui-box`: `invert` |
| `Behaviour` | Call the module on mount and its teardown on unmount; re-implement only where the project's rendering owns the attribute the module writes | `initDialog(dialog)`, `initPopover(popover)`, `initTabs(root)`; `ui-alert`, `ui-box` and `ui-button` are `none` |
| Qualifier line `states` | The story list: one story per variant and one per prop-driven state | `ui-button`: `hover`, `focus`, `disabled` under three variants; `ui-popover`: `open`, `focus` |

Three refinements apply across the Props rules, and each is decided by the contract:

- An entry the contract pairs to another entry is derived from it, never exposed.
  `ui-alert` `role` and `aria-live` are paired to `data-variant`, so `variant` alone
  is the prop and the component writes both.
- An entry the Behaviour module rewrites - each reference's Behaviour section names
  them - takes no prop of its own. The prop is the state that drives it: a tab set
  takes `selected`, and `aria-selected`, `tabindex` and `hidden` follow from it.
- An entry that lives on another element - an opener's `data-dialog-open`, a
  trigger's `popovertarget`, `popovertargetaction` and `aria-expanded` - is a prop
  of the component that owns that element, and that component is usually a composed
  button.

## Rules

Four rules, in the order every component skill's Build it names them. The pointer
line there is the short form; this is the long form.

**Props from the contract table.** Every prop is a Props entry mapped by the table,
or the state that drives an entry the module writes. A required entry with one fixed
value is hard-coded. No prop may remove a required accessibility attribute: nothing
in the surface can unset the dialog's `aria-labelledby`, the alert's `aria-atomic`,
the popover's `role="group"` or a tab's `aria-controls`, and a prop that could is a
defect in the surface, not a feature of it. Native attributes the contract does not
name - an extra class, an event handler, a `lang` - pass through to the root and are
not props of the contract; an attribute the contract does name is a typed prop, which
is why `id` is a required string on the dialog, the popover and every tab and panel.
A prop named for a choice or a state drops its `data-` or `aria-` prefix - `variant`,
`iconOnly`, `unavailable` - because the prefix is how the attribute travels in
markup, not what it means; an attribute whose value the consumer writes verbatim,
`aria-label`, keeps its name so the accessible name stays visible in the surface.

**Split only on structure.** A prop that changes which parts render is structural,
and a structural prop becomes its own variant component behind a thin router: the
router takes the union, renders the variant component for the chosen value, and
keeps the import surface to one name. A prop that only writes `data-variant` or a
class stays a prop. On the shipped contracts: `ui-popover` `mode` is structural,
because a `manual` popover renders its own close control and an `auto` one does
not, so it splits into an auto and a manual variant behind a router; `ui-button`
`data-icon-only` changes the label's shape but not which parts render, so it stays
a prop; `ui-alert` `role` and `aria-live` are paired to the variant, so they are
derived. Never one boolean per variant, and never a flag that switches the layout
inside one component. The shipped popover projection still branches on `mode` inside
one component; it predates this rule and is not the shape to copy - the router is.

**Compose sibling auk components.** When the project already owns a sibling auk
component - a button in a dialog's footer, a button as a popover's trigger - the new
component imports and renders it, passing the sibling's props: the variant, and the
opener or trigger attributes the contract puts on that element. It never re-types
the sibling's markup or its class. A hand-typed `auk-button` inside a dialog file is
a second copy of the button that drifts the first time the button changes. If the
sibling is not in the project yet, build it from its own skill first, then compose
it.

**Render alone.** The emitted component renders with nothing but its own file, the
component's Styles block and, where the contract has one, its Behaviour module: no
store, no app-level context, no page-level id it depends on, no global stylesheet.
Where the project already has a story harness, one story per variant and one per
prop-driven state from the qualifier line's `states`, so every state is nameable
and mockable. Where it has none, the component still renders on a blank page, and
no harness is installed to prove it.

When re-implementing behaviour is right: the Behaviour rule calls the shipped module
on mount and its teardown on unmount, so focus restoration, toggle listeners and
opener wiring have one implementation. Re-implement a piece only where the
project's rendering owns the attribute the module writes. `aria-selected`,
`tabindex` and `hidden` in a tab set are written from the selected state by the
rendering, and the module's own writes would fight it, so that piece is the
rendering's. Everything the rendering does not own stays the module's, and a second
copy of it is the drift the compose rule exists to prevent.

## Output contract

- One component file per auk component, named the way the project names its
  components, exporting the component and its typed props. Where the project has
  no convention, the names are `Auk<Component>` and `Auk<Component>Props`, matching
  the projection demo each component skill ships.
- A router file only when a structural prop splits the component: it takes the
  union and renders the variant component, so importers see one name and the split
  is an implementation detail.
- A stories file only when a story harness already exists: one export per story
  from the states list. Never install a harness.
- The root class, every `data-part` and every attribute the contract marks required
  appear in the rendered output verbatim, so the component's Styles block, the
  `--auk-*` properties and the browser suite apply unchanged.
- The Behaviour module is copied from the reference into the project and called on
  mount, its teardown on unmount. No package is installed and no build step is
  added.
- The Styles block is copied as-is, once, wherever the project keeps component
  styles; the wrapper does not restyle the root.
- The reply states the mapping as a short table - each Props entry against the
  prop, the hard-coded value, the derived value or the module that owns it - and
  names any split, so a reviewer can check the surface against the contract
  without opening the file.

## Worked example

The button, as a props table. Its contract has 5 Props entries, no module and three
states.

| Contract entry | Surface |
| --- | --- |
| `type` - a choice, required | `type`, required, the three-value union; no default, exactly as the contract |
| `data-variant` - a choice, `primary` when absent | `variant`, optional, `primary` by default, passed through to `data-variant` |
| `data-icon-only` - a boolean attribute, absent | `iconOnly`, optional boolean; when set, the `aria-label` prop becomes required |
| `aria-disabled` - one value, absent | `unavailable`, optional boolean; writes `aria-disabled="true"` and adds the click guard the skill's Non-negotiable list requires |
| `aria-label` - a string, required with `data-icon-only` | `aria-label`, a string, required only when `iconOnly` is set |
| Slots | children are the label; an icon child carries `data-part="icon"` |
| Variants `primary`, `secondary`, `destructive` | the `variant` union above - styling only, so no split |
| Behaviour `none` | no module; the click guard is the component's own |
| States `hover`, `focus`, `disabled` | stories: one per variant, plus unavailable and icon-only |

Nothing splits: no prop changes which parts render. The reply's mapping table is the
one above.

The dialog, as a parts tree. Its contract has 7 Props entries, a module and one
state.

- Root: `<dialog>` carrying `auk-dialog` and the `id` prop, a required string. Its
  `aria-labelledby` is generated from the header's heading id and its
  `aria-describedby` from the body's id - both referents are parts of the
  component, so neither is a prop. `data-dialog-fallback` maps to an optional
  `fallbackId` string, because its referent lives outside the dialog.
  - `header`: the heading, from a required `title` prop, and the close control
    carrying `data-dialog-close`, with its accessible name from an optional
    `closeLabel` string.
  - `body`: the children.
  - `footer`: an optional `footer` slot. The actions inside it are composed
    buttons from the project's own button component, one carrying
    `data-dialog-close` and the native `autofocus`, never a hand-typed
    `auk-button`.
- The opener is not a part of the dialog. `data-dialog-open="<id>"` is a required
  prop of whichever button opens it, so the opener is a composed button carrying
  that attribute with the dialog's `id`.
- Behaviour: `initDialog(dialog)` on mount, its teardown on unmount. The module
  owns opener and closer wiring, backdrop dismissal and focus restoration; the
  wrapper re-implements none of it.
- No split: Variants is `none` and no prop changes which parts render. One story,
  open, for the `focus` state.

The reply states both tables and says, in one line each, that neither component
splits.

## Verification

After the component is written:

1. Search the emitted files. The root class, every `data-part` and every attribute
   the contract marks required are present verbatim; no hand-typed sibling class -
   `auk-button` inside a dialog or popover file - appears when the project owns the
   sibling; a props type is exported.
2. Render the component alone on a blank page, or each story where a harness
   exists, and run the same measurements the component's own browser suite runs on
   its demo: an accessibility scan and a keyboard walk.
   `tests/e2e/ui-<component>.spec.ts` in this skill's repository shows the reads
   for each WCAG criterion the contract claims; the emitted component makes the
   same DOM, so the same reads apply.
3. Check the reply's mapping table against the contract: every Props entry is
   accounted for as a prop, a hard-coded value, a derived value or the module's,
   and any split names the structural prop that caused it.
