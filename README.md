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

## Licensing & Governance

- Code licensed under AGPLv3
- Contributions accepted under AGPL via DCO (sign-off required)
- Brand assets excluded from the open-source license
- Bundled reference data is included under AGPL
- Commercial licensing available by separate agreement

## Local testing (pre–App Store)

You can test on the iOS simulator without TestFlight:

```bash
cd app
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then run in Xcode on a simulator.

OAuth note: if your Google OAuth consent screen is in Testing mode, add your
Google account to the Test users list in Google Cloud Console.
