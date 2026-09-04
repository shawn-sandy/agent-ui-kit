# Evaluations

Whether a realistically phrased request reaches the right skill, and what the models
produce when it does not. Recorded 2026-09-02 against `agent-ui-skills` 0.2.0, with the
design-system section below added 2026-09-04 against 0.4.0. Those
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

Recorded 2026-09-04 against `agent-ui-skills` 0.4.0 in the isolated session shape, with
`EVAL_SKILLS=ui-theme`: the seven ui-theme scenarios - the three from 0.3.0 and the four
added with the role layer (`ui-theme-shadcn`, `ui-theme-figma`, `ui-theme-token-file`,
`ui-theme-override-adjacent`) - on Haiku, Sonnet and Opus, one run each. The fixture
project carried an `index.html` with auk buttons, a dialog and tabs built from the
references, `styles/tokens.css`, a shadcn-style `globals.css` and a DTCG
`tokens/brand.tokens.json`, so every scenario had the file it names.

| Scenario | Haiku | Sonnet | Opus |
| --- | --- | --- | --- |
| ui-theme-obvious | miss, no skill invoked | ui-theme fired | ui-theme fired |
| ui-theme-oblique | miss, no skill invoked | ui-theme fired | ui-theme fired |
| ui-theme-adjacent | quiet (pass) | quiet (pass) | quiet (pass) |
| ui-theme-shadcn | miss, no skill invoked | ui-theme fired | ui-theme fired |
| ui-theme-figma | miss, no skill invoked | ui-theme fired | ui-theme fired |
| ui-theme-token-file | miss, no skill invoked | ui-theme fired | ui-theme fired |
| ui-theme-override-adjacent | quiet (pass) | quiet (pass) | ui-button fired, ui-theme quiet (pass) |
| **Total** | **2 / 7** | **7 / 7** | **7 / 7** |

Fifteen of the twenty-one runs ended with the CLI's `error_max_turns`. On Sonnet and Opus
that was the skill working, not failing: after ui-theme fired, the model copied
`auk-roles.css` into the project and wrote the role block - Sonnet's shadcn run bound
seven roles, `--auk-role-primary: var(--primary)` through `--auk-role-radius:
var(--radius)`, in `globals.css` - and the runner's `--max-turns 8` stopped it before it
could report. The first sweep of the day counted every non-zero exit as an error and
scored 2 / 7 on all three models; the runner was corrected the same day (see
Reproducing) and the sweep re-run. The table is the re-run.

One description rewrite was tried for Haiku, as the plan requires: shorter and
trigger-verbs-first (567 characters against 655), re-run on Haiku alone. It scored 2 / 7
again, with no skill invoked on any of the five triggering scenarios, so the original
description ships - it is the one all three models were measured on. This is the known
limitation recorded above, unchanged: Haiku decides not to consult a skill before any
description is compared, and the description cannot reach that decision.

The role-layer plan's acceptance criterion that the four new scenarios pass on all three
models is therefore met on Sonnet and Opus and not on Haiku, and the plan stays
in-progress on that criterion alone.

## Reproducing

```bash
scripts/eval.sh baseline    # what the models write with no skill
scripts/eval.sh skills      # which skill fires, isolated by default
EVAL_ISOLATE=0 scripts/eval.sh skills   # the same, in a crowded session
```

`EVAL_MODELS` and `EVAL_CONCURRENCY` control the sweep; `EVAL_PROJECT` points at the
fixture project each run gets its own copy of; `EVAL_SKILLS=ui-theme` narrows a sweep
to one skill's scenarios, so a description edit can be re-measured without the other
six skills running again. Results are scored by `scripts/score-evals.mjs`, kept
separate from the runner so the correctness rule can be corrected without paying for
another sweep.

Each recorded row carries the CLI's exit reason under `exit`. A run counts as an
error only when no assistant message came back at all; a run the CLI stopped at
`--max-turns` (`error_max_turns`) after the model had already invoked a skill still
reached the model, and is scored on what the model did. Before 2026-09-04 the runner
took any non-zero exit as an error, which marked every ui-theme run that copied the
roles file and kept working as a miss.
