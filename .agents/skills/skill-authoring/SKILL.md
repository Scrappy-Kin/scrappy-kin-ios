---
name: skill-authoring
description: Create or update SKILL.md-based skills. Use when authoring or refactoring local skills; not for executing normal product work.
---

# Skill Authoring

## Purpose
Produce skills that are portable, trigger reliably, and stay maintainable under real usage.

Use `skills-maintainer` when the task includes cross-repo propagation, template updates, or meta-process ownership. Use this skill for the skill content itself.

## Standard Stack (order of truth)
1. **Normative spec**: `agentskills.io/specification`.
2. **Platform overlays**: official product docs (for example Anthropic Claude docs, GitHub Copilot docs).
3. **High-signal exemplars**: maintained public skill repos.
4. **Local constraints**: project pathing, review protocol, required footer/rubric.

If sources disagree, follow this order and explicitly note any tradeoff.

Prefer first-party sources (official docs and canonical GitHub repos). Treat directory/mirror sites as discovery aids only, then trace back to canonical source before adopting patterns.

## Evidence Contract
Before writing or revising a skill, collect:
1. At least 1 normative source.
2. At least 2 platform-doc sources.
3. At least 2 real skill examples from active repos.
4. Recency check (prefer sources updated in the last 6 months).
5. Triangulated quality signals per source: maintainer credibility, adoption signal (stars/usage/docs references), and implementation clarity.

## Seed Sources (check first)
1. `agentskills.io/specification` (format and constraints).
2. GitHub Copilot "About Agent Skills" docs (cross-product behavior).
3. Anthropic Claude docs for Agent Skills (runtime behavior and safety guidance).
4. `anthropics/skills` repository, especially `skills/skill-creator/SKILL.md` (large real-world exemplar set + meta-skill pattern).
5. `openai/agents.md` (parallel cross-agent instruction standard; useful for interoperability decisions).

## Workflow
1. Define the job-to-be-done, trigger phrases, and failure modes.
2. Collect 5 comparator skills/examples and map recurring patterns.
3. Draft/update `SKILL.md` with minimal required frontmatter and concise activation-focused instructions.
4. Apply progressive disclosure (keep core workflow in `SKILL.md`; move detail to `references/` and utilities to `scripts/` only if needed).
5. Dogfood: use the skill once on a realistic task and capture friction.
6. Patch the skill from dogfood findings.
7. Lock: add/update `Version` section with date, change summary, and explicit status (`locked`).
8. If this repo uses propagation, sync to children and verify one target repo.

## Comparator Extraction Template
For each comparator, capture:
- Source URL
- Maintainer/org
- Recency (last meaningful update)
- Adoption signal (for example stars, installs, or official-doc references)
- What works (trigger quality, structure, resources, validation)
- What to avoid (bloat, vague descriptions, missing constraints)
- Portable pattern to adopt

## Authoring Rules
1. Keep frontmatter minimal unless platform requires extras.
2. Put "what + when" in `description`; this is the primary trigger surface.
3. Prefer deterministic steps where mistakes are costly; keep freedom where multiple approaches are valid.
4. Keep language imperative and concrete.
5. Avoid repo-specific hardcoding unless intentionally project-local.

## Dogfood Review Rubric
1. Did the skill trigger from natural user phrasing?
2. Did the first pass produce a usable output without hidden assumptions?
3. Were instructions short enough to scan and execute?
4. Did any missing references/scripts block execution?
5. Did output quality improve vs no skill?

If 2+ checks fail, revise before locking.

## Fast Path (low-risk edits)
Use fast path only when all conditions are true:
1. Change is editorial only (wording, typo, clarity), no workflow/behavior changes.
2. No frontmatter trigger changes (`name`/`description`).
3. No new scripts/references/assets added.

Fast path requirements:
1. One authoritative source is sufficient.
2. Dogfood run can be skipped.
3. Mark version status as `locked (fast-path)` and note why full workflow was not needed.

If any condition fails, use the full workflow.

## Definition of Done
A skill update is done when:
- Evidence contract is satisfied.
- Dogfood pass is completed and fixes are applied.
- `Version` section is updated and marked `locked`.
- Propagation/sync (if applicable) is completed and spot-verified.

## Version
Last updated: 2026-02-12
Status: locked (dogfood-validated)
