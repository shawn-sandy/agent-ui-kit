---
name: design-kit
description: Publishes the Claude Design canvas projection of this repository's component sheet. Runs scripts/build-design.mjs with --canvas, hands the artboards to the design skill to publish, and records the canvas URL in docs/artifacts.md.
disable-model-invocation: true
metadata:
  internal: true
---

# Design kit

Claude-only, and optional. The design-side record is the generated component sheet at
`docs/designs/components/index.html`: any agent regenerates it with
`node scripts/build-design.mjs`, any browser opens it from disk, and printing it is the
hand-off. This skill publishes the sheet's Claude Design projection - one pan-and-zoom
canvas with an artboard per sheet section - which only Claude Code can do. An agent
without this skill runs the generator and opens the sheet, and loses nothing but the
canvas page. Nothing here is needed to use the components or the token file.

## Steps

1. Run `node scripts/build-design.mjs --canvas`. It rewrites the sheet and writes one
   `.dc.html` artboard per section plus `canvas.json` into
   `docs/designs/components/canvas/`. `tests/integration/design-sheet.spec.ts` pins the
   sheet and every listed artboard to the generator, so never hand-edit either.
2. Hand the artboards to the built-in `design` skill to publish, asking it to seed the
   canvas from the existing `canvas.json` rather than draft new artboards. If a canvas
   for the sheet is already listed in the Designs table of `docs/artifacts.md`, publish
   to that URL so the link never changes.
3. The Artifact publish hook appends a row to the Recently published table of
   `docs/artifacts.md`. Move it into the Designs table, describing it as the Claude
   Design projection of `docs/designs/components/index.html`, with the sheet named as
   the record.
4. Run `npx vitest run tests/integration/design-sheet.spec.ts tests/integration/artifacts-doc.spec.ts`
   and commit the canvas files with the artifacts row.

## Do not

- Do not edit an artboard or `canvas.json` by hand; edit a reference and regenerate.
- Do not call the canvas the record anywhere. The sheet is; the canvas, and any Figma
  kit built from the sheet with `figma-generate-design`, are projections of it.
- Do not run this for a change that did not alter what the sheet shows.
