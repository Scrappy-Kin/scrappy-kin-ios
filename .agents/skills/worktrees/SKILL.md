---
name: worktrees
description: Local-first parallelization via git worktree. Use for parallel-safe side quests with a strict fence contract and evidence-first review.
---

# Worktrees for Parallel Slices + Side Quests

Run parallel work streams on one machine without directory dance:
- `./` stays on `main` (mainline lane)
- `../sk-slice-<slug>` is an isolated slice worktree on `slice/<slug>`

⸻

## ⚡ Four Non-Negotiables

1. **Fence-first** — No code changes until the Fence Contract is written.
2. **One slice = one fence** — No scope creep. New scope = new slice.
3. **Evidence mandatory** — Produce the declared evidence package as you go.
4. **Fence break = stop** — If you need to touch a file outside the fence, pause and ask.

⸻

## ✅ When to Spawn a Slice (30-second smell test)

Spawn a slice only if all are true:

- **Autonomous**
  - Can be specified as outcomes + constraints.
  - Low likelihood of new architecture/product decisions mid-stream.

- **Parallel-safe**
  - Can be fenced to a directory set or explicit small file set.
  - Low likelihood of touching "hot" shared files in flux.

- **Observable**
  - Review can happen from evidence (screenshots, demo steps, logs), not code-reading.

If any are false: keep it in `main` until the decision surface shrinks.

⸻

## Two Lanes

### Lane A — Mainline (high judgment)

- Workspace: `./`
- Branch: `main`
- Work type: UX flow decisions, architecture choices, composition, taste

### Lane B — Slice (bounded implementation)

- Workspace: `../sk-slice-<slug>`
- Branch: `slice/<slug>`
- Work type: fenced implementation + evidence package

⸻

## Fence Contract (required for every slice)

Put the Fence Contract at the top of the PR description, or create `notes/slices/<slug>.md`.

### Fence Contract Template

- **Slug:** `<slug>`
- **Goal (1 sentence):**
- **Fence (allowed):**
  - `path/allowed/**`
  - `path/allowed/file.ts`
- **No-touch list (explicitly forbidden):**
  - `path/hot/**`
  - `app.config.*`
  - `package-lock.json` *(example; adapt to repo reality)*
- **Evidence required:**
  - [ ] Screenshot(s): X / Y / Z states
  - [ ] Demo steps (3–7 steps)
  - [ ] Log snippet showing Y (if applicable)
  - [ ] Risk notes (what might break + rollback note)
- **Stop conditions (pause + ask):**
  - If you need to edit any file outside the fence
  - If a new product/architecture decision is required
  - If a platform constraint breaks a non-negotiable

⸻

## 🔄 The Slice Loop

1. **Decide** — Run the smell test. Confirm autonomy + fenceability + observability.
2. **Declare** — Write the Fence Contract (including evidence requirements).
3. **Spawn** — Create a sibling worktree on a dedicated branch.
4. **Execute** — Work only inside the fence. Capture evidence continuously.
5. **Integrate** — Rebase slice on `main`, then open a PR with the contract + evidence.
6. **Cleanup** — Remove the worktree after merge.

⸻

## CLI Fanout (Codex/Claude)

Use non-interactive sub-agent passes for fenced, low-judgment cleanup loops:

- Codex:
  - `codex exec --dangerously-bypass-approvals-and-sandbox -C ../sk-slice-<slug> - < prompt.md`
- Claude:
  - `claude -p --permission-mode bypassPermissions --dangerously-skip-permissions < prompt.md`

Prompt contract for each slice:
1. stay inside the declared fence,
2. run required checks before exit,
3. return a short changelog + residual risks,
4. escalate only when objective/scope/threshold decisions must change.

Mayor role in fanout:
- parallelize routine slices automatically,
- review evidence bundles,
- involve overseer only for leverage decisions.

⸻

## Command Reference

Run these from the main repo folder (`./`) unless noted.

| Task | Command |
|------|---------|
| Ensure mainline is clean | `git status` |
| Update main | `git checkout main && git pull` |
| Create slice worktree | `git worktree add ../sk-slice-<slug> -b slice/<slug>` |
| List worktrees | `git worktree list` |
| (Slice) Rebase onto main | `cd ../sk-slice-<slug> && git fetch origin && git rebase origin/main` |
| Cleanup worktree | `git worktree remove ../sk-slice-<slug>` |
| Delete local branch (optional) | `git branch -d slice/<slug>` |
| Delete remote branch (optional) | `git push origin --delete slice/<slug>` |
| Fix stale worktree metadata (if needed) | `git worktree prune` |

⸻

## Build Artifact Isolation (Xcode / native tooling)

**Outcome:** slice and mainline must not stomp build artifacts.

- Use a distinct DerivedData (or equivalent) per worktree.
- Do not commit per-machine build settings.

⸻

## PR + Review Rules (conversational review)

- Keep PRs medium-sized: one coherent user-visible change or one coherent internal primitive.
- Put at top:
  - Fence Contract
  - Evidence package
  - 5–10 line summary: what changed + why + risk notes
- Evidence > code:
  - Screenshots preferred
  - Demo steps when relevant
  - Short decision notes when tradeoffs exist

⸻

## Troubleshooting

- **Worktree already exists / branch in use**
  - A branch can only be checked out in one worktree at a time.
  - Use a new slug / branch, or remove the old worktree.

- **Build weirdness across worktrees**
  - Verify artifact isolation (DerivedData/caches) per worktree.
  - Clean only the affected worktree’s artifacts.

- **Merge conflicts**
  - First check: did the slice violate the fence?
  - If conflicts are inside the fence, resolve in the slice after rebasing on latest `main`.

⸻

## Guardrails

- One active slice at a time until stable; then consider two.
- Avoid touching global config in slices unless the slice is explicitly about config.
- Slices are disposable working directories: merge → remove worktree → delete branch.

⸻

## Closing

Parallelism is opportunistic. Use slices to protect focus in `main` while still shipping bounded work.
