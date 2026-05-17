# Scrappy Kin iOS

Scrappy Kin is an iOS app for preparing and sending data-broker opt-out emails from your own Gmail account.

Current product surface:
- requests only the Google `gmail.send` scope
- does not read your inbox or manage your mailbox
- stores the Gmail token locally on your device
- keeps Gmail content off Scrappy Kin servers
- protects local app data using your device’s built-in secure storage and encryption
- lets you review prepared message batches before you send them
- sends only after you start a prepared batch yourself
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
- `/Users/jonamar/Development/scrappy-kin/scrappy-kin-hq/workstreams/active-user-facing-launch/shared.md`

This repo owns execution, code, runtime notes, and technical reference.
Local scratch notes are fine, but they are not canonical planning state.

## Structure
- `app/` - React + TypeScript UI (Capacitor host)
- `scripts/` - engineering scripts used by the app/tooling
- `docs/build-oauth.md` - build-time OAuth and environment contract
- `docs/qa-policy.md` - explicit QA surface policy and release-boundary rules
- `docs/ui/accessibility-guidelines.md` - operational iOS accessibility rules and handoff checklist
- `docs/ui/accessibility-qa-working-notes.md` - scratchpad for unresolved accessibility QA findings

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
For the bend/hold line between local QA, TestFlight, and release, see
`docs/qa-policy.md`.

## QA and release commands

The safe default for physical-device QA is `QADevice` / `qa-storekit`. It uses
the production bundle ID, production OAuth, production StoreKit product ID, real
broker names/counts/order, and sink inbox recipients.

| Job | Command | Safe to Send? |
| --- | --- | --- |
| Local iPhone QA | `cd app && npm run ios:fastlane:qa-device` | Yes |
| Local iPhone QA, web-only iteration | `cd app && npm run ios:fastlane:qa-device-fast` | Yes |
| Local simulator QA | `cd app && npm run ios:fastlane:qa-simulator` | Yes |
| Production archive | `cd app && npm run ios:fastlane:prod-archive` | No |
| Production TestFlight | `cd app && SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:prod-testflight` | No |

Production TestFlight uses `Release` and can send real broker emails. Use it only
for release-candidate validation, not safe send QA.

Use the fast iPhone QA command only for JS/TS/CSS/content-only loops. Use the
normal QADevice command after native iOS, Capacitor config, package/dependency,
signing, plugin, or StoreKit changes.

The production Fastlane commands read App Store Connect API credentials from
macOS Keychain services named `scrappy-kin-asc-key-id`,
`scrappy-kin-asc-issuer-id`, and `scrappy-kin-asc-api-key-p8`. The `.p8`
contents are written to a temporary file only for the Fastlane process and then
deleted.
