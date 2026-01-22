# User Bug Logging Flow

## Purpose
Define the user-reported bug logging flow with a 15-minute opt-in window and explicit export controls.

## TL;DR
- Add a 15-minute opt-in timer for diagnostics capture.
- Keep logs zero-PII and local only.
- Provide explicit export actions (copy/download) with manual user send.

## Scope & Relationship
- Applies to Settings diagnostics UI and log capture behavior.
- Complements `docs/planning/active/2026-01-15-logging-modes-build-gating.md`.

## Key Principles / Constraints
- Opt-in must be time-boxed and user-controlled.
- No automatic upload or background sharing.
- Logs must remain non-PII by design.

## Structure & Decisions
- Add a 15-minute timer when diagnostics are enabled.
- Auto-disable and show remaining time.
- Export actions remain manual (copy/download).

## Dependencies / Related Docs
- `docs/strategy/privacy-openess-security.md`
- `docs/planning/active/2026-01-15-logging-modes-build-gating.md`
