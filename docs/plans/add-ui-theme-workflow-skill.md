---
status: todo
type: feature
created: 2026-09-03
repo-name: agent-ui-skills
glance: Agents already build the six auk components into user projects, but every build wears the shipped default blue instead of the host project's brand, and the one spec sentence promising a binding layer has no procedure behind it. Done means all six gates pass with a seventh, non-component skill under skills/, the failure-proof run shows the loosened gate can still fail, and a browser run measures that a bound palette keeps every demo axe-clean.
workflow: never
artifact-url: https://claude.ai/code/artifact/f21dc0a6-79c1-453a-b568-9bc98ef8ec2b
issue: https://github.com/shawn-sandy/agent-ui-skills/issues/18
design: https://claude.ai/code/artifact/d9bb436b-2d3a-40b0-ae1c-6c00a50fcc86
design-dir: docs/designs/add-ui-theme-workflow-skill
---

# Plan: Add the ui-theme workflow skill that binds a project's styles to the auk custom properties

## Objective

Ship `skills/ui-theme` — a public workflow skill that maps a consuming project's
existing colours, radius and type onto the 69 brand-bearing `--auk-*` custom
properties — by first partitioning the repo's gates so a non-component skill can
live under `skills/` at all.

## Context

The component spec already mandates the mechanism: a project that has design tokens
"binds them to the `--auk-*` properties in its own stylesheet"
(docs/component-spec.md:269-272). The build-ui-component-skills plan lists the
design-token bridge as an unbuilt wish-list item and asked for the design as a
proposal first; that proposal now exists at
docs/prompts/proposal-add-ui-theme-skill.md, converged 2026-09-03 with every open
decision resolved. The demand is measured, not guessed: docs/vendor-support.md:51
records Codex writing 26 `var(--auk-button-*, ...)` declarations into a project
stylesheet unprompted — agents already put the properties where the override block
would go, without a procedure telling them which roles map to which properties.

The blocker is structural. Every gate treats each `skills/*` directory as a
component: tests/objective.spec.ts asserts a reference, demo, react-demo, contract
table and WCAG rows; tests/e2e/demos.spec.ts opens `references/demo.html` for every
directory; scripts/build-demos.mjs throws when the reference and demo pair is
missing, aborting gate 4 for all skills at once. So the partition (phase 1) must
land before any file under `skills/ui-theme/` exists. The known risks and their
mitigations: loosening a deliberately strict contract (mitigated by an explicit
`metadata.kind` key defaulting to component, plus a broken fixture proving the
partition can fail); a mapped palette breaking contrast (mitigated by a Playwright
run that measures the result with axe rather than estimating ratios); and the
portability lint banning the vocabulary a stylesheet-reading skill reaches for
(mitigated by naming lowercase file extensions, never tools — the lint patterns are
case-sensitive word matches).

## Decisions

- Ship as a public workflow skill at `skills/ui-theme` marked `metadata.kind: workflow` — internal placement under `.claude/skills/` never installs, and a fabricated component shape would be noise; `metadata` is already a standard frontmatter key, so no validator change is needed.
- Gate partition keys on the explicit `metadata.kind` value and defaults to component — an absent key must change nothing for the six shipped skills.
- The shared kind reader lives in a new `scripts/skill-kind.mjs`, not inside an existing gate file — scripts/build-demos.mjs executes its main body on import, so importing it for a helper would run the build.
- Mapping scope is the 69 brand-bearing properties (57 colour, 7 radius, 5 font-family); the 68 size, spacing, duration and placement properties keep their fallbacks so the values measured in tests/e2e/ stay untouched.
- Discovery is static — the project's stylesheet sources on disk, no browser, no rendered page; roles with no evidence go to the skill's Clarify interview with shipped fallbacks as defaults.
- Dark scheme is mirrored, never invented: recognise `prefers-color-scheme: dark`, `.dark` and `[data-theme="dark"]`, mirror the project's own form — a class or attribute selector is repeated verbatim, a media query is emitted as `@media (prefers-color-scheme: dark) { :root { … } }` because a media query is not a selector — and emit nothing dark when the project has none.
- The emitted block appends to the stylesheet already declaring the project's `:root` custom properties (else a new `auk-theme.css` beside the first stylesheet containing an `auk-` selector), uses `var(--project-token)` with no fallback where a token exists, and the undefined-token behaviour (component literal wins) is asserted by an e2e case rather than trusted from the CSS spec.
- No bundled scanner script in the first release — discovery is prose an agent runs with its own file tools; the script is a follow-up only if evals show missed tokens.
- Roadmap phases, not red-green-verify (confirmed 2026-09-03): the change edits the test gates themselves, so a plan-wide RED would assert edits rather than behaviour, and the proposal locks partition-before-skill so every phase boundary leaves the tree green.
- `evals/ui-theme.json` lands in the skill phase, not the test phase — the evals gate is deliberately kept for workflow skills, so the skill phase would end red without it.
- Version bumps to 0.3.0 across package.json and both plugin manifests (confirmed 2026-09-03) — a seventh public skill is a feature, and tests/integration/manifests.spec.ts asserts the three agree.
- `workflow: never` in this plan's frontmatter — the phases are strictly ordered (partition → skill → test → docs), so fanning steps out across subagents would break the dependency chain.
- Interview findings (2026-09-03, all confirmed): skillKind treats malformed frontmatter as component so broken files face the strict gates; the discovery Clarify interview caps at six core roles instead of one question per unbound role; discovery skips minified or generated stylesheet files; the palette test's values are chosen at implementation with axe as arbiter; the undefined-token fallback is proven on one representative property; e2e titles carry WCAG criterion prefixes where one applies; the dark block is a partial mirror covering only tokens that change; a measured contrast failure in the project's own brand is reported and asked about, never silently reverted; and the skill stops with a message when no auk component exists in the project yet.

## Steps

### Phase: Gate partition

1. Create scripts/skill-kind.mjs exporting `skillKind(skillDir)` — read the directory's SKILL.md frontmatter with gray-matter and return `metadata.kind`, defaulting to `"component"` when the key or the file is absent or the frontmatter fails to parse, so a broken file always lands in the strict component gates. Why: three gates need one shared answer to "is this directory a component?", and a second definition would drift; it cannot live in scripts/build-demos.mjs because that file runs its main body on import. Verify: `node -e "import('./scripts/skill-kind.mjs').then(m=>console.log(m.skillKind('skills/ui-button')))"` prints `component`.
2. Branch tests/objective.spec.ts on `skillKind`: a workflow skill keeps SKILL.md existence, the name prefix, frontmatter validation, body length, the Clarify heading, portability rules (over only the files that exist) and the evals assertions, and skips the component-only ones — the reference/demo file trio, react-demo shape, contract table, section order, Qualifiers line, css-var rules, demo-drift pins and WCAG rows (today's lines 50-54, 92-111, 121-161, 173-212, 214-236). Why: the suite is data-driven over skills/ and currently asserts every directory is a component, so any workflow skill fails on arrival. Verify: `npx vitest run tests/objective.spec.ts` stays green over the six component skills — the new branch is dormant until phase 2.
3. Filter workflow skills out of tests/e2e/demos.spec.ts and scripts/build-demos.mjs using `skillKind`. Why: both walk skills/ expecting `references/demo.html`, and build-demos.mjs throws on a missing pair — one workflow skill would abort gate 4 for every skill at once. Verify: `node scripts/build-demos.mjs --check` prints "6 demo(s) up to date" and `npx playwright test tests/e2e/demos.spec.ts` still runs the six demo tests.
4. Add the broken fixture tests/fixtures/workflow-skill/SKILL.md (valid frontmatter, `metadata.kind: workflow`, deliberately no evals file), a unit spec tests/unit/skill-kind.spec.ts (classifies the fixture as workflow, defaults skills/ui-button to component, and names the fixture in a rejection assertion), and a `--prove` stanza in scripts/check.sh mirroring the existing frontmatter one that greps the spec's verbose output for that fixture test. Why: the partition loosens a deliberately strict contract, and this repo's rule is that every gate must be provably fallible from tests/fixtures/. Verify: `bash scripts/check.sh --prove` prints the new ok line alongside every existing proof line.
5. Add a short section to docs/component-spec.md defining a workflow skill: what `metadata.kind: workflow` means, which contract rules still bind it (naming, frontmatter, body rules, Clarify heading, portability, evals) and which do not apply (reference, demo, react-demo, WCAG table), and that such a skill stays public — it never sets `metadata.internal`. Why: the spec is the authoring contract and wins over CLAUDE.md, so an undocumented kind would make the partition folklore. Verify: the section reads back from the file and `npm run check` stays green.

### Phase: The ui-theme skill

6. Author skills/ui-theme/SKILL.md: name `ui-theme`, license MIT, `metadata.kind: workflow`, a third-person description free of first- and second-person pronouns, and a body under 60 lines with no code fences carrying When to use, When not to use, a Clarify when needed heading (with the words description, props, requirements and ask) and a Build it list pointing at references/ui-theme.md. Why: SKILL.md is the installable surface agents discover, and the kept gates enforce exactly this shape. Verify: `npx vitest run tests/objective.spec.ts` shows ui-theme passing every kept assertion except the evals one, which step 9 lands.
7. Write the discovery half of skills/ui-theme/references/ui-theme.md, prose wrapped at 88 columns: the ordered static procedure (collect `:root`/`:host`/`html` custom properties and match role words; skip files that are effectively one line or carry a minified or generated marker, so a stray bundle cannot swamp the ranking; frequency-rank colour literals, border-radius values and font-family stacks for unbound roles; detect a project dark scheme by media query, `.dark` or `[data-theme="dark"]`; cap the Clarify interview at the six core roles — primary, text, surface, border, radius, font — with every other unbound role keeping its shipped fallback unless the project shows evidence), then the mapping table binding the 21 style roles to the 69 brand-bearing properties with their shipped fallbacks. Why: the mapping table is the skill's actual product — without it an agent invents bindings ad hoc, and the measured Codex run shows agents already write these properties. Verify: extract every `var(--auk-` name from the six component references with grep, confirm each property named in the table exists in a shipped reference and the measured count of distinct brand-bearing names equals the table's — counted at implementation time, never copied on trust.
8. Write the output-contract half of the same reference: a guard first — when no stylesheet contains an `auk-` selector, the skill states that no auk components were found, points at the component skills, and emits nothing; otherwise one `:root` block appended to the stylesheet that already declares the project's custom properties (else a new auk-theme.css beside the first stylesheet containing an `auk-` selector); `var(--project-token)` with no fallback where the project defines a token and the shipped literal otherwise; a dark block only when discovery found a project dark form, mirroring that form — selector repeated verbatim, media query wrapping `:root` — and covering only the roles whose bound token differs under it; never a size, spacing, duration or placement property and never a forced-colors query; plus a closing verification step naming the tests/e2e/ specs that measure contrast and focus visibility, with no estimated ratio anywhere — and when the re-measure finds the project's own brand failing contrast, the agent keeps the binding, reports the measured failure plainly and asks, never silently reverting a brand value. Why: the emitted block is what lands in user projects, and its rules are what keep the components' measured accessibility intact. Verify: `node scripts/lint-portability.mjs` passes and the no_external_refs grep finds no `url(`, `@import` or `src=` under skills/ui-theme/.
9. Author evals/ui-theme.json with at least three scenarios in the shipped shape (id, kind, expect, prompt, baselineFailure, detect): obvious — "make these components match our brand"; oblique — "the buttons look off next to the rest of the page"; adjacent — a request to restyle a non-auk element, where ui-theme must stay quiet. Why: the evals gate is deliberately kept for workflow skills, and landing the file here is what turns the suite fully green so this phase can close. Verify: `npx vitest run` is fully green with ui-theme present.

### Phase: Regression test

10. Write tests/e2e/ui-theme.spec.ts: for each of the six component demos, inject a test palette (values chosen at implementation, axe is the arbiter) as a `:root` override block over the brand-bearing properties via addStyleTag and assert the page stays axe-clean under the same WCAG tags demos.spec.ts uses; add two focus tests under the palette: a 2.4.7 Focus Visible test that tabs to a control and asserts a non-zero focus-visible outline width, as the sibling specs do, and a 1.4.11 Non-text Contrast test that reads the outline colour and the surface it is drawn over from computed style and asserts a WCAG contrast ratio of at least 3:1 (computed by a small relative-luminance helper in the spec file), since axe's colour-contrast rule does not cover focus indicators and a bare "differs" check would accept an invisible one-channel change; add one case where a single representative override (the button background) references an undefined project token and assert via computed style that the component's own literal fallback wins — the CSS mechanism is identical for every property, so one proof suffices. Title tests with their WCAG criterion prefix where one genuinely applies (1.4.3 for text contrast, 2.4.7 for focus visibility, 1.4.11 for the focus indicator's contrast) and descriptively otherwise. Why: this is where the real risks live — a mapped palette can break contrast or drown a focus ring, and the undefined-token behaviour is the output contract's load-bearing CSS claim, so all of it gets measured rather than trusted. Verify: `npx playwright test tests/e2e/ui-theme.spec.ts` exits 0, with axe and the computed-style reads doing the measuring — no estimated ratios anywhere.

### Phase: Docs and consistency

11. Add the override sentence — "Override `--auk-<slug>-*` to theme it." — to the Build it steps of skills/ui-alert, ui-dialog, ui-popover and ui-tabs SKILL.md, matching the wording already in ui-button and ui-box. Why: all six components should point at the mechanism ui-theme automates. Verify: `grep -l "to theme it" skills/*/SKILL.md` lists all six component skills and vitest stays green on the body-length rule.
12. Update README.md — six becomes seven with ui-theme listed at lines 18-23 and line 40, leaving line 98's "Six gates" untouched because it counts gates, not components — and bump the version to 0.3.0 in README.md, package.json, .claude-plugin/plugin.json and .codex-plugin/plugin.json. Why: the README hard-codes the count beside the version, and tests/integration/manifests.spec.ts asserts the three manifests agree. Verify: `npx vitest run tests/integration/manifests.spec.ts` passes and `grep -in six README.md` returns only the gates line.
13. Close the loop in docs: link docs/prompts/proposal-add-ui-theme-skill.md from the "Add an optional design-token bridge" wish-list item in docs/plans/build-ui-component-skills.md (around lines 149-152), and fix the grammar example in docs/component-spec.md by replacing `--auk-tab-selected-indicator-color` with the shipped `--auk-tabs-selected-tab-border-block-end-color`. Why: the wish-list item is exactly what this work delivers, and the spec's one worked property example should name a property that exists. Verify: `grep -n "tab-selected-indicator" docs/component-spec.md` returns nothing — the proposal's Appendix E and the design canvas keep the old name on purpose, as the record of what was fixed.
14. Run the full gate end to end: `npm run check`, then `bash scripts/check.sh --prove`. Why: the six gates plus the failure proofs are this repo's single definition of done, and the prove run is what shows the loosened contract can still fail. Verify: every gate prints ok and every prove line prints ok, including the new workflow-partition line.

## Acceptance Criteria

- [ ] `npm run check` passes with skills/ui-theme present — all six gates.
- [ ] `bash scripts/check.sh --prove` prints an ok line for the workflow-partition fixture alongside every existing proof line.
- [ ] A skills/ directory declaring `metadata.kind: workflow` passes the kept gates without a reference, demo, react-demo or WCAG table, while directories without the marker still face every component assertion.
- [ ] Every property in the reference's mapping table exists in a shipped component reference, and the table's count equals the grep-measured count of brand-bearing properties.
- [ ] `npx playwright test tests/e2e/ui-theme.spec.ts` passes: the injected palette keeps all six demos axe-clean, a focused control's outline colour measurably differs from the surface, and an undefined project token falls back to the component's shipped literal.
- [ ] All six component SKILL.md files carry the override sentence.
- [ ] README lists seven skills and version 0.3.0 agrees across package.json, .claude-plugin/plugin.json and .codex-plugin/plugin.json.
- [ ] docs/component-spec.md defines the workflow kind, and its custom-property grammar example names a shipped property.

## Files

- scripts/skill-kind.mjs (new) — shared metadata.kind reader, defaulting to component
- tests/objective.spec.ts (modified) — branch component-only assertions on the kind
- tests/e2e/demos.spec.ts (modified) — skip workflow skills in the axe sweep
- scripts/build-demos.mjs (modified) — skip workflow skills instead of throwing
- tests/fixtures/workflow-skill/SKILL.md (new) — broken workflow skill missing evals
- tests/unit/skill-kind.spec.ts (new) — classification proof over the fixture
- scripts/check.sh (modified) — new --prove stanza for the partition
- docs/component-spec.md (modified) — workflow-kind section; fix the property example
- skills/ui-theme/SKILL.md (new) — the installable workflow skill surface
- skills/ui-theme/references/ui-theme.md (new) — discovery, mapping table, output contract
- evals/ui-theme.json (new) — obvious, oblique and adjacent scenarios
- tests/e2e/ui-theme.spec.ts (new) — palette injection and undefined-token fallback
- skills/ui-alert/SKILL.md (modified) — add the override sentence
- skills/ui-dialog/SKILL.md (modified) — add the override sentence
- skills/ui-popover/SKILL.md (modified) — add the override sentence
- skills/ui-tabs/SKILL.md (modified) — add the override sentence
- README.md (modified) — seven skills; version 0.3.0
- package.json (modified) — version 0.3.0
- .claude-plugin/plugin.json (modified) — version 0.3.0
- .codex-plugin/plugin.json (modified) — version 0.3.0
- docs/plans/build-ui-component-skills.md (modified) — close the wish-list item

## Tests

Tier 1 — This plan changes gate code, test code and shipped skill files
- Objective: a project palette bound to the auk properties keeps the components accessible. File: tests/e2e/ui-theme.spec.ts; Type: E2E; Asserts: a `:root` override over the brand-bearing properties leaves all six demos axe-clean, a focus-visible outline stays distinguishable from the surface, and an undefined project token falls back to the shipped literal; Run: npx playwright test tests/e2e/ui-theme.spec.ts
- Unit: workflow-kind classification. File: tests/unit/skill-kind.spec.ts; Targets: skillKind; Key cases: metadata.kind workflow read from frontmatter, missing key defaults to component, broken fixture named in the rejection output check.sh --prove greps for
- Integration: the data-driven gates over skills/ with ui-theme present. File: tests/objective.spec.ts and tests/e2e/demos.spec.ts (existing, data-driven); Run: npx vitest run and npx playwright test — ui-theme passes the kept assertions and the six component skills pass everything unchanged

## Verification

Run `npm run check`: the vitest suites, portability lint, external-resource grep,
demo build check, plugin manifest validation and the Playwright sweep must all pass
with skills/ui-theme in the tree. Then run `bash scripts/check.sh --prove` and
confirm the new workflow-partition proof line prints ok next to the existing ones —
the loosened gate must still be able to fail.

Then exercise the skill the way its consumer would. Against a scratch stylesheet
defining `--color-primary`, `--color-text`, `--radius-md` and a
`[data-theme="dark"]` block, follow the discovery procedure in
references/ui-theme.md and write the emitted `:root` block by hand: defined tokens
must appear as `var(--project-token)` with no fallback, roles without evidence must
keep the shipped literals, the dark block must repeat the project's selector
verbatim, and no size, spacing or duration property may be set. The e2e spec is the
measured backstop — the palette run stays axe-clean, and no contrast ratio is ever
estimated into prose.

## Next Steps

- Zero-dependency token scanner script (roadmap phase 5) — only if evals show agents missing tokens with prose-only discovery.
  ```text
  In shawn-sandy/agent-ui-skills, evals for skills/ui-theme have shown agents missing
  project tokens during static discovery. Add a zero-dependency Node script under
  skills/ui-theme/scripts/ that scans stylesheet sources for :root custom properties,
  colour/radius/font literals and dark-scheme selectors, printing a role-to-value
  report matching the mapping table in references/ui-theme.md. It must respect the
  portability rules in scripts/lint-portability.mjs (no package imports, no framework
  or preprocessor names). Verify by running npm run check and the script against
  tests fixtures; report the output.
  ```
- Run the manual eval protocol on ui-theme and record the results.
  ```text
  In shawn-sandy/agent-ui-skills, run the eval scenarios in evals/ui-theme.json via
  scripts/eval.sh per the manual protocol, and record the outcomes in
  docs/evaluations.md in the same format as the existing entries. Verify the new
  section lists all three scenario kinds with observed pass/fail before reporting
  done.
  ```

## Resources

- docs/prompts/proposal-add-ui-theme-skill.md — the converged proposal: locked decisions, the 21-role mapping table, discovery procedure and gate-partition appendix
- docs/component-spec.md:269-272 — the design-token mandate this skill implements
- docs/plans/build-ui-component-skills.md:149-152 — the wish-list item this closes
- docs/vendor-support.md:51 — measured datapoint: Codex writing 26 auk properties into a project stylesheet
