# Build Metadata in Settings

## Purpose
Expose build identity in-app so bug reports can be tied to a specific source revision without CI.

## TL;DR
- Inject build SHA, build time, and build mode at Vite build time.
- Display this info in Settings.
- Keep the data read-only and non-PII.

## Scope & Relationship
- Applies to app build process and Settings UI.
- Complements `docs/planning/active/2026-01-15-logging-modes-build-gating.md`.

## Key Principles / Constraints
- No PII in build metadata.
- Safe defaults if git info is unavailable.
- Minimal friction for local builds.

## Structure & Decisions
- Vite defines compile-time constants for SHA/time/mode.
- Settings shows a short build section.
- Release builds show production mode.

## Dependencies / Related Docs
- `docs/strategy/privacy-openess-security.md`
- `docs/planning/active/2026-01-15-logging-modes-build-gating.md`
