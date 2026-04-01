# Lightweight CI Guardrails

## Purpose
Reduce the chance of missed critical steps by automating build-mode checks and configuration validation.

## TL;DR
- Add a minimal CI workflow that validates iOS build-mode config on every push/PR.
- Keep dev-only settings in `debug.xcconfig` and ensure Release stays clean.
- Provide a single verification script that agents can run locally.

## Scope & Relationship
- Applies to iOS configuration checks only.
- Complements `docs/planning/active/2026-01-15-logging-modes-build-gating.md`.

## Key Principles / Constraints
- Prefer automation over manual checklists.
- Avoid new dependencies and keep runtime fast.
- No signing or TestFlight automation in this phase.

## Structure & Decisions
- CI workflow runs a local script that verifies Debug/Release separation.
- Debug overrides live in `app/ios/debug.xcconfig`.
- Release config should not hardcode dev bundle identifiers.

## Dependencies / Related Docs
- `docs/strategy/privacy-openess-security.md`
- `docs/planning/active/2026-01-15-logging-modes-build-gating.md`
