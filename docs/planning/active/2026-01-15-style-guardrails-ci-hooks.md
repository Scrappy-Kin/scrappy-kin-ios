# Style Guardrails via CI + Hooks

## Purpose
Keep UI style-guide constraints enforced by a single script run both locally and in CI, while leaving design-system rules to the owner.

## TL;DR
- Use the log schema check as the first guardrail script and anchor.
- Local git hook calls the script for fast feedback.
- GitHub Actions calls the same script as a merge gate.

## Scope & Relationship
- Applies to style-guide enforcement and automation, not design-system content.
- Design-system rules are defined by the DS owner; this doc covers CI/hooks only.

## Key Principles / Constraints
- Single source of truth for checks (one script).
- Keep checks blunt and fast (fail on clear violations).
- Local hooks are optional convenience; CI is the enforcement gate.

## Structure & Decisions
- `scripts/check-log-schema.js` is the foundational guardrail (required, deterministic).
- Local hook calls the script (pre-commit).
- CI job calls the script on push/PR.
- Design-system checks will extend this model via a single script owned by the DS owner.

## Dependencies / Related Docs
- `docs/ui/ui-system.md`
- `docs/ui/ui-primitives.md`
