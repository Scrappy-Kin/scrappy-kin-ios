# Scrappy Kin iOS

Scrappy Kin is an iOS app for preparing and sending data-broker opt-out emails from your own Gmail account.

Current product surface:
- requests only the Google `gmail.send` scope
- does not read your inbox or manage your mailbox
- stores the Gmail token locally on your device
- keeps Gmail content off Scrappy Kin servers
- protects local app data using your device’s built-in secure storage and encryption
- lets you review the message batch before you send it
- sends only after you choose brokers and start the batch yourself
- includes no analytics SDKs, no third-party tracking tools, and no automatic crash reporting
- keeps optional diagnostics local unless you manually export and share them

Links:
- Website: [scrappykin.com](https://scrappykin.com)
- Help: [How Scrappy Kin uses Gmail permission](https://scrappykin.com/help/gmail-permission/)
- Privacy Policy: [scrappykin.com/privacy.html](https://scrappykin.com/privacy.html)
- Terms: [scrappykin.com/tos.html](https://scrappykin.com/tos.html)

## Planning canon
Cross-repo planning lives in HQ:
- `/Users/jonamar/Development/scrappy-kin/scrappy-kin-hq/README.md`
- `/Users/jonamar/Development/scrappy-kin/scrappy-kin-hq/workstreams/google-auth-phase-a/shared.md`

This repo owns execution, code, runtime notes, and technical reference.
Local scratch notes are fine, but they are not canonical planning state.

## Structure
- `app/` - React + TypeScript UI (Capacitor host)
- `scripts/` - engineering scripts used by the app/tooling
- `docs/build-oauth.md` - build-time OAuth and environment contract

## Auditing the code

If you want a local plain-language review prompt for the main trust surfaces, generate the audit manifest with:

```bash
cd app
npm run audit:manifest
```

That writes `AUDIT_PROMPT.md` in the repo root for local review. It is intentionally not tracked in git.

## Licensing & Governance

- Code licensed under AGPLv3
- Contributions accepted under AGPL via DCO (sign-off required)
- Scrappy Kin name and visual identity are excluded from the open-source license
- Bundled reference data is included under AGPL
- Commercial licensing available by separate agreement

## Local testing (pre–App Store)

You can test on the iOS simulator without TestFlight:

```bash
cd app
npm install
npx cap add ios
npm run ios:sync:dev
npx cap open ios
```

Then run in Xcode on a simulator.

OAuth note: if your Google OAuth consent screen is in Testing mode, add your
Google account to the Test users list in Google Cloud Console.

For build-time OAuth configuration (DEV vs PROD), see `docs/build-oauth.md`.
