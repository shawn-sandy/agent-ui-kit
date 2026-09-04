# Published artifacts

Every claude.ai artifact published from this repo, with the file that records its URL.
Artifacts are private to the maintainer's account unless shared from the page. Each URL
is stable: republishing updates the page in place, so links here never need to change.

## Overview

| Artifact | What it is | Recorded in |
| --- | --- | --- |
| [Agent UI Skills](https://claude.ai/code/artifact/3474b8f0-f906-4f3a-95f7-45c9cf539de3) | Living project overview: goal, format, what ships, gates, evidence, status, roadmap. Refresh procedure is in `CLAUDE.md`. | `CLAUDE.md` |

## Proposals

| Artifact | What it is | Recorded in |
| --- | --- | --- |
| [ui-theme Proposal](https://claude.ai/code/artifact/35196d3b-8a93-4af5-a0ba-17cfa4956446) | Published page for the proposal to add a ui-theme skill. | not linked from the repo; source is `docs/proposals/add-ui-theme-skill.md` |

## Plans

Each plan's `artifact-url` frontmatter key points at its published page. Status comes
from the same frontmatter.

| Artifact | Status | Recorded in |
| --- | --- | --- |
| [Plan: Build vendor-neutral UI component skills](https://claude.ai/code/artifact/aabf412c-2636-4254-9a21-615215b8c4ce) | in-progress | `docs/plans/build-ui-component-skills.md` |
| [Plan: Give the kit a box to build layouts on](https://claude.ai/code/artifact/3ac8af41-5a39-4bc7-aa5e-456dfe8bc9bb) | completed | `docs/plans/add-box-layout-component-skill.md` |
| [Plan: Make the six ui- skills one command away for every skills-CLI user](https://claude.ai/code/artifact/3fde0cb0-a799-4e78-9b36-f3f27b92137b) | completed | `docs/plans/make-skills-installable-via-skills-cli.md` |
| [Plan: Ship a non-modal popover skill on the native popover attribute](https://claude.ai/code/artifact/4e94d7ac-07d7-48cc-b1a7-2917796d9c77) | completed | `docs/plans/add-ui-popover-skill.md` |
| [Plan: Prove each skill by testing what an agent actually builds from it](https://claude.ai/code/artifact/dee6ed17-545d-4356-b5ba-2063e66d4436) | todo | `docs/plans/add-build-layer-for-agent-built-components.md` |
| [Plan: Add the ui-theme workflow skill that binds a project's styles to the auk custom properties](https://claude.ai/code/artifact/f21dc0a6-79c1-453a-b568-9bc98ef8ec2b) | completed | `docs/plans/add-ui-theme-workflow-skill.md` |
| [Plan: Bring ui-dialog back in line with the native dialog element](https://claude.ai/code/artifact/f56741f9-bfb0-4616-bc12-78e829d5d996) | todo | `docs/plans/sync-ui-dialog-with-native-spec.md` |

## Designs

| Artifact | What it is | Recorded in |
| --- | --- | --- |
| [ui-theme Plan Canvas](https://claude.ai/code/artifact/d9bb436b-2d3a-40b0-ae1c-6c00a50fcc86) | Design canvas for the ui-theme plan, one artboard per user-facing step. | `design:` key in `docs/plans/add-ui-theme-workflow-skill.md`; local copy at `docs/designs/add-ui-theme-workflow-skill/ui-theme-plan-canvas.html` |

## Session recaps

| Artifact | What it is | Recorded in |
| --- | --- | --- |
| [Reviewer stall and eval read fixes](https://claude.ai/code/artifact/6124c3f7-244e-48d9-a136-0bf809a1b30a) | Engineering recap of PR #21 (private plugin copy per eval run) and a related reviewer-stall fix in the agentics repo. | not linked from the repo |

## Keeping this list current

Two things keep this file honest:

- A `PostToolUse` hook in `.claude/settings.json` runs `scripts/record-artifact.mjs`
  after every Artifact publish made from this checkout. It appends a row to the
  "Recently published" table below unless the URL is already on this page. Move that
  row into the right section above when you next touch the file.
- `tests/integration/artifacts-doc.spec.ts` fails `npm test` when a plan's
  `artifact-url` or `design` frontmatter, or the overview URL in `CLAUDE.md`, is
  missing from this page.

A page published from a claude.ai chat rather than from Claude Code never passes
through the hook. Add those by hand. The artifact list on the account is the source of
truth.

## Recently published

Rows the hook appended. Keep this table last in the file: the hook appends to the end.

| Artifact | Date |
| --- | --- |
