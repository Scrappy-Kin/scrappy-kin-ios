---
name: operating-guide
description: Developer execution loop for debugging and feature delivery. Use for hands-on implementation work; not for WO governance/review.
---

# Agentic Developer Operating Guide (v3)

A lightweight working-style standard for high-signal collaboration in small teams.

## Routing
- Use when: doing implementation/debugging work directly.
- Do not use when: running WO orchestration/review decisions.
- Use instead: `contractor` for WO execution, `mayor-best-practices` for WO governance.

⸻

## ⚡ Five Non-Negotiables

1. **Harness before opinion** — Don't propose fixes you haven't tested
2. **Validate in production** — Test fixtures aren't enough, check real data
3. **Delete your mess** — Temporary work must vanish
4. **Observation before iteration** — If you can't see the result, build a bridge first
5. **Ignore effort estimates** — If work is framed as "large" or "days," re-evaluate on complexity and friction, not labor cost

⸻

## 🔄 The Loop

Use this for debugging, feature work, investigation, or unexpected behavior.

1. Clarify the target (1–2 sentences)
2. Generate hypotheses (2–4 likely causes or paths)
3. Build a harness *(need to understand the problem first? see Research Guide)*
4. Iterate rapidly (change → run → observe → adjust)
   *Can't observe directly? Build file-based logging or ask for a screenshot before iterating blind.*
5. Validate against real data
6. Apply the minimal fix *(structural changes? see Refactoring Guide)*
7. Delete all temporary work
8. Summarize in <10 lines

⸻

## Execution Boundary (delegated/WO mode)
When executing delegated work (contractor mode):
- Freeze strategy during execution. Do not add new tactical branches mid-run.
- If a new branch appears necessary, raise it as a blocker with 1-3 options and continue only after decision.
- Keep variant count fixed to WO scope while collecting clean learning signals.

⸻

## Core Principles

1. **Complexity Is the Real Cost** — Friction compounds. Each point of friction imposes recurring costs.

2. **Small Batches Win** — Work in micro-chunks (2–5 steps). Long sequences guarantee drift.

3. **Evidence Over Speculation** — Run a harness before proposing fixes. Delete all temporary work after validation. If untested, surface as question.

4. **Agency by Default, Escalate Uncertainty** — Investigate and iterate first. Loop others only when you've hit the edge of your search space.

5. **In-Thread, Calibrated Delivery** — Deliver in chat. Don't create docs unless requested. Most of the time "looks good" is right; surface concerns as questions.

⸻

## Pattern: Disposable Harness

**Purpose:** Isolate behavior, iterate quickly, understand constraints with zero side effects.

**How to run it:**
- Create a tiny script (e.g. `scripts/debug-X.js`)
- Export the target function; guard `main()`
- Run against a single, fixed test fixture
- Adjust logic until output matches expectations
- **Validate against production data** (not just fixtures)
- Integrate only the minimal required change
- Delete the harness and any debug scaffolding

**Success criteria:**
- Fix validated in isolation AND against real data
- No temporary code or logs remain
- Root cause understood
- Summary <10 lines

**Agent-specific:** You cannot see the UI. Harnesses must write observable output (files, structured logs) that you can read directly.

⸻

## Handoff Protocol

**Only hand off when the other party is the blocker.**

**Every handoff must include:**
- Context (1–2 lines)
- Action (copy-pasteable)
- Expected result
- What to do if it fails

**Reserve founder attention for judgment calls, not validation.**

⸻

## Failure Modes to Avoid

| Mode | Description |
|------|-------------|
| Doc Creep | Generating docs without being asked |
| Speculative Fixing | Changing code without validating hypotheses |
| Unqualified Hedging | Saying "probably" without exposing evidence gap |
| Blind Iteration | Multiple fixes without observing results |
| Complexity Debt | Deferring 20-min refactor that runs weekly for months |
| Blame Framing | Harsh or personal wording that lowers collaboration throughput |

⸻

## Success Tests

Task is ready when: smallest fix applied, no temp code remains, system works, summary <10 lines, handoff (if any) is actionable, no new ambiguity.
