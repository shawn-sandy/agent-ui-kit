---
name: ui-theme
description: Theme workflow - binds a project's design tokens, whether a DTCG token file, Figma variables or an existing stylesheet, to the auk role layer, so every component built from the ui- skills takes on the project's brand through at most 23 role lines. Use when components look off next to the rest of the page, when a design system, token file, Figma library or palette should drive them, when a dark or high-contrast scheme must apply to them, or when a request asks to match, re-skin or restyle auk components. Not for restyling elements that are not auk components, not for one component that should differ from the brand, and not for building a component.
license: MIT
metadata:
  kind: workflow
---

# Theme

A workflow that copies the generated `auk-roles.css` into a project and binds the
project's existing tokens to the `--auk-role-*` properties, so components built from
the `ui-` skills wear the project's brand.

## When to use

- auk components already built into a project look off next to the rest of the page.
- A project has a token file, a Figma library, a palette or a type scale the
  components should follow, or a dark or high-contrast scheme they should switch with.

## When not to use

- No auk component exists in the project yet. Build one with a `ui-` skill first;
  there is nothing to bind.
- Restyling something that is not an auk component. That is the project's own
  stylesheet, and this skill emits only `--auk-role-*` bindings.
- One component that should differ from the brand: set its own `--auk-<component>-*`
  property by hand, since a role reaches every component. Changing a component's
  size, spacing or motion: those keep their shipped, measured values.

## Clarify when needed

Use any description the user provides of the brand, the palette, the token names, the
token file or the dark scheme to infer the bindings. If the description, missing token
props or requirements leave one of the six core roles - primary, text, surface, border,
radius, font - unbound, ask about that role, offering the shipped fallback as the
default; never ask about any other role. If the request already maps cleanly, proceed
and state any assumptions.

## Build it

1. Read `references/ui-theme.md` for the guard, the discovery procedure, the mapping
   table, the crosswalk and the output contract.
2. Stop if no stylesheet contains an `auk-` selector: say no auk components were
   found, point at the component skills, and emit nothing.
3. Run discovery in order: a DTCG token file on disk, then Figma variables when a
   Figma file is named and a Figma server is connected, then the stylesheet sources.
   A crosswalk row for a known system short-circuits the matching.
4. Copy `references/auk-roles.css` beside the first stylesheet that contains an `auk-`
   selector, then emit one block of `--auk-role-*` lines under the scope selector,
   plus a dark block and a contrast block only when the project has those forms.
   Every block below `:root` restates the chain lines for the roles it sets.
5. Re-measure with the checks the reference names. Report a measured failure in the
   project's own brand plainly and ask; never revert a brand value silently.

## Non-negotiable

- Only `--auk-role-*` properties are bound, at most 23 lines per block - never a
  size, spacing, duration or placement property, and never a component property
  except to make one component differ from its role.
- A binding to a project token is `var(--token)` with no fallback. The component's
  own literal is the fallback, and it wins when the token or the role is undefined.
- The dark and contrast blocks mirror the project's own forms and never invent values.
- A theme never sets `color-scheme` and never writes a `forced-colors` query. System
  colours stay the reader's.
- No contrast ratio is ever estimated. The tests measure.
