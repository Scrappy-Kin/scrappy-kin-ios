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

## Commands

```bash
cd app

# Install deps
npm install

# Sync dev web bundle (JS/CSS-only rebuilds)
npm run ios:sync:dev

# Sync prod web bundle
npm run ios:sync:prod

# Install QA StoreKit lane on connected device
npm run ios:install:qa-storekit:device

# Open Xcode project
npx cap open ios

# Generate trust-surface audit prompt
npm run audit:manifest
```

## Structure
- `app/` - React + TypeScript UI (Capacitor host)
- `scripts/` - engineering scripts used by the app/tooling
- `docs/build-oauth.md` - build-time OAuth and environment contract
- `docs/browser-qa.md` - web-harness and browser automation QA lanes
- `docs/qa-policy.md` - explicit QA surface policy and release-boundary rules

## Agent Notes

- HQ owns planning canon; this repo owns execution. Current active iOS stream: check HQ `workstreams/` for the live stream name (the `parked-google-auth-phase-a` stream referenced in older agent files is archived).
- Shared agent tooling lives in `.agents/` (propagated from product-ops). Do not edit those surfaces directly.
- Workflow guides: `.agents/skills/`, shared tools: `.agents/tools/`, risk modes: `.agents/meta/`.

## Auditing the code

If you want a local plain-language review prompt for the main trust surfaces, generate the audit manifest with:

```bash
cd app
npm run audit:manifest
```

That writes `AUDIT_PROMPT.md` in the repo root for local review. It is intentionally not tracked in git.

## Browser QA

For Codex-driven web UI validation, start the preview harness, run the route
preflight, then use the Codex Playwright MCP/browser tool for screenshots:

```bash
cd app
npm run preview:dev
```

In another shell:

```bash
cd app
npm run qa:agent-browser
```

Repo-local Playwright capture is intentionally a manual/unsandboxed lane:
`npm run capture:screens:manual`. The legacy `npm run capture:screens` alias is
blocked by default so agents do not reach for the broken sandboxed browser path.
On macOS Codex sandboxed shells can fail to launch Playwright browsers even when
the app is healthy. See `docs/browser-qa.md`.

For a fast launch-facing dashboard/state regression brake:

```bash
cd app
npm run test:launch-harness
```

This starts or reuses the preview harness and checks coarse seeded UI states. It
does not replace native/device QA for StoreKit, Gmail OAuth, sends, or VoiceOver.
On the Agentic-Work-VM, this command uses the VM browser sidecar automatically
when it is available.

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
| Upload signed IPA to TestFlight | `cd app && IPA_PATH=/path/to/ScrappyKin.ipa SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:upload-testflight-ipa` | No |

Production TestFlight uses `Release` and can send real broker emails. Use it only
for release-candidate validation, not safe send QA. The current production
TestFlight command builds/exports a Release IPA and uploads it. The upload-only
lane is for already-signed IPAs; it does not build or export a production
archive.

Local QA scripts choose Xcode/Fastlane cache roots dynamically:

1. explicit `IOS_DERIVED_DATA_PATH` or `XCODE_DERIVED_DATA_ROOT`
2. `/Volumes/T7-Dev/Xcode-DerivedData` when that host path is writable
3. repo-local `app/tmp/Xcode-DerivedData`

Fastlane user state and npm cache also default to repo-local `app/tmp/` through
`scripts/run-fastlane.mjs`, so VM runs do not require access to the broader host
volume or a writable home-directory tool cache.

Use the fast iPhone QA command only for JS/TS/CSS/content-only loops. Use the
normal QADevice command after native iOS, Capacitor config, package/dependency,
signing, plugin, or StoreKit changes.

The production Fastlane commands read App Store Connect API credentials from
macOS Keychain services named `scrappy-kin-asc-key-id`,
`scrappy-kin-asc-issuer-id`, and `scrappy-kin-asc-api-key-p8`. The `.p8`
contents are written to a temporary file only for the Fastlane process and then
deleted.
