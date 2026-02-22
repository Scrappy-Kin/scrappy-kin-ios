---
name: skills-maintainer
description: Maintain shared agent skills and templates from execution friction. Use when converting recurring failures into minimal, reusable process/tooling improvements with propagation and verification.
---

# Skills Maintainer

## Purpose
Own the meta-improvement loop for agent workflows:
- detect repeatable friction,
- codify minimal generic fixes in shared sources,
- propagate safely,
- verify adoption.

## Routing
- Use when: improving shared skills/templates/process rules across repos.
- Do not use when: executing a single WO deliverable or choosing arena winners.
- Use with: `skill-authoring` for drafting/revising SKILL.md content quality.

## Core Directives (non-negotiable)
1. Shared-first always: patch canonical files in `agentic-guides` first.
2. No repo-only process patches unless updating existing project adapters (for example `CONTRACTOR-BRIEF.md`).
3. Propagation is part of Done.
4. After propagation, commit and push canonical updates to remote in the same work cycle.
5. New shared skill => add one-line pointer in `AGENTS.md` template and active repo `AGENTS.md`.
6. Do not ask “want me to apply this now?” for meta changes; execute directly.
7. Keep minimal diff; no framework expansion unless explicitly requested.
8. Use canonical status enums for process-critical fields.
9. Explicitly call out policy changes that alter merge/review semantics.
10. Shared templates are first-class artifacts; propagate `.agents/templates/` with skills.
11. Run preflight/postflight checks during propagation; fail fast on contract violations.

## Operating Loop
1. Capture friction pattern in one sentence (trigger, failure mode, impact).
2. If pattern is substantive/recurrent, register or update a risk-mode spec under `docs/meta/risk-modes/`.
3. Validate scope: repeatable + generic + worth codifying.
4. Pick smallest canonical edit surface:
   - shared skill(s),
   - shared template(s) (for example patch packets),
   - project adapter only if needed.
5. Implement patch with copy-paste-ready wording.
6. Propagate.
7. Verify in at least:
   - one active repo,
   - one additional repo.
8. Return change ledger.

## Propagation Contract
Use one canonical script/workflow that does all of:
1. Sync `.agents/skills/` and `.claude/skills/`.
2. Sync `.agents/templates/`.
3. Sync `.agents/tools/`.
4. Remove deprecated legacy skill paths.
5. Ensure discovery docs (`AGENTS.md`/`CLAUDE.md`) exist and point to local `.agents/...` paths.

## Validation Contract
### Preflight (canonical repo, before sync)
1. Every shared skill has valid frontmatter `name` + `description`.
2. Skill names are unique.
3. No machine-specific absolute paths in shared skills.
4. Any `.agents/templates/...` path referenced by a skill exists in shared templates.

### Postflight (target repo, after sync)
1. Required skill and template directories exist.
2. AGENTS doc contains local pointers to `.agents/skills/` and `.agents/templates/`.
3. Required tool directory exists (`.agents/tools/`) and includes WO runtime scripts.
4. Deprecated `.windsurf/skills/` path is removed.
5. Spot-check at least 2 repos every run.

## Change Ledger (required output)
- Files changed
- Why each changed
- Propagation result
- Verification paths checked
- Residual risks / follow-ups

## Definition of Done
A skills-maintainer update is done only when:
- canonical sources are patched,
- propagation has run,
- canonical repo changes are committed and pushed,
- AGENTS pointer rule is satisfied,
- WO tooling sync rule is satisfied,
- verification checks pass,
- change ledger is returned.

## Version
Last updated: 2026-02-21
Status: locked
