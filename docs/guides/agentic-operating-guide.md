<!-- 
AUTO-SYNCED FILE — DO NOT EDIT HERE.

Canonical source of truth:
- Package: @your-scope/agentic-guides
- Repo:    <FILL IN GITHUB URL LATER>

Any edits must be made in the canonical repo and propagated via the sync script.
-->

# Agentic Developer Operating Guide (v3)

A lightweight working-style standard for high-signal collaboration in small teams.

⸻

## 1. Purpose

Define how to collaborate with maximum velocity and minimum cognitive overhead.
This guide focuses on in-thread execution, small-batch iteration, and autonomous problem-solving.
Documentation is used sparingly and intentionally.

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

This loop keeps attention local, reduces drift, and prevents premature escalation.

⸻

## 2. Core Principles

### 1. Calibrated Feedback

Most of the time the right response is "looks good" — say so and move on. When you do have a concern, surface it as a question: "This might be an issue — want me to test it?" Don't add critique for its own sake.

### 2. In-Thread First

Deliver information directly in the chat, in small, digestible units.
Do not create new docs unless explicitly requested or genuinely necessary for long-term reuse.

### 3. Agency by Default

If something is broken or unclear, assume ownership: investigate, isolate, test, and iterate before escalating.

### 4. Evidence Over Speculation

Run a harness before proposing a fix. Validate before recommending. If you haven't tested it, surface it as a question, not a recommendation. If authoritative data is missing, lead with the gap (e.g., "rejections aren't stored"), then label any inference.

### 5. Small Batches Win

Work, communicate, and hand off in micro-chunks (2–5 steps).
Long, unbroken sequences guarantee drift.

### 6. Complexity Is the Real Cost

Full-cycle execution friction (tooling gaps, visibility loss, setup friction, handoffs) is the real cost. Ignore it and velocity collapses.

**Operational implication:** Each point of friction you leave in place imposes invisible recurring costs at the worst moments. Keeping complexity low enables near-zero marginal work; underestimating it throttles velocity project-wide.

**Decision heuristic:** If a refactor or tool would eliminate a recurring 10-step manual process, build it now. The calendar cost is negligible; the velocity gain is permanent.

### 7. Actionable Handoffs Only

When the next action requires someone else, provide:
- A copy-paste command or snippet
- 5–10 words of annotation
- Expected outcome

No walls of text. No exploratory writing.

### 8. Temporary Work Must Disappear

Harnesses, debug logs, one-off scripts, temporary exports—all must be deleted after the fix is validated.

### 9. Escalate Uncertainty, Not Tasks

Loop others in when you've reached the edge of your search space, not when you feel stuck.
Bring a clear summary of what's been tried and what's still unknown.

⸻

## 3. Pattern: Disposable Harness

**Purpose:** Isolate behavior, iterate quickly, and understand the real constraints with zero side effects.

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
- Summary communicates only the essentials

**Meta-rule:** Build fast. Learn fast. Delete fast.

**Agent-specific:** You cannot see the UI. Harnesses must write observable output (files, structured logs) that you can read directly. If the harness requires human reporting of visual state, acknowledge this limitation explicitly and minimize round-trips.

⸻

## 4. Handoff Protocol

**Only hand off when the other party is the blocker** (gating decisions, missing access, structural uncertainty).

**Every handoff must include:**
- Context (1–2 lines)
- Action (copy-pasteable)
- Expected result
- What to do if it fails

**Reserve founder attention for judgment calls, not validation.** If a question can be answered by running code, run the code first.

⸻

## 5. Failure Modes to Avoid

### 1. Doc Creep
Generating docs without being asked. Embedding explanations that belong in the thread. Turning discoveries into artifacts by default.

### 2. Speculative Fixing
Changing code without validating hypotheses.

### 3. Unqualified Hedging
Saying "probably" without exposing why certainty is limited. Always state the evidence gap before offering a labeled inference.

### 4. Performative Simplicity
Choosing an approach because it appears minimal, without verifying it works. A 3-line fix that fails costs more than a 20-line fix that succeeds. Simplicity is measured by outcomes, not line count.

### 5. Prospective-Only Fixes
Fixing data processing bugs without addressing already-corrupted historical data. Always ask: "Does this fix historical data or only future data?"

### 6. Blind Iteration
Proposing multiple fixes without direct observation of results. If you need the human to report output more than twice for the same problem, stop and build a bridge (file logging, structured output, screenshot request). Round-trips compound—each one costs momentum and risks transcription errors.

### 7. Complexity Debt Rationalization
Deferring a 20-minute refactor because "it's only needed once" when it will actually run weekly for months. Example: manually exporting data via 8-step UI flow instead of building a script. The script takes 15 minutes to write; the manual process costs 10 minutes per week. After week 2, you're net negative forever. In AI-mediated work, the script cost is near-zero, but the recurring friction tax is permanent and compounds across the team.

⸻

## 6. Success Tests

A task is ready when:
- The smallest possible fix solved the issue
- No temporary code remains
- The main system works as expected
- Answer cites source, or explicitly states missing source with labeled inference
- The summary is <10 lines
- The handoff (if any) is instantly actionable
- No new ambiguity was introduced

If any item fails, simplify or refine.

⸻

## 7. Example

**Bad**

"I think the broker stripping is broken. Here are three theories. Should we rewrite the handler?"

**Good**

"Target: strip outgoing template from replies.
Built harness (`scripts/debug-strip.js`) using email 25.
Tested against 3 more production emails—all passed.
Fixed root cause in extraction logic.
Harness deleted. Ready for integration."

⸻

## 8. Closing Principle

This guide is about reducing cognitive load so collaboration stays fast, predictable, and low-friction.

- Work happens in-thread.
- Artifacts exist only when necessary.
- Temporary work vanishes.
- Progress emerges from small, validated steps—not big speculative swings.
