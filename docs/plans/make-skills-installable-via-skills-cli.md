---
status: in-progress
modified: 2026-09-03
type: chore
created: 2026-09-03
repo-name: agent-ui-kit
artifact-url: https://claude.ai/code/artifact/3fde0cb0-a799-4e78-9b36-f3f27b92137b
issue: https://github.com/shawn-sandy/agent-ui-kit/issues/11
glance: skills.sh builds its directory from anonymous install counts, so the first installs decide which repository name the listing lives under and what it shows. Today a maintainer-only scaffolding skill would ship to every installer, and the documented install name points at a repository that does not exist. Done means the skills CLI reports exactly six skills under the settled name and npm run check stays green.
---

# Plan: Make the six ui- skills one command away for every skills-CLI user

## Objective

Anyone can run `npx skills add shawn-sandy/agent-ui-skills` and receive exactly the six
public ui- skills, with the GitHub repository, the README and the manifests all agreeing
on one name, so the skills.sh listing that later grows from installs sits under a single
name and never shows maintainer tooling.

## Context

skills.sh is Vercel's public directory of agent skills. It has no submission form and no
registration API. A repository page such as skills.sh/shawn-sandy/agent-ui-skills
appears only after real users run `npx skills add` against it, because that command
reports an anonymous install count. Listing is therefore a side effect of shipping a
clean install path, not a separate publishing step.

The install path already works. On 2026-09-03, skills CLI 1.5.23 cloned the public
repository and found the six `skills/ui-*` skills with no changes to the tree. Two
defects stand between that and a clean listing.

First, the CLI also scans `.claude/skills/`, so `new-component`, the repository's own
scaffolder for adding a component, is offered to every installer as a seventh skill.
The CLI documents a frontmatter flag, `metadata.internal: true`, that hides a skill
from discovery. In a scratch copy holding one public skill plus the patched scaffolder,
the CLI reported "Found 1 skill", so the flag works. `tests/lib/frontmatter.ts` lists
`metadata` among the Agent Skills standard keys and skips `.claude/skills/` for its
ui- prefix rule, and `claude plugin validate . --strict` passed on a scratch copy with
the flag added, so the repository's own gates are expected to accept the change.

Second, the GitHub repository is still named `agent-ui-kit`, while package.json, both
plugin manifests, the README install lines, AGENTS.md, the docs and the eval scripts
all say `agent-ui-skills`. `github.com/shawn-sandy/agent-ui-skills` returns not found,
so the README's marketplace lines and the manifests' homepage links are dead today.

Risk: skills.sh files install counts under the name people type. Renaming after
installs begin would split the listing across two names. Mitigation: the rename is
step 1 and the README advertises the command only afterwards. The skills.sh page is a
404 today, so no counts exist yet to split.

Packs (skills.sh/docs/packs) are unlisted bundles assembled in the skills.sh web UI
after a Vercel sign-in. They add nothing over the repository itself and are not part of
this plan. A root `skills.sh.json` only groups skills on the listing page and is skipped
while the catalog fits on one screen.

## Decisions

- Rename the GitHub repository to agent-ui-skills rather than rewriting the tree to
  agent-ui-kit. Every tracked file, the plugin name, the npm package name and the product
  name already say agent-ui-skills, and a merge commit on main is titled "merge main into
  agent-ui-skills rename", so the GitHub name is the one thing lagging a decision already
  made. GitHub redirects the old clone URL, so existing checkouts keep working. The
  alternative would touch README.md, package.json, both plugin manifests, the marketplace
  manifest, AGENTS.md, docs/vendor-support.md and the two eval scripts that filter skill
  invocations by the `agent-ui-skills` prefix. Confirmed by the user on 2026-09-03.
- Hide the scaffolder with `metadata.internal: true` rather than moving it out of
  `.claude/skills/`. The key is part of the Agent Skills standard, the CLI honours it,
  and Claude Code keeps loading the skill for the /new-component command.
- Guard the leak with a filesystem test, not a live CLI run. The CLI needs the network
  and npx, which would make `npm test` slow and flaky. The live `--list` check lives in
  Verification instead.

## Files

- tests/integration/internal-skills.spec.ts (new) — every SKILL.md the skills CLI scans outside skills/ must declare metadata.internal true
- .claude/skills/new-component/SKILL.md (modified) — add the metadata.internal flag so installers never see the scaffolder
- README.md (modified) — add the skills CLI install command to the Install section

## Steps

1. [x] Rename the GitHub repository with `gh repo rename agent-ui-skills --repo shawn-sandy/agent-ui-kit --yes`. Why: every manifest, the README and the package already use agent-ui-skills, and skills.sh files install counts under the name people type, so the name must be settled before anyone installs; this changes the public repository, so run it yourself or approve it explicitly rather than letting an implementing agent run it unprompted. Verify: `gh repo view shawn-sandy/agent-ui-skills --json name` prints agent-ui-skills and https://github.com/shawn-sandy/agent-ui-skills loads in a browser.
2. [x] Point the local checkout at the new address with `git remote set-url origin https://github.com/shawn-sandy/agent-ui-skills.git`. Why: GitHub redirects the old URL, but `gh` warns on every call until the remote matches, and tooling that reads the repository name from the remote would keep reporting agent-ui-kit. Verify: `git remote -v` shows the agent-ui-skills URL and `git fetch origin` succeeds without a redirect warning.
3. [x] Export the existing `isPackagedSkill` helper from tests/lib/frontmatter.ts, then write the failing regression test tests/integration/internal-skills.spec.ts, opening with the same purpose comment every spec in tests/ carries and following the data-driven style of tests/integration/manifests.spec.ts: walk the whole repository for SKILL.md files with Node's `readdirSync(root, { recursive: true })`, skipping `node_modules/` and `tests/fixtures/`, partition the paths with `isPackagedSkill`, parse each with gray-matter (already a devDependency), and assert that every non-packaged file has `data.metadata.internal === true` while no packaged file under `skills/` carries the flag. Why: the skills CLI offers every SKILL.md it scans to installers, so a maintainer skill without the flag leaks into the public install list; reusing the helper that already draws the packaged-versus-internal boundary for the ui- prefix rule keeps the two tests from drifting apart, a repository-wide walk catches a maintainer skill dropped into any directory rather than only three named ones, and writing the test before the fix proves it can fail. Verify: `npx vitest run tests/integration/internal-skills.spec.ts` fails and the failure names .claude/skills/new-component/SKILL.md, and `npx vitest run tests/unit/frontmatter.spec.ts` still passes.
4. [x] Add two frontmatter lines to .claude/skills/new-component/SKILL.md after the existing `disable-model-invocation: true` line, a `metadata:` key holding `internal: true`. Why: it is the documented way to hide a skill from the skills CLI, it is a standard Agent Skills key so the repository's own validator accepts it, and Claude Code still loads the skill for /new-component. Verify: the step 3 test passes, and `npx skills add "$PWD" --list` run from the repository root reports "Found 6 skills" with no new-component entry.
5. [x] Add the skills CLI as the first entry of the Install section in README.md, directly after the sentence "The repository is both a plugin and its own marketplace.", as a bold "Skills CLI" label, a fenced block containing `npx skills add shawn-sandy/agent-ui-skills`, and one sentence saying the command installs into Claude Code, Codex, Cursor, Copilot and the other agents the CLI supports, and add one `it` to tests/integration/internal-skills.spec.ts that reads README.md and asserts it contains the exact string `npx skills add shawn-sandy/agent-ui-skills`. Why: it is the only install path that works for every agent with one command and the only one that feeds the skills.sh listing, and the README never mentions it; nothing in `npm run check` reads README.md today, so without the assertion a later edit could drop or mistype the line silently. Verify: `grep -n 'npx skills add shawn-sandy/agent-ui-skills' README.md` prints one line inside the Install section, and `npx vitest run tests/integration/internal-skills.spec.ts` passes, then fails when that README line is removed.

## Tests

Tier 1 — This plan changes application code
- Objective: no maintainer-only skill reaches installers and the six public skills stay public. File: tests/integration/internal-skills.spec.ts; Type: smoke; Asserts: every SKILL.md under .claude/skills, .agents/skills or .codex/skills declares metadata.internal true, and no SKILL.md under skills/ does; Run: npx vitest run tests/integration/internal-skills.spec.ts
- Integration: the README advertises the install command. File: tests/integration/internal-skills.spec.ts; Targets: README.md Install section; Key cases: the exact string `npx skills add shawn-sandy/agent-ui-skills` is present

## Acceptance Criteria

- [x] `gh repo view shawn-sandy/agent-ui-skills --json name` succeeds, and `git ls-remote https://github.com/shawn-sandy/agent-ui-kit.git HEAD` still resolves through GitHub's redirect.
- [ ] `npx skills add shawn-sandy/agent-ui-skills --list` prints "Found 6 skills" and lists only ui-alert, ui-box, ui-button, ui-dialog, ui-popover and ui-tabs.
- [x] `npx vitest run tests/integration/internal-skills.spec.ts` passes, and fails again when the two metadata lines are removed from the scaffolder.
- [x] The Install section of README.md contains a fenced block whose only content is `npx skills add shawn-sandy/agent-ui-skills`.
- [x] `npm run check` prints "check.sh: all gates passed".
- [x] In an interactive Claude Code session opened at the repository root, typing /new-component still offers the scaffolder.

## Verification

From a fresh clone of the renamed repository, run `npm install && npx playwright install
chromium && npm run check` and confirm the last line is "check.sh: all gates passed".
That covers the new vitest test, the portability lint, the demo check, the plugin
manifest validation and the browser suite in one run.

Then, from any directory outside the repository, run
`npx skills add shawn-sandy/agent-ui-skills --list` and confirm it prints "Found 6
skills" followed by the six ui- names and nothing else. Run the same command with the
old name, shawn-sandy/agent-ui-kit, and confirm it still resolves through the redirect.

Finally, do one real install into a throwaway project:
`npx skills add shawn-sandy/agent-ui-skills --skill ui-button -a claude-code -y` and
confirm `.claude/skills/ui-button/SKILL.md` appears there. This is the first install the
CLI reports to skills.sh, so the repository page at skills.sh/shawn-sandy/agent-ui-skills
should appear within a day of it. A 404 before that first install is expected and is
not a failure of this plan.

## Next Steps

- Record the skills CLI as a third verified vendor path in docs/vendor-support.md
  The doc records what actually happened for Claude Code and Codex; the CLI run belongs beside them.
  ```text
  In the shawn-sandy/agent-ui-skills repository, add a short section to
  docs/vendor-support.md recording the skills CLI path: the command
  `npx skills add shawn-sandy/agent-ui-skills --list`, the CLI version you ran,
  the date, and the exact skill list it printed. Match the existing table style and
  wrap prose at 88 columns. Verify by running the command yourself and pasting its
  output, then run `npm run check` and confirm it prints "check.sh: all gates passed".
  ```
- Wish list: add a root skills.sh.json to group the listing page once the catalog outgrows one screen (schema https://skills.sh/schemas/skills.sh.schema.json). Not needed at six skills.

## Unresolved Questions

- Resolved 2026-09-03: the user confirmed the rename. The fallback, had it been
  declined, was a sweep rewriting the name in README.md, package.json, the three
  manifests, AGENTS.md, two docs and the two eval scripts.
- The README's "Any other agent" paragraph tells readers to copy folders by hand. The
  CLI entry makes it mostly redundant, but rewriting it is out of scope here.

## Resources

- https://www.skills.sh/docs/packs - what a pack is; confirms packs are unlisted bundles, not a listing route
- https://www.skills.sh/docs/faq - listing is automatic from install telemetry; no submission process
- https://www.skills.sh/docs/cli - install command shape and the DISABLE_TELEMETRY opt-out
- https://www.skills.sh/docs/api - public API has no registration or refresh endpoint
- https://www.skills.sh/docs/customize - skills.sh.json groups skills on the repository page only
- https://github.com/vercel-labs/skills - discovery directories, metadata.internal syntax, --list and --skill flags
- https://vercel.com/kb/guide/agent-skills-creating-installing-and-sharing-reusable-agent-context - Vercel's own guide confirming repos surface through installs

## Team Review (2026-09-03 20:02 UTC)

### Executive Summary

Sound with revisions. Seven reviewers ran (architecture, completeness, testability,
risk, conventions, product, security) and none was lost. Coverage, verbatim from the
workflow: 20 findings raised, 19 standing, 0 verified, 19 unverified (below the
high-severity verify threshold), 0 verifier failures, 1 refuted and dropped (the only
high-severity finding; its skeptic refuted it). The recurring theme was the shape of the
step 3 regression test: five of seven lenses asked it to reuse the packaged-skill
boundary that tests/lib/frontmatter.ts already draws and to walk the whole repository.
Two lenses flagged that GitHub's rename redirect is temporary. No reviewer asked for the
plan to be rethought. The 19 findings were merged into 11 distinct edits for triage.

### Role-by-Role Findings

#### Architecture Review

Reuse `isPackagedSkill` rather than re-deriving the directory boundary in the new test;
list tests/lib/frontmatter.ts under Files. Design otherwise sound.

#### Completeness Review

Name the directory-walk mechanism (Node's recursive readdirSync, no glob dependency);
add the `repo-name` frontmatter key the plan-authoring rule requires.

#### Testability Review

Guard the walk against directories that do not exist yet; add an automated assertion
for the README install line, since nothing in `npm run check` reads README.md.

#### Risk Review

GitHub's rename redirect stops once the old name is reclaimed, and the plan gives no
rollback command; pin the CLI version in verification commands; mark criterion 6 as a
manual check.

#### Conventions Review

Same helper-reuse concern as architecture; the new spec should open with the purpose
comment every spec in tests/ carries.

#### Product Review

Verification never exercises the objective's literal promise (a full install with no
`--skill` filter); the redirect caveat belongs in Context.

#### Security Review

Disclose the install telemetry and its opt-out in the README; check CI identity after
the rename (both Claude workflows request id-token write and use a repo secret); make
the test repository-wide so an unflagged skill in any scanned directory is caught; pin
the CLI version; name the credential path for the rename.

### Agreements and Conflicts

- Confirmed concern: step 3 test design. Architecture, conventions, completeness,
  testability and security converged on helper reuse and a repository-wide walk.
- Confirmed concern: the rename redirect is temporary. Risk and product both raised it.
- No direct conflicts. Risk and security both wanted version pinning; product wanted the
  live install exercised instead.

### Highest-Risk Issues

1. Step 3 duplicates the packaged-skill boundary (medium, five lenses). Accepted.
2. README recommends a command that reports telemetry without saying so (medium,
   security). Rejected by the developer.
3. Rename redirect is temporary and no rollback is named (medium, risk and product).
   Rejected by the developer.
4. The full install is never exercised end to end (medium, product). Rejected by the
   developer.
5. CI identity after the rename is unchecked (medium, security). Rejected by the
   developer; repository secrets survive a rename.

### Inline Edits to Apply

| Target | Action | New Content / Notes | Source / Rationale | Verdict |
|---|---|---|---|---|
| step 3 | edit | Export `isPackagedSkill`; repository-wide recursive walk skipping node_modules and tests/fixtures; partition with the helper; non-packaged files must carry `metadata.internal: true`, packaged must not; purpose comment; Verify also runs tests/unit/frontmatter.spec.ts | architecture, conventions, completeness, testability, security: one boundary, one source of truth, catches any directory | unverified, below verify threshold |
| Files | edit | Add tests/lib/frontmatter.ts (modified) | architecture, conventions: Files must name every file the steps touch | unverified, below verify threshold |
| frontmatter | edit | Add `repo-name: agent-ui-kit` | completeness: plan-authoring rule requires the key | unverified, below verify threshold |
| Context | insert | Redirect is temporary; rollback `gh repo rename agent-ui-kit --repo shawn-sandy/agent-ui-skills --yes` | risk, product: residual risk of the authorised rename | unverified, below verify threshold |
| Verification | edit | Full install with no `--skill` filter; confirm six folders, no new-component | product: the objective's literal promise | unverified, below verify threshold |
| step 5 | edit | Sentence disclosing the anonymous install count and `DISABLE_TELEMETRY=1` | security: readers should know the command reports | unverified, below verify threshold |
| step 5 | edit | Assertion that README.md contains the exact install string | testability: criterion 4 has no automated guard | unverified, below verify threshold |
| Verification | edit | Pin `npx skills@1.5.23`; supply-chain hygiene paragraph | risk, security: reproducibility | unverified, below verify threshold |
| criterion 6 | edit | Mark as a manual, one-time check | risk: no automated coverage | unverified, below verify threshold |
| after step 2 | insert | Step confirming CI still authenticates after the rename | security: OIDC subject and secret scope change with the name | unverified, below verify threshold |
| step 1 | edit | Run from an authenticated `gh`, never an inlined token; Verify checks `gh auth status` | security: credential hygiene | unverified, below verify threshold |

#### Triage Outcome

The developer walked through all 11 merged edits.

**Accepted** (applied as-is):

- step 3: helper reuse and repository-wide walk.
- frontmatter: `repo-name: agent-ui-kit`. The developer asked whether the value should
  be agent-ui-skills; the plan-authoring rule resolves it from the origin remote's
  basename, which is agent-ui-kit today, and the other plan carrying the key uses the
  same value, so agent-ui-kit was applied.
- step 5: the README install-line assertion. A matching bullet was added to Tests so
  the catalogue names every assertion the spec file carries.

**Modified** (applied with revised content):

- None.

**Rejected** (recorded only, never applied):

- Files: tests/lib/frontmatter.ts entry. Declined by the developer; note that the
  accepted step 3 does modify that file.
- Context: redirect risk and rollback command. Declined by the developer.
- Verification: full install with no filter. Declined by the developer.
- step 5: telemetry disclosure. Declined by the developer.
- Verification: CLI version pinning and hygiene. Declined by the developer.
- criterion 6: manual-check annotation. Declined by the developer.
- after step 2: CI identity step. Declined; repository secrets survive a rename and CI
  on this account is often billing-blocked.
- step 1: credential wording. Declined; noise in the plan's most important step.

### Revised Plan

The sections above this Team Review are the revised plan as of this review. The
rendered page is at the artifact-url in the frontmatter.
