---
status: todo
type: feature
created: 2026-09-04
modified: 2026-09-04
repo-name: agent-ui-skills
workflow: never
artifact-url: https://claude.ai/code/artifact/40ddb8f5-3d38-4923-b9c8-c49a0060b12f
issue: https://github.com/shawn-sandy/agent-ui-skills/issues/27
prototype: docs/prototypes/apply-component-style-overrides.html
proto-model: {"entity":"Override","fields":[{"name":"scope","type":"string"},{"name":"property","type":"string"},{"name":"value","type":"string"}],"action":"Apply","successSignal":"overrides that change the button's computed style"}
glance: Users can already restyle any auk component with a custom property or a plain CSS rule, but nothing tells them the property names, the three places to set them, or that a plain rule wins, so agents guess and users read the CSS. Done means a user's plain rule wins no matter where it loads (proven by a browser test that fails without the cascade layer), every settable property is listed on one generated page the test suite keeps honest, and the six references plus a theming guide say exactly where an override goes.
---

# Plan: Make restyling an auk component a one-line job, whichever door a user picks

## Objective

Give plugin users three reliable doors for overriding component styles: set a `--auk-*` custom property at any scope, write a plain CSS rule that always wins, or run ui-theme for the whole brand. Ship the cascade layer that makes the second door reliable, a generated catalog of every property for the first, and the docs that name all three.

## Context

Every component under `skills/` writes each visual value as `var(--auk-<component>-<property>, <literal>)`. A custom property is a named CSS variable, and the literal after the comma is the fallback the browser uses when nobody sets it. Because custom properties inherit down the page, a user can set one on `:root` for every instance, on an ancestor for one region, or on the element itself for one instance. All three work today with no change. The `ui-theme` workflow skill automates the site-wide case for the 69 colour, radius and font-family properties and deliberately leaves the 68 size, spacing and motion properties alone, because `tests/e2e/` measures those.

Three gaps make that harder than it should be. Nothing tells a user or a building agent where to set a property: each SKILL.md carries one clause, "Override `--auk-button-*` to theme it", with no place and no example. Nothing lists the 137 property names outside the six CSS blocks, so a user reads `var()` calls out of code to learn what is settable. And a plain CSS rule, which is the door for anything that is not a custom property such as `border-style`, only wins when it loads after the component and matches the component's specificity, the score the browser uses to pick between two rules that match the same element. A rule in a stylesheet that happens to load first loses silently.

A cascade layer closes the third gap outright. `@layer auk { ... }` puts the shipped rules in a named bucket, and the CSS cascade ranks every unlayered normal declaration above every layered one, whatever its order or specificity. That cuts both ways, and the prototype measured the sharp edge: a host page's own unlayered reset, `* { padding: 0 }`, outranks the layered button too, and the button's padding-inline drops from 16px to 0px. A `button { border: 0; background: none }` reset would do worse. So the layer ships with a documented condition rather than a hidden one. A project's reset and base rules must sit in a layer declared before `auk`, for example `@layer reset, auk;` ahead of everything else, and `auk` must come before the project's utility or override layers so those still win. A layer is ordered by its first declaration, so a project that already declares layer order adds `auk` between its base and utility layers, not first. A project with no layers at all wraps its reset in one, which is one line. A browser released before March 2022 ignores the whole block and leaves the component unstyled; MDN lists the feature as Baseline widely available from that date. Keeping the layer under this condition was decided on 2026-09-04, after the prototype surfaced the hazard and dropping the layer was offered and declined.

Two repository facts shape where the docs go. Installers copy skill directories, not `docs/`, so guidance an agent needs while building has to live inside the skill. The Agent Skills specification says agents load `SKILL.md` when a skill triggers and files under `references/` only when needed, and it asks that references stay one level deep from `SKILL.md`. Every SKILL.md already sends the agent to its reference as step one, so the where-to-set-it prose goes into each reference's Styles section at zero extra load and with no extra file. The human-facing guide and the property catalog live under `docs/`.

One hazard turned up during exploration. The dialog and popover demos carry a trimmed, unlayered copy of the button CSS in their hand-written page chrome, including a `.auk-button:focus-visible` rule. Once the dialog reference is layered, that unlayered chrome rule outranks the reference's own `.auk-dialog [data-part="footer"] .auk-button:focus-visible` rule. The values happen to match today, so nothing visibly changes, but the demo would stop modelling a real page where all auk CSS shares one layer. The plan wraps those chrome copies in the same layer. The demos' other chrome rules were checked against the same reset hazard: they style `body`, headings, `p`, `label`, `a` and plain `button`, and the only reference that styles a bare element is the dialog's header `h2`, which the dialog demo's chrome leaves alone. So no demo chrome rule collides with a layered component rule, and the `.auk-button` copies are the only chrome edit needed.

The `--auk-*` naming shape, the no-nested-`var()` rule and the ban on shared `--auk-color-*` tokens inside `skills/` are locked decisions recorded in `docs/proposals/add-ui-theme-skill.md`. This plan does not reopen them.

## Decisions

- Structured as red-green-verify: the browser test, the layer assertion and the catalog drift test are written and seen to fail before any reference or script changes, so the layer's effect is proven rather than assumed.
- One shared layer name, `auk`, across all six components. Six `@layer auk { }` blocks merge into one layer, which is what lets a consumer treat all auk CSS as a single bucket.
- The layer ships despite the reset hazard the prototype measured on 2026-09-04. Dropping it was offered and declined. The mitigation, a project reset in a layer declared before `auk`, is written into every reference's Styles prose and into docs/theming.md, and the Verification walk measures it.
- The CSS block body is indented two spaces inside the wrapper. The diff is wide but mechanical, the demos are regenerated by `build-demos.mjs`, and no test reads the raw CSS text.
- SKILL.md files are not edited. Each already tells the agent to read the reference as step one; the where-to-set-it prose lives in the reference's Styles section, which keeps every SKILL.md body short and keeps references one level deep as the specification asks.
- The property catalog is a fully generated file, `docs/properties.md`, kept honest by a vitest assertion that the file equals the generator's output. That mirrors how `docs/artifacts.md` is checked and adds no new gate to `check.sh`.
- One parser, `scripts/auk-properties.mjs`, feeds both the catalog generator and `tests/unit/ui-theme-mapping.spec.ts`, so the two can never disagree about which properties exist.
- The new layer assertion in `tests/objective.spec.ts` gets no `--prove` fixture. None of the objective assertions has one today; only the frontmatter validator and the workflow partition are proven through fixtures. A fixture is listed under Next Steps as a wish-list item.
- No SHIP phase. The request was to plan the work, not to land it; committing and opening a pull request wait for an explicit ask.
- `workflow: never`. RED must finish before GREEN starts, and the six reference edits are a short mechanical pass that a fan-out across subagents would only complicate.

## Files

- tests/e2e/overrides.spec.ts (new) — prepends an unlayered rule before each demo's styles and asserts it wins
- tests/objective.spec.ts (modified) — asserts every reference css block is wrapped in `@layer auk { }`
- tests/integration/properties-doc.spec.ts (new) — asserts docs/properties.md equals the generator's output
- tests/unit/auk-properties.spec.ts (new) — the parser's nested-parenthesis fallback and duplicate-fallback cases
- tests/unit/ui-theme-mapping.spec.ts (modified) — reads shipped properties through the shared parser
- scripts/auk-properties.mjs (new) — shared parser for every `var(--auk-*, fallback)` in the component references
- scripts/build-properties.mjs (new) — renders docs/properties.md from the parser
- docs/properties.md (generated) — one table per component: property, fallback, brand or measured
- docs/theming.md (new) — the three doors, the layer-order note, dark mode, what not to override
- docs/component-spec.md (modified) — the layer rule in Styles, a settled-question row, a checklist tick
- skills/ui-alert/references/ui-alert.md (modified) — css block wrapped in `@layer auk`; Styles prose on where to set properties
- skills/ui-box/references/ui-box.md (modified) — same wrap and prose
- skills/ui-button/references/ui-button.md (modified) — same wrap and prose
- skills/ui-dialog/references/ui-dialog.md (modified) — same wrap and prose
- skills/ui-popover/references/ui-popover.md (modified) — same wrap and prose
- skills/ui-tabs/references/ui-tabs.md (modified) — same wrap and prose
- skills/ui-alert/references/demo.html (generated) — regenerated by build-demos.mjs
- skills/ui-box/references/demo.html (generated) — regenerated by build-demos.mjs
- skills/ui-button/references/demo.html (generated) — regenerated by build-demos.mjs
- skills/ui-dialog/references/demo.html (modified) — regenerated, plus the chrome's button copy wrapped in `@layer auk`
- skills/ui-popover/references/demo.html (modified) — regenerated, plus the chrome's button copy wrapped in `@layer auk`
- skills/ui-tabs/references/demo.html (generated) — regenerated by build-demos.mjs
- README.md (modified) — Documentation list gains docs/theming.md and docs/properties.md
- CLAUDE.md (modified) — the generator command, and a note that docs/properties.md is generated

## Steps

### Phase: RED

1. Write tests/e2e/overrides.spec.ts: for each of the six components, open the demo with `demoUrl()` from tests/e2e/support.ts, prepend a `<style>` element to `<head>` holding an unlayered `.auk-<slug> { background-color: rgb(1, 2, 3) }` rule (use `color` for tabs, whose root declares no background) so the rule sits before the component styles, and assert the root element's computed value is `rgb(1, 2, 3)`. Why: this is the one behaviour the cascade layer buys, a user rule winning regardless of load order, and it has to be seen failing before the layer exists. Verify: `npx playwright test tests/e2e/overrides.spec.ts` exits non-zero on all six with the computed value equal to the shipped fallback, for example `rgb(26, 86, 219)` on the button; paste the output.
2. Add a component assertion to tests/objective.spec.ts that the reference css block's first non-blank line is `@layer auk {` and its last non-blank line is `}`. Why: the six blocks must agree on one layer name, and an agent-facing contract has to be enforced by a gate rather than by convention. Verify: `npx vitest run tests/objective.spec.ts` exits non-zero and the new assertion names all six components; paste the output.
3. Write tests/integration/properties-doc.spec.ts with two cases: the first asserts docs/properties.md exists, the second dynamically imports `render` from scripts/build-properties.mjs and asserts the file's content equals its return value byte for byte. Why: a generated file that nothing checks goes stale on the first new property, and the dynamic import keeps the first case failing on the missing file rather than on a missing module. Verify: `npx vitest run tests/integration/properties-doc.spec.ts` exits non-zero with the existence assertion failing first; paste the output.

### Phase: GREEN

4. Wrap the fenced css block of each of the six references, skills/ui-alert/references/ui-alert.md, ui-box, ui-button, ui-dialog, ui-popover and ui-tabs, in `@layer auk {` and `}` with the body indented two spaces. Why: the layer is what makes any unlayered user rule win regardless of load order or specificity. Verify: the new assertion in `npx vitest run tests/objective.spec.ts` passes for all six, and the existing `var()` and nested-`var()` assertions still pass.
5. Add one short paragraph to the Styles prose of each of the six references, above the fenced block and wrapped at 88 columns: the block declares the `auk` cascade layer, so a rule written outside any layer wins over it whatever its order or specificity; a project's reset and base rules must therefore sit in a layer declared before `auk`, for example `@layer reset, auk;`, and `auk` goes before the project's utility layers, because an unlayered reset outranks the component and strips its padding; a `--auk-<slug>-*` property is set on `:root` for every instance, on an ancestor for one region, or on the element for one instance. Why: the reference is the only file the building agent is guaranteed to read, installers copy skill directories and not docs, and the specification keeps references one level deep. Verify: `grep -l '@layer' skills/ui-*/references/ui-*.md | wc -l` prints 6 and `node scripts/lint-portability.mjs` exits 0.
6. Run `node scripts/build-demos.mjs` to regenerate the six demo.html files from the wrapped references. Why: each demo's `<style>` must end with its reference css byte for byte, and the generator is the only permitted way to keep the two copies in step. Verify: `node scripts/build-demos.mjs --check` exits 0 and `git status --short skills/` lists six demo.html files.
7. In skills/ui-dialog/references/demo.html and skills/ui-popover/references/demo.html, wrap the hand-written `.auk-button` rules in the page chrome in `@layer auk { }`. Why: an unlayered copy of the button CSS would now outrank the dialog reference's own footer-button focus rule, and the demo must keep modelling a page where all auk CSS shares one layer. Verify: `npx playwright test tests/e2e/ui-dialog.spec.ts tests/e2e/ui-popover.spec.ts` exits 0 and the page-chrome assertion in `npx vitest run tests/objective.spec.ts` still passes.
8. Update docs/component-spec.md: add to Styles rule 2 that the fenced css block is wrapped in `@layer auk { }`, add a settled-question row explaining why, and add a checklist item. Why: the spec is the authoring contract and wins over every other file, so a rule the gate enforces has to be written there. Verify: `grep -c '@layer auk' docs/component-spec.md` prints at least 3.
9. Create scripts/auk-properties.mjs exporting `parseVars(css)` and `readProperties(skillsDir)`: the reader walks component skills with `skillKind` from scripts/skill-kind.mjs, takes the fenced css block from each reference, and the parser scans every `var(--auk-…, fallback)` with a balanced-parenthesis walk so a fallback such as `rgba(17, 24, 39, 0.6)` survives whole, returning `{ property, fallback, component, brand }` per unique name with the same brand test the mapping spec uses, and throwing when one name carries two different fallbacks; write tests/unit/auk-properties.spec.ts for the nested-parenthesis and duplicate-fallback cases, and switch tests/unit/ui-theme-mapping.spec.ts to build its `shipped` set from `readProperties`. Why: the catalog and the mapping test must agree on the property list, a plain regex cannot parse a nested-parenthesis fallback, and a parser is non-trivial logic that leaves one runnable check behind. Verify: `npx vitest run tests/unit/auk-properties.spec.ts tests/unit/ui-theme-mapping.spec.ts` exits 0 with the mapping spec's count assertions unchanged.
10. Create scripts/build-properties.mjs exporting `render()` and, when run directly, writing docs/properties.md: a one-line intro pointing at docs/theming.md, then one section per component with a table of Property, Fallback and Kind, where Kind is brand or measured. Run it once. Why: one page answers "what can I set" without reading six CSS blocks, and a generated file is the only kind that cannot drift from the references. Verify: `npx vitest run tests/integration/properties-doc.spec.ts` exits 0 and `grep -c '^| .--auk-' docs/properties.md` prints 137.
11. Write docs/theming.md: the three doors as a table with one small example each, the reset condition with its one-line recipe `@layer reset, auk, utilities;` and the measured consequence of skipping it (padding-inline 16px to 0px), where `auk` slots into a project that already orders layers, dark mode as "redeclare under the project's own dark selector or let ui-theme mirror it", a short list of what not to override because tests/e2e/ measures it (focus ring width and offset, minimum target size, reduced-motion timing), and links to docs/properties.md and skills/ui-theme. Why: a human reading the repository needs the full picture in one place, and this is the page README points at. Verify: `grep -q '@layer auk' docs/theming.md && grep -q 'properties.md' docs/theming.md && grep -q 'ui-theme' docs/theming.md` exits 0.
12. Add a Documentation bullet to README.md for docs/theming.md and docs/properties.md, and add `node scripts/build-properties.mjs` to the CLAUDE.md commands block with one sentence saying docs/properties.md is generated and never hand-edited. Why: the entry points have to be discoverable from the two files a newcomer reads first. Verify: `grep -q 'theming.md' README.md && grep -q 'build-properties' CLAUDE.md` exits 0; if any test still fails after 8 GREEN iterations, stop and report the failing assertion, the last diff tried and what was ruled out, and do not report success.

### Phase: VERIFY

13. Run `npm run check`. Why: it is the single local gate and the same six gates continuous integration runs. Verify: the run ends with `check.sh: all gates passed` and the Playwright summary shows tests/e2e/overrides.spec.ts passing six times.
14. Run `bash scripts/check.sh --prove`. Why: the demo generator's input and the objective suite both changed, and the proof run shows the broken fixtures can still fail each gate. Verify: every proof line prints `ok` and the run ends with `check.sh: all gates passed`.
15. Open each regenerated demo over `file://` in the browser pane and, with `mcp__Claude_Browser__javascript_tool`, read the root element's computed `background-color` (`color` for tabs) and then read the console with `mcp__Claude_Browser__read_console_messages`. Why: the layer wrapper touches every component's CSS, and a live pass confirms the shipped fallbacks still apply unchanged with no console errors. Verify: each computed value equals the reference's literal fallback, for example `rgb(26, 86, 219)` on the button, and the console holds zero errors; report the six values.

## Tests

Tier 1 — This plan changes application code
- Objective: an unlayered user rule wins over every component's shipped styles regardless of load order. File: tests/e2e/overrides.spec.ts; Type: smoke; Asserts: a `.auk-<slug>` rule prepended before the demo styles sets the root's computed colour on all six demos; Run: npx playwright test tests/e2e/overrides.spec.ts
- Unit: every reference css block is wrapped in the auk layer. File: tests/objective.spec.ts; Targets: the fenced css block of each component reference; Key cases: first line `@layer auk {`, last line `}`, the existing var() and nested-var() rules still hold inside the wrapper
- Unit: the shared parser reads fallbacks whole and rejects contradictions. File: tests/unit/auk-properties.spec.ts; Targets: parseVars in scripts/auk-properties.mjs; Key cases: a `rgba(…)` fallback returned intact, a shorthand fallback with a nested function returned intact, one name with two fallbacks throws
- Unit: the mapping table still matches the references through the shared parser. File: tests/unit/ui-theme-mapping.spec.ts; Targets: readProperties in scripts/auk-properties.mjs; Key cases: 69 brand-bearing and 68 measured properties, every table property exists in a reference
- Integration: the catalog cannot go stale. File: tests/integration/properties-doc.spec.ts; Targets: render in scripts/build-properties.mjs against docs/properties.md; Key cases: file exists, content equals render() byte for byte
- E2E: the dialog and popover suites still pass with the chrome's button copy layered. File: tests/e2e/ui-dialog.spec.ts, tests/e2e/ui-popover.spec.ts; Targets: footer button and close control focus outline; Key cases: focus outline width still 3px, axe reports zero violations

## Acceptance Criteria

- [ ] `npx playwright test tests/e2e/overrides.spec.ts` fails on the unlayered references and passes once they are wrapped, with the failure output recorded in the session notes or pull request.
- [ ] Every `skills/ui-*/references/ui-*.md` css block opens with `@layer auk {` and `npx vitest run tests/objective.spec.ts` enforces it.
- [ ] `node scripts/build-demos.mjs --check` exits 0 and each demo's `<style>` ends with its reference css byte for byte.
- [ ] docs/properties.md lists every `--auk-*` property with its fallback and kind, and `npx vitest run tests/integration/properties-doc.spec.ts` fails when the file is edited by hand.
- [ ] `npx vitest run tests/unit/ui-theme-mapping.spec.ts` passes with its counts unchanged while reading through scripts/auk-properties.mjs.
- [ ] Each of the six references' Styles prose names the layer, the reset-before-`auk` condition, and the three places to set a property, wrapped at 88 columns.
- [ ] docs/theming.md exists and README.md links both it and docs/properties.md.
- [ ] No SKILL.md changes, and every SKILL.md body stays under 60 lines.
- [ ] `npm run check` and `bash scripts/check.sh --prove` both exit 0.

## Verification

Walk it as a plugin user would. Copy the button reference's css block into a scratch page and, above it in the same `<style>`, write `.auk-button { border-style: dashed; background-color: rebeccapurple; }` with no layer around it. Open the page over `file://` and read the button's computed style: `border-style` is `dashed` and `background-color` is `rgb(102, 51, 153)` even though the rule loads first. Remove the `@layer auk {` line and its closing brace from the pasted block and reload: the component's own values return, which is exactly the behaviour the layer removes. Put the wrapper back and add an unlayered `* { padding: 0 }` above everything: the button's computed padding-inline drops to 0px, the hazard the prototype at docs/prototypes/apply-component-style-overrides.html measures. Declare `@layer reset, auk;` as the first line and wrap that reset in `@layer reset { }`: padding-inline returns to 16px, which is the condition the docs state.

Then run `npm run check` from the repository root. Expected: the run ends with `check.sh: all gates passed`, with tests/e2e/overrides.spec.ts, tests/integration/properties-doc.spec.ts and the layer assertion in tests/objective.spec.ts all reported as passed, and axe clean on all six regenerated demos. Finally open docs/properties.md and confirm that a property picked at random from any reference, for example `--auk-dialog-backdrop-bg`, appears with the literal fallback the reference carries, `rgba(17, 24, 39, 0.6)`.

## Next Steps

- Refresh the project overview artifact after the merge
  CLAUDE.md asks for a refresh whenever a merge changes a skill, and this change touches all six.
  ```text
  In shawn-sandy/agent-ui-skills, the pull request that added the auk cascade layer, docs/properties.md and docs/theming.md has merged. Follow the "Project overview artifact" section of CLAUDE.md: read the artifact at https://claude.ai/code/artifact/3474b8f0-f906-4f3a-95f7-45c9cf539de3 with the Artifact tool, update the meta strip (version, skill count, main SHA, CI state, open issue count, date), re-source each section, add a row to the page-history table, and republish to the same URL. Confirm by re-reading the artifact and checking that the new history row is present.
  ```
- Add a --prove fixture for the layer assertion
  Wish list. The objective suite has no failure-proof fixtures today; if that changes, an unlayered reference under tests/fixtures/ would show the new assertion can fail.
  ```text
  In shawn-sandy/agent-ui-skills, add tests/fixtures/unlayered-css/ holding a minimal component skill whose reference css block is not wrapped in @layer auk, and extend the --prove section of scripts/check.sh with an arm that runs the layer assertion against it and greps for the fixture name in the failure output. Verify with bash scripts/check.sh --prove printing an ok line for the new arm while npm run check stays green.
  ```
- Correct the load-order explanation in the ui-theme reference
  Verification step 1 in skills/ui-theme/references/ui-theme.md says a still-blue button "means the block loads before the component styles". Custom properties set on :root are read by inheritance, so load order was never the cause, and the layer makes that clearer.
  ```text
  In shawn-sandy/agent-ui-skills, edit skills/ui-theme/references/ui-theme.md, Verification step 1: replace the load-order explanation with the two real causes of a still-blue button, a misspelled token name or a block that never reached :root. Keep prose wrapped at 88 columns. Verify with npm test passing and node scripts/lint-portability.mjs exiting 0.
  ```

## Resources

- Agent Skills specification, Progressive disclosure section — https://agentskills.io/specification — confirms SKILL.md loads on trigger and references/ on demand, and asks that references stay one level deep
- Claude Code skills documentation — https://code.claude.com/docs/en/skills — supporting files load only when needed; the first 5,000 tokens of an invoked skill survive context compaction
- ChatGPT and Codex skills documentation — https://learn.chatgpt.com/docs/build-skills — name and description at startup within two percent of context, the full SKILL.md on selection
- MDN, @layer — https://developer.mozilla.org/en-US/docs/Web/CSS/@layer — unlayered normal declarations beat layered ones; layer order is fixed by first declaration; Baseline widely available since March 2022
- docs/vendor-support.md — the recorded Codex run wrote 26 var(--auk-button-*) declarations that exist only in the reference, which proves on-demand reading of references/
- docs/proposals/add-ui-theme-skill.md — the locked decisions on component-scoped properties and no shared tokens under skills/
- tests/objective.spec.ts lines 155 to 173 — the var() and no-nested-var() assertions the wrapper must keep passing, and the demo rule that rejects any --auk-*: declaration
