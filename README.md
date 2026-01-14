# Scrappy Kin iOS

Scrappy Kin is an iOS app that helps you protect your privacy. In particular it helps you send opt-out requests to data brokers from your own Gmail account. The app keeps data on-device (never our servers) and uses Gmail only to send the emails you initiate. No analytics or tracking SDKs anywhere. This code is public so you dont have to take our word for it.

Tip: if you're not a developer, share the url to this repo with an AI assitant you trust and ask it to verify that the code is what it claims to be.

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
