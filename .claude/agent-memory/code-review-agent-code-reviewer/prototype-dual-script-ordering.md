---
name: prototype-dual-script-ordering
description: agent-ui-skills docs/prototypes/*.html pattern where a second "live preview" script depends on running after a first "table CRUD" script — usually not a bug
metadata:
  type: project
---

`docs/prototypes/*.html` files in this repo (agent-ui-skills) commonly ship two inline
`<script>` blocks: one implements a localStorage-backed records table (add/delete/reset),
the other is a "live preview" that reads the same store and applies it to a real
component. The preview script is written second in the file and calls `apply()` inside
listeners for the same events the table script already handles (form `submit`, a
container's `click` for row deletes, and the reset button's `click`).

This looks fragile at a glance ("relies on running second") but is actually guaranteed
two different ways, confirmed live in `apply-component-style-overrides.html` with
Playwright:
- Row delete: the table script's listener is on the `<button class="btn-danger">`
  itself; the preview script's listener is on an ancestor (`#rows`). DOM bubbling
  guarantees the target listener fires before the ancestor listener — this is
  structural, not order-of-registration.
- Form submit / reset button: both scripts attach a listener to the *same* element for
  the *same* event type. Per the DOM spec, same-target listeners run in registration
  order, so this genuinely does depend on the table script's `<script>` tag appearing
  before the preview script's `<script>` tag in the file. It currently holds, but is a
  real (if minor) fragility if someone reorders the script blocks or moves one to `defer`.

**Why:** Verified end-to-end with a headless Chromium run (padding-inline 16px→0px on
reset-toggle, font-weight 3-of-3→2-of-3 on layer-toggle, inline custom properties fully
cleared after delete-all with no leftovers, no console errors) — the coordination works
correctly as designed.

**How to apply:** Do not flag the "runs after" comment as a bug by itself. Only flag it
if the *same-element, same-event* case (form submit, reset button) is reordered or one
script is deferred/async relative to the other — that specific case has no structural
guarantee and would silently make the preview stale.
