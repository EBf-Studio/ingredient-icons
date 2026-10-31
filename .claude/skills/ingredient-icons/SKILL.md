---
name: ingredient-icons
description: Pipeline of the ingredient icons. Use to generate a batch of new icons (or regenerate one) with Grok, to publish generated icons in a pull request, or to release @ingredient-icons/core.
---

# Ingredient icons

Three **stages**, each run on its own when the user asks for it:

1. **Batch**: from a list of ingredients to raws pushed on `ingredient-icons-sources`. Repeatable: several batches can pile up before anything is published.
2. **Publish**: the raws not yet in this repository become icons, in a pull request.
3. **Release**: a new version of `@ingredient-icons/core` on npm.

A stage ends with its own report; the next stage starts only on the user's request. In particular, never offer a release at the end of a batch or a publish: report the count of unreleased icons in one line instead.

**Roles.** You (Opus, the main thread) choose ids, write subjects and make every decision. Grok 4.7 only generates images: it never looks at them. Sonnet 5.5 reviews the candidates.

**Paths.** Run every script from this repository's checkout (worktree included; `bun install` first in a fresh one). `$SRC` is the sources checkout the scripts resolve, usually `~/Dev/ingredient-icons-sources`: `bun -e 'import {sourcesDir} from "./scripts/layout"; console.log(sourcesDir())'`. One batch at a time per sources checkout: batches share `subjects.json` and `inbox/`.

## Stage 1: batch

1. **List.** `git -C $SRC pull --ff-only`, then propose ids to the user, and run `bun run impact <ids…>` on them. Keep only ids marked ✓. Read every takeover: a generic icon (`en:seed`) takes over ids it may draw badly (`en:pepper`, `en:sesame`), and the fix is to add the better parent too, or drop the generic. Look at the icon each id shows today (`icons/png/128/<file>.png`): a new icon must be told apart from it at 24 px (`en:chicken` is a drumstick, so `en:chicken-thigh` is a thigh without one). Done when the user has validated the list.

2. **Subjects.** Append one `{ "slug", "subject" }` per id at the end of `$SRC/subjects.json`, in the file's one-line-per-entry format, without reformatting the rest. A subject is one sentence: the object, its colours and the one or two features that identify it. The background is magenta, so:
   - nothing magenta, pink or purple in the object (pink peppercorns go, a red onion stays deep red-purple and is fine);
   - thin fronds, fine leaves, open lattices and clear glass let the background show through: lay them on a small white plate, or use an opaque container;
   - powders, liquids and grains go in their typical container (bowl, bottle, jar), plain.
   Done when every validated id has its subject.

3. **Generate.** Split the slugs in groups of about 10 and run one Grok subagent per group, up to 5 at once, with the brief in [briefs.md](briefs.md#grok). `delegate_task` with provider `grok`, model `grok-4.7`, option `reasoningEffort: low`, runtime `full-access`. Ask for 2 candidates per slug. Done when every slug has its candidates in `$SRC/inbox/` (`ls`, not Grok's report).

4. **Preview.** `bun run preview` (or `bun run preview <slugs…>` for a retry). It cuts out every candidate, flags what a pixel count catches better than an eye (magenta left in the object, uneven background, cropped, too small) and draws `.out/preview/sheet-<k>.png`, 6 slugs per sheet. A flag asks for a close look, not a rejection: about 5% of the accepted icons carry one.

5. **Review.** Run one Sonnet reviewer per 2 sheets, in parallel: Agent tool, `model: "sonnet"`, `run_in_background: false`, with the brief in [briefs.md](briefs.md#reviewer). Done when every slug has a verdict line.

6. **Pick.** `bun run pick en:honey=2 en:oregano=1 …` for every PICK: the candidate becomes `$SRC/raw/<file>.png` and the slug's other candidates are deleted. For every REJECT, rewrite the subject from the reviewer's reason, `bun run pick --discard <slugs…>`, then back to step 3 with those slugs only. After 2 retries, keep the best candidate, or remove the slug from `subjects.json`, and tell the user. Done when the inbox is empty and every subject has its raw.

7. **Push the sources.** In `$SRC`: `git add raw subjects.json`, one commit for the batch (`🍱 Add <n> raws for <what>`), `git push origin main`. This step is the point of the batch: an image that only lives on this machine is lost with it. Done when `git -C $SRC status --porcelain` is empty and `git -C $SRC rev-list --count @{upstream}..HEAD` prints 0.

Report: the new raws, the subjects rewritten and why, what was dropped, the commit, and how many raws wait for a publish:
`comm -23 <(jq -r '.[].slug' $SRC/subjects.json | sort) <(git show origin/main:manifest.json | jq -r '.icons | keys[]' | sort) | wc -l`

## Stage 2: publish

1. **Branch.** A new branch from an up-to-date `origin/main`. `bun install`.
2. **Build.** `bun run build`. It rebuilds only the icons whose raw changed (per `build.lock.json`) and warns when the sources aren't pushed: push them first (stage 1, step 7). Open `.out/review.html`: it shows the rebuilt icons, on light and dark.
3. **Taxonomy.** `bun run taxonomy`, without argument: it keeps the pinned Open Food Facts release, which the recipe app pins too. Its diff touches `names` only.
4. **Counts.** `bun run check`, then `bun run --cwd apps/docs prepare-data` prints the icons and the ingredients covered. Update them in `README.md` (title line, the two badges, the fallback paragraph) and `packages/core/README.md` (title line, fallback paragraph). Search the docs, READMEs and tests for each new id: an example that shows an id falling back to its parent is wrong once that id has its own icon (`en:cherry-tomato` was).
5. **Pull request.** `bun run check` green, then one commit (`🍱 Add <n> icons for <what>`) and the `ship-pr` skill. The body gives the icons added, the coverage before and after, and the takeovers `impact` reported.

Report with the PR link, plus one line: the icons on `main` since the last release (`git describe --tags --abbrev=0 origin/main`, then compare its `manifest.json` with `origin/main`'s).

## Stage 3: release

Only when the user asks. Bump `packages/core/package.json` and run `bun install` for `bun.lock`, commit `🔖 Release @ingredient-icons/core <version>` with what changed since the last tag, push it to `main`, and publish a GitHub release `v<version>` titled `@ingredient-icons/core <version>`. The `Publish` workflow stages the package on npm; the user approves it with 2FA (`npm stage approve`). Minor version for new icons, patch for fixes.
