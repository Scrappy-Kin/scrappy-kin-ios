# Patch Packet

Use this packet when work is not merge-ready and a contractor needs a targeted revision.

## Header
- Work order: `<WO id/title>`
- Candidate/output path: `<worktree-relative file path>`
- Mode: `single-output | arena | patch-stream`
- Reviewer: `<name>`
- Date: `<YYYY-MM-DD>`

## Verdict
- Merge-ready: `yes | no`
- If no: `patch required`

## Findings (highest severity first)
1. `[P1|P2|P3] <issue summary> - <file path>`
2. `[P1|P2|P3] <issue summary> - <file path>`

## Required Fixes
1. `<exact fix + acceptance check>`
2. `<exact fix + acceptance check>`

## Copy-Paste Patch Prompt
```md
Please patch `<target file path>` in your worktree.

Goals:
1. <goal>
2. <goal>

Required fixes:
1. <exact fix + acceptance check>
2. <exact fix + acceptance check>

Validation checks (must pass):
- <check 1>
- <check 2>

Rules:
- Use worktree-root relative paths only.
- Do not write to main workspace path.
- Preserve required footer/required sections.

Return:
- brief changelog (5-10 bullets)
- updated file path(s)
- consistency check block with reconciled counts/claims (if gate-driven)
```

## Merge Readiness
- Ready after: `<conditions>`
- Residual risk: `<one line>`
- Consistency check: `pass | fail | n/a`
