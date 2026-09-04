---
name: ui-theme
description: Theme workflow - binds a project's existing colours, corner radius and type to the auk custom properties, so every component built from the ui- skills takes on the project's brand instead of the shipped defaults. Use when components look off next to the rest of the page, when a design system, token file or palette should drive them, when a dark scheme must apply to them, or when a request asks to match, re-skin or restyle auk components. Not for restyling elements that are not auk components, and not for building a component.
license: MIT
metadata:
  kind: workflow
---

# Theme

A workflow that maps a project's existing styles onto the `--auk-*` custom
properties, so components built from the `ui-` skills wear the project's brand.

## When to use

- auk components already built into a project look off next to the rest of the page.
- A project has design tokens, a palette or a type scale the components should follow.
- A project has a dark scheme and the components should switch with it.

## When not to use

- No auk component exists in the project yet. Build one with a `ui-` skill first;
  there is nothing to bind.
- Restyling something that is not an auk component. That is the project's own
  stylesheet, and this skill emits only `--auk-*` bindings.
- Changing a component's size, spacing or motion. Those properties keep their
  shipped values so the measured target sizes and focus offsets hold; a project
  that wants them different sets them by hand, deliberately.

## Clarify when needed

Use any description the user provides of the brand, the palette, the token names or
the dark scheme to infer the bindings. Discovery reads the stylesheet sources first.
If the description, missing token props or requirements leave one of the six core
roles - primary, text, surface, border, radius, font - unbound, ask about that role,
offering the shipped fallback as the default; never ask about any other role. If the
request already maps cleanly, proceed and state any assumptions.

## Build it

1. Read `references/ui-theme.md` for the guard, the discovery procedure, the mapping
   table and the output contract.
2. Stop if no stylesheet contains an `auk-` selector: say no auk components were
   found, point at the component skills, and emit nothing.
3. Run discovery over the stylesheet sources: custom properties first, then literal
   frequency, then the dark-scheme check, then the capped interview.
4. Emit one `:root` block per the output contract, appended to the stylesheet that
   declares the project's tokens, plus a dark block only when the project has one.
5. Re-measure with the checks the reference names. Report a measured failure in the
   project's own brand plainly and ask; never revert a brand value silently.

## Non-negotiable

- Only the brand-bearing properties in the mapping table are set - never a size,
  spacing, duration or placement property.
- A binding to a project token is `var(--token)` with no fallback. The component's
  own literal is the fallback, and it wins when the token is undefined.
- The dark block mirrors the project's own dark form and never invents dark values.
- No `forced-colors` query. System colours stay the reader's.
- No contrast ratio is ever estimated. The tests measure.
