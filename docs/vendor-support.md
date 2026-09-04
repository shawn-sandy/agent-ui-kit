# Vendor support

What actually happened when each vendor was pointed at this repository, recorded on
2026-09-02 against `agent-ui-skills` 0.2.0 and updated on 2026-09-03 for the
`ui-` skill-name rule. Every other check in this repo tests the files. This is the
only one that tests the README's claim that one `skills/` tree serves two vendors.

Failures are recorded here rather than fixed silently.

Scope: the runs below were made when four skills existed - `ui-button`, `ui-alert`,
`ui-dialog` and `ui-tabs`. Every "all four" below means those four and is not a claim
about the four skills added since: `ui-box`, `ui-popover`, `ui-theme` and `ui-compose`
have not been through a vendor run. Nothing here is restated from memory, so the
counts stay as measured until a fresh run replaces them.

## Claude Code

Version: the `claude` CLI on the author's machine at the time of writing.

| Check | Result |
| --- | --- |
| `claude plugin validate . --strict` | Passes. It is gate 5 of `scripts/check.sh`. |
| Plugin loads from a local directory | Yes, via `claude --plugin-dir <repo>`. |
| All four skills register | Yes: `agent-ui-skills:ui-button`, `agent-ui-skills:ui-alert`, `agent-ui-skills:ui-dialog`, `agent-ui-skills:ui-tabs`. |
| Skills are invocable by name | Yes. All four appear in the session's slash-command list. |
| Skills are model-invocable | Yes. All four appear in the session's auto-invocable skill list, not only as slash commands. |
| A skill actually fires and is used | Yes. A headless run of the `ui-button-obvious` scenario invoked `Skill(skill: "agent-ui-skills:ui-button")`, read `skills/ui-button/references/ui-button.md`, and edited the target project. |

### Finding: a request needs a concrete target before any skill fires

The first attempt at the evaluation suite produced zero skill invocations on every
scenario and every model. The cause was not the descriptions and not competition from
other installed skills. The prompts said "this page", the working directory held an
`index.html` the model had not been told about, and the model asked which file to edit
rather than exploring. No skill fires for a request the model does not intend to act
on yet.

Once the prompts named the file, the skills fired. This is worth recording because it
is easy to misread the first result as a description problem and start rewriting
descriptions that were never at fault.

A second run compared a session loading only this plugin's skills against one that
also loaded the author's full library. Both result sets are in
`docs/evaluations.md`. The difference between them is within the run-to-run variation
of the models themselves, so this repo does not claim that a crowded skill library
measurably harms discovery - only that it was checked.

## ChatGPT / Codex

Version: `codex-cli 0.145.0`, model `gpt-5.5`.

| Check | Result |
| --- | --- |
| Discovery path | `~/.codex/skills/<skill-name>/SKILL.md`. The four skill directories were linked in under their own names. |
| All four skills discovered | Yes. Codex listed all four with their descriptions when asked. |
| Frontmatter accepted | Yes. No warning about `license`, and no complaint about any key. |
| A skill actually fires and is used | Yes. `codex exec --full-auto` on the `ui-button-obvious` scenario produced `class="auk-button"` with `data-variant="primary"` and `data-variant="destructive"`, wrote 26 `var(--auk-button-*, …)` declarations into the project stylesheet, and set `aria-disabled="true"` for the in-flight state. |
| The `aria-disabled` guard survived the port | Yes. Codex wrote `if (saveButton.getAttribute("aria-disabled") === "true") return;` - the exact contract the reference states, in the consumer's own handler. |
| `codex plugin add` from a local directory | Not supported. `codex plugin add` installs from a configured marketplace snapshot, so the plugin-install path was not exercised; only the skills tree was. |

### Finding: the Codex manifest supplies the namespace

Linked in through the repository, the skills were reported as `agent-ui-skills:ui-button`
and so on. The same skill copied to `~/.codex/skills/ui-button/` with no repository
around it was reported as bare `ui-button`. So `.codex-plugin/plugin.json` is doing real
work: Codex resolves the skill back to the repository root and takes the plugin name
from that manifest.

### Finding: Codex truncates descriptions under load

Every Codex run emitted:

> Skill descriptions were shortened to fit the 2% skills context budget. Codex can
> still see every skill, but some descriptions are shorter.

The four descriptions in this repository are 250 to 340 characters. Under that budget the
tail of a description - which is where the "not for X" disambiguation lives - is the
part at risk. Putting the distinguishing phrase early in a description, rather than in
a trailing clause, is a portability concern this repository did not previously know about.

## What was changed on the machine, and put back

The Codex check placed four `ui-` prefixed symlinks in `~/.codex/skills/` and, for
the namespace check, one copied directory. All five were removed afterwards; that
directory is back to the 24 entries it held before. Nothing else outside this
repository was touched.
