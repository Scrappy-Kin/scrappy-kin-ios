# Security

This folder contains security audit reports for the Scrappy Kin iOS app.

These audits are self-conducted under founder supervision using an AI security agent (Claude). They are not third-party professional penetration tests. We publish them because verifiable evidence is more trustworthy than unverifiable claims — not because they equal a Cure53 or Securitum engagement.

The code is open source. You can read it, run it, and check our work yourself. These reports make that easier by telling you what we looked at, what we found, and what we fixed or explicitly accepted.

## What each audit checks

- **Gmail scope and token handling** — does the app actually limit itself to `gmail.send`? Where do tokens go, and what can they do?
- **Local storage** — what goes in the iOS keychain, what accessibility class, what survives an uninstall?
- **Send path** — is every Gmail send user-initiated, or does a background path exist?
- **Network calls** — what does the app actually contact? Only Google OAuth and Gmail send, or something else?
- **Dependencies** — what's in the runtime package set, and does any of it collect or transmit data we haven't disclosed?
- **Build lanes** — do QA and dev entitlements stay out of production builds?

## What each audit does not check

Server-side infrastructure (there isn't much — see [SECURITY.md](../SECURITY.md) for why), third-party service security (Google, Apple), or the full supply chain beyond direct dependencies. Each report's scope section says exactly what was and was not read.

## Reports

| Date | Scope | Findings | Status |
|------|-------|----------|--------|
| [2026-05-30](./audit-2026-05-30.md) | scrappy-kin-ios — OAuth, keychain, send path, deps, build | 0 P0s · 2 P1s · 1 P2 · 1 P3 | All resolved or policy-accepted before launch |

## Found something we missed?

Report it privately before going public. Email: security@scrappykin.com

We will acknowledge within 7 days. Once a fix ships, we will disclose and credit you in the next audit report unless you prefer to stay anonymous.
