---
name: documentation
description: Standards for high-signal, low-slop documentation. Use when writing or reviewing docs to ensure they enable decisions.
---

# Agentic Documentation Guide

A standard for high-signal, low-slop documentation in agentic workflows.

⸻

## ⚡ Three Non-Negotiables

1. **100 words = 1 actionable idea** — If you can't point to the decision it enables, cut it
2. **Front-load signal** — Best lines in first 20 lines; agents weight beginnings heavily
3. **One concept, one location** — Duplication isn't emphasis; it's dilution

⸻

## Doc Types & Where They Live

| Type | Location | Purpose |
|------|----------|---------|
| **Navigation** | CLAUDE.md (root) | Project context, pointers |
| **Workflows** | .agents/skills/ | Reusable patterns (auto-synced) |
| **Execution control (Mayor mode)** | THREAD_A_STATE.md + work-orders/ + deliverables/ | Decision-gated orchestration with reviewable outputs |
| **Reference** | docs/ | Technical specs, architecture |
| **Strategy** | docs/strategy/ | Product/business (scrappy-kin only) |

**Key distinctions:**
- **CLAUDE.md** = Project-specific navigation, pointers, constraints
- **Skills** = Reusable workflows, propagated from canonical source
- **Mayor/WO repos** = Prefer `work-orders/` + `deliverables/` + state control file.
- **Everything else** = Project-specific, stays local

⸻

## Core Principles

1. **Every Document Has a Function** — Define what decision this doc enables. If unclear, don't write it.

2. **Structure Clarifies Thought** — Use tight section constraints instead of long instructions.

3. **Don't Teach the AI to Be Human** — Focus on architecture and rationale, not skill instruction.

4. **Diagnose Before Rewriting** — Identify verbosity, repetition, or drift before editing.

5. **Trim Before Adding** — Cut 20-30% first. Only then consider what's missing.

⸻

## Standard Doc Anatomy

1. **Purpose** – What this doc exists to change or align
2. **TL;DR** – 3 bullets max, actionable, at the TOP
3. **Scope & Relationship** – Where it fits in the project
4. **Key Principles / Constraints** – Ethics, limits, priorities
5. **Structure & Decisions** – Core choices and rationale
6. **Dependencies / Related Docs** – Upstream and downstream links

Each section should fit on one screen. If more is needed, spawn a child doc.

⸻

## Doc Diagnostic Loop

Before marking a doc "ready," self-check:

1. Is this decision-enabling?
2. Does it reuse and pass context?
3. Is it shorter than it could be?
4. Can a new agent act on it without more input?
5. Are the best lines in the first 20 lines?

**When to run:**
- Before marking any doc "ready"
- After any edit >50 words
- When another doc references this one

⸻

## Real-World Patterns

### Pattern: Primacy and Signal Placement

- **TL;DR at TOP, not bottom** — Primacy effect beats recency
- **Best line in first 20 lines** — If it's buried at line 200, it won't land

**Test:** Read only the first 20 lines. Can you act on it?

### Pattern: Command Reference Tables

Instead of subsections per command, use tables:

```markdown
| Task | Command |
|------|---------|
| View logs | `ssh server "docker logs service"` |
| Restart | `ssh server "docker restart service"` |
```

Impact: -50% words, +100% scannability.

### Pattern: Single Source of Truth

Every concept needs exactly one canonical home. Other docs reference it.

- **Canonical docs:** Full explanations (own the concept)
- **Hint docs:** Point to canonical sources, max 1 mention

**Grep test:** If a concept appears >2 times in non-operational docs, consolidate.

⸻

## Common Failure Modes

| Mode | Description |
|------|-------------|
| Verbosity | Restating the same goal in different phrasing |
| Context drift | Doc no longer matches current state |
| Over-production | Creating docs that don't enable decisions |

⸻

## Closing

Documents don't record work — they define intention.

- Every clean, aligned document compounds understanding across agents.
- Every unnecessary word dilutes it.
- Prefer brevity that clarifies, not minimalism that obscures.

**Remember:** Trim before adding. Front-load signal. One concept, one location.

⸻

## Commit & Version Standards

**Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) format. Do not use scopes (e.g., `feat(ios):` ❌ → `feat:` ✅).

**Versioning:** Follow semver (MAJOR.MINOR.PATCH) where logical — primarily for libraries, packages, or projects with external consumers.
