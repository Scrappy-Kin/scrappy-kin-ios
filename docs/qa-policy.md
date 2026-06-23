# QA Surface Policy

Purpose: keep prelaunch QA fast enough to actually use, while preserving a
clear boundary around the production release path.

## TL;DR

- Fast UI/content iteration starts in the web harness.
- Native behavior and layout rough edges should be cleared in the VM simulator.
- Agent-driven native accessibility checks should use simulator XCTest
  accessibility audits where available.
- Real-device pocket QA, VoiceOver signoff, and final release-candidate checks
  should use TestFlight.
- Use `QADevice` for local physical-device QA and safe sends.
- Use production TestFlight only for release-candidate validation; it can send to real broker recipients.
- The current production TestFlight lane builds/exports a Release IPA and uploads it; it is not upload-only.
- Treat `Release` as archive/submission-only. Do not change it to make local installs easier.

## Testing Surface Hierarchy

Use the lowest surface that can answer the question without changing the release
boundary:

1. Web harness: fastest loop for copy, layout, accessibility, routing, and UI
   state that does not require native iOS behavior.
2. VM simulator: default native QA lane for Capacitor shell behavior, iOS layout,
   navigation, build/sync validation, and XCTest accessibility audits.
3. TestFlight on a real phone: pocket testing, hallway checks, VoiceOver
   behavior, install/update behavior, and release-candidate validation.

Accessibility Inspector GUI is an optional human debugging aid, not a required
default QA lane. Prefer simulator XCTest accessibility audits for agent-driven
repeatable checks and physical-device VoiceOver for launch truth.

Do not make Parallels iPhone USB passthrough to the macOS VM a required QA path.
If it happens to work, treat it as a convenience only. The durable physical-device
surface is TestFlight; host Xcode tethered installs are a temporary debugging
fallback for bugs that cannot be reproduced in the web harness, VM simulator, or
TestFlight.

## Command Matrix

| Job | Command | Safe to Send? | Notes |
| --- | --- | --- | --- |
| Local iPhone QA | `cd app && npm run ios:fastlane:qa-device` | Yes | Uses `QADevice`; safe sends require the App Review demo profile email. |
| Local iPhone QA, web-only iteration | `cd app && npm run ios:fastlane:qa-device-fast` | Yes | Rebuilds web assets and uses `cap copy`; use only after JS/TS/CSS/content changes. |
| Local simulator QA | `cd app && npm run ios:fastlane:qa-simulator` | Yes | Uses `QADevice`; good for fast UI checks. |
| Production archive | `cd app && npm run ios:fastlane:prod-archive` | No | Builds `Release`; use for archive verification only. |
| Production TestFlight | `cd app && SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:prod-testflight` | No | Builds/exports `Release`, then uploads; release-candidate only; can email real brokers. |
| Production TestFlight, auto-next build | `cd app && SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:prod-testflight-next` | No | Queries App Store Connect, sets the next checked-in build number, builds/exports `Release`, then uploads. |
| Upload signed IPA to TestFlight | `cd app && IPA_PATH=/path/to/ScrappyKin.ipa SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:upload-testflight-ipa` | No | Uploads an already-signed IPA; does not build or export. |

Apple marketing versions use semver shape (`MAJOR.MINOR.PATCH`) in
`MARKETING_VERSION` / `CFBundleShortVersionString`. Apple build numbers stay
separate in `CURRENT_PROJECT_VERSION` / `CFBundleVersion`; do not use suffixes
or build metadata in the marketing version.

Before a new production TestFlight build, bump and commit the checked-in Xcode
build number:

```bash
cd app
npm run ios:version:set -- --build <next-build-number>
```

Use the next number after the latest TestFlight build for the current marketing
version. Check App Store Connect before bumping:

```bash
cd app
npm run ios:testflight:build-status
```

The production TestFlight lane uses the same App Store Connect lookup before
archiving and fails fast if the checked-in build number is stale.

For the usual release-candidate path, prefer the auto-next lane:

```bash
cd app
SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1 npm run ios:fastlane:prod-testflight-next
```

After a successful upload, commit the resulting Xcode project build-number
change so the repo stays aligned with TestFlight.

Local QA scripts resolve DerivedData/cache roots in this order:

1. explicit `IOS_DERIVED_DATA_PATH` or `XCODE_DERIVED_DATA_ROOT`
2. `/Volumes/T7-Dev/Xcode-DerivedData` when writable
3. repo-local `app/tmp/Xcode-DerivedData`

Fastlane user state and npm cache default to repo-local `app/tmp/` via
`scripts/run-fastlane.mjs`. This keeps the VM lane bounded while preserving the
host cache path when it is available.

If the task is "QA the send flow without emailing brokers", use
`ios:fastlane:qa-device` on a connected iPhone.

For tight UI/accessibility loops where only web assets changed, use
`ios:fastlane:qa-device-fast`. Return to the normal QADevice lane after any
native iOS, Capacitor config, package/dependency, signing, plugin, or StoreKit
configuration change.

## Policy

### Hold strong

These must stay aligned with production behavior unless there is an explicit,
documented reason to diverge:

- Production bundle ID when testing production subscription behavior
- Production StoreKit product ID
- Production Google OAuth client for production-lane QA
- Production legal/support URLs
- Real broker catalog names, order, and counts
- Real app routing and state behavior
- `Release` configuration for archive/submission

### Bend only where safety or transport requires it

Allowed QA-only accommodations:

- Demo-recipient routing so QA/App Review demo sends do not email real brokers
- QA badge and QA diagnostics
- Development signing for local tethered device installs
- Local install helpers/scripts

These accommodations must not mutate the true production archive path.

## Approved QA Surfaces

### 1. Local QA Lane

Use for fast iteration, trust-surface review, and end-to-end send-flow testing
without contacting real brokers.

Rules:

- Web bundle lane: `qa-device`
- Bundle ID: `com.scrappykin.ios`
- StoreKit product ID: `com.scrappykin.ios.subscription.annual`
- Google OAuth: production client
- Broker names/order/counts: real local catalog
- Broker recipients: real broker recipients by default
- Safe sends: entering `scrappykin365@gmail.com` as the local profile email routes broker sends to Scrappy Kin test inboxes

For physical-device local installs, use the dedicated Xcode build
configuration:

- Build configuration: `QADevice`
- Signing: automatic Apple Development signing
- Archive configuration remains `Release`

This preserves production app/runtime settings while avoiding the mistake of
using the distribution-oriented `Release` signing path for tethered installs.

Before starting manual QA, confirm:

- the app shows the visible `QA` badge
- broker preview names/counts/order look real
- the App Review demo profile email routes send recipients to Scrappy Kin test inboxes
- non-demo recipients show the demo-profile-required notice on final review, disable the send button, and remain blocked before Gmail send in `QADevice`
- the installed app build was produced by `ios:fastlane:qa-device` or `ios:install:qa-device:device`

### 2. Internal TestFlight

Use for final high-fidelity verification before launch signoff, especially for:

- install/distribution behavior
- subscription purchase/restore on a production-like delivery path
- reviewer-like device experience

Internal TestFlight is the final truth surface for paid-flow confidence.

Internal TestFlight is not the safe-send QA surface. A TestFlight build produced
from `Release` may send to real broker recipients.

Sandbox subscription reset note:

- Clearing purchase history in App Store Connect is not enough by itself for a
  device that is already signed in to that Sandbox Apple Account.
- After clearing purchase history, sign out of the Sandbox Apple Account on the
  iPhone to clear the device purchase-history cache, then sign back in and
  restart the app.
- If the account has been used heavily or still reports an active entitlement,
  create a fresh Sandbox Apple Account with an email address that is not already
  an Apple Account and use that for clean-slate purchase/restore QA.

Signing authority and upload authority are separate. A release machine may build
and sign the production IPA, while another bounded surface may upload that
already-signed IPA to TestFlight using `ios:fastlane:upload-testflight-ipa`.
Do not install Apple Distribution private keys or production provisioning
profiles on a surface that should not be able to produce production builds.

### 3. Release / Submission

Use only for archive, App Store submission, and reviewer-facing builds.

Rules:

- `Release` is archive/submission-only
- do not modify `Release` to make local QA easier
- do not rely on QA-only affordances for App Review or launch signoff

## Required Launch Sequence

1. Fast iteration in local QA lane
2. Manual human QA on touched surfaces
3. Internal TestFlight pass for production-like validation
4. Release archive and submission

## Current Repo Implementation

- `Release` remains the production archive/submission configuration
- `QADevice` exists for local physical-device QA installs
- `Scrappy Kin Prod` scheme:
  - Run/Profile -> `QADevice`
  - Archive -> `Release`
- `QADevice` visibly marks the app as QA, exposes StoreKit diagnostics, and blocks non-demo broker recipients before Gmail send

## Anti-Patterns

Do not:

- change `Release` signing or provisioning to make local installs work
- point local QA at real broker recipients
- rely on a dev-only bundle ID for production subscription testing
- use a local-only shortcut as the sole signoff surface for subscriptions
- upload production TestFlight builds for routine QA-send iteration
- treat the current production TestFlight lane as upload-only
