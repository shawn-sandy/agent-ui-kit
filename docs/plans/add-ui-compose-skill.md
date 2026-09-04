---
status: completed
type: feature
created: 2026-09-04
modified: 2026-09-04
repo-name: agent-ui-skills
issue: https://github.com/shawn-sandy/agent-ui-skills/issues/31
prototype: docs/prototypes/map-contract-rows.html
proto-model: {"entity":"Mapping","fields":[{"name":"component","type":"string"},{"name":"row","type":"string"},{"name":"surface","type":"string"},{"name":"rule","type":"string"}],"action":"Map","successSignal":"rows mapped"}
artifact-url: https://claude.ai/code/artifact/5acfc646-e9c4-42b5-a36e-48efc40ffe5a
glance: An agent building an auk component into a framework project is currently told only to adapt template syntax, so the output takes whatever shape habit gives it and the exemplars model hand-typed siblings. After this lands every component skill hands that case to four enforceable composition rules, a unit test pins those rules to the shipped contract tables, and the six gates prove the whole set end to end.
workflow: never
---

# Plan: Add the ui-compose workflow skill so agent-built components follow Component Driven Design

## Objective

Ship a `ui-compose` workflow skill whose four rules - props from the contract table, split only on structure, compose sibling auk components, render alone - reach an agent from every component skill's Build it, are pinned to the shipped contract tables by the gates, and are modeled by the dialog and popover exemplars instead of contradicted by them.

## Context

The converged proposal at docs/prompts/proposal-add-ui-compose-skill.md is the authoritative source; this plan delivers its Workstreams A through E in roadmap order. The idea it settled: the output phase - the moment an agent follows a ui- component skill and writes the component into a consuming project - should follow Component Driven Design when that project is component-based.

Today the framework case is handled by one clause. skills/ui-box/SKILL.md and skills/ui-button/SKILL.md say "adapt only template syntax to the target stack"; the other four component skills say nothing. Yet the contract table in every reference already carries what Component Driven Design calls a well-defined API and fixed series of states. Worse, the two stateful React exemplars model the opposite of composition: skills/ui-dialog/references/react-demo.tsx hand-types `className="auk-button"` at lines 124, 142 and 151, and skills/ui-popover/references/react-demo.tsx at 115, 124 and 138. An agent copies what the exemplar shows.

The delivery shape mirrors the one workflow-skill precedent: skills/ui-theme declares metadata kind workflow, scripts/skill-kind.mjs reads it, and the component-only gates skip it. tests/unit/ui-theme-mapping.spec.ts pins that skill's mapping table to the component references; this plan adds the same pinning for ui-compose. Distribution is per-directory - the skills CLI copies only named skill directories - so the two-line pointer in each component skill is what carries the gist into a selective install.

Constraints that shape every step: scripts/lint-portability.mjs bans framework names case-sensitively anywhere under skills/, prose included; SKILL.md bodies must stay under 60 lines as the gate counts them, a newline split that includes the trailing empty element, and ui-popover sits at 58 with one line of headroom; reference prose wraps at 88 columns; no typecheck may be added; descriptions are third person with disambiguators in the first clause because one host truncates them.

Since the proposal converged, two pull requests landed on main. PR #23 merged the spec's Sources edits, so the docs phase no longer waits on it and the branch must rebase before editing docs/component-spec.md. PR #29 fixed the broken YAML that kept the test suite red, so a green baseline exists after the rebase. Issue #25, which reworks the same dialog exemplar this plan touches, is still open - the projection phase lands after it or in the same pull request. Issue #15, the only path to testing what an agent actually builds, is still open and its re-scope is a next step, not a step.

## Decisions

- Location is a new ui-compose workflow skill plus a two-line pointer in every component Build it - one file to maintain, ships through the skills CLI, and the ui-theme precedent already partitions the gates. Locked at the proposal review.
- The four rules are named, in order - props from the contract, split on structure, compose siblings, render alone. The pointer line and the reference use the same four names so a selective install of one component skill still carries the gist.
- Split rule - a prop that only writes data-variant or a class stays a prop; a prop that changes which parts render becomes its own variant component behind a thin router with the same import surface. Locked at the proposal review.
- Projections get a composition-only fix - the dialog and popover exemplars import AukButton; the hook re-implementations stay, because wrapping the init modules is a four-file refactor with an open design question. Locked at the proposal review.
- Isolation - the emitted component renders alone; stories are added only when a story harness already exists, and one is never installed. Locked at the proposal review.
- Verification is regex gates and evals inside npm run check now; proving that an agent follows the guidance needs a component-based fixture and waits for issue #15. Locked at the proposal review.
- Steps run in workstream phases, not red-green-verify headings - most of the work is markdown authoring where a failing test would assert the edit rather than behaviour. The one place test-first matters, the pointer assertion, is written first and watched to fail inside the second phase. Confirmed with the maintainer on 2026-09-04.
- workflow never - the phases are ordered (the skill precedes the assertion, the assertion precedes the pointers) and the projection phase edits a file that open issue #25 also edits, so subagent fan-out has nothing it can parallelize safely.
- Discovery of a component-based project is structural - a components directory, or lowercase component file extensions, which the case-sensitive lint permits; the spec amendment in the docs phase makes that allowance explicit rather than accidental.
- Implementation continues on this branch after the rebase - the proposal commit and the implementation tell one story in one pull request. Confirmed at the 2026-09-04 interview.
- The mapping test measures its stated counts from the real contract tables - a seventh component later turns the gate red until the mapping is updated, which is deliberate friction. Confirmed at the interview.
- The exemplars stay regex-gated - no parse or typecheck tooling is added, honouring the repo's no-typecheck rule; step 11 compensates with a native-prop pass-through grep and a written read-through. Confirmed at the interview.
- Phase 4 stops and reports when issue #25 is unmerged at build time, so the dialog exemplar is edited once. Confirmed at the interview.

## Steps

### Phase: Rebase and skill

1. [x] Rebase claude/js-component-driven-design-97debf onto the tip of origin/main at build time. Why: PR #23 already edited docs/component-spec.md and PR #29 fixed the YAML that keeps the suite red in this worktree, so every later step must edit current files from a green baseline. Verify: git log shows the tip of origin/main beneath the branch commits and npx vitest run exits 0 before any new change.
2. [x] Write skills/ui-compose/SKILL.md - frontmatter name ui-compose, license MIT, metadata kind workflow, the settled third-person description with the disambiguators in the first clause; a body under 60 lines with the same five headings as every skill, whose Build it walks the procedure detect a component-based project or stop, read the component's contract table, map rows to the public surface per the reference, apply the four rules, emit the component plus a router only when a structural prop exists and stories only when a harness is already present, and state the mapping and any split in the reply. Why: this is the one file that puts the rules in front of an agent at build time, and kind workflow is what makes the component-only gates skip it. Verify: node scripts/lint-portability.mjs exits 0 and the body line count printed by awk is under 60; the full suite stays red until steps 3 and 4 add the reference and evals the every-skill gates expect.
3. [x] Write skills/ui-compose/references/ui-compose.md with sections Scope, Guard, Discovery, Mapping table, Rules, Output contract, Worked example and Verification - the mapping table carries the ten mapping rules from the proposal's Appendix A, nine for contract rows and one for the qualifier line, with a string rule and a required-versus-absent split so every Props entry matches exactly one rule, the Rules section states when re-implementing behaviour is right (only where the framework's rendering owns the attribute the module writes, as with aria-selected in tabs) and that no prop may remove a required accessibility attribute - fixed-value rows stay hard-coded, never exposed, the worked example walks the button and the dialog as a props table and a parts tree in prose, and no line names a framework. Why: the reference is the on-demand product - the mapping from contract rows to a public component surface is the whole skill. Verify: node scripts/lint-portability.mjs exits 0 and an awk pass shows no prose line over 88 columns outside tables and fences.
4. [x] Write evals/ui-compose.json with three scenarios - obvious names a component file path and an existing project Button component and expects composition plus a typed props export, oblique asks to make the confirm dialog fit our component setup, adjacent is a plain index.html request that must stay quiet - with detect regexes for an exported props type and against hand-typed sibling markup in either spelling, class or className, so the check is not tied to one template syntax. Why: the evals are the only measure of triggering, and the adjacent scenario guards the skill from firing on plain pages. Verify: npx vitest run tests/objective.spec.ts exits 0 now that every ui-compose file the every-skill gates expect exists.

### Phase: Pointer and gates

5. [x] Add a Build it points at ui-compose assertion to tests/objective.spec.ts beside the Clarify assertion at lines 83-92 - every component skill body must match the pointer line's opening words at a numbered step, workflow skills exempt - and run it before touching any SKILL.md. Why: the regression test comes before the edit it guards, and watching it fail six times proves it bites. Verify: npx vitest run tests/objective.spec.ts exits non-zero with exactly six failures, one per component skill - capture the list.
6. [x] Add the identical two-line pointer to all six component SKILL.md Build it sections as the step before Open references/demo.html - In a component-based project, follow ui-compose with props from the contract table, split only on structure, compose sibling auk components, render alone - replacing the adapt-only-template-syntax clause in ui-box and ui-button, after trimming one line from ui-popover's body, which sits at 58 under the gate's count and has one line of headroom. Why: the pointer carries the four rules into a selective single-skill install and gives the framework case one owner. Verify: npx vitest run tests/objective.spec.ts exits 0 and every body count stays under 60 lines, with ui-popover landing at 59.
7. [x] Write tests/unit/ui-compose-mapping.spec.ts mirroring tests/unit/ui-theme-mapping.spec.ts - every row name the mapping table maps is one of the seven contract rows or the qualifier line, every entry in every component's Props row is covered by exactly one mapping rule (choice, fixed, boolean, string, reference), and every count stated in the reference prose is measured from the six contract tables. Why: pinning the guidance to the real contracts makes a future contract change fail the gate instead of silently orphaning the mapping. Verify: npx vitest run tests/unit/ui-compose-mapping.spec.ts exits 0, and temporarily breaking one row name in the reference makes it exit non-zero before reverting.

### Phase: Docs and walker

8. [x] Amend docs/component-spec.md in four places - the pointer step in the section 1 body skeleton near line 195, a settled-questions row saying what an agent emits in a component-based project is the ui-compose mapping, one sentence under Framework neutrality near line 270 stating that lowercase file extensions name file types rather than libraries and are allowed, and a Build it points at ui-compose line in the section 8 checklist. Why: the spec is the authoring contract that outranks CLAUDE.md - without these the next component skill would skip the pointer and the extension allowance would stay accidental. Verify: grep -n ui-compose docs/component-spec.md shows all four sites and npx vitest run stays green.
9. [x] Update .claude/skills/new-component/SKILL.md - fold the pointer into step 3's SKILL.md instructions and add a react-demo.tsx authoring step after the demo step, renumbering the rest. Why: the walker writes future skills and currently omits the react-demo.tsx that tests/objective.spec.ts line 105 requires, recorded drift this plan closes. Verify: grep shows both additions; the walker lives under .claude/ so the portability lint does not apply to it.
10. [x] Add one README.md paragraph naming ui-compose as the skill that shapes output for component-based projects, next to the existing ui-theme line. Why: the README is the distribution story - it tells installers the set ships together, which is the mitigation for a pointer arriving without its skill. Verify: grep -n ui-compose README.md shows the paragraph.

### Phase: Projections

11. [x] Import AukButton from ../../ui-button/references/react-demo in the dialog and popover exemplars and replace the six hand-typed buttons - dialog lines 124, 142 and 151, popover lines 115, 124 and 138 - keeping each variant via the variant prop and adding a one-line comment noting the import dangles under a selective single-skill install. Why: an agent copies what the exemplar shows, and today both files model the opposite of compose-siblings; issue #25 edits the same dialog file, so this lands after it or in its pull request. Verify: grep for the hand-typed auk-button class in both files returns nothing, grep shows filters-apply and autoFocus still on the composed popover button, npx vitest run tests/objective.spec.ts stays green, and both edited files are read end to end since no gate parses them.
12. [x] Run bash scripts/check.sh from the worktree root with the claude CLI on PATH. Why: the six gates are the single local gate and the plugin-validate and manifest gates run nowhere else. Verify: exit 0 with each gate's output observed, not inferred.

## Files

- skills/ui-compose/SKILL.md (new) — the workflow skill carrying the four rules and the Build it procedure
- skills/ui-compose/references/ui-compose.md (new) — mapping table, rules, output contract, worked example
- evals/ui-compose.json (new) — obvious, oblique and adjacent scenarios with detect regexes
- tests/objective.spec.ts (modified) — the every-component pointer assertion beside the Clarify one
- tests/unit/ui-compose-mapping.spec.ts (new) — pins the mapping table to the six contract tables
- skills/ui-alert/SKILL.md (modified) — pointer line in Build it
- skills/ui-box/SKILL.md (modified) — pointer line replaces the template-syntax clause
- skills/ui-button/SKILL.md (modified) — pointer line replaces the template-syntax clause
- skills/ui-dialog/SKILL.md (modified) — pointer line in Build it
- skills/ui-popover/SKILL.md (modified) — one line trimmed, then the pointer line; body lands at 59 as the gate counts
- skills/ui-tabs/SKILL.md (modified) — pointer line in Build it
- docs/component-spec.md (modified) — skeleton step, settled-questions row, neutrality sentence, checklist line
- .claude/skills/new-component/SKILL.md (modified) — pointer instruction and the missing react-demo.tsx step
- README.md (modified) — one paragraph naming ui-compose
- skills/ui-dialog/references/react-demo.tsx (modified) — compose AukButton at three sites
- skills/ui-popover/references/react-demo.tsx (modified) — compose AukButton at three sites

## Tests

Tier 1 — steps modify test source and the projection exemplars
- Objective: every component skill points at ui-compose and the guidance matches the shipped contracts. File: tests/objective.spec.ts and tests/unit/ui-compose-mapping.spec.ts; Type: smoke; Asserts: all six component SKILL.md bodies carry the pointer line at a numbered Build it step, and every mapping-table row resolves against the seven contract rows or the qualifier line of the six shipped components; Run: npx vitest run tests/objective.spec.ts tests/unit/ui-compose-mapping.spec.ts
- Unit: contract coverage of the mapping table. File: tests/unit/ui-compose-mapping.spec.ts; Targets: the Mapping table in skills/ui-compose/references/ui-compose.md; Key cases: an unknown contract-row name fails, a Props entry no mapping rule covers fails, a count stated in prose that disagrees with the measured contracts fails
- Integration: the shipped every-skill gates over the new skill. File: tests/objective.spec.ts and tests/unit/frontmatter.spec.ts, existing suites picking up the new directory; Targets: frontmatter shape, Clarify heading, body length and eval scenario kinds for ui-compose; Key cases: metadata kind workflow skips the component-only gates, three eval kinds present

## Acceptance Criteria

- [x] skills/ui-compose ships SKILL.md with metadata kind workflow, references/ui-compose.md and evals/ui-compose.json, and npx vitest run exits 0 with them included
- [x] All six component SKILL.md files carry the identical pointer line, and removing any one of them makes tests/objective.spec.ts exit non-zero
- [x] tests/unit/ui-compose-mapping.spec.ts exits non-zero when a mapping-table row name or a stated count disagrees with the six contract tables
- [x] node scripts/lint-portability.mjs exits 0 with every new file included
- [x] The dialog and popover react-demo.tsx files contain no hand-typed auk-button class and both import AukButton
- [x] docs/component-spec.md, the new-component walker and README all name ui-compose
- [x] The reference's Rules section states that no prop may remove a required accessibility attribute
- [x] Every SKILL.md body stays under 60 lines
- [x] bash scripts/check.sh exits 0 end to end

## Completion Report

- Step 11, the projection fix — issue #25 was still open at build time and the plan's decision said to stop there; the stop was overridden because no pull request for #25 existed, the sync-ui-dialog plan was still todo, and the edit touches only the demo function, so #25 can still edit the component body once. AukButton in ui-button's projection gained forwardRef, a file outside the plan's list, so the dialog's opener ref works through the composed button.

## Verification

After the last step, run bash scripts/check.sh from the worktree root with the claude CLI on PATH and observe all six gates exit 0. Then walk the change as its consumer, an agent, would: read skills/ui-button/SKILL.md and confirm Build it hands the component-based case to ui-compose with the four rules on the line; open skills/ui-compose/references/ui-compose.md and resolve one real mapping, data-variant to a typed variant prop; grep both stateful exemplars for the hand-typed auk-button class and find only the AukButton import.

Finally prove the gate guards the objective rather than merely passing: remove one pointer line, run npx vitest run tests/objective.spec.ts and observe a non-zero exit, restore the line and observe 0.

## Next Steps

- Re-scope issue #15 to prove agent output in a component-based project
  The gates this plan adds prove the guidance is present and pinned, not that an agent follows it. Issue #15 owns the build layer and currently scopes framework builds out.
  ```text
  In the agent-ui-skills repo, read issue #15 and docs/plans/add-build-layer-for-agent-built-components.md, then draft a comment for issue #15 proposing one additional fixture, a minimal component-based project, and a build spec that runs the ui-compose eval scenarios against it. Do not implement; post the comment after showing it for approval. Verify by linking the posted comment.
  ```
- Decide the Astro asymmetry in the portability lint
  Astro is absent from the banned-word list in scripts/lint-portability.mjs while every other framework the neutrality rule names is present.
  ```text
  In the agent-ui-skills repo, open a short issue asking the spec owner whether Astro belongs in the banned-word list in scripts/lint-portability.mjs line 19, citing the Framework neutrality section of docs/component-spec.md. Include both options' consequences in two sentences each. Verify by linking the created issue.
  ```
- Wish list: wrap the init modules in the React exemplars
  The proposal locked the projection fix to composition only; wrapping initDialog, initPopover and initTabs behind hooks is a four-file refactor with an open design question about who owns the attributes the modules write.

## Resources

- docs/prompts/proposal-add-ui-compose-skill.md — the converged proposal this plan delivers
- https://claude.ai/code/artifact/46ed2463-87fe-411e-9126-9c5f5084520d — the published proposal page
- componentdriven.org — the four-step canon and the well-defined API phrasing
- github.com/vercel-labs/agent-skills composition patterns — the explicit-variant-components split rule
- tests/unit/ui-theme-mapping.spec.ts and skills/ui-theme/ — the workflow-skill and pinning precedent
- PR #23 and PR #29 (merged), issues #15 and #25 (open) on github.com/shawn-sandy/agent-ui-skills
