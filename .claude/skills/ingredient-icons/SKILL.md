---
name: ingredient-icons
description: Pipeline of the ingredient icons. Use to generate a batch of new icons (or regenerate one) with Grok up to a pull request the user reviews, to act on the user's review of that pull request, to merge an approved batch, or to release @ingredient-icons/core.
---

# Ingredient icons

Two repositories: the private `ingredient-icons-sources` holds the data (`subjects.json`, the raws in `raw/`, `style.txt`), and this one holds the code and the published icons. Icons are keyed by the ids of Marmalade's ingredient catalog (English kebab-case: `olive-oil`, `cheeses`), whose snapshot is `catalog.json`; the catalog itself lives in the recipe repository (`packages/ingredient-catalog`), and an ingredient it lacks gets added there before it can get an icon. A batch lives on **one branch name in both**, and reaches `main` of either only once the user has approved its icons in the pull request. So `main` of the sources holds exactly the raws of the icons on `main` here.

Three **stages**, each run when the user asks for it:

1. **Batch**: from a list of ingredients to a pull request with a review sheet, then the rounds of the user's review.
2. **Merge**: once the user approves, both branches into `main`.
3. **Release**: a new version of `@ingredient-icons/core` on npm, grouping any number of batches.

A stage ends with its own report; the next starts only on the user's request. Never propose a release after a batch or a merge: end with the count of icons on `main` since the last release, in one line.

**Roles.** You (Opus, the main thread) choose ids, write subjects and make every decision. Grok 4.7 only generates images. Sonnet 5.5 sorts the candidates. The user has the last word, on the pull request's sheet.

**Paths.** Work in a worktree of this repository on the batch's own branch, created from an up-to-date `origin/main` (never `main` itself), `bun install` first. `$SRC` is the sources checkout the scripts resolve, usually `~/Dev/ingredient-icons-sources`: `bun -e 'import {sourcesDir} from "./scripts/layout"; console.log(sourcesDir())'`. One batch at a time: it holds the sources checkout on its branch until it is merged.

## Stage 1: batch

1. **Branches.** `bun run batch start`: checks the sources are clean and on `main`, updates it, and creates and pushes the sources' branch of this branch's name (or resumes it). `build` refuses to run while the sources are on another batch's branch.

2. **List.** First `bun run catalog` (it rewrites `catalog.json` from a recipe checkout: see the script's header), so ids added to the catalog since the last batch exist. Propose catalog ids to the user and run `bun run impact <ids…>` on them. Keep the ids marked ✓. Read every takeover: a broad icon (`nuts-and-seeds`) takes over entries it may draw badly (`pine-nut`, `chia-seeds`), and the fix is to add the better parent too, or drop the broad one. Look at the icon each id shows today (`impact` prints its file): the new icon must read differently at 24 px (`chicken` is a drumstick, so `chicken-thigh` is a thigh without one). Done when the user has validated the list.

3. **Subjects.** `bun run subject <id> "<sentence>"` per id: it adds the line to `$SRC/subjects.json`, or replaces that id's, and leaves the rest of the file as it is. A subject is one sentence: the object, its colours and the one or two features that identify it. The background is magenta, so:
   - describe pink or purple things by a neighbouring hue (pink peppercorns: coral-red; a red onion: deep red-purple);
   - lay thin fronds, fine leaves and open lattices on a small white plate, and put clear liquids in an opaque or tinted container, so the plate or the container shows through instead of the background;
   - put powders, liquids and grains in their typical plain container (bowl, bottle, jar).

4. **Generate.** Split the slugs in groups of about 10, one Grok subagent per group, up to 5 at once, with the brief in [briefs.md](briefs.md#grok) and 2 candidates per slug. `delegate_task` with `target: { providerInstanceId: "grok", model: "grok-4.7", options: { reasoningEffort: "low" } }` and `runtimeMode: "full-access"`. Done when every slug has 2 more files in `$SRC/inbox/` than before this round: count them yourself, Grok's report is not the check. Files missing? Look in this checkout's `inbox/` (a relative path in Grok's hands lands there; `preview` warns about it too): move them to `$SRC/inbox/` under the next free numbers, then delete that folder.

5. **Preview.** `bun run preview` (or `bun run preview <slugs…>`). It cuts out every candidate, flags what a pixel count catches better than an eye (magenta in object, uneven background, cropped, too small, unreadable), and draws `.out/preview/sheet-<k>.png` with the icon each slug shows on `main` today. A flag asks for a close look, not a rejection: about 5% of the accepted icons carry one.

6. **Sort.** One Sonnet reviewer per 4 sheets, all launched in a single message so they run in parallel: Agent tool, `model: "sonnet"`, `run_in_background: false`, with the brief in [briefs.md](briefs.md#reviewer). Then look at the sheets yourself: the reviewer's PICK is a proposal. Done when every slug has a verdict.

7. **Pick.** `bun run pick honey=2 oregano=1 …`: the candidate becomes `$SRC/raw/<file>.png` and the slug's other candidates are deleted. For a REJECT, rewrite the subject from the reason, then back to step 4 with those slugs only: the new candidates join the old ones, so the next review compares them all. After 2 retries, pick the best candidate seen, or drop the slug (`bun run pick --discard <slug>` and remove its line from `subjects.json`), and tell the user. Done when `inbox/` is empty and every subject of the batch has its raw.

8. **Save the sources.** `bun run batch save "🍱 Add <n> raws for <what>"`: commits `raw/` and `subjects.json` on the batch's branch and pushes it. The raws are backed up; `main` is untouched.

9. **Build and counts.** `bun run build`, then the counts: `bun run check` (it also refuses an icon whose id left the catalog, and a family or the generic icon without one), `bun run --cwd apps/docs prepare-data`, which prints the icons and the catalog entries covered; grep the previous counts (both forms, like `1,048` and `1%2C048`) in `README.md`, `packages/core/README.md` and `apps/docs` and update every hit; grep each new id in the READMEs, docs and tests (an example showing an id falling back to its parent is wrong once that id has its own icon). One commit (`🍱 Add <n> icons for <what>`). Done when `bun run check` passes and `git status` is clean.

10. **Sheet and pull request.** `bun run sheet` draws `.out/sheet/sheet-<k>.png`: per icon that differs from `origin/main` (new, regenerated or removed), what `main` shows today, the new icon on light and dark, and at 24 px. Open each sheet yourself. No raw goes in the pull request: this repository is public. Open it with the `ship-pr` skill, the sheets attached in the body (`--attach`), with the icons added, the coverage before and after, and the takeovers `impact` reported. Done when the pull request is open, ready for review, with the sheets showing in its body.

Report: the pull request's link, the subjects rewritten and why, what was dropped, and one sentence for the user: review the sheet, comment on GitHub the icons to redo (one comment per icon, or a list), or answer "ok", then say so here.

### Review rounds

When the user says they reviewed: read every comment (`gh pr view --comments`, plus `gh api repos/{owner}/{repo}/pulls/<n>/comments` for those on files). For each icon to redo: rewrite its subject from the comment, then steps 4 to 8 for those slugs only, `bun run build`, a commit, `git push`, and `bun run sheet <ids…>` attached to a pull request comment (`gh pr comment <n> --attach …`) that says what changed per icon. An icon the user no longer wants:
- a new one: delete its raw and its subject line;
- a regenerated one: put back `main`'s raw and subject, `git -C $SRC checkout origin/main -- raw/<file>.png` and the line `git -C $SRC diff origin/main -- subjects.json` shows;

then `bun run batch save`, `bun run build --prune` (the icon is in this branch's manifest already), commit, push. Repeat until the user approves.

### Regenerating an existing icon

Same steps, with three changes: skip `impact`; in step 3, replace the slug's subject; in the reviewer brief, criterion 5 becomes "better than the icon shown today" (the preview shows it). After 2 failed retries, `bun run pick --discard <slug>` and put back `main`'s subject and raw, as in the review rounds. The sheet marks the icon "regenerated", next to the one it replaces.

## Stage 2: merge

Only when the user has approved the icons (in the pull request or here). `bun run batch finish`:
- checks the pull request is open, not a draft, green, and is this checkout's pushed HEAD;
- checks every icon it holds was built from the very raw on the sources' branch, and every raw there is built;
- fast-forwards `main` of the sources to the batch's branch, pushes it and deletes the branch;
- then merges the pull request, at the head it checked.

If it stops, fix what it names and run it again: it resumes. If the user merged the pull request on GitHub, run it too: it still has the sources to merge. When `main` of the sources moved since the batch started, it prints the commands to rebase the batch on it.

Report with the merge, plus one line: the icons on `main` since the last release (`git describe --tags --abbrev=0 origin/main`, then compare its `manifest.json` with `origin/main`'s).

## Stage 3: release

Only when the user asks. Run `bun run catalog` first: each release ships `catalog.json`, so it should be the catalog Marmalade runs (if it moved, `bun run check` must still pass, and the release notes say so). Bump `packages/core/package.json` and run `bun install` for `bun.lock`, commit `🔖 Release @ingredient-icons/core <version>` with what changed since the last tag, push it to `main`, and publish a GitHub release `v<version>` titled `@ingredient-icons/core <version>`. The `Publish` workflow stages the package on npm; the user approves it with 2FA (`npm stage approve`). Minor version for new icons, patch for fixes.
