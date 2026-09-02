# Component specification

> **Status: alpha.** The format will change. Pin a commit SHA if you depend on it.

This is the authoring contract for every skill under `skills/`. It defines the three
files a component ships, what belongs in each, and the rules a component must satisfy
to be portable across agent vendors.

Read this before writing a component. Every check in `scripts/check.sh` enforces
something stated here.

## 1. Files

A component's skill directory is exactly three files. Nothing else lives under
`skills/<name>/`.

```
skills/<name>/
├── SKILL.md                    # trigger and orientation
└── references/
    ├── reference.md            # the contract: what it is, what it guarantees
    └── <name>.html             # the code, the demo, and the test target
```

The split exists because the three files load at different moments:

| File | Loads | Budget |
|---|---|---|
| `SKILL.md` frontmatter `description` | always, at agent startup | ~100 tokens |
| `SKILL.md` body | when the skill triggers | under 60 lines |
| `references/*` | only when the agent commits to building | unbounded |

A component's code appears in exactly one place: `<name>.html`. Neither `SKILL.md`
nor `reference.md` may contain the component's HTML, CSS or JavaScript. Two copies
drift; a drifted copy makes every accessibility claim in this repository unverifiable,
because the test would assert against one copy while the user copies the other.

### 1.1 What lives outside the skill directory

Two further artifacts are required before a component can pass the build. Both are
written by the component's author, in the same change. They sit outside
`skills/<name>/` because they are test and evaluation code rather than shipped
reference material, and an agent that loads the skill must never pull them into
context.

| Artifact | Path | Requirement |
|---|---|---|
| End-to-end assertions | `tests/e2e/<name>.spec.ts` | one per criterion in `a11y` (§3.2) |
| Evaluation scenarios | `evals/<name>.json` | at least three (§2.2) |

A component is not finished when its three files exist. It is finished when those
three files and both artifacts above are in place and `scripts/check.sh` exits zero.

## 2. `SKILL.md`

### 2.1 Frontmatter

Standard [Agent Skills](https://agentskills.io/specification) keys only.

| Key | Required | Rule |
|---|---|---|
| `name` | yes | kebab-case; identical to the parent directory name; no leading, trailing or consecutive hyphens |
| `description` | yes | third person; 1–1024 characters; written as a trigger (§2.2) |
| `license` | no | SPDX identifier |
| `allowed-tools` | no | comma-separated tool names |

No other key may appear. In particular `disable-model-invocation:` and `hint:` are
Claude Code extensions absent from the standard, and this repository's validator
rejects them.

### 2.2 Writing the `description`

The description is the only text permanently in the agent's context, and it is the
sole mechanism by which a component is discovered. It is a trigger, not a summary.

Write it in the words a user would type **without knowing the component's name**.
Name the problem before the solution, and list the adjacent vocabulary a user is
likely to reach for.

```
Weak:   Accessible dialog component with focus trap and aria-modal.
Strong: Use when building a modal, popup, overlay, lightbox, or any panel that
        blocks the rest of the page until dismissed. Covers focus trapping,
        Escape to close, and returning focus to the element that opened it.
```

The weak version only fires when the user already said "dialog", which is the case
where they needed the least help. Every component's evaluation set in `evals/`
includes one deliberately oblique request that avoids the component's own name;
that scenario tests this field and nothing else.

Triggering failures are fixed in the `description`. Never in the body — the body
loads after the decision has already been made.

### 2.3 Body

Under 60 lines. No component code. No `${CLAUDE_PLUGIN_ROOT}`, no backslash paths,
no shelling out to helper scripts (§6).

Sections, in order:

| Section | Contents |
|---|---|
| `# <Component>` | One paragraph: what it is, and the single accessibility fact that most often gets it wrong. |
| `## When to use` | Two to four bullets, phrased as user situations. |
| `## When not to use` | One to three bullets naming the component that is actually wanted. |
| `## Build` | Numbered steps. Step 1 always reads the reference. The last step always names a keyboard or screen-reader check the developer can run by hand. |

## 3. `references/reference.md`

### 3.1 Frontmatter

This file carries the machine-readable contract. It lives here rather than in
`SKILL.md` because `SKILL.md` frontmatter is constrained to the standard's keys
(§2.1) and would fail validation.

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | kebab-case; matches the skill directory |
| `element` | yes | the semantic host element the structure renders |
| `role` | no | explicit ARIA role; **omit when the element already implies it** |
| `props` | no | abstract prop model, projected per framework by the consuming agent |
| `slots` | no | named content slots; `children` is the default slot |
| `variants` | no | named variant to the DOM expression that selects it (§3.1.1) |
| `a11y` | yes | WCAG 2.2 success criteria this component satisfies (§3.2) |

A `props` entry may carry `values`, `type`, `required`, `default`, `maps-to` (how the
prop surfaces in the DOM) and `a11y` (a one-line note on its accessibility effect).

#### 3.1.1 `variants` and `maps-to`

A **DOM expression** is the literal attribute form that expresses the variant in
markup, written as `attribute=value`. It is not a CSS selector and not prose.

`variants` is always a mapping of variant name to an object carrying `maps-to`:

```yaml
variants:
  primary:   { maps-to: "data-variant=primary", default: true }
  secondary: { maps-to: "data-variant=secondary" }
  danger:    { maps-to: "data-variant=danger" }
```

A `props` entry's `maps-to` takes the same form — `aria-disabled=true`, `data-size=lg`.

One variant may be the unmarked default, expressed by the base rule with no attribute
at all. Mark it `default: true` and ship no selector for it, so a component with the
attribute omitted still renders correctly.

Deliberately **not** in this schema:

- **`tokens:` with `{token.path}` references.** Themeable values are expressed as
  CSS custom properties with literal fallbacks (§4.2). No design-token file needs to
  exist for a component to work.
- **`targets:` and `## Target: <framework>` adapter blocks.** Shipping a React
  template reintroduces the framework opinion this kit exists to avoid, and each
  adapter is a maintenance burden that grows with the component count. The agent
  projects from the neutral source.

### 3.2 `a11y` is a test manifest, not a claim

The `a11y` list is parsed by `tests/objective.spec.ts`. Every criterion listed must
have a matching assertion in `tests/e2e/<name>.spec.ts`. A criterion with no
assertion fails the build.

```yaml
a11y: [2.4.1, 2.4.7, 1.4.3]
```

Each criterion needs one assertion that would fail if that criterion were violated,
named so the manifest check can match it. The parser matches on the criterion number
leading the test name:

```ts
test('2.4.1 Bypass Blocks — Enter moves focus into the main content', ...)
```

A test whose name does not begin with a criterion number is ignored by the manifest
check. A criterion in `a11y` with no matching test name fails the build.

This is the rule that makes accessibility enforceable rather than aspirational. List
only what you have tested. An untested criterion is a defect, not documentation.

### 3.3 Body sections

Five sections, in this order. `Behaviour` is omitted for purely presentational
components; the other four are always required.

| Section | Required | Contents |
|---|---|---|
| `## Structure` | yes | The element tree in prose or an indented outline, naming slot placeholders and `data-*` variant hooks. Explains *why* the elements were chosen. Does not restate the markup — the file does that. |
| `## Styles` | yes | A table of every `--auk-*` custom property: name, default, and what it controls. Plus any layout technique that is load-bearing for accessibility. |
| `## Behaviour` | if stateful | Triggers, state transitions, invariants, and the ARIA attributes each transition changes. Names the init function and its signature. |
| `## Accessibility` | yes | A keyboard table, focus-management notes, and a checklist of the WCAG criteria that mirrors the `a11y` frontmatter exactly. |
| `## Demo` | yes | How to open `<name>.html` and what to try, keyboard-first. |

No section may contain the component's HTML, CSS or JavaScript. Short illustrative
fragments naming a single attribute or selector are fine; a copyable block is not.

## 4. `references/<name>.html`

This one file is the reference implementation, the demo page, and the target of the
end-to-end tests. It is the single source of truth for the component's code.

### 4.1 It must be entirely self-contained

The file must load **no external resource of any kind**. Specifically:

- No `<script type="module" src="...">`
- No `<script src="...">`
- No `<link rel="stylesheet" href="...">`
- No fonts, images or icons fetched over the network

Styles go in an inline `<style>`. Behaviour goes in an inline
`<script type="module">`.

This is not a stylistic preference. A page opened from disk has a null origin, and a
module fetched from a sibling file is a cross-origin request that the browser blocks.
Measured on this repository: a page importing a sibling `.js` module **runs** under
`chrome-headless-shell` — the engine Playwright drives — and **does not run** in a
real browser at a null origin, with an inline module in the identical page as the
passing control.

The consequence is that the automated gate is more permissive than the manual one. A
component split across files would pass `scripts/check.sh` and fail the manual
verification of opening the demo in a browser. `scripts/check.sh` therefore greps for
external references under `skills/` and fails the build when it finds one.

### 4.2 CSS naming

Every class a component defines is prefixed `auk-` and kebab-cased after the
component: `.auk-skip-link`, `.auk-button`. A component defines no unprefixed class,
and no element or id selector reaching outside its own subtree, so its CSS cannot
collide with a consuming project's.

One exception: a component whose contract requires styling an element it does not own
— a skip link's target, a dialog's scroll lock on `body` — may do so, provided the
selector is as narrow as it can be and the `## Styles` section names the element and
says why. The worked example in §5 uses this exception once.

Every themeable value is a custom property with a literal fallback, so the component
renders correctly with no properties defined at all.

```
--auk-<component>-<property>
--auk-<component>-<variant>-<property>    # only when a variant needs its own value
```

The variant segment is used only where a variant genuinely differs. A three-variant
button that shares its padding across all three declares `--auk-button-padding` once
and adds `--auk-button-danger-bg` only for the value that actually changes.

Two shared properties may be used as an intermediate fallback so a project can theme
focus rings once rather than per component:

| Shared property | Purpose |
|---|---|
| `--auk-focus-outline` | the focus indicator's `outline` shorthand |
| `--auk-focus-offset` | its `outline-offset` |

They are used as a nested fallback, never directly:

```css
outline: var(--auk-skip-link-focus-outline, var(--auk-focus-outline, 2px solid currentColor));
```

Fallback nesting is capped at two levels. Adding a name to the shared list requires a
change to this specification.

**Do not carry `currentColor` into the final fallback on a component with a background
fill.** The ring must contrast with the surface it actually lands on, and
`outline-offset` decides which surface that is. At a positive offset the ring sits on
the page, not on the component. On a mid-blue filled button, `currentColor` resolves
to the white label colour and measures **1.00:1 against a white page** — an invisible
focus indicator on the variant most likely to be a page's primary action. A dark
literal reaches 17.40:1 there. Use a literal that contrasts with the page surface.

The example above is safe only because a skip link's own background *is* the page
surface, so `currentColor` contrasts with both.

### 4.3 JavaScript

Dependency-free ES module in an inline `<script type="module">`. A stateful component
exposes a single entry point taking a root element:

```
function init(root) { ... }
```

It must be safe to call on any number of roots, including nested and overlapping
ones, and must not assume it runs at any particular point in the document lifecycle.

The function is **not** exported. An inline module's exports are unreachable — §4.1
forbids the sibling file that would import them — so `export` here is dead syntax.
The demo calls `init` directly at the end of the same script. A consumer copies the
function into their own module and exports it there if they need to.

## 5. Worked example

A complete, conformant component. `skip-link` is presentational, so it has no
`Behaviour` section and no JavaScript.

### `skills/skip-link/SKILL.md`

```markdown
---
name: skip-link
description: Use when a keyboard or screen reader user needs to jump past a repeated
  header, navigation bar, or banner straight to the page content — the "skip to main
  content" link. Covers staying in the tab order while visually hidden, becoming
  visible on focus, and moving focus so the next Tab continues inside the content.
---

# Skip link

A link that is the first thing in the tab order and jumps focus to the main content,
letting keyboard users bypass navigation that repeats on every page. The mistake that
breaks it is hiding it with `display: none` or `visibility: hidden`, which removes it
from the tab order and makes it unreachable by the only users it serves.

## When to use

- Any page with navigation, a banner, or a toolbar before the main content.
- Any layout where reaching the content takes more than a few Tab presses.

## When not to use

- To hide text from sighted users only — that is a visually-hidden utility, not this.
- To move focus after an in-page action — that is focus management in a component.

## Build

1. Read `references/skip-link.html`. It is the complete component.
2. Place the link as the first focusable element in the document body.
3. Give the target container an `id` matching the link's `href`, and `tabindex="-1"`
   so focus lands on it.
4. Map the `--auk-skip-link-*` properties to the project's tokens, or leave the
   fallbacks.
5. Verify by hand: load the page, press Tab once. The link must appear, and pressing
   Enter must move focus into the content so the next Tab lands on the first control
   inside it.
```

### `skills/skip-link/references/reference.md`

```markdown
---
name: skip-link
element: a
props:
  href:
    type: string
    required: true
    a11y: "must match the id of the main content container"
slots: [children]
a11y: [2.4.1, 2.4.7, 1.4.3]
---

# Skip link

## Structure

A single `<a>` placed as the first element inside `<body>`, before the header. Its
`href` is a fragment pointing at the main content container, which carries a matching
`id` and `tabindex="-1"`.

The `tabindex="-1"` on the target is load-bearing. Without it, browsers move the
visual viewport to the target but leave focus at the document root, so the next Tab
returns to the top of the page and the link accomplishes nothing.

No ARIA role is set. `<a href>` already exposes the link role.

## Styles

The link stays in the tab order at all times and is moved out of view with
`transform`, never with `display`, `visibility`, or removal from the DOM.

| Property | Default | Controls |
|---|---|---|
| `--auk-skip-link-inset` | `0` | distance from the top and inline start edges |
| `--auk-skip-link-z` | `999` | stacking order above the header |
| `--auk-skip-link-padding` | `0.5rem 1rem` | the hit area |
| `--auk-skip-link-bg` | `#ffffff` | background when visible |
| `--auk-skip-link-color` | `#1a1a1a` | text colour when visible |
| `--auk-skip-link-radius` | `0 0 0.25rem 0` | corner rounding |
| `--auk-skip-link-focus-outline` | `--auk-focus-outline`, then `2px solid currentColor` | focus indicator |
| `--auk-skip-link-focus-offset` | `--auk-focus-offset`, then `2px` | focus indicator offset |

The reveal transition is wrapped in `prefers-reduced-motion: no-preference`, so a
user who has asked for reduced motion gets the link with no animation rather than no
link.

The target container's own focus ring is suppressed. It is a programmatic focus
target, not an operable control, so an outline around the whole content region carries
no information. 2.4.7 is unaffected: it governs keyboard-operable components, which
the container is not.

## Accessibility

| Key | Result |
|---|---|
| `Tab` (from page load) | moves focus to the link, which becomes visible |
| `Enter` | moves focus to the main content container |
| `Shift+Tab` | returns to the browser chrome |

The visible state is styled on `:focus`, not `:focus-visible`. A skip link is only
ever reached by keyboard, and `:focus-visible` would leave it invisible if focus
arrived programmatically.

WCAG 2.2 criteria satisfied:

- **2.4.1 Bypass Blocks (A)** — provides a mechanism to skip repeated content.
- **2.4.7 Focus Visible (AA)** — the link is visible and carries an outline whenever
  it holds focus.
- **1.4.3 Contrast (Minimum) (AA)** — the default `#1a1a1a` on `#ffffff` measures
  17.4:1, well clear of the 4.5:1 threshold.

## Demo

Open `skip-link.html` in a browser. Do not click anything. Press Tab once: the link
slides into view at the top left. Press Enter: focus moves into the content. Press
Tab again and confirm the next stop is the first link inside the content, not the
top of the page.
```

### `skills/skip-link/references/skip-link.html`

The complete file, self-contained per §4.1:

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skip link — agent-ui-kit reference</title>
<style>
  .auk-skip-link {
    position: absolute;
    inset-block-start: var(--auk-skip-link-inset, 0);
    inset-inline-start: var(--auk-skip-link-inset, 0);
    z-index: var(--auk-skip-link-z, 999);
    padding: var(--auk-skip-link-padding, 0.5rem 1rem);
    background: var(--auk-skip-link-bg, #ffffff);
    color: var(--auk-skip-link-color, #1a1a1a);
    border-radius: var(--auk-skip-link-radius, 0 0 0.25rem 0);
    transform: translateY(-100%);
  }

  .auk-skip-link:focus {
    transform: translateY(0);
    outline: var(--auk-skip-link-focus-outline, var(--auk-focus-outline, 2px solid currentColor));
    outline-offset: var(--auk-skip-link-focus-offset, var(--auk-focus-offset, 2px));
  }

  @media (prefers-reduced-motion: no-preference) {
    .auk-skip-link { transition: transform 120ms ease-out; }
  }

  [id="main"]:focus { outline: none; }
</style>

<a class="auk-skip-link" href="#main">Skip to main content</a>

<header>
  <nav aria-label="Primary">
    <a href="#one">Products</a>
    <a href="#two">Pricing</a>
    <a href="#three">Support</a>
  </nav>
</header>

<main id="main" tabindex="-1">
  <h1>Main content</h1>
  <p>Press Tab from page load to reveal the skip link.</p>
  <a href="#four">First link inside the content</a>
</main>
```

## 6. Portability rules

Every file under `skills/` is linted against these. A match fails the build.

| Forbidden | Why |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` | a Claude Code variable; Codex does not expand it |
| `disable-model-invocation:` | Claude Code frontmatter extension, not in the standard |
| `hint:` | same |
| a backslash path | breaks on every platform this repo supports |
| a call to a helper script or interpreter | a cross-vendor skill cannot assume Python or any runtime exists |
| a framework, preprocessor or package name in a component's code | the kit is framework-neutral by definition |
| an external `src`, `href` or `@import` in a component's HTML | breaks when the page is opened from disk (§4.1) |

## 7. Consumer behaviour

How a validator or generator treats a non-conforming file.

| Scenario | Behaviour |
|---|---|
| Missing a required section | error; reject the file |
| Duplicate section heading | error; reject the file |
| Unknown body section | preserve; do not error |
| Unknown `reference.md` frontmatter key | accept with a warning |
| Non-standard `SKILL.md` frontmatter key | error; reject the file |
| `name` not matching the parent directory | error; reject the file |
| A criterion in `a11y` with no matching e2e assertion | error; fail the build |
| A custom property with no fallback | error; the component must work standalone |
