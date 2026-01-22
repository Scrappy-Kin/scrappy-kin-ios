#!/usr/bin/env node

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = process.cwd()
const manifestPath = path.join(repoRoot, 'app', 'src', 'assets', 'audit-manifest.json')
const repo = 'https://github.com/Scrappy-Kin/scrappy-kin-ios'

const keyFiles = [
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
    path: 'app/src/services/emailTemplate.ts',
    purpose: 'Opt-out email template and fields.'
  },
  {
    path: 'app/src/services/secureStore.ts',
    purpose: 'Secure storage for credentials/tokens.'
  }
]

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
  keyFiles.forEach((entry) => ensureFileExists(entry.path))

  const rawUrls = keyFiles.map((entry) => ({
    path: entry.path,
    url: `https://raw.githubusercontent.com/Scrappy-Kin/scrappy-kin-ios/${sha}/${entry.path}`
  }))

  return {
    repo,
    sha,
    generated_at: new Date().toISOString(),
    key_files: keyFiles,
    raw_urls: rawUrls,
    coverage: {
      note: 'Key files only; this list is not exhaustive.'
    }
  }
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
  const paths = (manifest.key_files || []).map((entry) => entry.path).filter(Boolean)

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
  writeManifest(manifest)
  console.log(`Audit manifest written to ${path.relative(repoRoot, manifestPath)}.`)
} catch (error) {
  console.error(error.message || error)
  process.exit(1)
}
