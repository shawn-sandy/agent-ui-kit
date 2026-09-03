---
status: completed
type: feature
created: 2026-09-02
workflow: never
artifact-url: https://claude.ai/code/artifact/3ac8af41-5a39-4bc7-aa5e-456dfe8bc9bb
glance: The kit has four interactive components and no primitive for the thing every page is made of - a plain enclosure with padding, a border and a foreground/background pair. Box adds that primitive and makes the reasoning behind it explicit, so a bare div stops being the default answer. Success is `npm run check` green with three measured WCAG assertions behind the reference's claims.
---

# Plan: Give the kit a box to build layouts on

## Objective

Add a `box` component skill to `skills/` - a primitive enclosure that replaces a
bare `<div>` and carries the padding, border and colour-pairing rules that every
later layout component composes with.

## Context

The kit ships four components chosen to stress the *format*: no JavaScript, a live
region, focus management, keyboard navigation. None of them is a layout primitive,
so an agent asked to "wrap this in a card" has nothing to reach for and writes a
bare `<div>` with ad-hoc styles.

Every Layout's Boxes rudiment is the reference the request names. Its free page
establishes four things this component encodes:

- Everything is a box; layout is the arrangement of boxes.
- `box-sizing: border-box` universally, so padding and border sit inside the width.
- Dimensions are *derived* from inner content and outer context, not prescribed.
- Never set an explicit height. `min-block-size` is a suggestion, not a prescription.

The sibling `/layouts/box/` page - which carries Every Layout's own Box CSS - is
paywalled. This component therefore implements the ideas in the kit's house style
and copies no paid CSS. Two further rules come from the kit's own accessibility
posture rather than from that page: `color` and `background-color` are always set
together so an inverted variant can never leave unreadable text, and the box carries
a border that survives forced-colours mode so its edge does not vanish when a user's
own palette replaces the background.

**Two readings of "base for other layout components", named because they lead to
different work.** (a) Later layouts *inherit* the box - each one copies its CSS and
adds arrangement. (b) Later layouts *compose with* the box - the box owns the
enclosure, arrangement layouts own the spacing between children, and the two nest.
This plan takes **(b)**. It matches Every Layout's own model, it keeps each
component's contract table honest about what that component owns, and it avoids a
copy-paste inheritance chain that the kit has no mechanism to keep in sync.

Risk: the forced-colours border claim is a browser behaviour, not a design choice.
Writing it into the reference before measuring it would breach the kit's rule that
no unmeasured number or claim reaches a reference. Step 5 measures it first and the
reference is reconciled to what the browser actually did.

## Decisions

- **Composition, not inheritance.** Box owns padding, border, radius and the
  colour pair. It declares no arrangement, so a future Stack or Cluster nests inside
  or wraps around it and never re-declares those values.
- **Single-pass steps, not a RED/GREEN/VERIFY phase shape.** `CLAUDE.md` names
  `/new-component` as this repo's running order and it puts the reference before the
  tests. Most of the gate (`tests/objective.spec.ts`) asserts the artifact's *shape*
  - files exist, sections are ordered, demo matches reference byte for byte - so a
  RED phase over it asserts the edit rather than the behaviour. The genuinely
  behavioural tests are the browser ones, and they cannot fail for the right reason
  before the demo file exists; they would fail on a missing file instead.
- **One variant, `invert`.** The plain box is the base rule and writes no attribute
  at all, so naming `plain` as a variant value would imply a `data-variant="plain"`
  selector that does nothing. One variant is the smallest set that proves the
  colour-pairing rule pays off. More sizes or tones are out of scope until someone
  adds a contract row.
- **No `@media (forced-colors: active)` block.** Step 5 measured it: the border
  resolves to the forced text colour identically with the block and without it,
  because `border-color` is one of the properties a forced palette overrides. What
  decides the outcome is whether a border was declared at all, so the block was
  dropped and the assertion checks border width and style, not only colour.
- **Renamed to `ui-box` after main moved.** Eight commits landed on `main` during
  this session: every skill became `ui-<slug>`, `SKILL.md` gained a required
  `## Clarify when needed` section, and a typed React projection file became a
  required fourth reference, with assertions for all three. The component was built
  as `box` against the earlier contract, then rebased and adapted. The DOM contract
  is untouched because the slug stays unprefixed: `auk-box` and `--auk-box-*` are the
  same, and only the skill identity, filenames and one demo marker changed.
- **No `data-part`, no slots.** The whole element is the content region, so the
  box has no named internal parts and its Slots row reads `none`.
- **No version bump.** `docs/evaluations.md` records what was tested against
  `0.2.0`, and this plan deliberately does not run the evaluation sweep - it costs
  real model calls across three models. Shipping a new version whose evaluation
  record is incomplete would be worse than leaving the version alone. The bump and
  the sweep go together, in Next Steps.
- **Dated records stay dated.** `docs/vendor-support.md` says "All four skills
  register" as an observation from a recorded run. It is a log entry, not a roster,
  and is not rewritten.

## Files

- skills/ui-box/SKILL.md (new) — orientation: when a box is the answer and when it is not
- skills/ui-box/references/ui-box.md (new) — the component: contract, structure, CSS, accessibility
- skills/ui-box/references/demo.html (new) — self-contained page, both variants plus a nested example
- skills/ui-box/references/react-demo.tsx (new) — typed React projection over the same DOM contract, required since the ui- rename
- tests/e2e/ui-box.spec.ts (new) — one test per claimed WCAG criterion, plus forced-colours and axe
- evals/ui-box.json (new) — obvious, oblique and adjacent scenarios
- README.md (modified) — the component roster, which currently claims four

## Steps

1. [x] Write `skills/ui-box/SKILL.md`. Frontmatter carries `name: ui-box`, a third-person
   `description` with no first- or second-person pronoun, and `license: MIT`. Body
   under 60 lines with no component code fence: `## When to use`, `## When not to
   use`, `## Build it`, `## Non-negotiable`. The description leads with the
   disambiguating words - box, container, wrapper, panel, card, padded region -
   because a trailing clause is truncated under a context budget. `## When not to
   use` names the arrangement cases the box does not cover, so it is not reached for
   as a spacing tool. Why: this file is what an agent loads on trigger, and the
   description is the only thing that decides whether it triggers at all. Verify:
   `npx vitest run tests/objective.spec.ts` reports the frontmatter and 60-line
   assertions passing for `skills/ui-box`.

2. [x] Write `skills/ui-box/references/ui-box.md`. H1 `# Box reference`, then `## Contract`
   and the five sections in order: Structure, Styles, Behaviour, Accessibility,
   Demo. Contract rows in order: Element `` `<div>` root ``; Role `generic root`;
   Props `data-variant` — `"invert"` — `absent`, since the plain box writes no
   attribute; Slots `none`; Variants `` `invert` ``; Behaviour `none`; WCAG
   `1.4.3 Contrast (Minimum); 1.4.4 Resize Text; 1.4.12 Text Spacing`. The Styles
   section opens with the qualifier line (parts none, variants `invert`, states none)
   and holds one `css` fence. Structural values stay literal - `box-sizing:
   border-box`, `display: block`, `border-style` - while every themeable value is
   `var(--auk-box-*, <literal>)` with no nested `var()`: padding, border width,
   border colour, radius, colour, background, `min-block-size`, and the three
   `--auk-box-invert-*` properties. Behaviour reads `No JavaScript.` Prose wraps at
   88 columns. Why: this file is the component; everything downstream is generated
   from it or asserted against it. Verify: `npx vitest run tests/objective.spec.ts`
   passes the contract-table, section-order, qualifier-line and
   every-var-has-a-literal-fallback assertions for `box`.

3. [x] Create `skills/ui-box/references/demo.html` by copying `skills/alert/references/demo.html`
   - the CSS-only shape - and **rename the marker line** to `Generated from ui-box.md by
   scripts/build-demos.mjs. Edit the reference, not this.` before anything else. A
   copied marker still naming `alert` throws inside the loop over every component and
   aborts the build for all of them. Replace the page chrome and markup: a plain box,
   an invert box, and a nested box showing composition, each holding a real paragraph
   so contrast has something to measure. Drop the `<script>` entirely - the box has no
   behaviour and the browser suite drives it from the test side. Keep `auk-box` out of
   the hand-written chrome, and use no `src=`, `url(`, `@import` or `<link href=`. Then
   run `node scripts/build-demos.mjs`. Why: the demo is the template, and the browser
   suite tests the demo rather than the reference, so the two copies must match byte
   for byte. Verify: `node scripts/build-demos.mjs --check` exits zero and
   `npx vitest run tests/objective.spec.ts` passes the demo-matches-reference and
   chrome-claims-no-selectors assertions.

4. [x] Write `tests/e2e/ui-box.spec.ts` importing `demoUrl` from `./support.js`. One test
   per claimed criterion, each title starting with the criterion string and a space:
   `1.4.3 Contrast (Minimum)` runs axe-core's `color-contrast` rule over the demo and
   expects no violations; `1.4.4 Resize Text` sets the root font size to 200 percent
   and asserts each box grew and `scrollHeight` did not exceed `clientHeight`;
   `1.4.12 Text Spacing` applies the criterion's four overrides and asserts the same
   no-clipping condition. Add a non-criterion test that emulates forced colours via
   `page.emulateMedia({ forcedColors: 'active' })` and reads the computed border
   colour. Why: `tests/objective.spec.ts` treats a WCAG row with no matching test
   title as a defect, and an unmeasured claim in a reference is one too. Verify:
   `npx playwright test tests/e2e/ui-box.spec.ts` runs; record which assertions pass and
   which fail, without changing them to fit.

5. [x] Read step 4's forced-colours measurement and reconcile the reference to it. If
   the transparent border already resolves to a visible system colour, say exactly
   that in the Accessibility section. If it does not, add an explicit
   `@media (forced-colors: active)` block to the reference CSS setting
   `border-color: CanvasText` - a system colour, which the settled questions exempt
   from the `var()` rule precisely so a theme cannot defeat a user's own contrast
   setting - then re-run `node scripts/build-demos.mjs` and re-run the test. Why: the
   kit forbids writing a claim into a reference that a test does not back, and which
   branch is true is a browser behaviour rather than a design choice. Verify: the
   forced-colours test passes against the shipped CSS, and the Accessibility prose
   describes the mechanism that actually ran.

6. [x] Write `evals/ui-box.json` with `"skill": "ui-box"` and three scenarios. **obvious**
   uses the component's own vocabulary and asks for a padded, bordered container.
   **oblique** avoids that vocabulary entirely - something along the lines of a
   settings panel that must stay readable when a user forces their own colours, whose
   baseline failure is a background with no paired foreground. **adjacent** must not
   trigger the skill: a request that is really about arranging children in a row or a
   column, where the honest answer is that this kit has no arrangement layout yet.
   Each triggering scenario carries a `baselineFailure` and a `detect` map of regexes.
   Why: `tests/objective.spec.ts` requires at least three scenarios whose kinds
   include all three, and an adjacent scenario is what keeps the description from
   over-triggering. Verify: `npx vitest run tests/objective.spec.ts` passes the
   three-evaluation-scenarios assertion for `box`.

7. [x] Update `README.md`. The Status section claims "Four components ship" and names
   the four; make it five, add **box**, and extend the following sentence so the
   roster still explains what each component stresses - box stresses a purely
   presentational primitive. Leave the version string alone. Why: the count is a
   factual claim that this change falsifies. Verify: `grep -n 'components ship' README.md`
   shows five and the sentence names box.

8. [x] Run `npm run check`, then `bash scripts/check.sh --prove`. Fix whatever is named
   by editing the offending file, never by weakening a gate or hand-editing a
   generated region. Then walk `docs/component-spec.md` section 8 and report each
   item's status honestly, including the evaluation baseline, which this plan does
   not record. Why: the six gates are the only local proof the component is
   well-formed, and `--prove` is what confirms gates one to four can still fail.
   Verify: both commands exit zero, and the section 8 checklist is reported item by
   item with the baseline item explicitly open.

## Tests

Tier 1 - This plan changes application code

- Objective: a box built from the reference renders with padding, a border and a
  paired foreground and background, and survives text resize, text-spacing overrides
  and forced colours without clipping or losing its edge. File: `tests/e2e/ui-box.spec.ts`;
  Type: smoke; Asserts: the demo page renders both variants, axe-core reports no
  contrast violation, both boxes grow rather than clip under the 1.4.4 and 1.4.12
  overrides, and the border is visible under emulated forced colours; Run:
  `npx playwright test tests/e2e/ui-box.spec.ts`
- Integration: the whole-kit rules applied to the new component - frontmatter,
  60-line body, contract table, section order, qualifier line, custom-property
  grammar, demo-matches-reference, WCAG-row-has-a-test, three eval scenarios. File:
  `tests/objective.spec.ts`; Targets: the data-driven `describe.each` over `skills/`;
  Key cases: every assertion in that file, now also parameterised over `box`. No edit
  to this file is needed or allowed. Run: `npx vitest run tests/objective.spec.ts`
- E2E: the six gates end to end, plus the failure proofs for gates one to four.
  File: `scripts/check.sh`; Type: smoke; Asserts: unit, portability lint, external
  resource guard, demo freshness, plugin manifest validation and the browser suite
  all pass with `box` present; Run: `npm run check` and `bash scripts/check.sh --prove`

## Acceptance Criteria

- [x] `skills/ui-box/` holds `SKILL.md`, `references/ui-box.md`, `references/demo.html` and `references/react-demo.tsx`, and no other file.
- [x] The reference's contract table carries all seven rows in order, and its WCAG row names 1.4.3, 1.4.4 and 1.4.12.
- [x] `tests/e2e/ui-box.spec.ts` holds a test whose title starts with each of those three criteria, and each one asserts a measured value rather than the presence of a rule.
- [x] Every themeable value in the reference CSS is `var(--auk-box-*, <literal>)` with no nested `var()`, and the demo defines no custom property anywhere.
- [x] `skills/ui-box/references/demo.html` opens from `file://` with no server, no build step and no network request, and its `<style>` ends with the reference CSS byte for byte.
- [x] The forced-colours behaviour written into the reference is the one the browser actually produced in step 5, not an estimate.
- [x] `evals/ui-box.json` holds at least three scenarios whose kinds include `obvious`, `oblique` and `adjacent`.
- [x] `README.md` names five components including box.
- [x] `npm run check` exits zero.
- [x] `bash scripts/check.sh --prove` exits zero.
- [x] The `docs/component-spec.md` section 8 checklist is reported item by item, with the evaluation-baseline item explicitly left open.

## Verification

Open `skills/ui-box/references/demo.html` directly from disk in a real browser, not
through a server. Three boxes render: a plain one, an inverted one, and a nested
pair. Each has visible padding on all four sides and text that reads cleanly against
its own background. Nothing is loaded from the network.

With the page open, raise the browser's own text size to 200 percent. Every box grows
taller and none of the text is cut off or overlapped - that is intrinsic sizing doing
its job, and it is the whole reason the component sets no height. Switch the operating
system into a forced-colours or high-contrast mode and reload. The boxes keep a
visible edge rather than dissolving into the page background.

Then run `npm run check` from the repository root and confirm all six gates pass, and
`bash scripts/check.sh --prove` to confirm the first four can still fail. Finally,
read `skills/ui-box/SKILL.md` as an agent would and check that its description would
plausibly be reached by a request phrased as "put this in a padded container" without
also being reached by "space these items evenly".

## Next Steps

- Run the evaluation sweep for box and record its baseline
  Costs real model calls across three models, so it is deliberately outside this plan. It is also the gate on releasing a new version, since `docs/evaluations.md` pins its record to a version number.
  ```text
  Run the evaluation sweep for the box component skill in this repository. Use scripts/eval.sh to run the baseline, isolated and crowded runs for evals/ui-box.json across Haiku, Sonnet and Opus, then write the results into docs/evaluations.md following the existing table format. Do not change evals/ui-box.json to make a scenario pass - a scenario a model already handles unaided is too easy and should be rewritten instead, which is a separate decision to bring back for approval.
  ```

- Bump the plugin version to 0.3.0 once box has a recorded baseline
  Four files carry the version and `tests/integration/manifests.spec.ts` asserts they agree.
  ```text
  Bump the agent-ui-kit plugin version from 0.2.0 to 0.3.0. The version appears in package.json, .claude-plugin/plugin.json, .codex-plugin/plugin.json and the Status section of README.md, and tests/integration/manifests.spec.ts asserts the first three agree with each other. Do this only after the box component has a recorded evaluation baseline in docs/evaluations.md. Run npm run check afterwards.
  ```

- Wish list: an arrangement layout that composes with box
  The adjacent evaluation scenario in this plan asserts that box does *not* answer "space these items evenly". That gap is real and currently has no component.
  ```text
  Add a stack component skill to this repository - a layout that spaces its direct children evenly along one axis and owns nothing about padding, borders or colour, which the box component already owns. Read docs/component-spec.md first; it is the authoring contract and wins over everything else. Follow the running order in the /new-component skill. The composition story with box must be explicit in both references: they nest, and neither re-declares what the other owns.
  ```

## Resources

- [Every Layout - Boxes rudiment](https://every-layout.dev/rudiments/boxes/) - the reference the request names. Free to read, and the source of the border-box, intrinsic-sizing and no-explicit-height rules this component encodes.
- [Every Layout - The Box layout](https://every-layout.dev/layouts/box/) - the sibling page carrying Every Layout's own Box CSS. Paywalled, and therefore deliberately not used; this component implements the ideas in the kit's house style instead.
- `docs/component-spec.md` - the authoring contract. Section 0's settled-questions table answers nearly every authoring decision this plan would otherwise have to re-litigate.
- `.claude/skills/new-component/SKILL.md` - the repository's own running order for adding a component, including the marker-rename trap in step 5 that aborts the build for every component rather than just the new one.
