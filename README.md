# Scrappy Kin iOS

Phase A (iOS-only) repo for the Scrappy Kin consumer app.

## Scope (Phase A)
- Gmail send-only via `gmail.send` scope
- No mailbox access (no `gmail.modify`, no `gmail.readonly`)
- No broker portal automation or autofill
- User-initiated send-all (no background scheduling)

## Structure
- `app/` - React + TypeScript UI (Capacitor host)
- `docs/` - Product and scope docs
- `scripts/` - Local tooling scripts
