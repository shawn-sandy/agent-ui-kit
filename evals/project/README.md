# Evaluation fixture project

The small, realistic project the `skills` evaluation mode drops each run into. Point
the runner at it:

```
EVAL_PROJECT="$PWD/evals/project" scripts/eval.sh skills
```

`scripts/run-evals.mjs` gives every run its own fresh copy, so concurrent runs cannot
see one another's edits. Nothing here is shipped, imported or tested; it exists only
to give a scenario something concrete to act on.

That last point is the reason it is committed. The project's own vendor record found
that **no skill fires for a request the model does not intend to act on yet** - the
first sweep scored zero everywhere because the prompts said "this page" and no page
was there. A sweep run without a fixture measures the missing fixture, not the
descriptions.

## What each file is here for

| File | Scenarios that need it |
| --- | --- |
| `index.html` | Every one. Carries the pricing details and out-of-stock notice (`ui-box-obvious`), the settings summary (`ui-box-oblique`), three feature cards (`ui-box-adjacent`), a deployments table whose toolbar holds `Columns` and `More actions` (`ui-popover-obvious`, `ui-popover-oblique`), a `Delete workspace` button (`ui-popover-adjacent`), and a confirm dialog as plain markup (`ui-compose-oblique`). |
| `src/components/Button.tsx` | `ui-compose-obvious`, which states this wrapper already exists. Also the `auk-` root a compose run searches for to find sibling components. |
| `src/components/Tabs.tsx` | A second component, so "type the props the way the rest of `src/components` does" has a convention to read rather than invent. |
| `styles/tokens.css` | A plain custom-property sheet - one of `ui-theme`'s discovery sources. |
| `styles/globals.css` | A shadcn-shaped `@layer base` block, the second discovery source. |
| `tokens/brand.tokens.json` | A DTCG token file, the discovery source `ui-theme` prefers first. |

## Known limitation: one fixture cannot serve every compose scenario

`ui-compose` Discovery calls a project component-based when a `components` directory
exists. This fixture has one, because `ui-compose-obvious` says so outright. But
`ui-compose-adjacent` frames its request as "a plain static page", which is the case
where the skill is supposed to stay quiet.

So the adjacent scenario runs against a workspace that contradicts its own framing,
which makes it a *harder* test than written rather than an easier one. It passed on
all three models anyway. If a future change makes it fail, check this before
concluding the description drifted.
