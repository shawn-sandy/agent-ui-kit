# Agent UI Kit

Vendor-neutral UI component skills for AI coding agents.

Each skill describes one UI component and ships a complete reference: semantic HTML
with a real accessibility contract, plain CSS driven by custom properties, and
dependency-free JavaScript. An agent reads the reference and builds the component
into your project, in your stack.

There is nothing to install into your app. The canonical references require no
framework, no design system, no package and no vendor. Each Agent UI Kit
component also ships a required React projection demo that shows how to wrap the
same DOM contract in typed props when a consuming app already uses React. That
demo is reference material, not production code.

## Status

Version 0.2.0. Four components ship: **button**, **alert**, **dialog** and **tabs**.
They were chosen to stress different parts of the format rather than to be a useful
kit - no JavaScript, a live region, heavy focus management, and keyboard navigation.
Their skill names are prefixed for discovery: `ui-button`, `ui-alert`,
`ui-dialog` and `ui-tabs`.

Both vendors load the tree and use it: see [docs/vendor-support.md](docs/vendor-support.md)
for what actually happened, including what did not work.

The reference format is still moving - pin a commit if you depend on it.

## Install

The repository is both a plugin and its own marketplace.

**Claude Code**

```
/plugin marketplace add shawn-sandy/agent-ui-kit
/plugin install agent-ui-kit@agent-ui-kit
```

**ChatGPT / Codex**

Install from the plugin directory, or add this repository to a workspace marketplace.

**Any other agent**

Skills follow the [Agent Skills open standard](https://agentskills.io/specification).
Copy any folder from `skills/` into your agent's skills directory, keeping its
`ui-` prefix.

## Layout

```
agent-ui-kit/
├── .claude-plugin/
│   ├── plugin.json         # Claude Code plugin manifest
│   └── marketplace.json    # Claude Code marketplace, source "./"
├── .codex-plugin/
│   └── plugin.json         # ChatGPT / Codex plugin manifest
├── skills/                 # one directory per component skill
│   └── ui-<component>/
│       ├── SKILL.md        # what it is, when to use it, how to build it
│       └── references/
│           ├── ui-<component>.md   # contract, HTML, CSS, JS, accessibility
│           ├── demo.html        # standalone, opens from disk
│           └── react-demo.tsx   # required typed React projection reference
├── evals/                  # skill-triggering scenarios, three per component
├── tests/                  # frontmatter, manifests, and browser suites
├── scripts/
│   ├── check.sh            # the single local gate
│   └── build-demos.mjs     # rewrites each demo's component code from its reference
└── docs/                   # specification, evaluations, vendor results
```

One `skills/` tree serves every vendor. The manifests are thin and additive; there
is no build step and no duplicated content.

The `ui-` prefix belongs to the skill identity only. Component DOM contracts stay
unprefixed: the button skill still ships `auk-button`, `--auk-button-*`,
`initButton` and `AukButtonProps`.

## Verifying it

```
npm ci && npx playwright install chromium
bash scripts/check.sh
```

Six gates run in order: the unit, objective and integration suites; a portability
lint over `skills/`; a check that no file under `skills/` loads an external
resource; a check that every demo still matches its reference;
`claude plugin validate . --strict`; and the browser suite, which drives every demo
with the keyboard and scans it with axe-core.

`bash scripts/check.sh --prove` additionally runs a deliberately broken fixture
through the gate to show it can fail.

Every demo also opens directly from disk with no server, no build step and no
stylesheet beyond the reference's own CSS:

```
open skills/ui-dialog/references/demo.html
```

A demo inlines its component's CSS and JavaScript so it stays self-contained, which
means that code exists twice. The second copy is generated, not hand-kept:

```
node scripts/build-demos.mjs           # rewrite every demo from its reference
node scripts/build-demos.mjs --check   # report stale demos, write nothing
```

Edit the reference and re-run it. `scripts/check.sh` runs `--check` as a gate, so a
demo that drifts from its reference fails the build.

## Documentation

- [docs/component-spec.md](docs/component-spec.md) - the authoring contract for
  `SKILL.md` and the reference.
- [docs/evaluations.md](docs/evaluations.md) - whether a realistic request actually
  reaches the right skill, measured across three models.
- [docs/vendor-support.md](docs/vendor-support.md) - what each vendor did with the
  tree, including the failures.

## Principles

- **Semantic HTML first.** Correct elements and ARIA, no opinion imposed on class names.
- **Plain CSS.** Custom properties with fallbacks, so a component works standalone
  and themes cleanly when a design system is present.
- **Vanilla JavaScript.** No dependencies. Port it to your framework if you want to.
- **Accessibility is not optional.** Every reference states the WCAG criteria it
  satisfies, including keyboard handling and focus management.

## License

MIT
