# Component skill specification

The authoring contract for every skill in `skills/`. A skill name is always
`ui-<component-slug>`. The component slug is the same name with the leading `ui-`
removed, and it stays unprefixed in the public DOM/API contract. Three canonical
files carry the portable component:

| File | Job |
| --- | --- |
| `skills/<skill-name>/SKILL.md` | Orients the agent. Loads whenever the skill triggers. Holds no component code. |
| `skills/<skill-name>/references/<skill-name>.md` | The component itself: markup, styles, behaviour, accessibility contract. Loads only when needed. |
| `skills/<skill-name>/references/demo.html` | One self-contained page that proves the component in a real browser. |

For Agent UI Kit components, the references folder also carries a React projection
example. Projection examples are not the canonical component contract:

| File | Job |
| --- | --- |
| `skills/<skill-name>/references/react-demo.tsx` | Required React projection reference for Agent UI Kit components, showing a typed props API over the same DOM contract. |

Read this before writing or reviewing a component. `scripts/check.sh` enforces the
mechanical half; section 7 lists exactly what it checks.

## 0. Conventions this kit fixes

These are settled. Do not re-decide them per component.

| Thing | Rule | Example |
| --- | --- | --- |
| Skill name | `ui-<component-slug>`, matching the directory and reference filename | `ui-button` |
| Accessibility target | WCAG 2.2, Level AA | `2.4.7 Focus Visible` |
| Root class | `auk-<component-slug>`, one per component, on the root element | `auk-button` |
| Internal parts | `data-part="<name>"` — never a second class | `data-part="tablist"` |
| Variants | `data-variant="<value>"` | `data-variant="destructive"` |
| Named content regions ("slots") | `data-slot="<name>"` on the wrapping element, or `none` | `data-slot="icon"` |
| Custom property | `--auk-<component-slug>-<property>` | `--auk-button-bg` |
| Fallback | A literal value. Never a nested `var()`. | `var(--auk-button-bg, #1a56db)` |
| Behaviour export | `export function init<Component>(root)` taking the root element, returning a teardown `() => void` | `export function initDialog(root)` |
| Module shape | Named export. `demo.html` strips `export ` and calls the function by name, so a default export cannot work. | |
| Demo link | `./demo.html`, relative to the reference | |

State is carried by ARIA where ARIA has an attribute for it (`aria-disabled`,
`aria-selected`, `aria-expanded`); failing that by a native attribute (`hidden`,
`open`); and by `data-state` only when neither exists.

### Settled questions

These come up on every component. They are answered once here so no author has to
guess and no reviewer has to arbitrate.

| Question | Answer |
| --- | --- |
| How does a component tell the host something changed? | It does not dispatch custom events. State lives in the DOM attributes above, and hosts listen to the native event (`click`, `change`) or observe the attribute. A kit-wide event vocabulary is a thing to add once a component genuinely needs one. |
| Where do behavioural options go? | Arguments to the init function, not DOM attributes: `initTabs(root, { wrap: false })`. `data-*` describes what the element *is*, never how the script should treat it. |
| What belongs in the Props row? | Every attribute a consumer is expected to set or read, including ARIA ones. Attributes the module writes and nobody sets go in the Behaviour section instead. |
| How is a union type written in a table cell? | With quoted values and the word `or`, not a pipe: `"true" or "false" or "mixed"`. A raw pipe breaks the table. |
| What is the full custom property grammar? | `--auk-<component-slug>[-<variant-or-state>][-<part>]-<property>`. The property is always last; qualifiers sit between the component slug and the property, variant or state before part. `--auk-dialog-close-bg`, `--auk-alert-success-bg`, `--auk-tab-selected-indicator-color`. Segments are omitted when there is only one of the thing. |
| How do skill names and component slugs map? | The skill name and directory are `ui-<component-slug>`. Strip exactly one leading `ui-` for the root class (`auk-icon-button`), custom properties, init function (`initIconButton`), React projection names and H1. |
| Are `###` subheadings allowed inside a section? | No. Sections are flat. The Accessibility section uses the bold labels **Keyboard**, **ARIA**, **Focus management** and **WCAG 2.2 AA criteria claimed**, in that order. |
| Is an applicable-but-unclaimed WCAG criterion a defect? | No. Only an unbacked claim is. Claim what the browser suite actually asserts, and leave the rest out rather than writing an assertion-free promise. |
| May a reference land without its `tests/e2e/` sibling? | No. A reference and the assertions backing its WCAG row land in the same change. |
| Does the demo strip every `export `? | Yes, every occurrence at the start of a line. A module may export more than one thing. |
| Are system colours exempt from the `var()` rule? | Yes, inside `@media (forced-colors: active)` only. Making `Highlight` or `GrayText` themeable would let a theme defeat the user's own high-contrast setting. The same exemption covers any value that exists to honour a user setting - the `0s` inside `@media (prefers-reduced-motion: reduce)` stays literal for exactly that reason. |
| What does the Structure block show? | Every variant and state named in the contract, as sibling examples in one block. The demo mirrors it. |
| How wide is the prose? | Wrapped at 88 columns. The H1 is `# <Component> reference`. Prose between the H1 and `## Contract` is allowed. |
| Does the 88-column rule cover tables and code? | No. Prose only, and only prose that can wrap. A contract cell, the qualifier line and a fenced block each stay on one line or wrap where they read best, however long that runs. |
| What do Element and Role hold for a component made of several elements? | The root first, then each named part, separated by `; `. `` `<div>` root; `<button>` trigger; `<div>` panel ``. Role mirrors the same order. |
| Are `data-part` names documented in the contract? | No. Parts are not props - a consumer copies them from the Structure block rather than choosing them. Structure and Styles are their documentation. |
| May one element carry both `data-part` and `data-slot`? | Yes. An element is often an internal part *and* the wrapper of a named content region. |
| What shape are Slots and Variants entries? | Bare backticked names separated by `; `, or `none`. Only the Props row carries types and defaults. |
| Does a fallback have to be a plain value? | It has to be literal, not another `var()`. A keyword (`currentColor`, `transparent`), a function (`min()`, `rgba()`) and a comma-bearing font stack are all fine. |
| How does a Props entry say which element an attribute lives on? | On a composite component every entry names its part first: `part: \`attribute\` — type — default`. `input: \`aria-expanded\` — `"true"` or `"false"` — `"false"``. On a single-element component the part is omitted. |
| What goes in the default position for a required attribute? | The word `required`. `\`aria-controls\` — id reference — required`. |
| What is the Role entry for a plain wrapper with no meaningful role? | `generic`. The whole-cell `none` means the row has nothing in it, so it is not reused for a single entry. |
| What are `data-state` values, and where are they documented? | Lowercase single words from a set the component defines. The attribute is absent when the state is off rather than set to a resting value. The module writes it, so it is documented in the Behaviour section, not in Props. |
| Where does an attribute go that a consumer sets *and* the module rewrites? | In Props, because the consumer sets it. The Behaviour section then names which attributes the module rewrites. That duplication is intended: one row is the contract, the other is the mechanism. |
| May prose follow the Contract table? | Yes. Prose is allowed anywhere - between the H1 and the table, between the table and `## Structure`, and inside any section. |
| May a table appear outside the Contract? | Yes. The keyboard map in the Accessibility section is one. Only the Contract table has a fixed shape. |
| Does the Behaviour section allow prose? | Yes, like every other section. Explanation aimed at the reference's reader goes in prose; explanation aimed at whoever maintains the code goes in JSDoc, which is copied into the demo verbatim. |
| What ids does the Structure block use? | Real ones, not placeholders, prefixed with the **instance**: `confirm-delete-title`, not `dialog-title`. Two of the same component on one page need two id families, so a component prefix would collide. Say in one line of prose that the ids are per instance. |
| How is the custom property grammar parsed when the CSS property itself is hyphenated? | Against the qualifier line, below. Anything not in that list is the property. `--auk-combobox-focus-field-outline-color` parses as state `focus`, part `field`, property `outline-color` because `field` is a declared qualifier and `field-outline` is not. |
| Where are a component's qualifiers declared? | On one line at the top of the Styles section, before the fenced block: `Qualifiers: parts `field`, `list`, `option`; variants none; states `focus`, `selected`, `no-results`.` It is the only place parts and states are declared; the contract table does not carry them. |
| What goes on the qualifier line? | Every `data-part` the component uses, every value in the Variants row, and every state that appears in a CSS selector or in a custom property name - including `data-state` values and CSS pseudo-states such as `focus`. A state carried only by an ARIA attribute and never styled or named in a property is not declared. Use `none` for an empty category. |
| What may the final property segment be? | The CSS property name in full (`outline-color`, `padding-block`, `line-height`), or one of the kit's four abbreviations - `bg` for `background-color`, `radius` for `border-radius`, `size` for a min/max dimension pair, `gap` - or, where the value is not a whole property but an argument or one part of a shorthand, the sub-value's own name: `brightness`, `offset`, `duration`. Nothing else is abbreviated. |
| May `data-slot` and `data-part` carry the same name on one element? | Yes. |
| Does Structure show state the module writes? | Yes - the same sibling-examples rule. Add one line of prose saying which of those attributes the module maintains, so a reader does not think they have to keep them in sync by hand. |
| What notation does a Role entry use? | `implicit <role>` for a role the element already has, `<role>` for one written with a `role` attribute, `generic` for an element with no meaningful role, and `presentation` for one hidden from the tree. Entries mirror the Element entries in order and carry the same part labels, so the two rows read side by side. |
| Does the root element carry a `data-part`? | No. The root carries the class; `data-part` is for elements inside it. The Element row still names the root, labelled `root`. |
| How specific is an Element entry? | The bare tag: `` `<input>` ``, not `` `<input type="text">` ``. Attributes that matter belong in Props. |
| What types may a Props entry use? | `string`, `number`, `boolean attribute`, `id`, `id reference`, `id reference list`, or a quoted union. Nothing else - the list is closed so two authors describe the same thing the same way. |
| What may the default position hold? | A literal default value, or one of `required`, `absent`, `present`. |
| In what order are Props listed? | Document order, grouped by the part they live on, matching the Element row. |
| Do `id` attributes belong in Props? | Yes, when the component's own wiring depends on them, as `aria-controls` and `aria-labelledby` do. |
| May a `data-state` value contain a hyphen? | Yes: `no-results` is fine. It must be lowercase and contain no spaces. |
| Does the demo's markup have to match Structure exactly? | No. Only `<style>` and `<script>` are verbatim, and only those are asserted. The demo's markup shows the same variants and states, and the demo calls the init function on every instance, so any attribute the module maintains is immediately brought into line. |
| How are non-ASCII glyphs written in the Structure block? | As numeric character references (`&#9662;`), not literal characters. The block gets pasted into files whose encoding the component cannot know. |
| What counts as themeable? | Anything carrying visual design - colour, length, radius, font, shadow, opacity, duration. Not what would break the component if a theme changed it: the structural keywords (`display`, `position`, `overflow`, `flex`, `grid`, `z-index`, `border-style`, `outline-style`, `cursor`) and the structural lengths that are mechanism rather than design - user-agent resets like `margin: 0`, and the `1px` / `inset(50%)` of a visually-hidden clip. Those stay literal. |
| What characters may a `data-part` or `data-slot` name use? | The same as `data-state`: lowercase, hyphens allowed, no spaces or underscores. Part names become custom property qualifier segments, so a capitalised part name silently breaks the property grammar. |
| How does a Role entry carry its part label? | Value first, label after, matching the Element row: ``generic root; implicit `button` trigger``. Role names are backticked, part labels are not, exactly as the Element row backticks its tags and not its labels. Only Props puts the part first, because there the part is what disambiguates the attribute. |
| Which segment is used for one value of a shorthand? | The sub-value's name, unless that collides with a plain property of the same element. `--auk-list-shadow-offset` is fine; where `--auk-list-color` would already mean the text colour, theme the whole shorthand under its full property name instead (`--auk-list-box-shadow`). |
| What about a state the platform already has an attribute for, like `hidden`? | Use the native attribute. The order of preference is ARIA, then a native attribute, then `data-state`. `data-state` is the last resort, not the second. |
| Where does an attribute go that only the module ever writes, like `aria-activedescendant`? | Behaviour. Props is for what a consumer sets or reads in their own markup. |
| Are the Accessibility bold labels standalone lines? | Yes, each on its own line, with its content following. |
| How is a value shared by more than one part named? | Drop the part qualifier and hang it on the component: `--auk-combobox-popup-offset` where `popup` is declared on the qualifier line as a group covering `list` and `empty`. Duplicating the same literal under two part names is wrong - a theme would have to set both and would eventually set one. |
| Must every element in Structure be a named part? | No. Element lists the root and the named parts; a purely presentational wrapper or an `aria-hidden` glyph may carry no `data-part` at all. Add a part only when styles, the module or the contract need to address it. |
| Is the `data-state` value set component-wide or per part? | Component-wide, and values are unique across parts. The Behaviour section names which element carries each one. |
| May a `data-state` value never appear in CSS? | Yes, when the module writes it purely as a hook for the host page. Declare it on the qualifier line anyway - the line is the component's state vocabulary, not only its styling vocabulary. |

Measured numbers — contrast ratios, target sizes — are never written into a
reference from estimation. Either an assertion in `tests/e2e/` measures it at run
time, or the reference does not claim the number.

## 1. SKILL.md

### Frontmatter

Only keys defined by the [Agent Skills open standard](https://agentskills.io/specification)
may appear. Nothing else — a Claude Code extension key makes the skill invalid for
every other vendor.

| Key | Required | Rule |
| --- | --- | --- |
| `name` | yes | Matches the parent directory exactly, starts with `ui-`, and otherwise uses lowercase letters, digits and single inner hyphens; no leading, trailing or doubled hyphen; 64 characters or fewer. |
| `description` | yes | Third person, 1–1024 characters, no first- or second-person pronoun. States what the component is and when an agent should reach for it. |
| `license` | no | SPDX identifier. |
| `allowed-tools` | no | Comma-separated tool list. |
| `metadata` | no | Free-form object. |

Banned outright, and checked by the portability lint:

- `disable-model-invocation`, `hint` — Claude Code extensions, not in the standard.
- `${CLAUDE_PLUGIN_ROOT}` — a Claude Code variable Codex does not expand. Reference
  sibling files with a relative path instead: `references/ui-button.md`.
- Backslash paths — Windows separators break POSIX agents.

### Description

The description is the entire discovery mechanism. It loads at startup for every
skill in the kit; the body does not. A component that triggers on the wrong request,
or fails to trigger on the right one, cannot be fixed in the body.

Write it in third person, name the component, and name the situations that should
reach for it — including phrasings that avoid the component's own jargon.

> Use when building a button — a clickable control that runs an action in the
> current page. Covers primary, secondary and destructive styling, disabled state
> that stays keyboard reachable, and icon-only buttons.

That example is illustrative tone, not the normative button description. The
component's scope is set by its contract table, not by this paragraph.

### Body

Under 60 lines, and it contains **no component code**. Its only job is to point at
the reference and state the rules an agent must not get wrong.

```markdown
---
name: ui-<component-slug>
description: <third person, one or two sentences>
---

# <Component>

One sentence: what it is.

## When to use
- ...

## When not to use
- ... (name the sibling component that is the right answer instead)

## Clarify when needed
- Accept a plain-language component description and use it to infer the closest
  contract-backed props, slots, behaviour and defaults. Ask targeted questions when
  the description, missing props or requirements would change the element, ARIA,
  state model, slots, behaviour or defaults. Proceed with stated assumptions when
  the request already maps cleanly to the contract.

## Build it
1. Read `references/ui-<component-slug>.md`.
2. Copy the Structure and Styles blocks; adapt only the template syntax to the stack.
3. ...

## Non-negotiable
- the accessibility rules that must survive any port
```

## 2. references/&lt;skill-name&gt;.md

### Skeleton

A reference is exactly this shape. There is no line limit.

```markdown
# <Component> reference

## Contract

| Field | Value |
| --- | --- |
| Element | `<button>` |
| Role | implicit `button` |
| Props | `data-variant` — string — `primary`; `aria-disabled` — `"true"` — absent |
| Slots | `none` |
| Variants | `primary`; `secondary`; `destructive` |
| Behaviour | `none`, or the init signature - including an options parameter when there is one - plus a short summary of what it wires |
| WCAG | 2.1.1 Keyboard; 2.4.7 Focus Visible; 4.1.2 Name, Role, Value |

## Structure
<prose, then exactly one fenced html block>

## Styles
Qualifiers: parts `x`, `y`; variants `a`, `b`; states `focus`, `selected`.
<prose, then exactly one fenced css block>

## Behaviour
<prose, then exactly one fenced js block - or the words `No JavaScript.`>

## Accessibility
<keyboard map, ARIA reasoning, focus management, then one line per WCAG criterion>

## Demo
<pointer to ./demo.html and what to look for>
```

Rules for the shape:

- H1 first, then `## Contract`, then the five `##` sections in the order shown.
- Every contract row is present. Use `none` rather than dropping a row.
- Multi-value cells are a single line, entries separated by `; `. A prop entry is
  `` `name` `` — type — default.
- Each section may hold explanatory prose. It holds at most one fenced block, and no
  `###` subheading.
- The WCAG list is one bullet per criterion. A bullet may wrap across lines.
- JSDoc in the `js` block is encouraged; it is copied verbatim into the demo.
- A criterion listed under WCAG with no matching assertion in `tests/e2e/` is a
  defect, not documentation.

### Section rules

1. **Structure** — semantic elements and ARIA only. One root class, `data-part` for
   internal parts, no framework template syntax.
2. **Styles** — opens with the one-line qualifier declaration (see the settled
   questions), then plain CSS. Every themeable value is
   `var(--auk-<component-slug>-<prop>, <literal>)`. The fallback makes the component work
   with no custom properties defined anywhere; the variable makes it theme cleanly.
3. **Behaviour** — a dependency-free ES module exporting `init<Component>(root)`. It
   may export other helpers, but that init function must exist and must return a
   teardown. No package import, no build syntax, no framework hook.
4. **Accessibility** — keyboard map, ARIA reasoning, focus management, then the WCAG
   criteria from the contract with one line each on how the component satisfies it.
5. **Demo** — a pointer to `./demo.html` and what a reader should look for.

### Framework neutrality

Structure, styles and the accessibility contract are framework-agnostic. Only
template syntax and reactivity binding are framework-specific, and neither belongs in
a reference. No reference may name a framework, a preprocessor, a CSS-in-JS library
or an external package.

The one exception is the required `references/react-demo.tsx` projection demo. It
may name React and import React types or hooks because it is an adapter reference
for apps that already use React, not production code shipped to consumers. That
exception is deliberately file-scoped: `SKILL.md`, `references/<skill-name>.md` and
`references/demo.html` remain framework-neutral, and the portability lint excludes
only `skills/<skill-name>/references/react-demo.tsx`.

Design tokens are an optional mapping layer, never a requirement. A reference ships
literal CSS with `var(--auk-*, fallback)`; it does not reference a token file, and no
token file needs to exist for a component to function. A project that has tokens
binds them to the `--auk-*` properties in its own stylesheet.

## 3. references/demo.html

One self-contained page per component. It must open over `file://` with no server,
no build step and no network request.

- The `<style>` element contains the reference's `css` block **verbatim**.
- The `<script>` element contains the reference's `js` block verbatim with the
  `export ` keyword stripped, plus the wiring that starts it. A `type="module"`
  script cannot load over `file://`, which is why the module is inlined here rather
  than linked.
- `tests/objective.spec.ts` asserts both, so the demo cannot drift from the reference.

The demo is not a showcase. It renders every variant and state the contract names, so
the browser suite can drive them.

## 4. Evaluations

Each skill has `evals/<skill-name>.json` holding at least three scenarios:

- one **obvious** request using the component's own vocabulary;
- one **oblique** request that avoids that vocabulary entirely;
- one **adjacent** request that must *not* trigger the skill.

A scenario that a model already handles correctly with no skill installed is too
easy. Rewrite it. Baselines and per-model results live in `docs/evaluations.md`.

## 5. Scope

The contract table is the component's scope. Anything not in it — extra sizes, a
loading state, toggle semantics, grouping — is out of scope until someone adds a row
and the assertions to back it.

## 6. Tests

Every component adds `tests/e2e/<skill-name>.spec.ts` asserting, at minimum, one case per
WCAG criterion in its contract, plus zero axe-core violations on its demo. Whole-kit
rules — frontmatter, required React projection presence and typed surface,
portability, demo-matches-reference — are asserted once in `tests/objective.spec.ts`,
which iterates `skills/`, so a new component is covered by them without editing a
test.

## 7. What scripts/check.sh enforces

Six gates, in order. Any failure stops the run.

1. **Vitest** — `tests/objective.spec.ts` (frontmatter conforms, no vendor token,
   demo matches reference), `tests/unit/frontmatter.spec.ts` (the validator itself),
   `tests/integration/manifests.spec.ts` (both plugin manifests agree).
2. **Portability lint** — `scripts/lint-portability.mjs`, over `skills/` only,
   except `skills/<skill-name>/references/react-demo.tsx`: `${CLAUDE_PLUGIN_ROOT}`,
   `disable-model-invocation:`, `hint:`, backslash paths, framework names,
   preprocessor names, package imports, install instructions.
3. **No external resources** — nothing under `skills/` may carry `src`, `srcset`,
   a `<link href>`, an `@import` or a `url()`. A component split across sibling
   files runs under headless Chrome and then fails in a real browser opened from
   disk, so without this the automated gate is looser than the manual one.
4. **Demos match their references** — `scripts/build-demos.mjs --check`. The
   component's code exists twice, and this is what keeps the two copies identical.
5. **Plugin validation** — `claude plugin validate . --strict`.
6. **Playwright** — the browser suite, including axe-core on every demo.

`bash scripts/check.sh --prove` additionally runs deliberately broken fixtures
through the gate, so each check is known to be able to fail.

## 8. Checklist

Before a component is done:

- [ ] Frontmatter uses standard keys only and `name` matches the directory with the `ui-` prefix.
- [ ] Description is third person, pronoun-free, and covers oblique phrasing.
- [ ] Body is under 60 lines and holds no component code.
- [ ] Contract table has all seven rows, in order.
- [ ] All five reference sections present, in order, one fenced block each.
- [ ] Every themeable CSS value is `var(--auk-<component-slug>-*, literal)`.
- [ ] No framework, preprocessor or package named outside the scoped React projection reference.
- [ ] `references/react-demo.tsx` exists as a typed React projection reference.
- [ ] Demo opens from `file://` and matches the reference verbatim.
- [ ] Every WCAG criterion claimed has a passing assertion in `tests/e2e/`.
- [ ] Three evaluations exist with a recorded baseline.
- [ ] `bash scripts/check.sh` exits zero.
