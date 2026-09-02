# Agent UI Kit

Vendor-neutral UI component skills for AI coding agents.

Each skill describes one UI component and ships a complete reference: semantic HTML
with a real accessibility contract, plain CSS driven by custom properties, and
dependency-free JavaScript. An agent reads the reference and builds the component
into your project, in your stack.

There is nothing to install into your app. No framework, no design system, no
package, no vendor.

## Status

Pre-release. The repository structure is in place; components are not written yet.
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
Copy any folder from `skills/` into your agent's skills directory.

## Layout

```
agent-ui-kit/
├── .claude-plugin/
│   ├── plugin.json         # Claude Code plugin manifest
│   └── marketplace.json    # Claude Code marketplace, source "./"
├── .codex-plugin/
│   └── plugin.json         # ChatGPT / Codex plugin manifest
├── skills/                 # one directory per component
│   └── <component>/
│       ├── SKILL.md        # what it is, when to use it, how to build it
│       └── references/     # the HTML, CSS, and JS
└── docs/                   # format specification
```

One `skills/` tree serves every vendor. The manifests are thin and additive; there
is no build step and no duplicated content.

## Principles

- **Semantic HTML first.** Correct elements and ARIA, no opinion imposed on class names.
- **Plain CSS.** Custom properties with fallbacks, so a component works standalone
  and themes cleanly when a design system is present.
- **Vanilla JavaScript.** No dependencies. Port it to your framework if you want to.
- **Accessibility is not optional.** Every reference states the WCAG criteria it
  satisfies, including keyboard handling and focus management.

## License

MIT
