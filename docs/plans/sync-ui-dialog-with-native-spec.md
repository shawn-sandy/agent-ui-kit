---
status: todo
type: fix
created: 2026-09-03
repo-name: agent-ui-skills
effort: medium
workflow: never
artifact-url: https://claude.ai/code/artifact/f56741f9-bfb0-4616-bc12-78e829d5d996
issue: https://github.com/shawn-sandy/agent-ui-skills/issues/25
prototype: docs/prototypes/check-dialog-dismissal.html
proto-model: {"entity":"Dismissal check","fields":[{"name":"gesture","type":"string"},{"name":"closedby","type":"string"},{"name":"expected","type":"bool"},{"name":"observed","type":"bool"}],"action":"Record check","successSignal":"checks matching the spec"}
glance: The ui-dialog skill already leans on the native dialog element for almost everything, but a review against web.dev and MDN found four places where it drifts - the React projection silently loses its initial focus, backdrop dismissal is hard-wired instead of following the platform's closedby attribute, the confirmation example never mentions role="alertdialog", and the reason given for using native autofocus is one Chromium contradicts. Done means two new Playwright tests go from red to green, the docs say only what was measured, and scripts/check.sh exits zero.
---

# Plan: Bring ui-dialog back in line with the native dialog element

## Objective

Fix the four spec drifts found in the `ui-dialog` review: make the React projection
honour `autofocus`, govern backdrop dismissal with the native `closedby` attribute
instead of an unconditional click handler, document `role="alertdialog"` as the one
permitted role override, and replace the incorrect `:focus-visible` justification with
the measured one, while filling the small documentation gaps the review listed.

## Context

The `ui-dialog` skill ships a modal built on the native `<dialog>` element. A review on
2026-09-03 compared it line by line with the two reference pages, web.dev's "Learn HTML:
Dialog" and MDN's `<dialog>` element page. The core is right: it opens only with
`showModal()`, which makes the page behind inert (unclickable and unfocusable), styles
the backdrop through the `::backdrop` pseudo-element, writes no `role` or `aria-modal`
by hand, uses the native `autofocus` attribute, and restores focus to the opener with a
fallback for an opener that was removed. The drift is at the edges, and every item
below was measured in a real Chromium against `references/demo.html` rather than
inferred.

Finding 1, a confirmed bug. `references/react-demo.tsx` passes the `autoFocus` prop to
the "Keep account" button. React's client renderer never writes the `autofocus`
attribute: `ReactDOMComponent.js` skips it in `setProp` with the comment "We polyfill it
separately on the client during commit", and `ReactFiberConfigDOM.js` calls
`domElement.focus()` once in `commitMount`. That call runs while the dialog is still
closed, so it does nothing. When `showModal()` later runs there is no attribute to
honour, and the browser focuses the first focusable element. Reproduced in Chromium 151:
focus landed on the "Close dialog" button, which the contract calls the worse landing.

Finding 2, a divergence with a confirmed downside. The platform's switch for closing on
an outside click ("light dismiss") is the `closedby` attribute. For a modal the default
is `closerequest`: Escape closes, an outside click does not. The module's
`onDialogClick` adds light dismiss to every dialog with no opt-out, so a dialog holding
a form loses its input on a stray click. It also closes on a drag that starts on the
dialog text and releases on the backdrop, because the resulting `click` event targets
the dialog element itself. Native light dismiss requires both the press and the release
to land outside, so it does not have that bug. Support for the attribute today, from
MDN's browser-compat-data:

| Attribute | Chrome | Firefox | Safari |
| --- | --- | --- | --- |
| `closedby` on `<dialog>` | 134 | 141 | preview only |
| `command` / `commandfor` on `<button>` | 135 | 144 | 26.2 |

Safari stable lacking `closedby` means the JavaScript stays as a fallback. The test
suite's Chromium (151) supports it natively, which shapes how the fallback is tested;
see Decisions.

Finding 3, a documentation gap. web.dev says a confirmation that interrupts to demand a
response should carry `role="alertdialog"`. The shipped example, "Delete this account?",
is exactly that. `SKILL.md` bans a hand-written `role="dialog"`, which is right, but
never names `alertdialog` as the one permitted override, so an agent following the skill
never uses it. Measured in Chromium 151 over the accessibility tree: with
`role="alertdialog"` written on the element, `showModal()` still exposes `modal: true`.

Finding 4, a wrong justification. The reference, `SKILL.md`, and a comment in
`tests/e2e/ui-dialog.spec.ts` all say a scripted `focus()` never matches
`:focus-visible`, so a keyboard user would see no focus ring. Measured: after a keyboard
open, a scripted `focus()` on "Keep account" matched `:focus-visible` and drew the 3px
outline; after a mouse open it drew nothing, the same result the native attribute
gives. The rule to use native `autofocus` stands, because MDN recommends it, it is zero
code, and the browser places focus as part of `showModal()` with no timing to get
wrong. Only the stated reason is wrong.

Smaller gaps from the same review: the skill bans `show()` but not `<dialog open>` in
markup, which MDN says is non-modal in the same way; neither page's "no `tabindex` on
the dialog" rule appears; `<form method="dialog">` and `returnValue` are never
mentioned; and the invoker attributes `command="show-modal"` and `commandfor`, the
spec's own version of `data-dialog-open`, are absent.

Two constraints shape the work. The demo's `<style>` and `<script>` are generated from
the reference by `scripts/build-demos.mjs`, so every code change lands in
`references/ui-dialog.md` first and the demo is rebuilt. And `SKILL.md`'s body must stay
under 60 lines after the frontmatter is stripped; it is at 52 today, so the additions
below fit without displacing anything.

## Decisions

- The plan is red-green-verify: the demo and the Playwright suite already exist, so the two behaviour changes can be asserted red before the module changes, which the popover plan could not do for a component that did not yet exist.
- Light dismiss is governed by the native `closedby` attribute, read at event time rather than at `initDialog` time. With the attribute absent the module does nothing on a backdrop click, matching the platform default of `closerequest` for a modal; the demo and the Structure block declare `closedby="any"` so the shipped confirmation keeps its current behaviour. This follows `docs/component-spec.md`: a native attribute beats an init option.
- The fallback mirrors native light dismiss exactly: it closes only when the `pointerdown`, the `pointerup` and the `click` all target the dialog element itself. A click whose press and release land on different elements fires on their common ancestor, which is the dialog, so the click target alone cannot tell a backdrop click from a drag in either direction; tracking both ends is what removes the drag-and-release bug. A press-only guard was caught by review on the prototype and the failure reproduced with the fallback forced on.
- Feature-detect native support: the fallback's `pointerdown` and `click` listeners attach only when `'closedBy' in HTMLDialogElement.prototype` is false, so a browser that owns the behaviour is not double-handled. Playwright's Chromium 151 has native support, so the suite forces the fallback on by deleting that accessor with `page.addInitScript` before the page loads. Measured on 2026-09-03: after the deletion the browser still honours the attribute natively, which is what lets the same assertions run against both paths. The fallback's own `close()` call is masked by the native close in that browser, and Chromium likewise suppresses `cancel` under `closedby="none"` natively, so those two branches are verified by inspection and the reference says so rather than claiming it.
- `role="alertdialog"` goes on the demo and the Structure block, because the example is a destructive confirmation, and the Contract's Role row records it as an explicit override of the implicit `dialog`. The reference states the modal-state result as measured in Chromium only, per the rule that a reference carries only what the suite measured.
- The React fix writes the real `autofocus` attribute through a ref callback, because React's client renderer never emits it. A `closedBy` prop is written onto the element as the `closedby` attribute the same way, since the React typings do not know the attribute yet.
- Browser version numbers for `closedby` and the invoker attributes stay in this plan's Context and out of the reference, where they would go stale; the reference says the attributes arrived later than `<dialog>` itself and to check support before relying on them.
- No SHIP phase. The user asked for a plan of the fixes, not for them to be landed; committing is a separate request.

## Files

- skills/ui-dialog/references/ui-dialog.md (modified) — closedby-aware module with the pointerdown guard, `closedby` and `role` in the Structure block and Contract, corrected autofocus paragraph, new notes on `method="dialog"` and invoker attributes
- skills/ui-dialog/references/demo.html (modified) — `closedby="any"` and `role="alertdialog"` on the hand-written markup; style and script regions regenerated by `node scripts/build-demos.mjs`
- skills/ui-dialog/SKILL.md (modified) — alertdialog override, `open`-attribute clause, `tabindex` rule, corrected autofocus reason; body stays under 60 lines
- skills/ui-dialog/references/react-demo.tsx (modified) — ref callback writing `autofocus`, `closedBy` prop, pointerdown guard in the backdrop handler, `role="alertdialog"` in the demo usage
- tests/e2e/ui-dialog.spec.ts (modified) — two new closedby tests, the 4.1.2 test updated for `alertdialog`, the incorrect focus-visible comment replaced

## Steps

### Phase: RED

1. Add two tests to `tests/e2e/ui-dialog.spec.ts`, "closedby absent: a backdrop click leaves the dialog open", which removes the `closedby` attribute via `page.evaluate`, opens the dialog, clicks at (5, 5) and asserts `open` is still true, and "closedby=any: a drag between dialog text and the backdrop in either direction does not dismiss", which opens the dialog, does `mouse.move` onto the body paragraph, `mouse.down`, `mouse.move(5, 5)`, `mouse.up`, asserts `open` is still true, then does the reverse, `mouse.move(5, 5)`, `mouse.down`, `mouse.move` onto the body paragraph, `mouse.up`, asserts `open` is still true, then clicks at (5, 5) and asserts it closed, and "closedby=none: Escape leaves the dialog open", which sets the attribute to `none` via `page.evaluate`, opens the dialog, presses Escape and asserts `open` is still true; then add a `test.describe('closedby fallback')` block whose tests first call `page.addInitScript(() => { delete HTMLDialogElement.prototype.closedBy; })` and navigate to the demo again, holding copies of those three assertions plus "closedby=any: a backdrop click closes", so the same expectations run with feature detection reporting no native support. Why: these are the behaviours the native `closedby` attribute defines and the current unconditional click handler gets wrong, and once the module feature-detects, its fallback never attaches in the suite's Chromium unless the accessor is hidden first, so both paths must be shown failing before the module changes. Verify: `npx playwright test tests/e2e/ui-dialog.spec.ts` exits non-zero with the absent-attribute and drag tests and their fallback copies failing on `expected true, received false` for `open`, while the `none` tests and the fallback block's backdrop-click copy pass already because Chromium 151 enforces `none` and light dismiss natively and are kept as contract locks rather than red tests, and the output pasted into the step record.
2. Change the 4.1.2 test in `tests/e2e/ui-dialog.spec.ts` to resolve `page.getByRole('alertdialog', { name: 'Delete this account?' })` and to expect `{ role: 'alertdialog', modal: null }` from the written-attribute check. Why: the shipped example is a confirmation that demands a response, which web.dev says should carry `role="alertdialog"`, while `aria-modal` must stay implicit. Verify: `npx playwright test tests/e2e/ui-dialog.spec.ts -g "4.1.2"` exits non-zero because no `alertdialog` role is found, and the output is pasted into the step record.

### Phase: GREEN

3. In the Behaviour module of `skills/ui-dialog/references/ui-dialog.md`, replace the unconditional `onDialogClick` with a fallback that attaches only when `'closedBy' in HTMLDialogElement.prototype` is false: `pointerdown` and `pointerup` listeners recording whether the press and the release each hit the dialog element itself, a `click` listener that closes only when both flags are set, the click also targets the dialog, and `dialog.getAttribute('closedby') === 'any'`, and a `cancel` listener that calls `preventDefault()` when the attribute is `none`, all four removed in the teardown; rewrite the comment to say browsers with native `closedby` handle light dismiss and Escape themselves and the fallback mirrors native behaviour; add `closedby="any"` to the Structure block and to the `<dialog>` in `references/demo.html`; add `closedby` to the Contract's Props row; add two sentences under the Structure block saying to declare `closedby="any"` for a cancel-safe confirmation and to leave it off for a dialog holding user input so a stray click cannot discard it, and that `none` also removes Escape, which keyboard users expect to close a modal, so it is a last resort; then run `node scripts/build-demos.mjs`. Why: the attribute is the platform's own switch for light dismiss, a browser that owns the behaviour should not be double-handled, the guard removes the confirmed drag bug, and the demo must declare the attribute or the existing backdrop test goes red for the wrong reason. Verify: `npx playwright test tests/e2e/ui-dialog.spec.ts` shows the two step-1 tests, the three fallback-block tests and the existing "the backdrop dismisses" test passing, and `node scripts/build-demos.mjs --check` reports the dialog demo up to date.
4. Add `role="alertdialog"` to the `<dialog>` in the Structure block and in the hand-written markup of `references/demo.html`, which sits outside the generated `<style>` and `<script>` regions and so needs no rebuild for this step, change the Contract's Role row to record `alertdialog` as an explicit override of the implicit `dialog` with `aria-modal` still implicit, add `role` to the Props row as optional with `alertdialog` as its only permitted value, and add an ARIA bullet in the Accessibility section stating the modal state was measured in Chromium with the override in place. Why: web.dev prescribes the role for exactly this example, and the Contract must say what the markup now does. Verify: `npx playwright test tests/e2e/ui-dialog.spec.ts -g "4.1.2"` passes and `npx vitest run tests/objective.spec.ts` passes the contract-row assertions for `ui-dialog`.
5. Rewrite the autofocus justification in three places to the measured reason, that MDN recommends the attribute, that it is zero code, and that the browser places focus as part of `showModal()` so the ring follows the browser's own `:focus-visible` heuristic: the paragraph under the Structure block in `references/ui-dialog.md`, the last non-negotiable bullet in `SKILL.md`, and the comment above the 2.4.7 test in `tests/e2e/ui-dialog.spec.ts`; in the same `SKILL.md` pass add "and never the `open` attribute in markup" to the `showModal()` bullet, add a bullet that `tabindex` never goes on the dialog element, and add a bullet that `role="alertdialog"` is the one role an author may write, for a confirmation that interrupts to demand a response. Why: the current sentence is contradicted by measurement and is the stated reason for a non-negotiable rule, and the three missing rules are ones both reference pages state outright. Verify: `grep -n "never matches\|does not match\|would suppress" skills/ui-dialog/SKILL.md skills/ui-dialog/references/ui-dialog.md tests/e2e/ui-dialog.spec.ts` prints nothing, and `npx vitest run tests/objective.spec.ts` passes the under-60-lines assertion for `ui-dialog`.
6. Add two short notes to the Behaviour section of `references/ui-dialog.md` after the module: one naming `<form method="dialog">` and `returnValue` as the native way to close with a value, with the caveat that `returnValue` persists across opens and is not reset by Escape so it must be reset on open; and one naming `command="show-modal"` with `commandfor` as the declarative form of `data-dialog-open`, arriving later than `<dialog>` itself, to be checked for support before use. Why: both are the spec's own mechanisms, and an agent asked for either will hand-roll it if the reference is silent. Verify: `node scripts/lint-portability.mjs` passes and every added prose line is 88 columns or fewer, checked with `awk 'length > 88' skills/ui-dialog/references/ui-dialog.md` printing only table and code-fence lines.
7. Update `skills/ui-dialog/references/react-demo.tsx`: replace `autoFocus` on the "Keep account" button with a ref callback that calls `setAttribute('autofocus', '')`, add an optional `closedBy` prop typed `'any' | 'closerequest' | 'none'` that the component writes onto the element as the `closedby` attribute through the same ref path, make `handleBackdropClick` return early when `'closedBy' in HTMLDialogElement.prototype` is true and otherwise guard it with `pointerdown` and `pointerup` flags exactly as the module does, add an `onCancel` handler that prevents default when `closedBy` is `none` and native support is absent, and put `role="alertdialog"` and `closedBy="any"` on the demo usage; if any RED test still fails after 8 GREEN iterations, stop and report the failing assertion, the last diff tried, and what was ruled out, and do not report success. Why: React's client renderer never emits `autofocus` and the projection must match the DOM contract the reference now states. Verify: `npx vitest run tests/objective.spec.ts` passes the React projection assertions, `grep -n "autoFocus" skills/ui-dialog/references/react-demo.tsx` prints nothing, and a scratch Playwright driver that loads React and Babel standalone from a CDN, transpiles the file in the page, mounts `AukDialogDemo`, clicks the opener and reads `document.activeElement.textContent` reports "Keep account"; if the CDN route cannot be made to work, record that the React change was verified by inspection only.

### Phase: VERIFY

8. Run `bash scripts/check.sh` from the repository root. Why: it is the single local gate, covering vitest over `tests/objective.spec.ts`, the portability lint, the external-resource grep, `build-demos.mjs --check`, `claude plugin validate . --strict`, and the full Playwright suite including axe-core. Verify: the command exits zero and all six gates print as passed.
9. Open `skills/ui-dialog/references/demo.html` from disk in the Browser pane and assert with `mcp__Claude_Browser__javascript_tool`: after Tab to the opener and Enter, `document.activeElement.id` is `keep` and its computed `outlineWidth` is `3px`; the close button's `getBoundingClientRect()` is at least 44 by 44; after Escape, `document.activeElement.id` is `open-top`; with the dialog open, `getComputedStyle(dialog, '::backdrop').backgroundColor` is the themed value; and `mcp__Claude_Browser__read_console_messages` shows no errors. Why: the suite proves behaviour in headless Chromium, and a live pass over the real page catches layout or console regressions the assertions do not name. Verify: each measured value is reported in the step record with its number.

## Tests

Tier 1 — This plan changes application code
- Objective: the dialog follows the native element's closing and focus rules. File: tests/e2e/ui-dialog.spec.ts; Type: smoke; Asserts: a backdrop click leaves the dialog open when `closedby` is absent, closes it when `closedby="any"` is declared, a drag between dialog text and the backdrop in either direction never dismisses, Escape leaves a `closedby="none"` dialog open, the dialog resolves by the `alertdialog` role with `aria-modal` unwritten, and a keyboard open lands focus on "Keep account" with a visible ring; Run: npx playwright test tests/e2e/ui-dialog.spec.ts
- E2E: closedby gating and the drag guard. File: tests/e2e/ui-dialog.spec.ts; Targets: skills/ui-dialog/references/demo.html; Key cases: attribute absent then backdrop click, attribute `any` then backdrop click, attribute `any` then press on text and release on backdrop, attribute `any` then press on backdrop and release on text, attribute `none` then Escape, and the same cases inside a describe block that deletes `HTMLDialogElement.prototype.closedBy` through `page.addInitScript` so the feature-detected fallback attaches
- E2E: alertdialog role with implicit modal state. File: tests/e2e/ui-dialog.spec.ts; Targets: the 4.1.2 Name, Role, Value test; Key cases: `getByRole('alertdialog')` resolves by name, `role` attribute reads `alertdialog`, `aria-modal` attribute reads null
- Integration: repository contract assertions. File: tests/objective.spec.ts; Targets: skills/ui-dialog; Key cases: SKILL.md body under 60 lines, no framework or vendor token outside react-demo.tsx, React projection exports `AukDialogProps` and `AukDialogDemo`, contract table intact

## Acceptance Criteria

- [ ] With no `closedby` attribute on the demo dialog, a click on the backdrop leaves `dialog.open` true.
- [ ] With `closedby="any"`, a click on the backdrop closes the dialog, and a drag between dialog text and the backdrop in either direction does not.
- [ ] With `closedby="none"`, Escape leaves the dialog open.
- [ ] With `HTMLDialogElement.prototype.closedBy` deleted before the page loads, the three assertions above still hold, proving the fallback's gating and drag guard.
- [ ] `page.getByRole('alertdialog', { name: 'Delete this account?' })` resolves on the open demo, the `role` attribute reads `alertdialog`, and no `aria-modal` attribute is written.
- [ ] No file under `skills/ui-dialog/` or `tests/e2e/ui-dialog.spec.ts` claims a scripted `focus()` never matches `:focus-visible`.
- [ ] `SKILL.md` names the `open` attribute, `tabindex`, and `role="alertdialog"` rules, and its body after the frontmatter is under 60 lines.
- [ ] `references/ui-dialog.md` names `<form method="dialog">` with `returnValue` and the `command` with `commandfor` invoker attributes.
- [ ] `references/react-demo.tsx` contains no `autoFocus` prop and writes the `autofocus` attribute, and the scratch React run lands focus on "Keep account".
- [ ] `node scripts/build-demos.mjs --check` reports the dialog demo up to date.
- [ ] `bash scripts/check.sh` exits zero.

## Verification

Run `bash scripts/check.sh` from the repository root and confirm it exits zero. That is
the gate: vitest asserts the skill's frontmatter, body length, contract rows and React
projection surface; the portability lint and the external-resource grep reject anything
that would break the Codex load; `build-demos.mjs --check` proves the demo has not
drifted from the reference; and Playwright runs `tests/e2e/ui-dialog.spec.ts` including
the two new closedby tests, the updated 4.1.2 test and axe-core with the dialog open.

Then open `skills/ui-dialog/references/demo.html` directly from disk with no server and
confirm by hand: Tab to "Delete account" and press Enter, and the focus ring is on "Keep
account"; press Escape, and focus is back on "Delete account"; open it with the mouse
and click the dark backdrop, and it closes; open it again, press the mouse on the body
sentence, drag out to the backdrop and release, and it stays open; and a screen reader
or the accessibility inspector announces it as an alert dialog named "Delete this
account?".

## Next Steps

- Fix the same focus-visible sentence in the popover skill
  `skills/ui-popover/SKILL.md` line 59 carries the identical claim that a scripted focus move does not match `:focus-visible`, inherited from the dialog reference. Out of scope here because this plan is scoped to `ui-dialog`.
  ```text
  In the agent-ui-skills repository, open skills/ui-popover/SKILL.md and find the
  non-negotiable bullet that says a scripted focus move does not match
  :focus-visible. Replace the reason with the measured one used in
  skills/ui-dialog/SKILL.md after the sync-ui-dialog-with-native-spec plan: the
  native autofocus attribute is what MDN recommends, it is zero code, and the browser
  places focus itself so the ring follows its own :focus-visible heuristic. Do not
  change the rule, only the reason. Keep the body under 60 lines. Verify with
  `npx vitest run tests/objective.spec.ts` exiting zero and
  `grep -n "does not match" skills/ui-popover/SKILL.md` printing nothing.
  ```

- Make the dialog's centring explicit so a global margin reset cannot move it
  Found while building the prototype: the Styles block never sets `margin` on `.auk-dialog`, so it leans on the browser default of `margin: auto` for a modal. A host stylesheet with the common `* { margin: 0 }` reset pushes the dialog to the top-left corner, and a backdrop click at the top-left then lands on the dialog header instead. One declaration fixes it. Out of scope here because it is not a spec drift.
  ```text
  In the agent-ui-skills repository, add `margin: auto;` to the `.auk-dialog` rule in
  the Styles block of skills/ui-dialog/references/ui-dialog.md with a one-line
  comment that it restores the browser's centring under a global margin reset, then
  run `node scripts/build-demos.mjs`. Add a Playwright assertion in
  tests/e2e/ui-dialog.spec.ts that injects `* { margin: 0 }` into the demo page,
  opens the dialog, and checks its bounding box is centred in the viewport within a
  few pixels. Verify with `bash scripts/check.sh` exiting zero.
  ```

- Wish list: move the openers to the invoker attributes once they are widely available
  `command="show-modal"` with `commandfor` opens the dialog with no script and gives the browser the opener for native focus return. It reached all three engines only recently, so it is not yet safe as the only mechanism in a reference that promises to work without a build step.
  ```text
  In the agent-ui-skills repository, check MDN browser-compat-data for the command
  and commandfor attributes on the button element. If they are Baseline widely
  available, update skills/ui-dialog/references/ui-dialog.md so the Structure block
  opens the dialog with command="show-modal" commandfor="<id>" and initDialog keeps
  data-dialog-open only as a fallback, rebuild the demo with
  node scripts/build-demos.mjs, and update tests/e2e/ui-dialog.spec.ts to open
  through the invoker. Verify with `bash scripts/check.sh` exiting zero.
  ```

## Resources

- web.dev, Learn HTML: Dialog, https://web.dev/learn/html/dialog — source of the `alertdialog` recommendation, the "avoid programmatic opening" note and the default-styling caveat
- MDN, the `<dialog>` element, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog — `closedby` values and defaults, `autofocus` and `tabindex` guidance, `method="dialog"` and `returnValue`, invoker commands
- MDN, `cancel` event on HTMLDialogElement, https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event — confirms Escape fires `cancel` and then `close`, which the module's single `close` listener relies on
- MDN browser-compat-data, html/elements/dialog.json and html/elements/button.json — the version numbers in the Context table
- React source, packages/react-dom-bindings/src/client/ReactDOMComponent.js and ReactFiberConfigDOM.js on main — the `autoFocus` client polyfill that never writes the attribute
- Scratch Chromium probes run during the review on 2026-09-03 against references/demo.html — drag-release dismissal, scripted focus with no attribute landing on the close button, `:focus-visible` matching after a keyboard open, and `modal: true` under `role="alertdialog"`
