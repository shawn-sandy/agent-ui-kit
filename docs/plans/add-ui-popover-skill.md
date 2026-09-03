---
status: completed
type: feature
created: 2026-09-03
repo-name: agent-ui-kit
effort: medium
artifact-url: https://claude.ai/code/artifact/4e94d7ac-07d7-48cc-b1a7-2917796d9c77
glance: The repository ships a modal dialog but nothing for the non-blocking layers that sit on top of a page - filter panels, disclosure cards, notices that must not steal the keyboard. The native popover attribute gives light dismiss, the top layer and a declarative trigger for free, so the component is mostly a contract and a very small module. Done means scripts/check.sh exits zero with a new ui-popover skill in it.
---

# Plan: Ship a non-modal popover skill on the native popover attribute

## Objective

Add a `ui-popover` component skill built on the native HTML `popover` attribute,
covering the `auto` and `manual` modes, light dismiss, the top layer and an
accessible trigger relationship, authored to `docs/component-spec.md` and backed by
browser assertions for every WCAG criterion it claims.

## Context

`skills/` currently holds `ui-alert`, `ui-button`, `ui-dialog` and `ui-tabs`. The
only overlay it offers is `ui-dialog`, which is modal by construction: it opens with
`showModal()`, makes the page behind inert, and traps the keyboard until it closes.
That is correct for a confirmation step and wrong for every layer that must leave the
page usable - a filter panel, a disclosure card, a notice. `ui-dialog`'s own
"When not to use" already routes those requests away and names no destination.

The native `popover` attribute is that destination. It reached Baseline in April 2024
and supplies, with no script at all: placement in the top layer so no ancestor
`overflow` or `z-index` can clip the layer, light dismiss on Escape and on an outside
click for `popover="auto"`, a declarative trigger through `popovertarget` that works
before any JavaScript runs, and focus returning to the trigger on close. A `manual`
popover opts out of light dismiss and closes only through an explicit control, which
`popovertargetaction="hide"` also supplies declaratively.

What the platform does not reliably expose is the trigger's open state. The
`popovertarget` relationship sets `aria-expanded` implicitly in the accessibility
tree, and implicit-only state is uneven across assistive technology and is not
readable from the DOM. That gap is the entire justification for the module: mirror
the popover's `toggle` event onto an explicit `aria-expanded` on every trigger, and
nothing else.

The risk worth naming is scope creep into positioning. A popover in the top layer
cannot be placed with `position: absolute` against an ancestor, so anchoring it to
its trigger needs either CSS anchor positioning - Chromium-only today, and the
Playwright suite runs Chromium only, so the fallback branch could not be verified
here - or a JavaScript positioner. Both are deferred; see Decisions.

## Decisions

- The component slug is `popover`, so the skill directory is `skills/ui-popover/`, the root class `auk-popover`, custom properties `--auk-popover-*`, the module export `initPopover`, and the React projection names `AukPopoverProps` / `AukPopoverDemo`. This is `docs/component-spec.md` section 0, not a choice being made here.
- Positioning is out of the v1 contract. The popover uses the user agent's centred placement, themeable through custom properties. Anchor positioning is not Baseline, and the browser suite runs Chromium only, so shipping it would put a claim in the reference that only one of its two branches could be asserted - which `docs/component-spec.md` treats as a defect. It moves to Next Steps.
- Mode is carried by the native `popover` attribute (`auto` / `manual`), not by `data-variant`. The spec's state rule is ARIA, then a native attribute, then `data-state`; a native attribute exists here, so the Variants row is `none` and mode lives in Props.
- `initPopover(root)` takes no options object. Its whole job is mirroring `aria-expanded`, and an options parameter with nothing to configure is speculative surface.
- Closing a `manual` popover is done declaratively with `popovertargetaction="hide"` on a button inside it, not with a scripted close handler. The platform already ships the behaviour.
- Initial focus inside the popover uses the native `autofocus` attribute, never a scripted `focus()` call - matching `ui-dialog`'s reasoning, because a scripted focus move does not match `:focus-visible` and would leave a keyboard user with no visible ring.
- Measured in Chromium at step 1, and the whole reason the module exists: an `auto` popover restores focus to its trigger on every close path, but a `manual` popover restores nothing - a `<div popover=manual>` drops focus to `<body>` and a `<dialog popover=manual>` leaves it on the now-hidden close button. The module therefore restores focus only for `manual`, and leaves `auto` to the browser.
- Measured at step 1: focus does not move into a popover on open. It only becomes next in the tab order. A descendant carrying `autofocus` is what moves it, so the reference states that rather than MDN's looser "focus moves into the popover".
- Measured at step 1: `popovertarget` sets `aria-expanded` implicitly in the accessibility tree only - `getAttribute('aria-expanded')` reads `null`. The module writes it explicitly so the state is both announced and readable.
- The root is `<div popover role="group">`, not `<dialog popover>`. Both were measured working and non-modal at step 1, and `<dialog popover>` does bring an implicit `dialog` role for free - but announcing a filter panel as a dialog overstates it, and `<dialog>` already belongs unambiguously to `ui-dialog`. The reference names the `<dialog popover>` alternative in one line for cases that genuinely want non-modal dialog semantics.
- No red-green-verify phases. The component's CSS and JS live in the reference and are generated into `demo.html` by `scripts/build-demos.mjs`, and the browser suite drives that generated demo. A test authored before the demo exists fails on a missing file, which proves nothing about the WCAG behaviour it is named for. The real gate is `scripts/check.sh`, and it runs at the end.

## Files

- skills/ui-popover/references/ui-popover.md (new) — the component itself: contract table, structure, styles, module, accessibility contract
- skills/ui-popover/SKILL.md (new) — frontmatter and orientation; no component code, under 60 lines
- skills/ui-popover/references/demo.html (new) — self-contained page opening over file://, with generated CSS and JS regions
- skills/ui-popover/references/react-demo.tsx (new) — typed React projection over the same DOM contract
- tests/e2e/ui-popover.spec.ts (new) — one test per claimed WCAG criterion, plus axe-core on the demo
- evals/ui-popover.json (new) — obvious, oblique and adjacent scenarios

## Steps

1. [x] Confirm the native focus behaviour in Chromium before writing any accessibility claim: open a scratch page with an `auto` popover, a `manual` popover and a trigger, and record whether focus enters the popover on open, whether `autofocus` is honoured, where focus lands on Escape and on outside-click dismissal, and whether Tab from inside an open popover reaches page content behind. Why: the reference may only state behaviour the browser actually has, and MDN's prose on popover focus is ambiguous about whether focus moves in on open or merely becomes next in the tab order. Verify: a scratch file under the scratchpad driven by Playwright prints the observed focus target for each case, and those observations are what the later Accessibility section is written from.
2. [x] Author `skills/ui-popover/references/ui-popover.md` with all seven contract rows and the five sections in order, using the observations from step 1: `popover` and `popovertarget` in Props, Variants `none`, the qualifier line declaring parts and states, every themeable value as `var(--auk-popover-*, <literal>)` with a literal fallback, and `initPopover(root)` returning a teardown. Why: the reference is the canonical component and the source `scripts/build-demos.mjs` generates the demo from, so nothing downstream can be written until it exists. Verify: `node scripts/lint-portability.mjs` passes on the file and the WCAG row lists only criteria step 5 will assert.
3. [x] Author `skills/ui-popover/SKILL.md` with standard-only frontmatter, a third-person pronoun-free `description` naming both the component and oblique phrasings, and a body under 60 lines holding no fenced component code, including the `## Clarify when needed` section and a `## When not to use` that routes modal cases to `ui-dialog`. Why: the description is the entire discovery mechanism and is the only part loaded at startup, so a component that fails to trigger cannot be fixed later in the body. Verify: `npx vitest run tests/objective.spec.ts` passes its frontmatter, body-length, no-code and clarify-section assertions for `ui-popover`.
4. [x] Hand-write `skills/ui-popover/references/demo.html` page chrome, markup and wiring with both generated-region markers naming `ui-popover.md`, then run `node scripts/build-demos.mjs` to fill the CSS and JS regions from the reference. Why: the demo is the template rather than a separate copy, and the marker embeds the component's own name, so a marker copied from another component leaves the generator unable to find the region. Verify: `node scripts/build-demos.mjs --check` reports every demo up to date, and the page opens over `file://` showing both popover modes with no console error.
5. [x] Author `tests/e2e/ui-popover.spec.ts` with one test per criterion in the reference's WCAG row, each title starting with the criterion string exactly as written there, plus an axe-core pass over the demo with a popover open. Why: `tests/objective.spec.ts` matches criteria to test titles by prefix, and `docs/component-spec.md` treats a claimed criterion with no assertion as a defect rather than documentation. Verify: `npx playwright test tests/e2e/ui-popover.spec.ts` passes and every test name is prefixed by a criterion from the contract table.
6. [x] Author `skills/ui-popover/references/react-demo.tsx` exporting `AukPopoverProps` and `AukPopoverDemo` over the same DOM contract, rendering the `auk-popover` root class. Why: `tests/objective.spec.ts` asserts the projection file exists with exactly those typed exports, and it is the one file the portability lint excludes, so it is also the only place the adapter can name its framework. Verify: `npx vitest run tests/objective.spec.ts` passes the React projection assertions for `ui-popover`.
7. [x] Author `evals/ui-popover.json` with at least three scenarios covering the `obvious`, `oblique` and `adjacent` kinds, where the adjacent scenario is a modal confirmation that must not trigger this skill. Why: the eval file is asserted by `tests/objective.spec.ts`, and an adjacent scenario is what stops `ui-popover` and `ui-dialog` from both firing on every overlay request. Verify: `npx vitest run tests/objective.spec.ts` passes the evaluation-scenario assertion for `ui-popover`.
8. [x] Run the full local gate and fix anything it reports, editing the reference rather than the generated demo regions. Why: six gates run in order and any failure stops the run, so a green local gate is the only evidence that the new skill is actually shippable. Verify: `bash scripts/check.sh` exits zero.

## Tests

Tier 1 — This plan changes application code
- Objective: the ui-popover skill is complete and passes every repository gate. File: tests/e2e/ui-popover.spec.ts; Type: smoke; Asserts: the demo renders both popover modes, opens and closes from the keyboard, reports open state on its trigger, releases the keyboard to the page behind, and records zero axe-core violations; Run: bash scripts/check.sh
- E2E: one assertion per claimed WCAG criterion. File: tests/e2e/ui-popover.spec.ts; Targets: skills/ui-popover/references/demo.html; Key cases: keyboard open and close, focus returning to the trigger, no keyboard trap out of a non-modal layer, visible focus outline inside the popover, accessible name and aria-expanded, contrast via axe-core with the popover open
- Integration: repository-wide contract assertions pick the new skill up automatically. File: tests/objective.spec.ts; Targets: skills/ui-popover; Key cases: frontmatter conforms, SKILL.md body under 60 lines with no component code, contract table has all seven rows, demo matches reference, React projection exports the typed surface, three eval scenarios present

## Acceptance Criteria

- [x] `skills/ui-popover/` holds SKILL.md, references/ui-popover.md, references/demo.html and references/react-demo.tsx.
- [x] The reference's contract table carries all seven rows in order, and its Variants row is `none` with popover mode documented in Props instead.
- [x] Every themeable CSS value in the reference is `var(--auk-popover-*, <literal>)` with a literal, non-nested fallback.
- [x] The module exports `initPopover(root)`, returns a teardown, and mirrors the popover's open state onto every trigger's `aria-expanded`.
- [x] `references/demo.html` opens over `file://` with no server and no network request, and `node scripts/build-demos.mjs --check` reports it up to date.
- [x] Every criterion in the reference's WCAG row has a test in `tests/e2e/ui-popover.spec.ts` whose title starts with that criterion string.
- [x] axe-core reports zero violations on the demo with a popover open.
- [x] `evals/ui-popover.json` holds at least three scenarios whose kinds include `obvious`, `oblique` and `adjacent`.
- [x] No framework, preprocessor or package name appears outside `references/react-demo.tsx`.
- [x] `bash scripts/check.sh` exits zero.

## Verification

Run `bash scripts/check.sh` from the repository root and confirm it exits zero. That
is the whole gate: vitest over `tests/objective.spec.ts` picks the new skill up by
iterating `skills/`, so frontmatter, body length, contract rows, the React projection
surface and the eval scenarios are all asserted without editing a test; the
portability lint rejects a framework name or a package import anywhere under
`skills/`; the external-resource grep rejects any `src=`, `<link href=`, `@import` or
non-data `url(`; `build-demos.mjs --check` proves the demo has not drifted from the
reference; `claude plugin validate . --strict` checks both manifests; and Playwright
runs `tests/e2e/ui-popover.spec.ts` including axe-core.

Then open `skills/ui-popover/references/demo.html` directly from disk, with no server
running, and confirm by hand what an automated run cannot show: the `auto` popover
closes on Escape and on a click outside it, the `manual` popover ignores both and
closes only from its own button, a link behind an open popover is still clickable
because the layer is non-modal, and the trigger's `aria-expanded` reads `true` while
its popover is open.

## Next Steps

- Record the ui-popover evaluation baseline in docs/evaluations.md
  The three scenarios exist and are asserted by the test suite, but `docs/component-spec.md` section 8 also wants a *recorded baseline* - what the models write with no skill installed. That needs real model runs through `scripts/eval.sh`, which nothing in `scripts/check.sh` gates, so it was left out of this plan rather than faked.
  ```text
  In the agent-ui-skills repository, record the evaluation baseline for the
  ui-popover skill. Run `bash scripts/eval.sh baseline` for the three scenarios in
  evals/ui-popover.json across Haiku, Sonnet and Opus, then add a results table to
  docs/evaluations.md in the same shape as the existing ui-button and ui-alert
  tables. The signals worth columns are: uses the native popover attribute rather
  than an absolutely positioned div, gives the layer an explicit role, gives it an
  accessible name, and keeps aria-expanded on the trigger. Write only what the runs
  actually produced - never estimate a cell. Verify by confirming
  docs/evaluations.md contains a ui-popover-obvious row and a ui-popover-oblique row
  for all three models.
  ```

- Anchor the popover to its trigger with CSS anchor positioning
  Deferred from v1 because anchor positioning is not Baseline and the Playwright suite runs Chromium only, so the unsupported branch could not be asserted. Revisit once a second engine ships it, or once the suite gains a non-Chromium project.
  ```text
  In the agent-ui-skills repository, extend skills/ui-popover to place the popover
  next to its trigger instead of using the user agent's centred placement. Use CSS
  anchor positioning behind an @supports guard, keeping the current centred
  placement as the fallback, and expose the placement through --auk-popover-*
  custom properties. Add a Playwright assertion in tests/e2e/ui-popover.spec.ts
  that the popover's bounding box sits adjacent to its trigger's box when anchor
  positioning is supported. Update docs/component-spec.md only if a new convention
  is needed. Verify by running `bash scripts/check.sh` and confirming it exits zero.
  ```

- Add a hint-mode popover for hover and focus tooltips
  Wish list. The `popover="hint"` value exists for supplementary layers opened by hover or focus rather than click, and it interacts with the auto stack differently. It also brings WCAG 1.4.13 Content on Hover or Focus into scope, which needs dismissible, hoverable and persistent all asserted.
  ```text
  In the agent-ui-skills repository, extend skills/ui-popover to cover popover="hint"
  for hover- and focus-triggered tooltips. Add the mode to the Props row of
  skills/ui-popover/references/ui-popover.md, add the hover and focus wiring to the
  module, render a hint example in references/demo.html, and add WCAG 1.4.13 Content
  on Hover or Focus to the contract WCAG row with tests in
  tests/e2e/ui-popover.spec.ts asserting the layer is dismissible, hoverable and
  persistent. Regenerate the demo with `node scripts/build-demos.mjs`. Verify by
  running `bash scripts/check.sh` and confirming it exits zero.
  ```

## Resources

- [Popover API - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover) — the normative reference for the attribute values (`auto`, `manual`, `hint`), `popovertarget`, `popovertargetaction`, and the `showPopover` / `hidePopover` / `togglePopover` methods. Establishes the April 2024 Baseline date cited in Context.
- [Using the Popover API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using) — the `ToggleEvent` shape (`oldState`, `newState`, `source`), the cancelable `beforetoggle`, the default user-agent stylesheet for `[popover]`, and the implicit `aria-expanded` and `aria-details` relationships that `popovertarget` establishes. The implicit-only nature of that state is what step 2's module exists to make explicit.
- [Popover and dialog - web.dev](https://web.dev/learn/css/popover-and-dialog) — the popover-versus-dialog framing used in Context, the light dismiss description, and the `transition-behavior: allow-discrete` / `@starting-style` / `overlay` recipe if animation is ever added.
- `docs/component-spec.md` — the authoring contract this plan is written against; it wins over CLAUDE.md on any conflict.
- `skills/ui-dialog/` — the closest existing component and the shape every step follows, including the native-attribute-over-scripted-focus reasoning reused in Decisions.
