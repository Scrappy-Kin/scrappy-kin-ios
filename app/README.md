# Scrappy Kin iOS App

React + TypeScript + Ionic + Capacitor app for Phase A.

## Development

```bash
npm install
npm run dev
```

## Native (iOS)

```bash
npx cap add ios
npm run build
npx cap sync ios
```

## OAuth redirect scheme

For Gmail OAuth (PKCE), register the URL scheme in the iOS project:

- Scheme: `com.googleusercontent.apps.<CLIENT_ID_WITHOUT_DOMAIN>`
- Redirect URI: `com.googleusercontent.apps.<CLIENT_ID_WITHOUT_DOMAIN>:/oauthredirect`

This must match the iOS OAuth client in Google Cloud Console.
