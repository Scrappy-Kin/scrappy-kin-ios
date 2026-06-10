# Build Lane, OAuth, and QA StoreKit Guide

This app uses build-time lanes for OAuth, StoreKit, and broker-send safety. There
are **no user-facing runtime switches**.

For the higher-level QA policy about where local QA ends and TestFlight/release
signoff begins, see `docs/qa-policy.md`.

## Lanes (locked)

**PROD**
- Bundle ID: `com.scrappykin.ios`
- Display name: `Scrappy Kin`
- Google project: `scrappy-kin`
- Google client ID: `304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com`
- Broker catalog: real curated broker list
- StoreKit product: `com.scrappykin.ios.subscription.annual`

**QA StoreKit**
- Bundle ID: `com.scrappykin.ios`
- Display name: `Scrappy Kin`
- Google project: `scrappy-kin`
- Google client ID: `304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com`
- Broker catalog: real curated broker list with `contactEmail` replaced by Scrappy Kin sink inboxes
- StoreKit product: `com.scrappykin.ios.subscription.annual`
- Visible app badge: `QA`
- Purpose: dogfood the real onboarding/send/subscription flow without emailing real brokers

**DEV**
- Bundle ID: `com.scrappykin.ios.dev`
- Display name: `Scrappy Dev`
- Google project: `Scrappy-Kin-Dev`
- Google client ID: `914858229260-ns59pecm40udl9fi18ugrb1njlqie0m1.apps.googleusercontent.com`
- Broker catalog: launch broker names with deterministic `testbot+...@scrappykin.com` fixture recipients

Build-time client IDs are lane defaults in `app/vite.config.ts`; a fresh clone
does not need local `.env` files just to produce a working DEV or PROD web
bundle. If `VITE_GOOGLE_CLIENT_ID` is set locally, Vite validates that production
builds still use the production client ID.

Native URL schemes remain set in:
- `app/ios/debug.xcconfig` (`GOOGLE_CLIENT_ID` + `GOOGLE_REDIRECT_SCHEME`)
- `app/ios/release.xcconfig` (`GOOGLE_CLIENT_ID` + `GOOGLE_REDIRECT_SCHEME`)

Set local env values only for optional lane-specific inputs such as
`VITE_APPLE_SUBSCRIPTION_PRODUCT_ID` in production/QA StoreKit builds.

Token/keychain storage is isolated per bundle ID (no shared keychain group).

## Verified (2026-01-23)

- Dev build runs and OAuth works in simulator.
- Prod archive validated in Organizer.

## Build selection (required)

Use the correct build-and-sync pair so the compiled client ID matches the target environment and the native app actually picks up the matching bundle.

- Xcode scheme pairing:
  - `Scrappy Kin Dev` scheme must be paired with `npm run ios:sync:dev`
  - `Scrappy Kin Prod` scheme must be paired with `npm run ios:sync:prod`
  - `npm run ios:install:qa-storekit` builds and installs the QA StoreKit web bundle on a simulator
  - `npm run ios:install:qa-storekit:device` builds and installs the QA StoreKit web bundle through `QADevice` on a connected iPhone
  - Do not mix a dev scheme with a prod web bundle, or a prod scheme with a dev web bundle.

Canonical local runbook:
- Dev lane
  - select Xcode scheme `Scrappy Kin Dev`
  - run `npm run ios:sync:dev`
  - expect the current launch broker names with fixture recipients derived from broker IDs
  - fixture emails use `testbot+<broker-id>@scrappykin.com` with non-alphanumeric characters normalized to `_`
  - if the simulator shows only the pink app background, rerun with
    `npm run ios:sync:dev:diagnostics`; this injects a dev-only boot overlay
    that reports whether HTML loaded, the app bundle loaded, or startup threw
    before React mounted
- Prod lane
  - select Xcode scheme `Scrappy Kin Prod`
  - run `npm run ios:sync:prod`
  - expect the real curated broker list
- QA StoreKit lane
  - run `npm run ios:install:qa-storekit`
  - run `npm run ios:install:qa-storekit:device` for physical-device StoreKit sandbox QA
  - Fastlane wrappers are available:
    - `npm run ios:fastlane:qa-simulator`
    - `npm run ios:fastlane:qa-device`
    - `npm run ios:fastlane:qa-device-fast` for JS/TS/CSS/content-only physical-device loops
  - expect bundle ID `com.scrappykin.ios`, `CAPACITOR_DEBUG=false`, and a visible `QA` badge
  - on physical devices, the installer uses the dedicated `QADevice` build configuration:
    - production bundle ID + production OAuth + production StoreKit product
    - automatic Apple Development signing for tethered installs
    - `Release` remains untouched for archive/submission
  - set `IOS_DEVICE_UDID` if more than one developer-mode device is available
  - expect real broker names/counts/order, but all sends go only to:
    - `app-review-redacted-03@example.invalid`
    - `app-review-redacted-04@example.invalid`
    - `app-review-redacted-05@example.invalid`
    - `app-review-redacted-06@example.invalid`
    - `app-review-redacted-07@example.invalid`
  - if any QA send attempts a non-test recipient, the app must block before calling Gmail

## Route model (required for debugging)

- `onboarding/*` is the first-run setup wizard.
- App-mode work does **not** re-enter onboarding routes.
- Use app-mode pages for post-onboarding tasks:
  - `/home`
  - `/gmail`
  - `/review-batch`
  - `/sent-emails`
- If a Home or Settings action lands in onboarding, treat that as a routing bug, not expected behavior.

## iOS config mapping

Build settings:
- `GOOGLE_CLIENT_ID` and `GOOGLE_REDIRECT_SCHEME` are set per build config:
  - `app/ios/debug.xcconfig` (DEV)
  - `app/ios/release.xcconfig` (PROD)

Info.plist uses:
- `$(GOOGLE_REDIRECT_SCHEME)` for the URL scheme
- `$(PRODUCT_BUNDLE_IDENTIFIER)` for `CFBundleURLName`

StoreKit:
- The iOS target declares the In-App Purchase capability.
- QA StoreKit diagnostics are visible only in the `qa-storekit` lane and report native bundle/build/product-load facts for sandbox troubleshooting.

Xcode scheme boundary:
- `Scrappy Kin Prod` Run/Profile uses `QADevice` for local physical-device QA
- `Scrappy Kin Prod` Archive uses `Release`
- do not repurpose `Release` to solve local install problems

Fastlane boundary:
- `ios qa_device` and `ios qa_simulator` wrap the QA StoreKit install scripts
- `ios qa_device_fast` uses the same QADevice install path but runs `cap copy` instead of full `cap sync`; do not use it after native iOS, Capacitor config, package/dependency, signing, plugin, or StoreKit configuration changes
- `ios prod_archive` builds the `Scrappy Kin Prod` scheme with `Release` and `export_method: app-store`
- `ios prod_testflight` builds the same Release archive, then uploads the IPA to TestFlight
- `ios prod_testflight` requires `SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1`
- `ios upload_testflight_ipa` uploads an already-signed IPA from `IPA_PATH` to TestFlight without building or exporting an archive
- `ios upload_testflight_ipa` requires `SCRAPPY_KIN_ALLOW_PROD_TESTFLIGHT=1`
- production TestFlight builds can send real broker emails; use them only for release-candidate validation, not safe send QA
- App Store Connect API credentials are read from env vars populated by the npm wrapper:
  - `APP_STORE_CONNECT_API_KEY_ID`
  - `APP_STORE_CONNECT_ISSUER_ID`
  - `APP_STORE_CONNECT_API_KEY_PATH`
- Keychain service names:
  - `scrappy-kin-asc-key-id`
  - `scrappy-kin-asc-issuer-id`
  - `scrappy-kin-asc-api-key-p8`
- the npm wrapper writes the `.p8` contents to a temporary file only for the Fastlane run, then deletes it
- if those API variables are absent, Fastlane falls back to its normal interactive Apple login/session behavior

## Boot diagnostics

`SCRAPPY_BOOT_DIAGNOSTICS=1` enables a small simulator-visible boot overlay for
DEV builds. Use `npm run ios:sync:dev:diagnostics` instead of editing app code
when diagnosing a blank native WebView.

The overlay is off by default, is injected by Vite from
`app/scripts/boot-diagnostic-snippet.html`, and production builds reject the flag
rather than carrying diagnostic UI or hook names into release artifacts.

## Do Not Change Without Consequences (PROD)

Once verification/publishing begins, treat these as immutable:
- OAuth consent screen app name
- App logo
- Privacy policy URL
- Homepage URL
- Authorized domains
- Redirect URIs (must match the prod client ID)
- PROD client ID and Google project

## Ephemeral OAuth state (privacy posture)

We temporarily store PKCE state + code verifier locally **only** to survive OS interruptions.
This data is:
- minimal (state, verifier, createdAt, attemptId)
- auto-cleared after 10 minutes or on completion
- never logged
- never transmitted
