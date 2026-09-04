---
name: plan-md-backtick-code-spans
description: docs/plans/*.md Why/Verify step lines can contain a literal backtick inside an inline code span, breaking CommonMark rendering even though the step still parses fine
metadata:
  type: project
---

`docs/plans/*.md` steps are parsed by a regex,
`^(.*?)\s+Why:\s+(.*?)\s+Verify:\s+(.*)$` (see plan-agent-render / plan-authoring.md).
That regex is plain-text and not markdown-aware, so it will happily match a step whose
Verify clause contains broken Markdown.

Found once (2026-09-04, `enable-simple-component-style-overrides.md` step 10, line 91):
a Verify clause embedded a shell command that itself needed a literal backtick
(`grep -c '^| \`--auk-' docs/properties.md`) inside a single-backtick inline code span.
CommonMark code spans do not honor backslash escapes, so the span closes at the first
literal backtick, and the rest renders as broken text with a stray backtick visible.
Confirmed in the generated `enable-simple-component-style-overrides.html` — the code
span cuts off mid-string and the tail renders as plain text.

**Why:** matters because this repo generates a plan's HTML from the `.md` via
`plan-agent-render`, and a source-level Markdown defect ships straight into the
published render — it will not fail any test, since nothing lints inline-code nesting.

**How to apply:** when reviewing a plan `.md`, grep the Steps section for a backtick
inside an already-open inline code span (a lone `` ` `` character, escaped or not,
between two others) — the Why/Verify regex match succeeding is not proof the line
renders correctly. Fix is to widen the code-span fence to double backticks
(`` ``...` ...`` ``) when the fenced content itself needs a literal backtick.
