# ⚠️ Auto-Synced Skills — Do Not Edit Here

These files are **automatically propagated** from a central repository and will be overwritten on next sync.

**Source:** `agentic-guides/skills/_shared/`  
**Sync script:** `agentic-guides/scripts/sync-skills.sh`

## For Agents: What To Do

1. **If you see changes here** — Commit them. These updates came from the canonical source and should be tracked in this repo's git history.

2. **Use these skills self-serve** — When a task matches a skill (health check, refactoring, research, etc.), load and follow its guidance. That's what they're for.

## Related: CLAUDE.md and AGENTS.md

The same sync system creates `CLAUDE.md` and `AGENTS.md` at the repo root **if they don't exist** (from templates).

- **AGENTS.md** — Lightweight pointer to skills. Safe to leave as-is.
- **CLAUDE.md** — Navigation hub. Created from template initially, but **may be edited** with project-specific content. Your edits won't be overwritten (sync only creates if missing).

## What Are These?

Workflow guides in AgentSkills format synced to project skill locations:
- `health-check/` — Code audits
- `operating-guide/` — Working style, harness-validate-cleanup loop
- `refactoring/` — When and how to refactor
- `documentation/` — Doc standards
- `research/` — Research methodology
- `contractor/` — WO execution contract and quality controls
- `mayor-best-practices/` — Orchestration, review, and merge protocol
- `worktrees/` — Parallel slice execution guardrails
- `classification-rnd/` — Classification experiment workflow
- `skill-authoring/` — Evidence-backed skill authoring and dogfood workflow
- `firecrawl-efficiency/` — Credit-aware Firecrawl endpoint routing and extraction guardrails
- `skills-maintainer/` — Shared skill/template maintenance loop with propagation and verification

## To Make Changes

1. Edit the canonical source in `agentic-guides/skills/_shared/`
2. Run `./scripts/sync-skills.sh` from agentic-guides
3. Changes propagate to all projects

**Do not edit these files directly** — your changes will be lost on next sync.
