// Keeps a batch on one branch name in both repositories, so nothing reaches main
// before the user has approved the icons in the pull request.
// Run from this repository's batch branch (never main):
//   bun run batch start            the sources' branch of the same name, from an up-to-date main (or resumes it)
//   bun run batch save "<message>" commits raw/ and subjects.json on it and pushes (a backup, main untouched)
//   bun run batch finish           after the user's approval: checks the pull request's icons were built from
//                                  the branch's raws, fast-forwards the sources' main to the branch, then
//                                  merges the pull request. Run again after a failure, or after a merge
//                                  done on GitHub: it resumes.

import path from "node:path"

import { fileName, sha256, sourcesDir } from "./layout"

const sources = sourcesDir()
const SHORT = 60_000
// A batch of raws is tens of megabytes: pushing it on a slow uplink takes minutes.
const TRANSFER = 15 * 60_000

function spawn(cmd: string[], timeout = SHORT) {
  return Bun.spawnSync(cmd, { timeout, stdout: "pipe", stderr: "pipe" })
}
function run(cmd: string[], timeout = SHORT) {
  const result = spawn(cmd, timeout)
  const out = result.stdout.toString().trim()
  if (!result.success) throw new Error(`${cmd.join(" ")} failed:\n${result.stderr.toString().trim() || out}`)
  return out
}
const git = (...args: string[]) => run(["git", ...args])
const src = (...args: string[]) => run(["git", "-C", sources, ...args])
const srcOk = (...args: string[]) => spawn(["git", "-C", sources, ...args]).success
const srcTransfer = (...args: string[]) => run(["git", "-C", sources, ...args], TRANSFER)

const branch = git("branch", "--show-current")
if (!branch || branch === "main") throw new Error("Run it from the batch's branch of ingredient-icons, not main")
const hasLocal = () => srcOk("rev-parse", "--verify", "--quiet", `refs/heads/${branch}`)
const hasRemote = () => src("ls-remote", "--heads", "origin", branch) !== ""

function requireClean() {
  const dirty = src("status", "--porcelain")
  if (dirty) throw new Error(`ingredient-icons-sources has uncommitted changes:\n${dirty}`)
}

const [command, ...args] = process.argv.slice(2)
if (command === "start") start()
else if (command === "save") save(args.join(" "))
else if (command === "finish") finish()
else {
  console.error('Usage: bun run batch start | save "<message>" | finish')
  process.exit(1)
}

function start() {
  requireClean()
  srcTransfer("fetch", "--quiet", "--prune", "origin")
  const current = src("branch", "--show-current")
  if (current !== branch) {
    if (current !== "main") throw new Error(`ingredient-icons-sources is on ${current || "a detached HEAD"}, another batch: finish it first`)
    src("merge", "--ff-only", "origin/main")
    // An existing branch (local, or only on GitHub: git then tracks it) is resumed, not recreated.
    src("switch", ...(hasLocal() || hasRemote() ? [branch] : ["-c", branch]))
  }
  if (hasRemote()) {
    src("branch", "--set-upstream-to", `origin/${branch}`)
    if (!srcOk("merge", "--ff-only", `origin/${branch}`))
      throw new Error(`${branch} of the sources and its copy on GitHub have diverged: sort it out by hand`)
    console.log(`ingredient-icons-sources: on ${branch}, up to date with GitHub`)
  } else {
    srcTransfer("push", "--quiet", "-u", "origin", branch)
    console.log(`ingredient-icons-sources: on ${branch}, pushed`)
  }
}

function save(message: string) {
  if (!message) throw new Error('Usage: bun run batch save "🍱 Add 10 raws for …"')
  const current = src("branch", "--show-current")
  if (current !== branch) throw new Error(`ingredient-icons-sources is on ${current || "a detached HEAD"}, not ${branch}: bun run batch start`)
  src("add", "raw", "subjects.json")
  if (srcOk("diff", "--cached", "--quiet")) console.log("Nothing new to commit")
  else src("commit", "--quiet", "-m", message)
  srcTransfer("push", "--quiet", "-u", "origin", branch)
  console.log(`ingredient-icons-sources: ${src("log", "-1", "--format=%h %s")} on ${branch}, pushed`)
}

function finish() {
  const pr = JSON.parse(run(["gh", "pr", "view", branch, "--json", "number,state,isDraft,mergeable,url,headRefOid"]))
  const open = pr.state === "OPEN"
  if (!open && pr.state !== "MERGED") throw new Error(`${pr.url} is ${pr.state.toLowerCase()}`)
  if (open) {
    if (pr.isDraft) throw new Error(`${pr.url} is a draft: gh pr ready ${pr.number} once the user has approved it`)
    if (pr.mergeable === "CONFLICTING") throw new Error(`${pr.url} has conflicts with main`)
    const checks = spawn(["gh", "pr", "checks", String(pr.number)])
    if (!checks.success) throw new Error(`Checks of ${pr.url} are not all green:\n${checks.stdout.toString().trim()}`)
    if (git("status", "--porcelain")) throw new Error("This checkout has uncommitted changes: commit and push them first")
    if (git("rev-parse", "HEAD") !== pr.headRefOid)
      throw new Error(`This checkout's HEAD is not ${pr.url}'s head: push (or pull), so the user reviewed what gets merged`)
  }

  requireClean()
  srcTransfer("fetch", "--quiet", "--prune", "origin")
  // A pull request merged on GitHub may hold a head this checkout never fetched.
  if (!spawn(["git", "cat-file", "-e", `${pr.headRefOid}^{commit}`]).success) run(["git", "fetch", "--quiet", "origin"], TRANSFER)
  const batched = hasRemote()
  const ref = batched ? `origin/${branch}` : "origin/main"
  if (batched) {
    if (hasLocal() && src("rev-list", "--count", `origin/${branch}..${branch}`) !== "0")
      throw new Error(`${branch} of the sources has commits not pushed: bun run batch save`)
    if (!srcOk("merge-base", "--is-ancestor", "origin/main", ref))
      throw new Error(
        `main of the sources moved since the batch started. Rebase the batch on it:\n` +
          `  git -C ${sources} switch ${branch} && git -C ${sources} rebase origin/main && git -C ${sources} push --force-with-lease\n` +
          "then here: git fetch origin && git merge origin/main (conflicts in manifest.json or build.lock.json: take either side,\n" +
          "git checkout --theirs manifest.json build.lock.json, the build rewrites both), bun run build, commit, push, and bun run batch finish again",
      )
  }
  // Checked before anything moves: what lands on both mains must match. A merged pull
  // request with no batch branch left is done: later batches may have moved both mains.
  if (open || batched) requireInSync(pr.headRefOid, ref, open)

  // The raws first: if the pull request then fails to merge, main of the sources is one
  // batch ahead of the icons, and running finish again completes it. Never the reverse.
  if (batched) {
    src("switch", "main")
    src("merge", "--ff-only", "origin/main")
    src("merge", "--ff-only", ref)
    srcTransfer("push", "--quiet", "origin", "main")
    srcTransfer("push", "--quiet", "origin", "--delete", branch)
    if (hasLocal()) src("branch", "-d", branch)
    console.log(`ingredient-icons-sources: ${branch} merged into main and pushed`)
  } else {
    const current = src("branch", "--show-current")
    if (current !== "main") throw new Error(`ingredient-icons-sources is on ${current || "a detached HEAD"}, and ${branch} is not on GitHub`)
    src("merge", "--ff-only", "origin/main")
    if (src("rev-list", "--count", "origin/main..main") !== "0") throw new Error("main of the sources has commits not pushed")
    console.log("ingredient-icons-sources: no batch branch, the raws were already on main")
  }

  if (open) {
    run(["gh", "pr", "merge", String(pr.number), "--merge", "--match-head-commit", pr.headRefOid])
    console.log(`Merged ${pr.url}`)
  } else console.log(`${pr.url} was already merged`)
}

/** Every icon built at `commit` comes from the very raw at `ref` of the sources, and every raw there with a subject is built. */
function requireInSync(commit: string, ref: string, open: boolean) {
  const lock: Record<string, string> = JSON.parse(git("show", `${commit}:build.lock.json`)).raws
  const subjects: { slug: string }[] = JSON.parse(src("show", `${ref}:subjects.json`))
  const raws = new Set(src("ls-tree", "--name-only", ref, "raw/").split("\n").map((file) => path.basename(file)))
  const expected = new Set(subjects.map((s) => s.slug).filter((id) => raws.has(`${fileName(id)}.png`)))
  const problems: string[] = []
  for (const id of expected) {
    if (!Object.hasOwn(lock, id)) problems.push(`${id}: raw not built`)
    else {
      const raw = spawn(["git", "-C", sources, "show", `${ref}:raw/${fileName(id)}.png`])
      if (!raw.success || sha256(raw.stdout) !== lock[id]) problems.push(`${id}: icon built from another raw`)
    }
  }
  for (const id of Object.keys(lock)) if (!expected.has(id)) problems.push(`${id}: icon without its raw or subject`)
  if (problems.length)
    throw new Error(
      `The pull request's icons and ${ref} of the sources differ: ` +
        (open
          ? "bun run build, commit, push."
          : "the pull request is merged already, so put the sources' branch back to the raws it was built from (or move the extra raws to a new batch)") +
        `\n${problems.join("\n")}`,
    )
}
