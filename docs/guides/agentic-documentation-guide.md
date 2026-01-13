<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

# Agentic Documentation Guide

A standard for high-signal, low-slop documentation in agentic workflows.

⸻

## 1. Purpose

Documents are the memory substrate of multi-agent systems. Every paragraph compounds future reasoning, scope clarity, and decision-making. Every word is a trade-off between speed now and confusion later.

Success = fewer, sharper, reusable docs that strengthen shared purpose.

⸻

## ⚡ Three Non-Negotiables

1. **100 words = 1 actionable idea** — If you can't point to the decision it enables, cut it
2. **Front-load signal** — Best lines in first 20 lines; agents weight beginnings heavily
3. **One concept, one location** — Duplication isn't emphasis; it's dilution

⸻

## 2. Core Principles

1. **Every Document Has a Function**
   Define what decision, alignment, or behavior this doc enables. If that isn't clear, don't write it yet.

2. **Structure Clarifies Thought**
   Use tight section constraints instead of long instructions.

3. **Each Doc Inherits and Passes Context**
   It's a live node in a larger reasoning graph. Reference upstream and downstream artifacts.

4. **Don't Teach the AI to Be Human**
   Avoid skill instruction (e.g., how to code). Focus on architecture, rationale, and decision context.

5. **Diagnose Before Rewriting**
   Don't polish slop. Identify verbosity, repetition, or drift before editing.

6. **Volume ≠ Value**
   High output with low signal-to-noise ratio is a systemic failure. Each word must earn its place.

7. **Trim Before Adding**
   When improving a doc, cut 20-30% first. Only then consider what's missing.

⸻

## 3. Standard Doc Anatomy

1. **Purpose** – What this doc exists to change or align
2. **TL;DR** – 3 bullets max, actionable, at the TOP (not bottom)
3. **Scope & Relationship** – Where it fits in the project
4. **Key Principles / Constraints** – Ethics, limits, priorities
5. **Structure & Decisions** – Core choices and rationale
6. **Dependencies / Related Docs** – Upstream and downstream links

Each section should fit on one screen. If more is needed, spawn a child doc.

**Two hero sections max:** Philosophy (why) + Process (how). Everything else is elaboration.

⸻

## 4. Doc Diagnostic Loop

Before marking a doc "ready," self-check:

1. Is this decision-enabling?
2. Does it reuse and pass context?
3. Is it shorter than it could be?
4. Does it reflect shared principles?
5. Can a new agent act on it without more input?
6. Are the best lines in the first 20 lines?

If any answer is "no," revise or remove. *(For operational docs, also check Operating Guide for harness/handoff patterns)*

**When to run:**
- Before marking any doc "ready"
- After any edit >50 words
- When another doc references this one

**Evaluation checklist for technical docs:**
```markdown
<!-- EVALUATION CHECKLIST:
- [ ] Can an agent find what it needs via grep in <30 seconds?
- [ ] Is every command copy-paste ready?
- [ ] Does this enable a decision without reading other docs?
- [ ] Is there duplicate content that should be referenced instead?
- [ ] Does the same concept appear >1 time in THIS doc?
- [ ] If this is a hint doc, am I pointing to canonical sources vs repeating them?
-->
```

⸻

## 5. Inline Comment Template

```markdown
# [Title] — vX.X (Agentic Docs)
<!-- Purpose: one sentence on decision/alignment -->
<!-- Context: prior docs or dependencies -->
<!-- Key principles/constraints: 3 bullets max -->
<!-- CANONICAL: concept-name (if this is the single source of truth) -->
```

**Doc type signals:**
- Add `CANONICAL: concept-name` if this doc owns the full explanation
- Hint docs should reference canonical sources, not repeat them
- One concept = one canonical location

**Required metadata for service docs:**
```markdown
<!-- 
SERVICE: [service-name]
CONTAINERS: [container-list]
DEPENDS_ON: [dependencies or "None"]
LAST_UPDATED: YYYY-MM-DD
RELATED_DOCS: [doc1.md], [doc2.md]
-->
```

⸻

## 6. Real-World Patterns

### Pattern: Primacy and Signal Placement

Agents (like humans) weight beginnings more heavily than middles. Structure docs accordingly:

- **TL;DR at TOP, not bottom** — Primacy effect beats recency
- **Best line in first 20 lines** — If it's buried at line 200, it won't land
- **Two hero sections max** — Philosophy + Process; everything else is elaboration

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

### Pattern: Cross-Reference Document

For projects with >10 docs, create a lookup index:

```markdown
| I want to... | Primary Doc | Also See |
|--------------|-------------|----------|
| Understand system | README.md | ARCHITECTURE.md |
| Find a command | QUICK-REFERENCE.md | Service docs |
```

This prevents agents from reading every doc to find the right one.

### Pattern: Single Source of Truth

Every concept needs exactly one canonical home. Other docs reference it.

**Doc type roles:**
- **Canonical docs:** Full explanations (own the concept)
- **Hint docs:** Point to canonical sources, max 1 mention
- **Operational docs:** Can repeat when pedagogically necessary

**Grep test:** If a concept appears >2 times in non-operational docs, consolidate.

### Pattern: Grep Before You Write

Before documenting a concept:

```bash
grep -ri "concept name" . --include="*.md" | wc -l
```

**Decision tree:**
- 0 mentions → You're creating the canonical source
- 1-2 mentions → Review those docs, reference if appropriate
- 3+ mentions → Duplication detected, consolidate first

⸻

## 7. Common Failure Modes

- **Verbosity** — Restating the same goal in different phrasing
- **Context drift** — Doc no longer matches current state
- **Instruction instead of rationale** — Teaching "how to code" instead of "why this architecture"
- **Over-production** — Creating docs that don't enable decisions

Each stems from forgetting the doc's function.

⸻

## 8. Example: Refactoring a Verbose Doc

**Before:**
> The system is designed in such a way that users are able to sign up and log in securely using encryption technologies that ensure data is protected from unauthorized access.

**After:**
> Users authenticate via end-to-end encryption; credentials never leave their device.

Impact: –70% words, +200% clarity.

⸻

## 9. Closing

Documents don't record work — they define intention. They are the architecture of alignment.

- Every clean, aligned document compounds understanding across agents.
- Every unnecessary word dilutes it.
- Prefer brevity that clarifies, not minimalism that obscures.

**Remember:** Trim before adding. Front-load signal. One concept, one location.
