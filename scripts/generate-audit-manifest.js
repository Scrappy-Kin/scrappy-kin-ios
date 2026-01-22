#!/usr/bin/env node

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = process.cwd()
const manifestPath = path.join(repoRoot, 'app', 'src', 'assets', 'audit-manifest.json')
const repo = 'https://github.com/Scrappy-Kin/scrappy-kin-ios'

const auditTiers = {
  must: [
    {
      path: 'app/src/services/googleAuth.ts',
      purpose: 'Gmail OAuth flow, scopes, and token handling.'
    },
    {
      path: 'app/src/services/gmailSend.ts',
      purpose: 'Send opt-out emails via Gmail API.'
    },
    {
      path: 'app/src/services/sendQueue.ts',
      purpose: 'Queueing and dispatch logic for outbound emails.'
    },
    {
      path: 'app/src/services/secureStore.ts',
      purpose: 'Encrypted storage for credentials and user data.'
    },
    {
      path: 'app/src/services/userProfile.ts',
      purpose: 'User profile storage and retrieval.'
    },
    {
      path: 'app/src/services/queueStore.ts',
      purpose: 'Local queue persistence for outbound emails.'
    },
    {
      path: 'app/src/services/brokerStore.ts',
      purpose: 'Broker data loading and selection storage.'
    },
    {
      path: 'app/src/services/emailTemplate.ts',
      purpose: 'Opt-out email template and merge fields.'
    },
    {
      path: 'app/src/services/logStore.ts',
      purpose: 'Diagnostics storage and export behavior.'
    },
    {
      path: 'app/package.json',
      purpose: 'Dependencies (analytics/SDKs) and tooling.'
    }
  ],
  great: [
    {
      path: 'app/src/screens/Settings.tsx',
      purpose: 'Log export, data wipe, and Gmail disconnect flows.'
    },
    {
      path: 'app/src/services/logSchema.ts',
      purpose: 'Diagnostics schema and metadata constraints.'
    },
    {
      path: 'app/src/services/pkce.ts',
      purpose: 'PKCE helper functions.'
    },
    {
      path: 'app/capacitor.config.ts',
      purpose: 'Capacitor app configuration.'
    },
    {
      path: 'app/src/assets/broker-lists/email-only-brokers.v1.0.1.json',
      purpose: 'Bundled broker list reference data.'
    }
  ],
  nice: [
    {
      path: 'app/src/App.tsx',
      purpose: 'Routes, offline gating, and harness routes.'
    },
    {
      path: 'app/src/main.tsx',
      purpose: 'App bootstrap and theme imports.'
    },
    {
      path: 'app/src/screens/Flow.tsx',
      purpose: 'Primary onboarding flow and audit prompt UI.'
    },
    {
      path: 'app/src/screens/Brokers.tsx',
      purpose: 'Broker selection UI and tier grouping.'
    },
    {
      path: 'app/src/screens/Home.tsx',
      purpose: 'Home screen content and quick actions.'
    }
  ]
}

const keyFiles = auditTiers.must
const allFiles = [...auditTiers.must, ...auditTiers.great, ...auditTiers.nice]

const args = new Set(process.argv.slice(2))
const checkOnly = args.has('--check')

const run = (command) => execSync(command, { encoding: 'utf8' }).trim()

const resolveSha = () => {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA
  }

  return run('git rev-parse HEAD')
}

const ensureFileExists = (filePath) => {
  if (!fs.existsSync(path.join(repoRoot, filePath))) {
    throw new Error(`Missing key file: ${filePath}`)
  }
}

const ensureGitPathExists = (sha, filePath) => {
  try {
    run(`git cat-file -e ${sha}:${filePath}`)
  } catch (error) {
    throw new Error(`Key file not found at ${sha}: ${filePath}`)
  }
}

const buildManifest = (sha) => {
  allFiles.forEach((entry) => ensureFileExists(entry.path))

  const rawUrls = allFiles.map((entry) => ({
    path: entry.path,
    url: `https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/${sha}/${entry.path}`
  }))

  const auditLinks = Object.fromEntries(
    Object.entries(auditTiers).map(([tier, entries]) => [
      tier,
      entries.map((entry) => ({
        ...entry,
        url: `https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/${sha}/${entry.path}`
      }))
    ])
  )

  return {
    repo,
    sha,
    generated_at: new Date().toISOString(),
    key_files: keyFiles,
    raw_urls: rawUrls,
    audit_links: auditLinks,
    coverage: {
      note: 'Key files only; this list is not exhaustive.'
    }
  }
}

const writePromptFile = (manifest) => {
  const promptPath = path.join(repoRoot, 'AUDIT_PROMPT.md')
  const text = manifest.prompt_text || buildPrompt(manifest)
  fs.writeFileSync(promptPath, `${text}\n`, 'utf8')
}

const buildPrompt = (manifest) => {
  const tierLabels = {
    must: 'Must see',
    great: 'Great to see',
    nice: 'Nice to see'
  }

  const listSection = Object.keys(tierLabels)
    .map((tier) => {
      const entries = manifest.audit_links?.[tier] ?? []
      if (entries.length === 0) return ''
      const lines = entries.map((entry) => `- ${entry.url}`)
      return [`${tierLabels[tier]}:`, ...lines].join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  const coverageNote = manifest.coverage?.note ? `\n\nScope: ${manifest.coverage.note}` : ''

  return [
    '# Scrappy Kin — Independent Consumer-Side Code Audit (AI Prompt)',
    '',
    'You are an **independent, user-side technical auditor**. Your job is to determine what this app can do with user data, using **only verifiable code evidence you can directly fetch**.',
    '',
    '## Quick navigation (for humans)',
    '- If you are not technical: **scroll to SECTION 6 (Plain-Language Summary + “Can it do this?” table)**.',
    '- The earlier sections are a **technical receipt** that makes the summary trustworthy.',
    '',
    '---',
    '',
    '## Rules (non-negotiable)',
    '1) **Evidence only.** Use only code you can fetch in this run. Do not use README/marketing text as evidence.',
    '2) **No guessing.** No “probably/likely/appears”. If not provable from fetched code, mark **Unknown**.',
    '3) **No invisible negatives.** You cannot claim “it does NOT do X” unless you can justify it via **explicit evidence** (e.g., missing scopes + no relevant API usage in audited files) and you must phrase it as:',
    '   - “No evidence of X in the code we audited” (not “impossible”).',
    '4) **Hard scope.** Audit ONLY:',
    '   - the repo tree **if you can browse it**, and',
    '   - the raw URLs listed below (authoritative file contents).',
    '   If tree browsing fails, treat the tree as **unavailable** and do not speculate about other files.',
    '5) **Every claim needs proof.** Any factual statement must cite:',
    '   - file path + function (or top-level const), and',
    '   - a direct code quote (≤2 lines).',
    '6) **Plain-language sections must be derived from the Evidence Ledger only.** No new facts.',
    '',
    '---',
    '',
    '## SECTION 0 — Access & Fetch Log (Required)',
    'State exactly what you could access:',
    '- Repo tree browsing: Success/Failure (and what you saw, if anything)',
    '- For each raw URL below: Success/Failure',
    '',
    'If any raw file fails to fetch, continue auditing the rest, but mark impacted areas **Unknown**.',
    '',
    '---',
    '',
    '## SECTION 1 — Evidence Ledger (Source of truth)',
    'Produce a numbered list of facts. Each item MUST include:',
    '- **Claim** (one sentence, factual)',
    '- **Location** (file path + function/const)',
    '- **Evidence** (≤2 lines quoted)',
    '',
    'No interpretation here.',
    '',
    '---',
    '',
    '## SECTION 2 — Access (What the app can access)',
    'Derived from ledger only. Cover:',
    '- Permissions/scopes (e.g., Gmail scope)',
    '- Device/platform capabilities used (if visible)',
    '- What user data fields are referenced for composing messages',
    '',
    'Each bullet must cite ledger item numbers.',
    '',
    '---',
    '',
    '## SECTION 3 — Storage (On-device)',
    'Derived from ledger only.',
    'List every storage mechanism + exact keys/prefixes/paths and what is stored.',
    'If encryption is used, name the algorithm ONLY if explicitly shown.',
    '',
    '---',
    '',
    '## SECTION 4 — Network Transmission Inventory (Table)',
    'Derived from ledger only.',
    'One row per network call (including wrapper + call sites if present):',
    '',
    '| File | Function | Destination host | Full URL | Method | Auth mechanism | Headers (keys only) | Body/query fields (keys only) | What user data is included | Proof (ledger #) |',
    '',
    'Rules:',
    '- If URL is constructed dynamically, show the base + how it’s constructed (ledger-backed).',
    '- If payload content can’t be determined, write **Unknown**.',
    '',
    '---',
    '',
    '## SECTION 5 — Gmail Authorization (only if present)',
    'Derived from ledger only. Explain in plain language later, but here capture facts:',
    '- OAuth flow (as implemented)',
    '- Scopes',
    '- Token storage/refresh/revoke',
    '- Redirect handling',
    '',
    'Ledger-backed.',
    '',
    '---',
    '',
    '## SECTION 6 — Plain-Language Summary (for non-technical humans)',
    'Use very plain words. Avoid jargon like “OAuth”, “PKCE”, “Bearer token”. If unavoidable, explain in one short parenthetical.',
    '',
    '### 6.1 TL;DR (8 bullets max)',
    'Write as “This app CAN…” / “This app DOESN’T appear to…” / “Unknown because we couldn’t see…”',
    'Every bullet must reference ledger item numbers in brackets like [L3, L7].',
    '',
    '### 6.2 “Can it do this?” table (keep it simple)',
    '| Question | Answer (✅ Yes / ❌ No evidence / ⚠️ Unknown) | What it means (one sentence) | Proof |',
    'Include at least these questions:',
    '- Can it read my emails?',
    '- Can it send emails for me?',
    '- Can it upload my data to Scrappy Kin servers?',
    '- Can it share data with third parties (analytics/crash tools)?',
    '- Can it track me across apps/websites?',
    '- Can it store my personal info on my phone?',
    '- Can it store my Gmail permission tokens on my phone?',
    '',
    '**Important phrasing rule for negatives:** prefer “❌ No evidence in audited code” over absolute “No”.',
    '',
    '### 6.3 Two examples of good plain language (follow this style)',
    '- ✅ Good: “It can send emails for you, because it calls Gmail’s ‘send message’ address.”',
    '- ❌ Bad: “It uses OAuth2 with PKCE and a Bearer token to access the Gmail API.”',
    '',
    '---',
    '',
    '## SECTION 7 — Gaps, limits, and confidence (non-scary)',
    'Write:',
    '- What you audited (tree? which raw files?)',
    '- What you could NOT access',
    '- What that means in plain language: “We can’t rule out X elsewhere because we did not see the full code.”',
    '- If repo tree browsing succeeded: briefly explain whether the provided raw links seem to cover the major risk surfaces (auth, networking, storage, logging), WITHOUT claiming full coverage.',
    '',
    '---',
    '',
    '## Audit target',
    `Repository: ${manifest.repo}`,
    `Pinned commit (SHA): ${manifest.sha}`,
    '',
    '### Raw files to audit (authoritative)',
    listSection,
    coverageNote.trim().length ? coverageNote.trimStart() : '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const writeManifest = (manifest) => {
  const output = `${JSON.stringify(manifest, null, 2)}\n`
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  fs.writeFileSync(manifestPath, output, 'utf8')
}

const checkManifest = () => {
  if (!fs.existsSync(manifestPath)) {
    console.error('Audit manifest missing. Run npm run audit:manifest and commit the updated audit-manifest.json.')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  if (!manifest.sha) {
    console.error('Audit manifest missing SHA. Run npm run audit:manifest and commit the updated audit-manifest.json.')
    process.exit(1)
  }

  const manifestSha = manifest.sha
  const paths = (manifest.raw_urls || []).map((entry) => entry.path).filter(Boolean)

  if (paths.length === 0) {
    console.error('Audit manifest missing key files. Run npm run audit:manifest and commit the updated audit-manifest.json.')
    process.exit(1)
  }

  paths.forEach((filePath) => ensureGitPathExists(manifestSha, filePath))

  const diffOutput = run(`git diff --name-only ${manifestSha} HEAD -- ${paths.join(' ')}`)

  if (diffOutput.trim().length > 0) {
    console.error('Audit manifest is out of date. Run npm run audit:manifest and commit the updated audit-manifest.json.')
    process.exit(1)
  }

  console.log('Audit manifest check passed.')
}

try {
  if (checkOnly) {
    checkManifest()
    process.exit(0)
  }

  const sha = resolveSha()
  const manifest = buildManifest(sha)
  manifest.prompt_text = buildPrompt(manifest)
  writeManifest(manifest)
  writePromptFile(manifest)
  console.log(`Audit manifest written to ${path.relative(repoRoot, manifestPath)}.`)
} catch (error) {
  console.error(error.message || error)
  process.exit(1)
}
