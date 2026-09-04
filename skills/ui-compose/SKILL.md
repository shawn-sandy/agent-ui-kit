---
name: ui-compose
description: Composition workflow - shapes auk components for a component-based project, with typed props derived from the contract table, explicit variant components instead of layout-switching flags, sibling auk components composed rather than re-typed, and each component renderable alone. Use when the target project is built from components, when a request asks to wrap, port or adapt an auk component into the project's component model, or when a screen must be assembled from auk parts. Not for a plain HTML page and not for theming.
license: MIT
metadata:
  kind: workflow
---

# Compose

A workflow that turns a component's contract table into a public component surface
for a project built from components, following Component Driven Design.

## When to use

- A project keeps its user interface in components - a `components` directory, or
  source files with a component file extension - and an auk component is going in.
- A request asks to wrap, port or adapt an auk component into the project's own
  component model, or to assemble a screen from several auk parts.

## When not to use

- A plain page with no component model. The component skill's Structure block is
  the whole answer there, and this skill emits nothing.
- Theming. Colours, radius and type are `ui-theme`; this skill never sets a
  `--auk-*` property.
- A component this kit does not ship. The mapping starts from a contract table, and
  a component without one has nothing to map.

## Clarify when needed

Use any description the user provides of the project's component conventions - file
layout, naming, how props are typed, whether a story harness exists - to infer the
mapping. Discovery reads the project first. If the description, missing props or
requirements leave it unclear which sibling components the project already owns, or
whether a structural prop should split, ask about that before building. If the
request already maps cleanly, proceed and state the mapping and any assumptions.

## Build it

1. Read `references/ui-compose.md` for the guard, discovery, the mapping table, the
   four rules and the output contract.
2. Stop if the project is not component-based: say so, point at the component
   skill's own Build it, and emit nothing.
3. Read the component's contract table in `ui-<component>/references/ui-<component>.md`.
4. Map every contract row to the public surface with the mapping table.
5. Apply the four rules in order: props from the contract table, split only on
   structure, compose sibling auk components, render alone.
6. Emit the component file; a thin router only when a structural prop splits it;
   stories only when a story harness is already present.
7. State the mapping and any split in the reply, so a reviewer can check both.

## Non-negotiable

- Props come from the contract table. A required attribute with one fixed value is
  hard-coded, never exposed, and no prop may remove a required accessibility
  attribute.
- A prop that changes which parts render is a variant component, not a flag. A prop
  that only writes `data-variant` or a class stays a prop.
- A sibling auk component the project already owns is composed, never re-typed.
- The emitted component renders with no app-level import. A story harness is used
  when present and never installed.
- The root class, every `data-part` and every attribute the contract marks required
  are emitted verbatim. The attributes the module writes stay the module's.
