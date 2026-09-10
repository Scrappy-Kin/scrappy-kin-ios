import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { resolveXcodeDerivedDataPath } from './xcode-runtime-paths.mjs'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

const bundleId = 'com.scrappykin.ios'
const productId = 'com.scrappykin.ios.subscription.annual'
const executionLane = 'qa-device'
const developmentTeam = process.env.IOS_DEVELOPMENT_TEAM ?? 'TF64W577SD'
const deviceUdid = process.env.IOS_DEVICE_UDID
const deviceName = process.env.IOS_DEVICE_NAME
const derivedDataPath = await resolveXcodeDerivedDataPath('ScrappyKinQaDevice')
const webOnly = process.env.SCRAPPY_KIN_QA_WEB_ONLY === '1'
const iosDeployPath = path.join(appRoot, 'node_modules', '.bin', 'ios-deploy')

let builtAppPathCache = null

function logCommand(command, args) {
  console.log(`$ ${command} ${args.join(' ')}`)
}

async function run(command, args, options = {}) {
  logCommand(command, args)
  return execFile(command, args, {
    cwd: options.cwd ?? appRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 1024 * 1024 * 30,
  })
}

async function findPhysicalDevice() {
  const { stdout } = await run('xcrun', ['xcdevice', 'list', '--timeout', '10'])
  const candidates = JSON.parse(stdout)
    .filter((device) => device.simulator === false)
    .filter((device) => device.platform === 'com.apple.platform.iphoneos')
    .filter((device) => device.available === true && device.ignored !== true)
    .filter((device) => !deviceUdid || device.identifier === deviceUdid)
    .filter((device) => !deviceName || device.name === deviceName)
    .map((device) => ({
      name: device.name ?? 'Unknown device',
      udid: device.identifier,
      transport: device.interface ?? 'unknown',
      installMethod: Number.parseInt(device.operatingSystemVersion, 10) >= 17
        ? 'devicectl'
        : 'ios-deploy',
    }))
    .filter((device) => device.udid)

  const wiredCandidates = candidates.filter((device) => device.transport === 'usb')
  const matches = wiredCandidates.length > 0 ? wiredCandidates : candidates

  if (matches.length === 1) return matches[0]

  if (matches.length === 0) {
    throw new Error(
      deviceName
        ? `No connected and unlocked iOS device matched IOS_DEVICE_NAME="${deviceName}".`
        : 'No connected and unlocked physical iOS device found.',
    )
  }

  const options = matches.map((device) => `${device.name}: ${device.udid}`).join('\n')
  throw new Error(`Multiple physical devices matched. Set IOS_DEVICE_UDID.\n${options}`)
}

async function runIosDeploy(args) {
  try {
    return await run(iosDeployPath, args)
  } catch (error) {
    const output = `${String(error?.stdout ?? '')} ${String(error?.stderr ?? '')}`
    if (output.includes('InstallComplete') && output.includes('(lldb)     run\nsuccess\n')) {
      console.log('ios-deploy installed and launched the app successfully.')
      return
    }
    throw error
  }
}

async function buildNativeApp(udid) {
  await run('npm', ['run', webOnly ? 'ios:copy:qa-device' : 'ios:sync:qa-device'])

  const buildConfiguration = process.env.IOS_XCODE_CONFIGURATION ?? 'QADevice'
  const signingOverrides = [
    'CODE_SIGN_STYLE=Automatic',
    `DEVELOPMENT_TEAM=${developmentTeam}`,
    'PROVISIONING_PROFILE_SPECIFIER=',
    'CODE_SIGN_IDENTITY=Apple Development',
  ]

  const xcodebuildArgs = [
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'Scrappy Kin Prod',
    '-configuration',
    buildConfiguration,
    '-destination',
    `id=${udid}`,
    '-derivedDataPath',
    derivedDataPath,
    ...signingOverrides,
  ]

  await run('xcodebuild', [...xcodebuildArgs, 'build'])

  const { stdout } = await run('xcodebuild', [...xcodebuildArgs, '-showBuildSettings'])
  const targetBuildDir = stdout.match(/^\s*TARGET_BUILD_DIR = (.+)$/m)?.[1]
  const fullProductName = stdout.match(/^\s*FULL_PRODUCT_NAME = (.+)$/m)?.[1]

  if (!targetBuildDir || !fullProductName) {
    throw new Error('Unable to resolve built app path from xcodebuild settings.')
  }

  builtAppPathCache = path.join(targetBuildDir, fullProductName)
}

async function readPlistValue(plistPath, key) {
  const { stdout } = await run('plutil', ['-extract', key, 'raw', '-o', '-', plistPath])
  return stdout.trim()
}

async function readPublicBundleText(publicPath) {
  const chunks = []

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
        continue
      }
      if (entry.isFile() && /\.(html|js|json)$/.test(entry.name)) {
        chunks.push(await fs.readFile(entryPath, 'utf8'))
      }
    }
  }

  await walk(publicPath)
  return chunks.join('\n')
}

async function verifyBuiltApp() {
  if (!builtAppPathCache) {
    throw new Error('Native app has not been built yet.')
  }

  const infoPlistPath = path.join(builtAppPathCache, 'Info.plist')
  const installedBundleId = await readPlistValue(infoPlistPath, 'CFBundleIdentifier')
  const capacitorDebug = await readPlistValue(infoPlistPath, 'CAPACITOR_DEBUG')
  const publicText = await readPublicBundleText(path.join(builtAppPathCache, 'public'))

  const checks = [
    [installedBundleId === bundleId, `bundle ID is ${bundleId}`],
    [capacitorDebug === 'false', 'CAPACITOR_DEBUG=false'],
    [publicText.includes(productId), `product ID ${productId} is bundled`],
    [publicText.includes(executionLane), `execution lane ${executionLane} is bundled`],
  ]

  const failures = checks
    .filter(([passed]) => !passed)
    .map(([, message]) => message)

  if (failures.length > 0) {
    throw new Error(`QADevice build verification failed: ${failures.join(', ')}`)
  }

  console.log(`Verified QADevice app at ${builtAppPathCache}`)
}

async function installAndLaunch(device) {
  if (!builtAppPathCache) {
    throw new Error('Native app has not been built yet.')
  }

  await fs.access(builtAppPathCache)

  if (device.installMethod === 'ios-deploy') {
    await runIosDeploy([
      '--id', device.udid, '--bundle', builtAppPathCache, '--justlaunch', '--no-wifi',
    ])
    return
  }

  await run('xcrun', [
    'devicectl', 'device', 'install', 'app', '--device', device.udid, builtAppPathCache,
  ])
  await run('xcrun', [
    'devicectl', 'device', 'process', 'launch', '--terminate-existing', '--device',
    device.udid, bundleId,
  ])
}

async function main() {
  const device = await findPhysicalDevice()
  console.log(`Using physical QA device: ${device.name} (${device.udid}, ${device.installMethod})`)
  await buildNativeApp(device.udid)
  await verifyBuiltApp()
  await installAndLaunch(device)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
