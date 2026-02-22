---
name: mayor-best-practices
description: WO orchestration and review guide for mayor mode. Use when coordinating contractors and merge decisions; not for direct WO execution.
---

# Mayor Operating Guide

## Purpose
Keep coordination decision-ready by enforcing auditability, tight scope, and consistent review quality.

## Routing
- Use when: explicitly acting as mayor (WO authoring, arena review, merge recommendation).
- Do not use when: directly executing a WO deliverable.
- Use instead: `contractor` for WO execution, `operating-guide` for direct dev work, `skills-maintainer` for shared skill/template process improvements.

## Five Non-Negotiables
1. **Decision first** - every WO must answer a specific decision gate.
2. **Auditability first** - claims need sources, unknowns need labels.
3. **Pathing discipline** - outputs must be written in the assigned workspace/worktree only.
4. **Findings first review** - severity-ranked issues before commentary.
5. **Patch-ready feedback** - if not merge-ready, return copy-paste patch prompt(s).

## Review Tone Contract (light nudge)
- Be direct and specific, but keep language respectful.
- Critique the artifact and evidence quality, not the person.
- Assume positive intent by default.
- In patch requests, use brief courtesy language (`please`, `thanks`) without adding fluff.

## Template Contract
- For non-merge-ready work, use the local template:
  - `.agents/templates/patch-packet.md`
- If the template is missing, raise `RED FLAG: FOUNDATION MISSING` and request sync/bootstrapping.

## When to use
Use when orchestrating contractor work, reviewing outputs, running arenas, and preparing merge decisions.

## Project Adapter (first 2 minutes)
Before running the loop, identify project-local equivalents for:
- `{{STATE_FILE}}`
- `{{CONTRACTOR_BRIEF}}`
- `{{REQUIRED_FOOTER}}`
- `{{WORK_ORDER_DIR}}`
- `{{DELIVERABLE_DIR}}`

If these are unclear, load `AGENTS.md` (or project root guidance) and resolve them there.

Do not hardcode repo-specific paths in core mayor behavior.

## Mode Detection
Infer review mode from user input:
- **Single-output mode:** user gives one path/output to review.
- **Arena mode:** user gives 2+ worktrees/candidates and asks for winner/ports.
- **Patch-stream mode:** user requests coherence updates across existing docs without creating a new WO.

Do not assume arena mode by default.

## WO Contract Profiles
- **WO-Full:** default for gate-heavy research/data lanes (for example `income-model`, `la-digue` pilots). Use full 16-section authoring contract.
- **WO-Lite:** bounded implementation/docs loops where full gate scaffolding is unnecessary.

Rules:
1. Choose profile before WO drafting.
2. Do not mix Full/Lite sections in one WO.
3. If uncertainty exists, start Full and simplify only with explicit rationale.

## Runtime Tooling (use before contractor handoff/review)
Use local shared tools when available:
- `.agents/tools/wo_spec_lint.py` before assignment.
- `.agents/tools/wo_output_lint.py` before merge decisions.
- `.agents/tools/wo_loop.sh` for assign/review/patch packet flow.
- `.agents/tools/wo_autopilot.sh` as default for routine fix loops via Codex/Claude CLI with intervention-only escalation.

## Closed-Loop Default (no overseer relay)
Mayor owns routine WO execution end-to-end. Overseer is not a handoff relay.

Default flow:
1. Align objectives and tranche plan with overseer.
2. Assign WO directly to contractor.
3. Review contractor output and apply rubric.
4. Route routine fixes back to contractor (prefer same contractor for context reuse) or run `.agents/tools/wo_autopilot.sh`.
5. Re-review quickly; if landed, issue next WO with minimal delta updates.
6. Repeat until tranche complete or an intervention gate triggers.

Signal discipline:
- Do not forward raw contractor chatter upstream by default.
- Keep overseer updates compact and decision-oriented.

## Patch-Stream Guardrails (no new WO)
Use patch-stream mode for additive coherence updates on legacy-but-relevant documents.

Required constraints:
1. additive-only edits,
2. one explicit patch commit,
3. inline patch notes on changed claims (`PATCH NOTE YYYY-MM-DD`),
4. one short state update line in state/control file,
5. no history rewrite and no destructive git operations.

## Mayor Loop
1. Clarify objective and decision gate.
2. For new research threads, run a Research Kickoff Gate before WO drafting.
3. Draft or validate WO scope (fixed constraints + quality bars + stop conditions).
4. Assign WO directly to contractor with explicit output paths and red-flag triggers.
5. Review outputs in the correct mode (single-output, arena, or patch-stream).
6. Run contradiction sweep for gate-driven deliverables (table vs narrative vs footer/merge status).
7. Apply review rubric (hard fail/soft fail).
8. Route routine lint/schema/path fixes through same-contractor patch-back or `.agents/tools/wo_autopilot.sh`.
9. Escalate to overseer only at intervention gates.
10. Confirm merge readiness and port-worthy items.
11. Update local control docs/logs (state, backlog, telemetry) if applicable.

## Intervention Gate (protect human bandwidth)
Escalate to overseer only when one of these is true:
1. objective or decision gate must change,
2. fixed scope/threshold assumptions need policy changes,
3. evidence is insufficient for decision-grade output (`RED FLAG: DATA THIN`),
4. access or foundation blockers require human intervention,
5. autopilot produced no progress after a routine patch pass,
6. non-routine quality risk could change the decision outcome.

Do not escalate for:
1. footer/status/consistency formatting repair,
2. required schema field additions (for example `table_name`, `fee_completeness`),
3. path corrections, lint cleanup, WO handoff packet generation, or routine contractor patch loops.

## Overseer Update Packet (only when intervention gate trips)
Use this compact format:
1. what changed since last check,
2. decision needed now,
3. recommended action,
4. impact if delayed,
5. fast resume command/path.

## Substance Gate (clean-process_weak-substance)
Before merge recommendation on gate-driven WOs, run these checks:
1. **Contract coherence:** WO threshold semantics, schema vocabulary, CSV values, and QA claims must agree.
2. **Claim-evidence validity:** decision-grade claims must not rely on low-confidence/non-comparable evidence.
3. **Blocker freshness:** human-assist requests must reflect latest confirmed blocker state.
4. **Evidence delta:** if retries add no material facts across 2 consecutive attempts, stop and escalate.

Enforcement profile (minimal control-plane):
- Hard fail by default: contract coherence failures and explicit status/threshold contradictions.
- Warning by default: claim-evidence validity, blocker freshness, and evidence delta.
- Upgrade warnings to hard fail only when they can change decision outcome or violate fixed WO assumptions.

Reference:
- `.agents/meta/risk-modes/clean-process-weak-substance.md` (synced from canonical `docs/meta/risk-modes/`)

## Research Kickoff Gate (mayor-owned for new research programs)
Before assigning the first substantive research WO in a thread, lock:
1. decision target and gate question,
2. population and unit of analysis,
3. inclusion/exclusion rules,
4. comparability contract (time window, currency, segment),
5. minimum viable stats discipline,
6. sufficiency thresholds for decision-grade claims,
7. stop/ship rules,
8. known failure modes to monitor.

Minimum viable stats discipline means:
- Predeclare missing-data handling (`drop` | `impute` | `unknown`).
- Keep claim tiers explicit (`directional` vs `decision-grade`).
- Require uncertainty expression for decision-grade outputs (range/band + confidence).
- Require two sensitivity checks on high-impact assumptions.

Enforcement:
- If kickoff gate is missing, verdict is `patch required` before deeper execution.
- If outputs violate locked kickoff assumptions without explicit patch note, verdict is `patch required`.
- If sufficiency thresholds are not met, return `RED FLAG: DATA THIN` (no forced precision).

## WO Authoring Contract (required sections)
Every WO should include:
1. Assignment (owner, due, submit paths)
2. Required reading
3. Objective
4. Decision gate
5. Fixed scope
6. Allowed sources/tools
7. Capture schema (if research/data WO)
8. Minimum quality bars
9. Red-flag escalation rules
10. Deliverable format
11. Stop conditions
12. Rules (including path discipline)
13. Success criteria
14. Decision clock (for test-driven WOs)
15. Variant cap and tranche plan (for outreach/GTM WOs)
16. Consistency Check requirement (for gate-driven deliverables)

For research/data WOs, enforce capture-schema rules:
- Comparator flags are single-purpose (for example comparability only).
- Data-quality/completeness gets separate fields (do not overload comparator flags).
- Required schema fields remain explicit even if redundant (for example `table_name`).
- If a field feels redundant, patch the WO/spec/template first; do not permit ad-hoc exceptions mid-run.

## Consistency Check Requirement (gate-driven deliverables)
Contractor must include a `Consistency Check` block near the end of the deliverable:

```md
Consistency Check:
- gates:
  - { name: "<gate name>", status: "PASS|FAIL|PATCH_REQUIRED" }
- merge_readiness_status: PASS|FAIL|PATCH_REQUIRED
- critical_counts:
  - { name: "<count name>", value: <number>, threshold: "<condition>" }
```

Enforcement:
- Status vocabulary is canonical: `PASS|FAIL|PATCH_REQUIRED`.
- If this block conflicts with gate table, conclusion narrative, or footer/merge-readiness lines, verdict is `patch required`.

## Decision Clock + Variant Cap Rules
For GTM/outreach/positioning WOs, enforce:
1. **Decision clock**
   - `Ship-by` date for test-ready artifact.
   - `Readout-by` date for decision after first signal.
2. **Variant cap**
   - default max 2 variants per wave unless explicitly justified.
3. **Top-lead protection**
   - require tranche plan; do not burn all top-priority leads in wave 1.

Missing any of the above should be treated as WO-quality gap before execution.

## Host/Event Mapping Rule
For ecosystem/event mapping WOs:

- **Default mode:** discovery-first
  - `search terms -> host extraction -> deduped host registry -> event dataset -> prioritization`
- **Fixed-list-only mode:** fallback, not default.

Fixed-list-only is allowed only when:
1. the decision explicitly concerns a known closed set, or
2. a hard operational constraint blocks discovery-first.

If fixed-list-only mode is used, the WO must include:
1. explicit rationale for fixed-list mode,
2. known coverage-risk statement,
3. discovery-recovery trigger condition (when to run a follow-up discovery pass).

## Review Rubric
### Hard Fail (must patch before merge)
- Missing required deliverable file(s)
- Wrong output path (for example nested duplicate roots)
- Missing required footer/required sections
- Count/math contradictions
- Consistency Check contradictions (table vs narrative vs footer/merge-readiness)
- Cross-file contract contradiction (WO/schema/CSV/QA mismatch)
- Gate-threshold basis ambiguity in decision rationale
- Stale blocker narrative or stale human-assist request after root-cause change
- Scope violation not explicitly separated/labeled
- Unsourced non-obvious claims
- Missing decision clock/variant cap for outreach/GTM WOs
- Patch-stream edits missing inline patch notes and/or state update line
- Claim use exceeds evidence grade (for example `C` used as gate/headline claim)
- Capture schema violations (overloaded fields, omitted required explicit fields, or ad-hoc schema relaxation)

### Soft Fail (can merge if low-risk)
- Overlong prose/weak scannability
- Minor wording ambiguity
- Optional formatting issues
- Nice-to-have extra evidence not present

## Pathing Preflight (mandatory before review)
1. Confirm expected output files exist.
2. Confirm files are in workspace/worktree-relative target paths.
3. Check for accidental nested roots (for example duplicated repo path segments).
4. Check for writes to main workspace when worktree-only was required.
5. Flag immediately if pathing is wrong.

## Patch Authority Matrix
- **Mayor patches directly:** minor formatting/path cleanup, typo-level fixes, non-analytical structure fixes.
- **Send back to contractor:** scope correction, dataset recomputation, new analysis, claim/evidence rewrites.
- **Ask overseer first:** if fix changes the decision outcome or assumptions.

## Escalation Protocol
Use explicit red flags when blocked:
- `RED FLAG: DATA THIN`
- `RED FLAG: ACCESS BLOCKED`
- `RED FLAG: PATHING/OUTPUT ERROR`
- `RED FLAG: LOOP STALL`

Each red flag must include:
1. Exact blocker
2. Where it occurred
3. What was tried
4. Human assist request (1-3 concrete actions)
5. Evidence delta since last attempt (what changed / did not change)

## Standardized Review Template (required output shape)
- Use `.agents/templates/patch-packet.md` for non-merge-ready outputs.
- Keep response sections in this order:
  1. Verdict
  2. Findings (highest severity first)
  3. Decision (winner/ports, if arena)
  4. Required fixes
  5. Copy-paste patch prompt
  6. Merge readiness

## Copy-Paste Patch Prompt Template
Use `.agents/templates/patch-packet.md` as the canonical source instead of inlining ad-hoc variants.

## Definition of Done (WO lifecycle)
A WO is done only when:
- Deliverable exists at the correct path
- Required support artifacts exist (if specified)
- Counts and claims reconcile across sections
- Decision section is actionable (A/B or clear go/no-go)
- Required footer is complete
- Merge readiness is explicitly stated

## Anti-Patterns
- Reviewing style before verifying path and required artifacts
- Accepting unsupported claims because narrative is strong
- Expanding scope without a linked decision gate
- Silent fixes that rewrite analysis history
- Assuming arena mode when user provided a single output

## Mayor Telemetry (lightweight)
Track per WO:
- mode used (single-output/arena)
- winner (if arena)
- runner-up ports applied
- recurring failure mode (pathing, scope drift, count drift, source gaps)
- precision-trap risk observed (yes/no + where)
- thread-sprawl risk observed (yes/no + where)
- risk mode `clean-process_weak-substance` observed (yes/no + where)
- loop stall observed (yes/no + blocker signature)
- follow-up action taken

Use telemetry to improve future WO specs and handoff prompts.

## Version
Last updated: 2026-02-21
