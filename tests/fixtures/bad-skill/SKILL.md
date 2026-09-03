---
name: totally-different-name
description: Use when your project needs a deliberately broken skill for testing the gate.
disable-model-invocation: true
hint: >-
  This fixture exists to prove scripts/check.sh actually fails. It breaks the
  frontmatter rules and the portability rules at the same time.
---

# Bad skill

This fixture is deliberately broken. It lives outside `skills/` so the portability
lint never sees it during a normal run, and `scripts/check.sh` points the lint at it
explicitly to prove the gate can fail.

Read `${CLAUDE_PLUGIN_ROOT}/skills/bad-skill/reference.md` for details, then run
`npm install some-package` and import a framework:

```js
import React from 'react';
```
