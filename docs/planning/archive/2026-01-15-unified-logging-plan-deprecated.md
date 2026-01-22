# Unified Logging Plan (Deprecated)

## Purpose
Record the rejected idea of a single unified logging pipeline for both user bug reports and dev diagnostics.

## TL;DR
- A single logging lane was considered but rejected as too risky for PII exposure.
- Replaced by split lanes in `docs/planning/active/2026-01-15-logging-modes-build-gating.md`.
- Kept here for auditability of the decision.

## Scope & Relationship
- Historical planning artifact only; no implementation.

## Key Principles / Constraints
- Avoid conflating user consent flows with dev diagnostics.
- Avoid "sanitize everything" as a default privacy strategy.

## Structure & Decisions
- Decision: do not pursue a unified logging pipeline right now.
- Rationale: higher PII risk and weaker safety boundaries vs two-lane approach.

## Dependencies / Related Docs
- `docs/planning/active/2026-01-15-logging-modes-build-gating.md`
- `docs/strategy/privacy-openess-security.md`
