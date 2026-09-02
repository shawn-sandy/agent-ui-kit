# Evaluations

Whether a realistically phrased request reaches the right skill, and what the models
produce when it does not. Recorded 2026-09-02 against `agent-ui-kit` 0.2.0.

Scenarios live in `evals/*.json` - three per component. Runs are driven by
`scripts/eval.sh`; `scripts/eval.sh print <skill> <index>` formats one for a manual
run, and `scripts/eval.sh baseline|skills` runs them all. Raw transcripts land in
`evals/results/` and are not committed; this file is the reviewable record.

## What each run measures

| Run | Question | How |
| --- | --- | --- |
| **Baseline** | What does a model write with no skill available? | `claude -p --disable-slash-commands`, asked for the code only. |
| **Isolated** | Does the description reach the right skill? | `claude -p --plugin-dir . --setting-sources project` - only this plugin's skills load. |
| **Crowded** | Same, in a session that also loads everything the operator already has. | The same, without `--setting-sources`. |

All three run against a throwaway copy of a small project with a real `index.html`, on
Haiku, Sonnet and Opus.

## Baseline: what the models write unaided

Eight scenarios (the four `adjacent` ones assert non-triggering and have nothing to
baseline), three models. `YES` means the signal was present in the answer.

| Scenario | Model | Native `disabled` | `aria-disabled` | Guard on `aria-disabled` |
| --- | --- | --- | --- | --- |
| button-obvious | haiku | YES | no | no |
| button-obvious | sonnet | YES | no | no |
| button-obvious | opus | YES | no | no |
| button-oblique | haiku | YES | no | no |
| button-oblique | sonnet | YES | no | no |
| button-oblique | opus | YES | no | no |

**Every model, both scenarios, expresses the unavailable state with the native
`disabled` attribute.** That silently removes the control from the keyboard tab order,
so a keyboard user never learns the action exists. It is the single clearest gap in
the set, and it is what the button skill exists to close.

| Scenario | Model | Region built at message time | Live region in static markup | `aria-live` declared |
| --- | --- | --- | --- | --- |
| alert-obvious | haiku | no | YES | YES |
| alert-obvious | sonnet | no | YES | YES |
| alert-obvious | opus | YES | YES | YES |

| Scenario | Model | Polite live region | Assertive live region | Moves focus to the message |
| --- | --- | --- | --- | --- |
| alert-oblique | haiku | no | no | no |
| alert-oblique | sonnet | YES | no | YES |
| alert-oblique | opus | YES | no | no |

Haiku produces **no live region at all** for the oblique alert request, so nothing is
announced. Opus builds the toast element at the moment the message arrives, which is
the classic silent failure: a live region has to be under observation before the
change happens. Sonnet moves focus to the message, which the prompt explicitly asked
it not to do.

| Scenario | Model | `showModal()` | Chooses initial focus | Explicit focus restoration |
| --- | --- | --- | --- | --- |
| dialog-obvious | haiku | YES | no | no |
| dialog-obvious | sonnet | YES | no | no |
| dialog-obvious | opus | YES | YES | no |

| Scenario | Model | `showModal()` | Hand-rolled trap over a div | Explicit focus restoration |
| --- | --- | --- | --- | --- |
| dialog-oblique | haiku | no | YES | YES |
| dialog-oblique | sonnet | YES | no | YES |
| dialog-oblique | opus | YES | no | no |

Haiku hand-rolls a `role="dialog"` div instead of the native element, so the page
behind stays reachable. Two of three never choose where focus lands on open, which
leaves the browser focusing the first focusable child - typically the close button,
one keystroke from the destructive action.

| Scenario | Model | Roving tabindex | Arrow keys | Home and End |
| --- | --- | --- | --- | --- |
| tabs-obvious | haiku | no | no | no |
| tabs-obvious | sonnet | YES | YES | no |
| tabs-obvious | opus | YES | YES | no |
| tabs-oblique | haiku | no | YES | no |
| tabs-oblique | sonnet | YES | YES | no |
| tabs-oblique | opus | YES | YES | no |

**No model produced Home and End handling in any run.** Haiku produced neither roving
tabindex nor arrow keys for the obvious request, leaving every tab in the page tab
order.

Two scenarios were rewritten during this work because the first draft was too easy -
every model already passed them unaided, which measures nothing. `button-oblique`
originally stated the accessibility requirement in the prompt, and `alert-obvious`
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

In the isolated run Opus fired the button skill on `button-adjacent` - *"add a link to
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

An adjacent scenario asserts that *its own* skill stays quiet, not that the kit is
silent. `alert-adjacent` - *"interrupts the user and blocks the page until they
confirm"* - correctly fired the **dialog** skill on five of six runs. That is the right
answer, and the alert skill staying out of it is exactly what the scenario tests.

## Reproducing

```bash
scripts/eval.sh baseline    # what the models write with no skill
scripts/eval.sh skills      # which skill fires, isolated by default
EVAL_ISOLATE=0 scripts/eval.sh skills   # the same, in a crowded session
```

`EVAL_MODELS` and `EVAL_CONCURRENCY` control the sweep; `EVAL_PROJECT` points at the
fixture project each run gets its own copy of. Results are scored by
`scripts/score-evals.mjs`, kept separate from the runner so the correctness rule can be
corrected without paying for another sweep.
