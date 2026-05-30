# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately — do not open a public issue.

Email: support@scrappykin.com

We will acknowledge receipt within 7 days and work to provide a fix as soon as possible. Once a fix is merged, we will disclose the vulnerability and credit the reporter unless they prefer to remain anonymous.

## Our Security Stance

Scrappy Kin is built on a minimal-exposure architecture. Key design principles:

- **Device-local by default.** User data (tokens, broker selections, sent logs) is stored on-device only in the iOS keychain with `ThisDeviceOnly` accessibility — data does not migrate to other devices or backups. Nothing is transmitted to Scrappy Kin servers.
- **Fresh-install keychain clear.** On first launch after a new install, the app clears any keychain data left over from a previous install. Deleting the app removes your Gmail connection and local data; reinstalling starts fresh.
- **Minimal permission scope.** The app requests Gmail send-only access (`gmail.send`). We do not read email.
- **No Scrappy Kin accounts.** There is no server-side user account layer. There is nothing to breach on our side.
- **No remote control.** There is no remote kill switch, feature flag, or backchannel. The app does not phone home.
- **Empty warehouse principle.** If a threat arrives at our door, they should find nothing worth taking.

## Emergency Response

We do not use a remote kill switch — that would contradict the no-backchannel architecture. If a serious issue is discovered in a released build, our response path is:

1. Ship an App Store update as quickly as possible.
2. If Gmail send is affected: post clear instructions for users to revoke Scrappy Kin's Gmail access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions). This takes effect immediately and does not require an app update.
3. Remove the app from the App Store if necessary to prevent new installs while a fix is in progress.

This is an accepted architectural tradeoff. We document it explicitly rather than leaving it implicit.

## Security Audits

This repository is open source and subject to periodic security audits. Audit reports are maintained in the `security/` directory when available. Audits are point-in-time snapshots; see the commit history for ongoing changes.

## Scope

This policy covers the `scrappy-kin-ios` app codebase. For the broader Scrappy Kin system (backend ops, broker data pipeline), contact us at the same address.

## Accepted Risk and Transparency

We are a small team. We aim to be honest about our limitations and our architecture rather than making security claims we cannot back up. If you find something we've missed, we want to know.
