---
name: design-kit
description: Regenerates the component sheet with its Claude Design canvas projection, publishes the canvas through the built-in design skill, and records the URL in docs/artifacts.md. Maintainer-only.
disable-model-invocation: true
metadata:
  internal: true
---

# Design kit

The canvas is a Claude-only projection. The record is the generated component sheet,
`docs/designs/components/index.html`, which any agent regenerates with
`node scripts/build-design.mjs` and opens from disk; nothing in this skill changes it.
An agent without this skill loses only the pan-and-zoom page.

This skill lives under `.claude/skills/` and not `skills/` on purpose: it uses
`disable-model-invocation`, which the portability lint bans for packaged skills, and it
needs Claude Code to publish. `tests/integration/internal-skills.spec.ts` keeps it out
of the install list through `metadata.internal`.

## Steps

1. Run `node scripts/build-tokens.mjs`, `node scripts/build-properties.mjs` and then
   `node scripts/build-design.mjs --canvas`. The last one rewrites the sheet and writes
   one `.dc.html` artboard per sheet section plus `canvas.json` into
   `docs/designs/components/canvas/`. Every file is generated; never edit one by hand,
   because `tests/integration/design-sheet.spec.ts` pins the sheet and the canvas to
   `render()` and `renderCanvas()`.
2. Hand the artboards to the built-in `design` skill to seed and publish: working
   files are the `.dc.html` files and `canvas.json` in that directory, `Main.dc.html`
   is the Foundations artboard, the title is `auk Component Sheet`. When
   `docs/artifacts.md` already records a canvas URL for the sheet, republish to that
   URL rather than creating a second page.
3. The `PostToolUse` hook appends a row for a new URL to the "Recently published"
   table at the end of `docs/artifacts.md`. Move that row into the Designs table with
   the description "Claude Design projection of the component sheet; the sheet at
   `docs/designs/components/index.html` is the record", and keep the URL on the page,
   because `tests/integration/artifacts-doc.spec.ts` checks it.
4. Run `npm test`. It must exit zero.

## Do not

- Do not edit a `.dc.html` artboard or `canvas.json` by hand. Change the references
  or `scripts/build-design.mjs` and regenerate.
- Do not name the canvas, the artboards or their format anywhere under `skills/`.
  The public, vendor-neutral design-side contract is
  `skills/ui-theme/references/auk.tokens.json`.
- Do not publish a Figma kit from here. `figma-generate-design` builds one from the
  sheet only when a team on an editing seat asks, and it is never maintained by hand.
