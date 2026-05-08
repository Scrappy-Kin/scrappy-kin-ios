import { spawn } from 'node:child_process'
import { execFile as execFileCallback } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)

const KEYCHAIN_ITEMS = {
  APP_STORE_CONNECT_API_KEY_ID: 'scrappy-kin-asc-key-id',
  APP_STORE_CONNECT_ISSUER_ID: 'scrappy-kin-asc-issuer-id',
}
const API_KEY_CONTENT_SERVICE = 'scrappy-kin-asc-api-key-p8'

function usage() {
  console.error('Usage: node scripts/fastlane-with-keychain-asc.mjs <fastlane args...>')
  console.error('Example: node scripts/fastlane-with-keychain-asc.mjs ios prod_testflight')
}

async function readKeychainPassword(service) {
  const { stdout } = await execFile('security', [
    'find-generic-password',
    '-a',
    process.env.USER ?? '',
    '-s',
    service,
    '-w',
  ])
  return stdout.trim()
}

function normalizeP8Contents(rawContents) {
  const trimmed = rawContents.trim()
  if (trimmed.startsWith('-----BEGIN PRIVATE KEY-----')) {
    return trimmed
  }

  if (/^(?:[0-9a-fA-F]{2})+$/.test(trimmed)) {
    const decoded = Buffer.from(trimmed, 'hex').toString('utf8').trim()
    if (decoded.startsWith('-----BEGIN PRIVATE KEY-----')) {
      return decoded
    }
  }

  const escapedNewlines = trimmed.replaceAll('\\n', '\n')
  if (escapedNewlines.startsWith('-----BEGIN PRIVATE KEY-----')) {
    return escapedNewlines
  }

  throw new Error(`Keychain service ${API_KEY_CONTENT_SERVICE} does not contain a PEM private key.`)
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeTempApiKeyFile(p8Contents) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scrappy-kin-asc-key-'))
  const keyPath = path.join(tempDir, 'AuthKey.p8')
  await fs.writeFile(keyPath, p8Contents.endsWith('\n') ? p8Contents : `${p8Contents}\n`, {
    mode: 0o600,
  })
  return { tempDir, keyPath }
}

async function buildEnv() {
  const env = { ...process.env }
  let tempKey = null

  for (const [envKey, service] of Object.entries(KEYCHAIN_ITEMS)) {
    if (env[envKey]) continue
    env[envKey] = await readKeychainPassword(service)
  }

  if (!env.APP_STORE_CONNECT_API_KEY_PATH) {
    const p8Contents = normalizeP8Contents(await readKeychainPassword(API_KEY_CONTENT_SERVICE))
    tempKey = await writeTempApiKeyFile(p8Contents)
    env.APP_STORE_CONNECT_API_KEY_PATH = tempKey.keyPath
  }

  return { env, tempKey }
}

async function cleanupTempKey(tempKey) {
  if (!tempKey) return
  if (!(await pathExists(tempKey.tempDir))) return
  await fs.rm(tempKey.tempDir, { recursive: true, force: true })
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    usage()
    process.exitCode = 1
    return
  }

  let env
  let tempKey
  try {
    const result = await buildEnv()
    env = result.env
    tempKey = result.tempKey
  } catch (error) {
    console.error('Unable to read App Store Connect credentials from Keychain.')
    console.error('Expected generic-password services:')
    for (const service of Object.values(KEYCHAIN_ITEMS)) {
      console.error(`- ${service}`)
    }
    console.error(`- ${API_KEY_CONTENT_SERVICE}`)
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
    return
  }

  const child = spawn('fastlane', args, {
    stdio: 'inherit',
    env,
  })

  child.on('exit', (code, signal) => {
    void cleanupTempKey(tempKey).finally(() => {
      if (signal) {
      console.error(`fastlane exited from signal ${signal}`)
      process.exitCode = 1
      return
      }
      process.exitCode = code ?? 1
    })
  })
}

void main()
