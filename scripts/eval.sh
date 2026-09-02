#!/usr/bin/env bash
# Print one evaluation scenario formatted for a manual run, or drive the automated
# runner. Manual mode exists because skill triggering is a model behaviour, not a
# code path - a human reading the transcript is still the ground truth.
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
  cat <<'USAGE'
usage:
  scripts/eval.sh print <skill> [index]   print one scenario ready to paste into an agent
  scripts/eval.sh baseline                run every scenario with all skills disabled
  scripts/eval.sh skills                  run every scenario with this repo loaded as a plugin

skills: button alert dialog tabs
env: EVAL_MODELS=haiku,sonnet,opus  EVAL_CONCURRENCY=4
USAGE
}

case "${1:-}" in
  print)
    skill="${2:-}"; idx="${3:-0}"
    [ -f "evals/$skill.json" ] || { echo "no such skill: $skill" >&2; usage; exit 2; }
    node -e '
      const [f, i] = process.argv.slice(1);
      const doc = JSON.parse(require("fs").readFileSync(f, "utf8"));
      const s = doc.scenarios[Number(i)];
      if (!s) { console.error("no scenario at index " + i); process.exit(2); }
      console.log("scenario : " + s.id + "  (" + s.kind + ")");
      console.log("expects  : " + (s.expect ? "skill " + s.expect + " fires" : "skill " + s.skill + " stays quiet"));
      console.log("baseline : " + s.baselineFailure);
      console.log("");
      console.log("--- paste from here ---");
      console.log(s.prompt);
      console.log("--- to here -----------");
      console.log("");
      console.log("record the result in docs/evaluations.md");
    ' "evals/$skill.json" "$idx"
    ;;
  baseline|skills) node scripts/run-evals.mjs "$1" ;;
  *) usage; exit 2 ;;
esac
