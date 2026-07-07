import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localConfigPath = path.join(appRoot, 'src/config/appReviewTestRecipients.local.ts')
const exampleConfigPath = path.join(appRoot, 'src/config/appReviewTestRecipients.local.example.ts')

function fail(message) {
  console.error(`[app-review-config] ${message}`)
  console.error(`[app-review-config] Copy ${exampleConfigPath} to ${localConfigPath} and fill it from the secure launch/App Review handoff.`)
  process.exit(1)
}

if (!fs.existsSync(localConfigPath)) {
  fail('Missing local App Review test-recipient config.')
}

const text = fs.readFileSync(localConfigPath, 'utf8')

for (const token of ['example.invalid', 'REPLACE', 'placeholder']) {
  if (text.toLowerCase().includes(token.toLowerCase())) {
    fail(`Local App Review test-recipient config still contains placeholder token: ${token}`)
  }
}

for (const exportName of ['APP_REVIEW_PROFILE_EMAILS', 'APP_REVIEW_TEST_RECIPIENT_EMAILS']) {
  if (!text.includes(`export const ${exportName}`)) {
    fail(`Local App Review test-recipient config must export ${exportName}.`)
  }
}
