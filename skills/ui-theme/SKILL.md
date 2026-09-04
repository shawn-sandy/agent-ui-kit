---
name: ui-theme
description: Theme workflow - binds a project's design system, whether a DTCG token file, Figma variables or a stylesheet's own tokens, to the auk role layer, so every component built from the ui- skills wears the project's brand instead of the shipped defaults. Emits at most 23 --auk-role-* lines beside the shipped roles file. Use when a design system, token file, Figma file or palette should drive the components, when they look off next to the rest of the page, when a dark or high-contrast scheme must apply to them, or when a request asks to match, re-skin or restyle auk components. Not for restyling elements that are not auk components, not for making one component differ from the brand, and not for building a component.
license: MIT
metadata:
  kind: workflow
---

# Theme

A workflow that binds a project's design system to the auk role layer: 23 semantic
roles that the shipped `references/auk-roles.css` chains every brand-bearing
`--auk-*` property to, so a brand is at most 23 lines.

## When to use

- A project has a design system, a token file, Figma variables or a palette the
  components should follow, or names a known system such as shadcn/ui or Primer.
- auk components already built into a project look off next to the rest of the page.
- A project has a dark or high-contrast scheme and the components should switch with it.

## When not to use

- No auk component exists in the project yet. Build one with a `ui-` skill first.
- Restyling something that is not an auk component. That is the project's own
  stylesheet, and this skill emits only `--auk-role-*` bindings.
- Making one component differ from the brand. Set that component's own `--auk-*`
  property by hand, outside any layer; the roles file leaves it in charge.
- Changing a component's size, spacing or motion; those keep their measured values.

## Clarify when needed

Use any description the user provides of the brand, the palette, the token names,
the token file or the dark scheme to infer the bindings. Discovery reads a token file
first, then Figma variables when a Figma file is named and a server is connected,
then the stylesheet sources. If the description, missing token props or
requirements leave one of the six core roles - primary, text, surface, border,
radius, font - unbound, ask about that role, offering the shipped fallback as the
default; never ask about any other role. If the request already maps cleanly,
proceed and state any assumptions.

## Build it

1. Read `references/ui-theme.md` for the guard, the discovery procedure, the mapping
   table, the crosswalk and the output contract.
2. Stop if no stylesheet contains an `auk-` selector: say no auk components were
   found, point at the component skills, and emit nothing.
3. Run discovery in order: a DTCG token file on disk, then Figma variables when the
   request names a Figma file and a Figma server is connected, then the stylesheet
   sources - custom properties, literal frequency, the dark and contrast check, the
   capped interview. A crosswalk row for a known system settles its cells first.
4. Copy `references/auk-roles.css` beside the first stylesheet that contains an
   `auk-` selector, then emit one block of `--auk-role-*` lines under the scope
   selector, plus the mirrored dark and contrast blocks only when the project has them.
5. Re-measure with the checks the reference names. Report a measured failure in the
   project's own brand plainly and ask; never revert a brand value silently.

## Non-negotiable

- Only roles are bound - never a component property, and never a size, spacing,
  duration or placement property. A component property is the user's own line.
- A binding to a project token is `var(--token)` with no fallback. The component's
  own literal is the fallback, and it wins when the token is undefined.
- The dark and contrast blocks mirror the project's own forms and never invent values.
- A theme never sets `color-scheme` and never writes a `forced-colors` query.
- No contrast ratio is ever estimated. The tests measure.
