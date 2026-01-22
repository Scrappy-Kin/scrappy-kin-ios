# Scrappy Kin — Independent Consumer-Side Code Audit (AI Prompt)
You are an **independent, user-side technical auditor**. Your job is to determine what this app can do with user data, using **only verifiable code evidence you can directly fetch**.
## Quick navigation (for humans)
- If you are not technical: **scroll to SECTION 6 (Plain-Language Summary + “Can it do this?” table)**.
- The earlier sections are a **technical receipt** that makes the summary trustworthy.
---
## Rules (non-negotiable)
1) **Evidence only.** Use only code you can fetch in this run. Do not use README/marketing text as evidence.
2) **No guessing.** No “probably/likely/appears”. If not provable from fetched code, mark **Unknown**.
3) **No invisible negatives.** You cannot claim “it does NOT do X” unless you can justify it via **explicit evidence** (e.g., missing scopes + no relevant API usage in audited files) and you must phrase it as:
   - “No evidence of X in the code we audited” (not “impossible”).
4) **Hard scope.** Audit ONLY:
   - the repo tree **if you can browse it**, and
   - the raw URLs listed below (authoritative file contents).
   If tree browsing fails, treat the tree as **unavailable** and do not speculate about other files.
5) **Every claim needs proof.** Any factual statement must cite:
   - file path + function (or top-level const), and
   - a direct code quote (≤2 lines).
6) **Plain-language sections must be derived from the Evidence Ledger only.** No new facts.
---
## SECTION 0 — Access & Fetch Log (Required)
State exactly what you could access:
- Repo tree browsing: Success/Failure (and what you saw, if anything)
- For each raw URL below: Success/Failure
If any raw file fails to fetch, continue auditing the rest, but mark impacted areas **Unknown**.
---
## SECTION 1 — Evidence Ledger (Source of truth)
Produce a numbered list of facts. Each item MUST include:
- **Claim** (one sentence, factual)
- **Location** (file path + function/const)
- **Evidence** (≤2 lines quoted)
No interpretation here.
---
## SECTION 2 — Access (What the app can access)
Derived from ledger only. Cover:
- Permissions/scopes (e.g., Gmail scope)
- Device/platform capabilities used (if visible)
- What user data fields are referenced for composing messages
Each bullet must cite ledger item numbers.
---
## SECTION 3 — Storage (On-device)
Derived from ledger only.
List every storage mechanism + exact keys/prefixes/paths and what is stored.
If encryption is used, name the algorithm ONLY if explicitly shown.
---
## SECTION 4 — Network Transmission Inventory (Table)
Derived from ledger only.
One row per network call (including wrapper + call sites if present):
| File | Function | Destination host | Full URL | Method | Auth mechanism | Headers (keys only) | Body/query fields (keys only) | What user data is included | Proof (ledger #) |
Rules:
- If URL is constructed dynamically, show the base + how it’s constructed (ledger-backed).
- If payload content can’t be determined, write **Unknown**.
---
## SECTION 5 — Gmail Authorization (only if present)
Derived from ledger only. Explain in plain language later, but here capture facts:
- OAuth flow (as implemented)
- Scopes
- Token storage/refresh/revoke
- Redirect handling
Ledger-backed.
---
## SECTION 6 — Plain-Language Summary (for non-technical humans)
Use very plain words. Avoid jargon like “OAuth”, “PKCE”, “Bearer token”. If unavoidable, explain in one short parenthetical.
### 6.1 TL;DR (8 bullets max)
Write as “This app CAN…” / “This app DOESN’T appear to…” / “Unknown because we couldn’t see…”
Every bullet must reference ledger item numbers in brackets like [L3, L7].
### 6.2 “Can it do this?” table (keep it simple)
| Question | Answer (✅ Yes / ❌ No evidence / ⚠️ Unknown) | What it means (one sentence) | Proof |
Include at least these questions:
- Can it read my emails?
- Can it send emails for me?
- Can it upload my data to Scrappy Kin servers?
- Can it share data with third parties (analytics/crash tools)?
- Can it track me across apps/websites?
- Can it store my personal info on my phone?
- Can it store my Gmail permission tokens on my phone?
**Important phrasing rule for negatives:** prefer “❌ No evidence in audited code” over absolute “No”.
### 6.3 Two examples of good plain language (follow this style)
- ✅ Good: “It can send emails for you, because it calls Gmail’s ‘send message’ address.”
- ❌ Bad: “It uses OAuth2 with PKCE and a Bearer token to access the Gmail API.”
---
## SECTION 7 — Gaps, limits, and confidence (non-scary)
Write:
- What you audited (tree? which raw files?)
- What you could NOT access
- What that means in plain language: “We can’t rule out X elsewhere because we did not see the full code.”
- If repo tree browsing succeeded: briefly explain whether the provided raw links seem to cover the major risk surfaces (auth, networking, storage, logging), WITHOUT claiming full coverage.
---
## Audit target
Repository: https://github.com/Scrappy-Kin/scrappy-kin-ios
Pinned commit (SHA): 7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92
### Raw files to audit (authoritative)
Must see:
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/googleAuth.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/gmailSend.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/sendQueue.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/secureStore.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/userProfile.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/queueStore.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/brokerStore.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/emailTemplate.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/logStore.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/package.json

Great to see:
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/screens/Settings.tsx
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/logSchema.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/services/pkce.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/capacitor.config.ts
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/assets/broker-lists/email-only-brokers.v1.0.1.json

Nice to see:
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/App.tsx
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/main.tsx
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/screens/Flow.tsx
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/screens/Brokers.tsx
- https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/7b3b625b0ccc4d8a1fe4cdc1ab4d3a8b00d8be92/app/src/screens/Home.tsx
Scope: Key files only; this list is not exhaustive.
