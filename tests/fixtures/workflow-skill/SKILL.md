---
name: workflow-skill
description: Deliberately broken workflow skill that proves the gate partition can still fail. Declares the workflow marker and ships no evals file.
metadata:
  kind: workflow
---

# Workflow skill

This fixture is a workflow skill by its marker, so the component-only gates skip it.
It lives outside `skills/` so the real gates never see it, and it ships without an
`evals/workflow-skill.json` on purpose: the evals gate is one a workflow skill keeps,
and `tests/unit/skill-kind.spec.ts` names this file to show the partition still
rejects a workflow skill that owes one.

## Clarify when needed

Ask about the description, props and requirements before building.
