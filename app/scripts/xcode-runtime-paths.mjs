import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

async function isWritableDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
    await fs.access(dirPath, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

export async function resolveXcodeDerivedDataPath(leafName) {
  if (process.env.IOS_DERIVED_DATA_PATH) {
    return process.env.IOS_DERIVED_DATA_PATH
  }

  const candidates = [
    process.env.XCODE_DERIVED_DATA_ROOT,
    '/Volumes/T7-Dev/Xcode-DerivedData',
    path.join(appRoot, 'tmp', 'Xcode-DerivedData'),
  ].filter(Boolean)

  for (const root of candidates) {
    if (await isWritableDirectory(root)) {
      return path.join(root, leafName)
    }
  }

  return path.join(appRoot, 'tmp', 'Xcode-DerivedData', leafName)
}

export async function resolveRepoLocalToolEnv() {
  const tmpRoot = path.join(appRoot, 'tmp')
  const fastlaneUserDir = process.env.FASTLANE_USER_DIR ?? path.join(tmpRoot, 'fastlane-user')
  const npmCache = process.env.NPM_CONFIG_CACHE ?? path.join(tmpRoot, 'npm-cache')

  await fs.mkdir(fastlaneUserDir, { recursive: true })
  await fs.mkdir(npmCache, { recursive: true })

  return {
    FASTLANE_USER_DIR: fastlaneUserDir,
    FASTLANE_SKIP_UPDATE_CHECK: process.env.FASTLANE_SKIP_UPDATE_CHECK ?? '1',
    FASTLANE_OPT_OUT_USAGE: process.env.FASTLANE_OPT_OUT_USAGE ?? '1',
    NPM_CONFIG_CACHE: npmCache,
  }
}
