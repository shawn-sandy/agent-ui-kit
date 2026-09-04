# Evaluations

Whether a realistically phrased request reaches the right skill, and what the models
produce when it does not. Recorded 2026-09-02 against `agent-ui-skills` 0.2.0. Those
runs predate the harness passing `--add-dir`, so they could not read `references/` and
built from the SKILL.md summary; triggering is captured at the Skill call, so the
numbers below remain comparable.

Scenarios live in `evals/*.json` - three per component. Runs are driven by
`scripts/eval.sh`; `scripts/eval.sh print <skill> <index>` formats one for a manual
run, and `scripts/eval.sh baseline|skills` runs them all. Raw transcripts land in
`evals/results/` and are not committed; this file is the reviewable record.
Skill ids use the `ui-` prefix, so the button component's scenarios live under
`ui-button`, while the DOM contract still uses `auk-button`.

## What each run measures

| Run | Question | How |
| --- | --- | --- |
| **Baseline** | What does a model write with no skill available? | `claude -p --disable-slash-commands`, asked for the code only. |
| **Isolated** | Does the description reach the right skill? | `claude -p --plugin-dir <copy> --add-dir <copy> --setting-sources project` - only this plugin's skills load, from a per-run copy of `.claude-plugin/` and `skills/` so the run can read `references/` without being able to write into the checkout. |
| **Crowded** | Same, in a session that also loads everything the operator already has. | The same, without `--setting-sources`. |

All three run against a throwaway copy of a small project with a real `index.html`, on
Haiku, Sonnet and Opus.

## Baseline: what the models write unaided

Eight scenarios (the four `adjacent` ones assert non-triggering and have nothing to
baseline), three models. `YES` means the signal was present in the answer.

| Scenario | Model | Native `disabled` | `aria-disabled` | Guard on `aria-disabled` |
| --- | --- | --- | --- | --- |
| ui-button-obvious | haiku | YES | no | no |
| ui-button-obvious | sonnet | YES | no | no |
| ui-button-obvious | opus | YES | no | no |
| ui-button-oblique | haiku | YES | no | no |
| ui-button-oblique | sonnet | YES | no | no |
| ui-button-oblique | opus | YES | no | no |

**Every model, both scenarios, expresses the unavailable state with the native
`disabled` attribute.** That silently removes the control from the keyboard tab order,
so a keyboard user never learns the action exists. It is the single clearest gap in
the set, and it is what the button skill exists to close.

| Scenario | Model | Region built at message time | Live region in static markup | `aria-live` declared |
| --- | --- | --- | --- | --- |
| ui-alert-obvious | haiku | no | YES | YES |
| ui-alert-obvious | sonnet | no | YES | YES |
| ui-alert-obvious | opus | YES | YES | YES |

| Scenario | Model | Polite live region | Assertive live region | Moves focus to the message |
| --- | --- | --- | --- | --- |
| ui-alert-oblique | haiku | no | no | no |
| ui-alert-oblique | sonnet | YES | no | YES |
| ui-alert-oblique | opus | YES | no | no |

Haiku produces **no live region at all** for the oblique alert request, so nothing is
announced. Opus builds the toast element at the moment the message arrives, which is
the classic silent failure: a live region has to be under observation before the
change happens. Sonnet moves focus to the message, which the prompt explicitly asked
it not to do.

| Scenario | Model | `showModal()` | Chooses initial focus | Explicit focus restoration |
| --- | --- | --- | --- | --- |
| ui-dialog-obvious | haiku | YES | no | no |
| ui-dialog-obvious | sonnet | YES | no | no |
| ui-dialog-obvious | opus | YES | YES | no |

| Scenario | Model | `showModal()` | Hand-rolled trap over a div | Explicit focus restoration |
| --- | --- | --- | --- | --- |
| ui-dialog-oblique | haiku | no | YES | YES |
| ui-dialog-oblique | sonnet | YES | no | YES |
| ui-dialog-oblique | opus | YES | no | no |

Haiku hand-rolls a `role="dialog"` div instead of the native element, so the page
behind stays reachable. Two of three never choose where focus lands on open, which
leaves the browser focusing the first focusable child - typically the close button,
one keystroke from the destructive action.

| Scenario | Model | Roving tabindex | Arrow keys | Home and End |
| --- | --- | --- | --- | --- |
| ui-tabs-obvious | haiku | no | no | no |
| ui-tabs-obvious | sonnet | YES | YES | no |
| ui-tabs-obvious | opus | YES | YES | no |
| ui-tabs-oblique | haiku | no | YES | no |
| ui-tabs-oblique | sonnet | YES | YES | no |
| ui-tabs-oblique | opus | YES | YES | no |

**No model produced Home and End handling in any run.** Haiku produced neither roving
tabindex nor arrow keys for the obvious request, leaving every tab in the page tab
order.

Two scenarios were rewritten during this work because the first draft was too easy -
every model already passed them unaided, which measures nothing. `ui-button-oblique`
originally stated the accessibility requirement in the prompt, and `ui-alert-obvious`
originally asked for an inline banner, which nudges models toward static markup. Both
now fail at baseline.

## Triggering: does the right skill fire?

Twelve scenarios, three models, both session shapes.

| Model | Isolated | Crowded |
| --- | --- | --- |
| Haiku | 5 / 12 | 7 / 12 |
| Sonnet | 12 / 12 | 12 / 12 |
| Opus | 11 / 12 | 12 / 12 |

### Known limitation: Haiku frequently consults no skill at all

Haiku's misses are not wrong-skill matches. On ten of the twelve scenarios across the
two runs it invoked **no skill whatsoever** and wrote the component directly. The
description cannot fix that: it is a decision the model makes before any description is
compared.

Two description rewrites were tried, as the plan requires, and neither moved the
number:

| Description | Haiku, isolated |
| --- | --- |
| Original (`Use when building a button - …`) | 7 / 12 |
| Rewrite 1, front-loaded trigger phrasings, 445-550 chars | 6 / 12 |
| Rewrite 2, shorter and more directive, 252-286 chars | 5 / 12 |

The spread is within the run-to-run variation of the model. Rewrite 2 ships, because
Codex truncates descriptions under a context budget (see
[docs/vendor-support.md](vendor-support.md)) and the shorter form loses less when it
does.

This is recorded as a known limitation, not a defect to keep grinding at. Sonnet and
Opus trigger reliably; Haiku is unreliable regardless of how the description is
written.

### Known limitation: one false positive on Opus

In the isolated run Opus fired the button skill on `ui-button-adjacent` - *"add a link to
the pricing page, styled to look like a call to action"*. The description ends "Not a
link to another page", and the skill body's **When not to use** says the same. It fired
anyway. In the crowded run the same scenario passed, so this is one sample of model
variance rather than a reproducible description defect - but it is the failure mode a
call-to-action link will keep provoking, and it is the reason the adjacent scenarios
exist.

### Note on the two session shapes

The isolated run is not simply "the crowded run minus other skills".
`--setting-sources project` also drops the operator's own configuration and memory
files, so the two runs differ in more than skill count. That is why this file reports
both rather than treating either as the number. On these results a crowded session is
no worse than an isolated one, so this repo makes no claim that a large installed
skill library harms discovery.

### Adjacent scenarios

An adjacent scenario asserts that *its own* skill stays quiet, not that the collection is
silent. `ui-alert-adjacent` - *"interrupts the user and blocks the page until they
confirm"* - correctly fired the **dialog** skill on five of six runs. That is the right
answer, and the alert skill staying out of it is exactly what the scenario tests.

## Design-system requests

Recorded 2026-09-04 against `agent-ui-skills` 0.4.0, isolated run, `ui-theme` only
(`EVAL_SKILLS=ui-theme`, 21 calls). The four scenarios added with the role layer ask
for a named system (shadcn/ui), a Figma file, a DTCG token file, and one component
override that must not trigger the theme skill. The fixture project carries auk
buttons, a dialog and tabs, a `styles/tokens.css`, a shadcn-shaped `styles/globals.css`
and a `tokens/brand.tokens.json`. `PASS` on a triggering scenario means the model
invoked `ui-theme`; on the adjacent scenario it means the theme skill stayed quiet,
whatever else fired.

| Scenario | Kind | Haiku | Sonnet | Opus |
| --- | --- | --- | --- | --- |
| ui-theme-shadcn | obvious | FAIL (no skill) | PASS | PASS |
| ui-theme-figma | oblique | FAIL (fired the built-in `design` skill) | PASS | PASS |
| ui-theme-token-file | oblique | FAIL (no skill) | PASS | PASS |
| ui-theme-override-adjacent | adjacent | PASS | PASS | PASS (fired `ui-button`, which is the right answer) |

The three earlier scenarios in the same sweep: Sonnet and Opus 3 / 3; Haiku passed
only the adjacent one and fired the built-in `run` skill on the obvious request.
Haiku's five misses are the known limitation above, not wrong-skill matches: on four
of them it invoked no plugin skill at all.

Two things about the run itself. Every Sonnet and Opus run that invoked `ui-theme`
then exited non-zero at the eight-turn cap, because version two of the skill copies
the roles file, reads discovery sources and writes the block before it verifies; the
runner used to score any non-zero exit as "never reached a model", which turned ten
correct triggers into failures. `scripts/run-evals.mjs` now records whether the
stream held an assistant message (`reached`) and the exit reason, and both scorers
count the trigger at the Skill call, which is what the earlier tables always
measured. And the sweep was limited to one skill with the new `EVAL_SKILLS` filter,
because re-measuring one description should not cost the other six skills' calls.

One description rewrite was tried for Haiku, as the plan requires: the trigger words
(shadcn/ui, Primer, Bootstrap, token file, Figma) moved to the first clause and the
text shortened from 720 to 634 characters. Re-run on Haiku alone, seven calls:

| Description | Haiku, isolated | New triggering scenarios |
| --- | --- | --- |
| Original (`Theme workflow - binds a project's design system, ...`), 720 chars | 2 / 7 | 0 / 3, one fired the built-in `design` skill |
| Rewrite, trigger words first, 634 chars | 2 / 7 | 0 / 3, no skill invoked on any |

Both pass only the two adjacent scenarios, so the criterion that the four new
scenarios pass on all three models is not met, and the plan that added them stays
in progress with this recorded as the blocker. The original description ships,
because it is the one Sonnet and Opus were measured on at 7 / 7; the rewrite was
not run on them. This is the same limitation as above and is not treated as a
defect to keep grinding at.

## Box, popover and compose

Recorded 2026-09-04 against `agent-ui-skills` 0.4.0, isolated run,
`EVAL_SKILLS=ui-box,ui-popover,ui-compose`: 18 baseline calls and 27 skills calls.
These three skills shipped after the 2026-09-02 sweep and had never been measured.

The sweep used the committed fixture at `evals/project/`, which did not exist for the
earlier runs. That is the one thing that keeps these numbers from being strictly
comparable to the tables above: same harness, same scoring, different project on disk.

### Baseline: what the models write unaided

| Scenario | Model | Signals |
| --- | --- | --- |
| ui-box-obvious | haiku / sonnet / opus | foreground YES, background YES, **border no** on all three; none pinned a height |
| ui-box-oblique | haiku | border YES, **forced-colours no**, foreground no |
| ui-box-oblique | sonnet | border YES, forced-colours YES, foreground no |
| ui-box-oblique | opus | border YES, forced-colours YES, foreground no |
| ui-popover-obvious | haiku / sonnet / opus | declarative trigger YES, **explicit role no**, **accessible name no**, **trigger state no** on all three |
| ui-popover-oblique | haiku | **top layer no** - hand-rolled stacking and outside-click dismissal instead |
| ui-popover-oblique | sonnet / opus | top layer YES, no hand-rolling |
| ui-compose-obvious | haiku / sonnet / opus | typed props surface YES, composed the project's Button YES |
| ui-compose-oblique | haiku / sonnet / opus | **typed props surface no** on all three |

Three gaps are unanimous. **No model draws a border** on the box request, so the
container it writes is a colour change rather than a bounded region. **No model gives
the popover an explicit role, an accessible name, or trigger state that tracks the
layer** - the panel opens, and a screen reader is told nothing about what opened or
whether it is still open. And on the oblique compose request **no model produces a
typed surface at all**, though every one of them does when the request names the file.

### Triggering: does the right skill fire?

| Model | Isolated |
| --- | --- |
| Haiku | 5 / 9 |
| Sonnet | 9 / 9 |
| Opus | 9 / 9 |

| Scenario | Kind | Haiku | Sonnet | Opus |
| --- | --- | --- | --- | --- |
| ui-box-obvious | obvious | FAIL (no skill) | PASS | PASS |
| ui-box-oblique | oblique | FAIL (no skill) | PASS | PASS |
| ui-box-adjacent | adjacent | PASS | PASS | PASS |
| ui-popover-obvious | obvious | PASS | PASS | PASS |
| ui-popover-oblique | oblique | PASS | PASS | PASS |
| ui-popover-adjacent | adjacent | PASS | PASS (fired `ui-dialog`) | PASS (fired `ui-dialog`) |
| ui-compose-obvious | obvious | FAIL (fired `ui-dialog`) | PASS | PASS |
| ui-compose-oblique | oblique | FAIL (no skill) | PASS | PASS |
| ui-compose-adjacent | adjacent | PASS | PASS (fired `ui-dialog`) | PASS (fired `ui-dialog`) |

Sonnet and Opus take every scenario. Haiku's four misses are the known limitation
recorded above and not wrong-skill matches: on three of them it invoked no plugin
skill at all, and on `ui-compose-obvious` it fired `ui-dialog` - the component being
wrapped, not the composition workflow. No description rewrite was attempted, because
two were already tried for the same failure mode without moving the number.

Both adjacent scenarios that fired `ui-dialog` are correct outcomes, the same pattern
`ui-alert-adjacent` shows: a request to block the page until the user answers really
is the dialog's job, and the skill under test staying out of it is what the scenario
asserts.

`ui-compose-adjacent` deserves its own note, because it is measured against a fixture
that argues with it. The prompt frames the page as "a plain static page", which is the
case where `ui-compose` must stay quiet, but the fixture carries `src/components/` -
which `ui-compose` Discovery reads as component-based. It is therefore a harder test
than written, and it still passed on all three models. `evals/project/README.md`
records this so a future failure is not misread as description drift.

Every one of the 27 runs reached a model, so no result here is a crash scored as a
miss. Nineteen exited non-zero at the eight-turn cap, the same behaviour the ui-theme
sweep surfaced; the trigger is captured at the `Skill` call, which happens well before
the cap, so those runs are complete observations.


## Reproducing

```bash
scripts/eval.sh baseline    # what the models write with no skill
scripts/eval.sh skills      # which skill fires, isolated by default
EVAL_ISOLATE=0 scripts/eval.sh skills   # the same, in a crowded session
EVAL_SKILLS=ui-theme scripts/eval.sh skills   # one skill's scenarios only
```

`EVAL_MODELS`, `EVAL_CONCURRENCY` and `EVAL_SKILLS` control the sweep; `EVAL_PROJECT`
points at the fixture project each run gets its own copy of. The fixture is committed
at `evals/project/`, so a `skills` sweep is reproducible:

```bash
EVAL_PROJECT="$PWD/evals/project" scripts/eval.sh skills
```

Without it the runner hands each scenario an empty directory, and the vendor record's
finding applies - no skill fires for a request with no concrete file to act on, so the
sweep measures the missing fixture rather than the descriptions. Results are scored by
`scripts/score-evals.mjs`, kept separate from the runner so the correctness rule can be
corrected without paying for another sweep.
