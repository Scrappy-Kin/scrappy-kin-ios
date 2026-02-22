# Xcode Cloud Release Attestation

## Purpose
Enable a verifiable chain from git commit -> Xcode Cloud build -> App Store/TestFlight binary for privacy posture and user trust.

## TL;DR
- Use Xcode Cloud to produce signed archives on Apple infra from main.
- Publish build metadata (commit SHA + build number + bundle ID) in-app and in release notes.
- Treat CI as the canonical build path for releases; local builds stay for dev only.

## Scope & Relationship
- Backlog item; complements OAuth build split and auditability docs.
- Related: `docs/build-oauth.md`, `docs/strategy/privacy-openess-security.md`.

## Constraints
- No new data collection; build metadata only.
- Keep setup minimal; avoid complex pipelines.

## Decisions (Draft)
- Single Xcode Cloud workflow: main -> Archive -> optional TestFlight.
- Embed build metadata in app (About/Settings) and README release notes.

## Dependencies
- Apple Developer team access + repo connection.
- Decide where to display build metadata in app.
