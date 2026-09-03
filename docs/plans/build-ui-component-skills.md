---
status: in-progress
type: feature
created: 2026-09-02
modified: 2026-09-02
repo: agent-ui-skills
workflow: never
glance: Agents keep rebuilding the same accessible components badly, and every existing kit ties you to one framework. This proves a component format that carries real working code and no vendor lock-in, and we will know it worked when four components load in both Claude Code and ChatGPT with their accessibility claims backed by a test run rather than a promise.
artifact-url: https://claude.ai/code/artifact/aabf412c-2636-4254-9a21-615215b8c4ce
---

# Plan: Build vendor-neutral UI component skills

## Objective

Ship a vendor-neutral component-skill format, proven by four components that reliably trigger across models and load correctly in both Claude Code and ChatGPT/Codex.

## Context

`agent-ui-skills` exists as structure only. The scaffold created both plugin manifests, a marketplace manifest, an empty `skills/` tree and a README. There are no components, no format specification, no tooling and no tests.

The project packages each UI component as an Agent Skill (a folder with a `SKILL.md` that agents load on demand). Each skill ships a complete, copyable reference: semantic HTML with a real accessibility contract, plain CSS driven by custom properties, and JavaScript with no dependencies. An agent reads the reference and builds the component into the user's project, in the user's stack. Nothing is installed into the consuming app.

It is deliberately seeded from `~/devbox/acss-plugins` rather than written from nothing. That repo's `style-agent` plugin holds an alpha framework-neutral component specification whose core insight is reusable: HTML structure, CSS and the accessibility contract are framework-agnostic, and only template syntax and reactivity binding are framework-specific. Its `acss-kit` plugin holds fifteen component references. Only the accessibility contracts, prop models and data-attribute variant strategy transfer from those — the TSX and SCSS templates are bound to `@fpkit/acss` and do not.

Three portability hazards found in `acss-kit` must not be repeated here. It uses `${CLAUDE_PLUGIN_ROOT}`, a Claude Code variable that Codex does not expand. It uses `disable-model-invocation` and `hint` frontmatter, which are Claude Code extensions absent from the Agent Skills open standard and rejected by a strict validator. It shells out to Python helper scripts, which a cross-vendor skill cannot assume exist.

One tooling constraint shapes the harness. `skills-ref`, the reference validator published alongside the Agent Skills standard, is labelled by its own authors as being for demonstration purposes only and not meant for production. It has no package release and installs from a git clone. It must not gate CI, so this repo owns its own frontmatter validator and treats `skills-ref` as an optional manual cross-check.

GitHub Actions is frequently billing-blocked on this account, so every check must run locally from one script. Continuous integration mirrors that script and is never the only place a check lives.

## Decisions

- One skill per component, not one skill per family — discovery quality beats startup token cost, and roughly 100 tokens of description per skill is an acceptable price for an agent picking the right component first time.
- References ship literal CSS where every themeable value is `var(--auk-name, fallback)`, not token references into a separate design file — the fallback lets a component work standalone, and the variable lets it theme cleanly.
- The upstream specification's `{colors.primary}` token references become an optional mapping layer rather than a requirement, so no design-token file needs to exist for a component to function.
- `SKILL.md` orients and points; the reference carries the code. The skill body stays under 60 lines and never contains the component itself, because the body loads whenever the skill triggers while the reference loads only when actually needed.
- Accessibility claims are asserted by axe-core and explicit keyboard tests, never stated bare — a criterion claimed in a reference with no matching assertion is a defect, not documentation.
- Version one is four components chosen to stress different parts of the format rather than to be a useful catalog: no JavaScript, a live region, heavy focus management, and keyboard navigation.
- `tabs` is deliberately absent from `acss-kit` so one component tests the greenfield path instead of the extraction path.

## Files

- package.json (new) — test runner and browser automation dependencies
- docs/component-spec.md (new) — the authoring contract for both SKILL.md and the reference
- docs/evaluations.md (new) — baseline and per-model skill-triggering results
- docs/vendor-support.md (new) — what actually happened when each vendor loaded the tree
- scripts/check.sh (new) — the single local gate: unit tests, portability lint, plugin validation, browser tests
- scripts/eval.sh (new) — prints one evaluation scenario formatted for a manual run
- evals/ (new) — twelve triggering scenarios, three per component
- skills/button/ (new) — skill, reference and standalone demo page
- skills/alert/ (new) — skill, reference and standalone demo page
- skills/dialog/ (new) — skill, reference, focus-management module and demo page
- skills/tabs/ (new) — skill, reference, roving-tabindex module and demo page
- tests/objective.spec.ts (new) — the whole-repository smoke test, data-driven over skills/
- tests/unit/frontmatter.spec.ts (new) — this repo's own Agent Skills frontmatter validator
- tests/integration/manifests.spec.ts (new) — both plugin manifests read together
- tests/e2e/ (new) — one browser spec per component
- tests/fixtures/bad-skill/ (new) — deliberately broken skill proving the harness fails
- README.md (modified) — replace the "components do not exist yet" status
- .claude-plugin/plugin.json (modified) — version bump to 0.2.0
- .codex-plugin/plugin.json (modified) — version bump to 0.2.0
- .github/workflows/check.yml (new) — mirrors scripts/check.sh

## Steps

### Phase: Foundation

1. [x] Create package.json and install vitest, @playwright/test, @axe-core/playwright and gray-matter. Why: every later step needs a test runner, and an earlier draft of this plan called `npm ci` in a repo that had no package.json at all. Verify: `npm ci && npx vitest run --passWithNoTests` exits zero and `npx playwright install chromium` completes.
2. [ ] Write docs/component-spec.md defining both halves of the authoring contract — what belongs in SKILL.md (standard frontmatter keys only, a third-person description, a body under 60 lines, no component code) and what belongs in the reference (element, role, props, slots, variants, behaviour, WCAG criteria, plus the five body sections Structure, Styles, Behaviour, Accessibility and Demo). Why: every later step writes against this contract, and the split between the two files is currently undefined, so drafting a component first would bake in an accidental format. Verify: hand the spec and nothing else to a fresh Claude and ask it to write the button reference — a clarifying question about structure means the spec is incomplete and gets fixed before step 3.
3. [x] Write three evaluation scenarios per component in evals/ and record a baseline run, with no skills installed, in docs/evaluations.md. Why: Anthropic's authoring guidance puts evaluations before documentation so a skill closes an observed gap rather than an imagined one, and without a baseline nothing proves the skill improved anything. Verify: docs/evaluations.md holds twelve baseline results naming concrete failures such as missing focus restoration or a wrong live-region setting; a scenario that already passes with no skill is too easy and gets rewritten.
4. [x] Build scripts/check.sh running four gates in order — the Vitest unit suite, a portability lint over every file under skills/, `claude plugin validate . --strict`, and the Playwright browser suite. Why: naming the check before the work stops the harness being quietly shaped to pass whatever the components happen to do. Verify: a deliberately broken fixture at tests/fixtures/bad-skill/ makes the run exit non-zero naming both faults separately, and the portability lint scans only skills/ so the fixture never trips the real gate.

### Phase: Components

5. [x] Write skills/button/ with no JavaScript, lifting from acss-kit the decision to use `aria-disabled` instead of the native disabled attribute so a disabled button stays in the keyboard tab order. Why: the simplest possible component proves the format end to end before any behaviour complexity arrives. Verify: check.sh passes, and tests/e2e/button.spec.ts confirms zero axe violations plus a disabled button that is reachable by Tab but does not fire on Enter, with all three button evaluations passing.
6. [x] Write skills/alert/ as an ARIA live region (the mechanism that makes a screen reader announce content appearing after page load), still with no JavaScript. Why: its entire value is the accessibility contract, so a wrong live-region setting is invisible to the eye and only a test catches it. Verify: tests/e2e/alert.spec.ts confirms zero axe violations, the alert role present, the live-region setting resolving to assertive, and the region already in the page before any content arrives.
7. [x] Write skills/dialog/ using the native dialog element plus a dependency-free ES module for focus management. Why: this is the hardest accessibility case in the set, so if the format cannot express focus trapping, inertness, Escape handling and focus restoration, that has to surface now rather than at component twenty. Verify: tests/e2e/dialog.spec.ts confirms focus moves inside on open, Tab cycles only within the dialog, Escape closes it, and focus returns to the exact element that opened it.
8. [x] Write skills/tabs/ using roving tabindex (keeping exactly one tab in the keyboard tab order and moving it with the arrow keys), with no acss-kit source to lift from. Why: every other component is an extraction, so this one tests whether the specification from step 2 stands on its own with nothing to copy. Verify: tests/e2e/tabs.spec.ts confirms one tab in the tab order at a time, arrow keys moving selection, Home and End jumping to the ends, and each tab paired to its panel by aria-controls and aria-labelledby.

### Phase: Proof

9. [x] Run all twelve evaluations against Haiku, Sonnet and Opus and record every result beside the baseline in docs/evaluations.md. Why: a description that triggers reliably on Opus can fail to trigger on Haiku, and triggering is the entire discovery mechanism, so skipping this ships descriptions tuned to one model. Verify: every scenario fires its intended skill on all three models, or the miss is named as a known limitation after two description rewrites — fixes go in the description, never the body, which loads too late to affect triggering.
10. [x] Install the plugin into Claude Code from the local directory, place the same skills tree where Codex looks for it, and write down what happened in docs/vendor-support.md. Why: every other check tests the files, and this is the only step that tests the README's actual claim that one tree serves two vendors. Verify: docs/vendor-support.md records both results including anything that failed, because a Codex discovery failure is a finding to document rather than a step to quietly skip.
11. [x] Update README.md, bump both plugin manifests to 0.2.0, and add .github/workflows/check.yml running scripts/check.sh. Why: the README still says components do not exist, and Claude Code only offers users an update when the manifest version changes. Verify: check.sh exits zero from a clean clone in a temporary directory; a failing Actions run is read with `gh run view --log-failed` first, because a billing block fails every job in seconds with no test output and is not a code defect.

## Tests

Tier 1 — This plan changes application code
- Objective: every skill in the repository is portable and its demo is accessible. File: tests/objective.spec.ts; Type: smoke; Asserts: for every directory under skills/, the frontmatter conforms to the Agent Skills standard, the files contain no vendor-specific token, and the demo page returns zero axe-core violations — iterating the directory so later components are covered without editing the test; Run: npx vitest run tests/objective.spec.ts
- Unit: the repo's own frontmatter validator, which replaces skills-ref as the enforcing gate. File: tests/unit/frontmatter.spec.ts; Targets: the SKILL.md frontmatter parser; Key cases: name matches its parent directory, name satisfies the standard's pattern including no consecutive or edge hyphens, description is non-empty and within 1024 characters, description is third person, only standard keys appear — each asserted against a fixture violating exactly that rule so a passing test proves the rule can fail
- Integration: both plugin manifests read together. File: tests/integration/manifests.spec.ts; Targets: the Claude Code manifest, the marketplace manifest and the Codex manifest; Key cases: both declare the same name and version, the marketplace source and skills paths resolve to real directories, and the Codex skills path resolves to the same directory Claude Code scans by default
- E2E: per-component keyboard and focus behaviour in a real browser. File: tests/e2e/button.spec.ts, alert.spec.ts, dialog.spec.ts, tabs.spec.ts; Targets: each component's demo page loaded from disk with no server and no build step; Key cases: the behaviours named in steps 5 to 8, with every WCAG criterion a reference claims carrying a matching assertion here
- Evaluations: whether a realistically-phrased request activates the right skill. File: evals/button.json, alert.json, dialog.json, tabs.json; Targets: the description field, run semi-manually since the format is documented but no runner ships; Key cases: per skill one obvious request, one oblique request avoiding the skill's own vocabulary, and one adjacent request that must not trigger it

## Acceptance Criteria

- [x] `npm ci` succeeds from a clean clone and `scripts/check.sh` exits zero
- [ ] docs/component-spec.md defines both the SKILL.md contract and the reference format, and a fresh agent writes a conforming component from it without asking a clarifying question

  **Not met.** The first half holds; the second does not. Eight fresh-agent passes were
  run, each handed only the spec and asked to author a component from it. The count of
  format questions fell from 26 to 4 - and every remaining item is a narrow CSS-naming
  edge on a deliberately hard composite component, not a structural gap. Passes 1 to 3
  used button and disclosure; passes 4 to 8 used a combobox, chosen because it is
  composite, has internal parts, a named content region and module-written state. All
  four v1 components were authored from the spec with no ambiguity. The four questions
  from pass 8 have been answered in the spec, but no ninth pass was run, so the
  criterion is recorded as unverified rather than met.
- [x] Four skills exist: button, alert, dialog and tabs
- [x] Every skill's frontmatter passes this repo's validator, and the validator is itself proven by fixtures that fail each rule
- [x] No skill contains `${CLAUDE_PLUGIN_ROOT}`, `disable-model-invocation`, `hint:` or a backslash path
- [x] No component's HTML, CSS or JavaScript references a framework, a preprocessor or an external package
- [x] Every themeable CSS value is a `var(--auk-*, fallback)` and every component renders correctly with no custom properties defined at all
- [x] Every WCAG criterion claimed in a reference has a passing assertion in tests/e2e/
- [x] Each skill has at least three evaluations, with baseline results recorded from before the skill existed
- [x] All twelve evaluations trigger the correct skill on Haiku, Sonnet and Opus, or the miss is documented as a known limitation
- [x] The four skills load and are invocable in Claude Code
- [x] The Codex discovery result is recorded in docs/vendor-support.md whether it worked or not

## Verification

From a clean clone in a temporary directory, run `npm ci && npx playwright install chromium`, then `bash scripts/check.sh`. It must exit zero, having run the unit suite, the portability lint, `claude plugin validate . --strict` and the browser suite. Then run `claude --plugin-dir .` and confirm `/help` lists all four skills under the `agent-ui-skills` namespace.

Read docs/evaluations.md and confirm both baseline and post-skill results are present for all twelve scenarios across three models, so the improvement is visible rather than assumed.

Finally, open each component's demo page directly in a browser with no build step and no stylesheet beyond the reference's own CSS. Each component must render correctly and be fully keyboard operable. This last check matters most: the entire premise is that these references work with nothing else present, so if a demo needs anything the reference did not ship, the component is not vendor-neutral regardless of what the tests report.

## Next Steps

- Extend version one into a genuinely useful component collection
  Adds the components a real project reaches for, once the format is proven.
  ```text
  In ~/devbox/agent-ui-skills the component skill format is proven by button, alert, dialog and tabs. Read docs/component-spec.md and the four existing skills under skills/, then add combobox (the ARIA 1.2 pattern with filtering), disclosure, tooltip and checkbox. Follow the same structure exactly, including a standalone demo page, three evaluations in evals/, and matching end-to-end assertions for every WCAG criterion claimed. Run scripts/check.sh before finishing and report the result.
  ```

- Automate the evaluation runner
  Removes the manual step from the only check that measures skill triggering.
  ```text
  ~/devbox/agent-ui-skills has evals/*.json holding skill-triggering scenarios, currently run by hand via scripts/eval.sh with results pasted into docs/evaluations.md. Investigate whether `claude -p` with --model can run these non-interactively and whether skill activation is reliably detectable from its output. If it is, build the runner and have it write docs/evaluations.md directly. If it is not, say so plainly and leave the manual protocol alone. Report which you found.
  ```

- Make acss-kit depend on agent-ui-skills instead of duplicating it
  Wish list — removes the duplication this project deliberately created.
  ```text
  ~/devbox/acss-plugins/plugins/acss-kit has fifteen component-* skills whose references contain fpkit-bound TSX and SCSS templates alongside framework-neutral accessibility contracts. ~/devbox/agent-ui-skills now owns the neutral contracts. Propose, but do not implement, how acss-kit could consume agent-ui-skills' references as the neutral source of truth and keep only the fpkit projection layer. Identify what would break for existing acss-kit users and whether Claude Code plugin dependencies can express this relationship. Write the proposal to docs/ and report the path.
  ```

- Add an optional design-token bridge
  Wish list — lets components inherit a project's theme automatically.
  ```text
  In ~/devbox/agent-ui-skills, components ship literal CSS using var(--auk-*, fallback). Design and document an optional mapping layer that lets a project with a design-token file bind its tokens to the --auk-* custom properties so components pick up the project's theme automatically. This must stay optional: every component must keep working with no token file present. Write the design to docs/ as a proposal first and report the path.
  ```

## Unresolved Questions

- The plugin and the marketplace share the name `agent-ui-skills`, so installation reads `/plugin install agent-ui-skills@agent-ui-skills` and skills invoke as `/agent-ui-skills:ui-button`. Renaming the plugin (not the repository) to something shorter would improve both, but renaming after publication may break existing installs. Worth settling before any public submission.
- Whether a four-component version one on an alpha reference format belongs in the public marketplaces yet. Approved Claude Code plugins are pinned to a commit SHA with CI bumping the pin, so submitting early commits the format sooner than it may be ready.

## Resources

- Agent Skills specification — https://agentskills.io/specification
- Skill authoring best practices — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Code plugins reference — https://code.claude.com/docs/en/plugins-reference
- ChatGPT and Codex plugin builder docs — https://learn.chatgpt.com/docs/build-plugins
