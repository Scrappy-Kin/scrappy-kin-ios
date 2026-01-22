# Dev Diagnostics Mode

## Purpose
Add a debug-only diagnostics mode so developers can capture richer logs without exposing it in Release builds.

## TL;DR
- Add a dev-only diagnostics toggle in Settings.
- Dev diagnostics only compile in Debug builds.
- Logging can be enabled for dev without user opt-in in debug builds only.

## Scope & Relationship
- Applies to log capture and Settings UI.
- Complements `docs/planning/active/2026-01-15-logging-modes-build-gating.md`.

## Key Principles / Constraints
- Never ship dev diagnostics UI in Release builds.
- Keep logs non-PII and local-only.
- Reuse existing log storage/export flow.

## Structure & Decisions
- Add dev diagnostics opt-in stored locally.
- `logEvent` records if user opt-in OR dev diagnostics enabled in Debug builds.
- Settings shows a Dev Diagnostics section only in dev builds.

## Dependencies / Related Docs
- `docs/strategy/privacy-openess-security.md`
- `docs/planning/active/2026-01-15-logging-modes-build-gating.md`
