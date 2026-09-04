---
name: local-playwright-without-install
description: how to run a real headless-browser check in this worktree when npm install has not been run (no local node_modules/playwright)
metadata:
  type: reference
---

agent-ui-skills worktrees sometimes have an empty `node_modules/` (no `npm install` run
yet), so `npx playwright test` / local `playwright` is unavailable. This machine still
has a global `@playwright/cli` package at
`/opt/homebrew/lib/node_modules/@playwright/cli` with its own bundled `playwright` +
`playwright-core`, and a cached browser at `~/Library/Caches/ms-playwright/chromium-1234`
(a "Google Chrome for Testing.app" build, arm64 mac).

The versions do not match by default — `chromium.launch()` looks for
`chromium_headless_shell-<other-version>` and fails with "Executable doesn't exist."
Workaround: write the verification script into
`/opt/homebrew/lib/node_modules/@playwright/cli/<script>.mjs` (so the ESM `import
{ chromium } from 'playwright'` resolves against that package's own node_modules) and
launch with an explicit `executablePath` pointing at
`~/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for
Testing.app/Contents/MacOS/Google Chrome for Testing`.

**How to apply:** use this only for read-only verification (computed styles, console
messages, DOM state) during a review — do not rely on it for anything that needs the
project's own `playwright.config.ts` or fixtures. `rm` is denied by policy, so leftover
scratch scripts in that global package directory cannot be self-cleaned; mention them
to the user instead of trying to delete them.
