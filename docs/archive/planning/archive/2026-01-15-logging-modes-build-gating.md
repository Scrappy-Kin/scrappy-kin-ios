# Logging Modes + Build Gating

## Purpose
Define the split between user-reported bug logging and dev diagnostics, plus the minimal build gating needed to keep them separate by default.

## TL;DR
- Two lanes: user bug logs (zero-PII, opt-in, manual share) and dev diagnostics (rich logs, debug-only, never in release).
- Debug builds get a distinct bundle ID + app name, and dev tooling compiles only under Debug.
- Release builds keep user logging safe and auditable without any hidden upload path.

## Scope & Relationship
- Applies to iOS app logging and build configuration.
- Must align with `docs/strategy/privacy-openess-security.md` (zero-trust, opt-in, no silent exfiltration).

## Key Principles / Constraints
- User logging is opt-in, time-boxed (15 min), and non-PII by design.
- Dev diagnostics never ship in Release builds.
- No background data export in any build; user-controlled sharing only.

## Structure & Decisions
- User-reported bugs
  - In-app toggle for 15-minute capture.
  - Strict allow-listed schema; reject PII-shaped keys.
  - User can view/copy/download; must manually send.
- Dev diagnostics
  - Compiled only under Debug.
  - Richer logging allowed, but still no PII.
  - Distinct Debug bundle ID + app name to prevent confusion.
- Build gating (now)
  - Debug: `com.scrappykin.ios.dev`, app name "Scrappy Kin (Dev)".
  - Release: `com.scrappykin.ios`, app name "Scrappy Kin".
  - Dev UI and diagnostics behind compile-time flags.
  - Note: `npx cap sync ios` may overwrite bundle IDs; re-apply Debug override (manual or script).

## Dependencies / Related Docs
- `docs/strategy/privacy-openess-security.md`
- `docs/strategy/scrappy-kin-strategy.md`
