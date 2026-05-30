# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately — do not open a public issue.

Email: support@scrappykin.com

We will acknowledge receipt within 7 days and work to provide a fix as soon as possible. Once a fix is merged, we will disclose the vulnerability and credit the reporter unless they prefer to remain anonymous.

## Our Security Stance

Scrappy Kin is built on a minimal-exposure architecture. Key design principles:

- **Device-local by default.** User data (tokens, broker selections, sent logs) is stored on-device only, encrypted using the device keychain (iOS) or AES-256-GCM. Nothing is transmitted to Scrappy Kin servers.
- **Minimal permission scope.** The app requests Gmail send-only access (`gmail.send`). We do not read email.
- **No Scrappy Kin accounts.** There is no server-side user account layer. There is nothing to breach on our side.
- **Empty warehouse principle.** If a threat arrives at our door, they should find nothing worth taking.

## Security Audits

This repository is open source and subject to periodic security audits. Audit reports are maintained in the `security/` directory when available. Audits are point-in-time snapshots; see the commit history for ongoing changes.

## Scope

This policy covers the `scrappy-kin-ios` app codebase. For the broader Scrappy Kin system (backend ops, broker data pipeline), contact us at the same address.

## Accepted Risk and Transparency

We are a small team. We aim to be honest about our limitations and our architecture rather than making security claims we cannot back up. If you find something we've missed, we want to know.
