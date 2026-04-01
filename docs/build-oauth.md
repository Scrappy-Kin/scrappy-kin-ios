# OAuth Build & Environment Guide

This app uses build-time configuration for OAuth. There are **no runtime switches**.

## Environments (locked)

**PROD**
- Bundle ID: `com.scrappykin.ios`
- Display name: `Scrappy Kin`
- Google project: `scrappy-kin`
- Google client ID: `304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com`
- Broker catalog: real curated broker list

**DEV**
- Bundle ID: `com.scrappykin.ios.dev`
- Display name: `Scrappy Dev`
- Google project: `Scrappy-Kin-Dev`
- Google client ID: `914858229260-ns59pecm40udl9fi18ugrb1njlqie0m1.apps.googleusercontent.com`
- Broker catalog: deterministic fixture brokers only

Set the DEV client ID in:
- `app/.env.development` (`VITE_GOOGLE_CLIENT_ID=...`)
- `app/ios/debug.xcconfig` (`GOOGLE_CLIENT_ID` + `GOOGLE_REDIRECT_SCHEME`)

Token/keychain storage is isolated per bundle ID (no shared keychain group).

## Verified (2026-01-23)

- Dev build runs and OAuth works in simulator.
- Prod archive validated in Organizer.

## Build selection (required)

Use the correct build-and-sync pair so the compiled client ID matches the target environment and the native app actually picks up the matching bundle.

- Xcode scheme pairing:
  - `Scrappy Kin Dev` scheme must be paired with `npm run ios:sync:dev`
  - `Scrappy Kin Prod` scheme must be paired with `npm run ios:sync:prod`
  - Do not mix a dev scheme with a prod web bundle, or a prod scheme with a dev web bundle.

Canonical local runbook:
- Dev lane
  - select Xcode scheme `Scrappy Kin Dev`
  - run `npm run ios:sync:dev`
  - expect the 5 neutral fixture brokers:
    - `Fixture Broker One`
    - `Fixture Broker Two`
    - `Fixture Broker Three`
    - `Very Long Broker Name For Layout Testing`
    - `Fixture Broker Four`
  - fixture emails use `testbot+broker-fixture_...@scrappykin.com` plus `testbot+broker-long_name@scrappykin.com`
- Prod lane
  - select Xcode scheme `Scrappy Kin Prod`
  - run `npm run ios:sync:prod`
  - expect the real curated broker list

## Route model (required for debugging)

- `onboarding/*` is the first-run setup wizard.
- App-mode work does **not** re-enter onboarding routes.
- Use app-mode pages for post-onboarding tasks:
  - `/home`
  - `/brokers`
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
