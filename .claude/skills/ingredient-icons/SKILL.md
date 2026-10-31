---
name: ingredient-icons
description: Pipeline of the ingredient icons. Use to generate a batch of new icons (or regenerate one) with Grok, to publish generated icons in a pull request, or to release @ingredient-icons/core.
---

# Ingredient icons

Three **stages**, each run on its own when the user asks for it:

1. **Batch**: from a list of ingredients to raws pushed on `ingredient-icons-sources`. Repeatable: several batches can pile up before anything is published.
2. **Publish**: the raws not yet in this repository become icons, in a pull request.
3. **Release**: a new version of `@ingredient-icons/core` on npm.

A stage ends with its own report; the next stage starts only on the user's request. In particular, a batch or a publish ends with the count of unreleased icons in one line, never with a release proposal.

**Roles.** You (Opus, the main thread) choose ids, write subjects and make every decision. Grok 4.7 only generates images. Sonnet 5.5 reviews the candidates.

**Paths.** Run every script from this repository's checkout (worktree included; `bun install` first in a fresh one). `$SRC` is the sources checkout the scripts resolve, usually `~/Dev/ingredient-icons-sources`: `bun -e 'import {sourcesDir} from "./scripts/layout"; console.log(sourcesDir())'`. One batch at a time per sources checkout: batches share `subjects.json` and `inbox/`.

## Stage 1: batch

1. **List.** `git -C $SRC pull --ff-only`, then propose ids to the user and run `bun run impact <ids…>` on them. It counts the raws not published yet as already there. Keep the ids marked ✓. Read every takeover: a generic icon (`en:seed`) takes over ids it may draw badly (`en:pepper`, `en:sesame`), and the fix is to add the better parent too, or drop the generic. Look at the icon each id shows today (`impact` prints its file): the new icon must read differently at 24 px (`en:chicken` is a drumstick, so `en:chicken-thigh` is a thigh without one). Done when the user has validated the list.

2. **Subjects.** Append one `{ "slug", "subject" }` per id at the end of `$SRC/subjects.json`, in the file's one-line-per-entry format, without reformatting the rest. A subject is one sentence: the object, its colours and the one or two features that identify it. The background is magenta, so:
   - describe pink or purple things by a neighbouring hue (pink peppercorns: coral-red; a red onion: deep red-purple);
   - lay thin fronds, fine leaves and open lattices on a small white plate, and put clear liquids in an opaque or tinted container, so the plate or the container shows through instead of the background;
   - put powders, liquids and grains in their typical plain container (bowl, bottle, jar).
   Done when every validated id has its subject.

3. **Generate.** Split the slugs in groups of about 10, one Grok subagent per group, up to 5 at once, with the brief in [briefs.md](briefs.md#grok) and 2 candidates per slug. `delegate_task` with `target: { providerInstanceId: "grok", model: "grok-4.7", options: { reasoningEffort: "low" } }` and `runtimeMode: "full-access"`. Done when every slug has 2 more files in `$SRC/inbox/` than before this round (count the files; Grok's report is not the check).

4. **Preview.** `bun run preview` (or `bun run preview <slugs…>`). It cuts out every candidate, flags what a pixel count catches better than an eye (magenta in object, uneven background, cropped, too small, unreadable) and draws `.out/preview/sheet-<k>.png`. A flag asks for a close look, not a rejection: about 5% of the accepted icons carry one.

5. **Review.** One Sonnet reviewer per 4 sheets, all launched in a single message so they run in parallel: Agent tool, `model: "sonnet"`, `run_in_background: false`, with the brief in [briefs.md](briefs.md#reviewer). Done when every slug has a verdict line.

6. **Pick.** `bun run pick en:honey=2 en:oregano=1 …` for every PICK: the candidate becomes `$SRC/raw/<file>.png` and the slug's other candidates are deleted. For every REJECT, rewrite the subject from the reviewer's reason, then back to step 3 with those slugs only: the new candidates join the old ones in `inbox/`, so the next review compares them all. After 2 retries, pick the best candidate seen, or drop the slug (`bun run pick --discard <slug>` and remove its subject), and tell the user. Done when `inbox/` is empty and every subject has its raw.

7. **Push the sources.** In `$SRC`: `git add raw subjects.json`, one commit for the batch (`🍱 Add <n> raws for <what>`), `git push origin main`. This step is the point of the batch: a raw that only lives on this machine is lost with it. Done when `git -C $SRC status --porcelain` is empty and `git -C $SRC rev-list --count @{upstream}..HEAD` prints 0.

Report: the new raws, the regenerated ones, the subjects rewritten and why, what was dropped, the commit, and how many new raws wait for a publish (regenerated raws wait too: list them):
`comm -23 <(jq -r '.[].slug' $SRC/subjects.json | sort) <(git show origin/main:manifest.json | jq -r '.icons | keys[]' | sort) | wc -l`

### Regenerating an existing icon

Same steps, with three changes: skip `impact`; in step 2, edit the slug's existing subject instead of appending one; in the reviewer brief, give the current icon as `today` (`<checkout>/icons/png/128/<file>.png`) and ask for a candidate better than it (criterion 5 becomes "better than today"). After 2 failed retries, put that slug's line back as it was (`git -C $SRC diff subjects.json` shows it), `bun run pick --discard <slug>`, and keep the current raw: a published icon never loses its subject.

## Stage 2: publish

1. **Branch.** `git -C $SRC pull --ff-only`, then a new branch from an up-to-date `origin/main`, and `bun install`.
2. **Build.** `bun run build`. It rebuilds only the icons whose raw changed (per `build.lock.json`), warns when the sources are not committed, not pushed or behind, and refuses to drop a published icon whose raw or subject is gone (`--prune` only when the user asked to remove it). Open `.out/review.html`: it shows the rebuilt icons, on light and dark.
3. **Taxonomy.** `bun run taxonomy`, without argument: it keeps the pinned Open Food Facts release, which the recipe app pins too. Its diff touches `names` only.
4. **Counts.** `bun run check`, then `bun run --cwd apps/docs prepare-data`, which prints the icons and the ingredients covered. Grep the previous counts (both forms, like `3,748` and `3%2C748`) in `README.md`, `packages/core/README.md` and `apps/docs`, and update every hit. Grep each new id in the READMEs, docs and tests too: an example showing an id falling back to its parent is wrong once that id has its own icon (`en:cherry-tomato` was).
5. **Pull request.** One commit (`🍱 Add <n> icons for <what>`), then the `ship-pr` skill. The body gives the icons added, the coverage before and after, and the takeovers `impact` reported.

Report with the PR link, plus one line: the icons on `main` since the last release (`git describe --tags --abbrev=0 origin/main`, then compare its `manifest.json` with `origin/main`'s).

## Stage 3: release

Only when the user asks. Bump `packages/core/package.json` and run `bun install` for `bun.lock`, commit `🔖 Release @ingredient-icons/core <version>` with what changed since the last tag, push it to `main`, and publish a GitHub release `v<version>` titled `@ingredient-icons/core <version>`. The `Publish` workflow stages the package on npm; the user approves it with 2FA (`npm stage approve`). Minor version for new icons, patch for fixes.
