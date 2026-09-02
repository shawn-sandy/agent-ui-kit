#!/usr/bin/env bash
# The single local gate. Continuous integration mirrors this script and is never the
# only place a check lives, because GitHub Actions is not always available.
#
#   bash scripts/check.sh            run all four gates
#   bash scripts/check.sh --prove    additionally prove the gate can fail, using the
#                                    deliberately broken fixture in tests/fixtures/
set -uo pipefail
cd "$(dirname "$0")/.."

failed=0

gate() {
  local name="$1"; shift
  printf '\n== %s\n' "$name"
  if "$@"; then
    printf '   ok\n'
  else
    printf '   FAILED: %s\n' "$name"
    failed=1
  fi
}

gate "unit, objective and integration tests" npx vitest run
gate "portability lint (skills/ only)" node scripts/lint-portability.mjs
gate "plugin manifests" claude plugin validate . --strict
gate "browser suite" npx playwright test

if [ "${1:-}" = "--prove" ]; then
  printf '\n== proving the gate can fail\n'
  # The fixture breaks frontmatter rules and portability rules at once. Both must be
  # reported, and each must be reported by the gate that owns it. These commands are
  # expected to exit non-zero, so their output is captured rather than piped - a pipe
  # under pipefail would read the intended failure as a failure of this check.
  lint_out=$(node scripts/lint-portability.mjs tests/fixtures 2>&1)
  lint_status=$?
  if [ "$lint_status" -ne 0 ] \
     && printf '%s' "$lint_out" | grep -q 'claude-plugin-root' \
     && printf '%s' "$lint_out" | grep -q 'disable-model-invocation' \
     && printf '%s' "$lint_out" | grep -q 'hint-frontmatter'; then
    printf '   ok: portability lint fails on the broken fixture, naming each fault\n'
  else
    printf '   FAILED: portability lint did not name every fault in the broken fixture\n'
    failed=1
  fi

  frontmatter_out=$(npx vitest run tests/unit/frontmatter.spec.ts --reporter=verbose 2>&1)
  if printf '%s' "$frontmatter_out" | grep -q 'rejects tests/fixtures/bad-skill'; then
    printf '   ok: frontmatter validator rejects the broken fixture\n'
  else
    printf '   FAILED: frontmatter validator did not reject the broken fixture\n'
    failed=1
  fi

  # The real gate must stay clean: the fixture lives outside skills/ on purpose.
  if node scripts/lint-portability.mjs >/dev/null 2>&1; then
    printf '   ok: the broken fixture does not trip the real gate\n'
  else
    printf '   FAILED: the fixture leaked into the skills/ lint\n'
    failed=1
  fi
fi

printf '\n'
if [ "$failed" -eq 0 ]; then
  printf 'check.sh: all gates passed\n'
else
  printf 'check.sh: one or more gates failed\n'
fi
exit "$failed"
