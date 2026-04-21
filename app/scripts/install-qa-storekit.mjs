import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

const bundleId = 'com.scrappykin.ios'
const productId = 'com.scrappykin.ios.subscription.annual'
const executionLane = 'qa-storekit'
const simulatorName = process.env.IOS_SIMULATOR_NAME
const simulatorRuntime = process.env.IOS_SIMULATOR_RUNTIME
const simulatorUdid = process.env.IOS_SIMULATOR_UDID
const derivedDataRoot = process.env.XCODE_DERIVED_DATA_ROOT ?? '/Volumes/T7-Dev/Xcode-DerivedData'
const derivedDataPath =
  process.env.IOS_DERIVED_DATA_PATH ?? path.join(derivedDataRoot, 'ScrappyKinQaStoreKit')

let builtAppPathCache = null

function logCommand(command, args) {
  console.log(`$ ${command} ${args.join(' ')}`)
}

async function run(command, args, options = {}) {
  logCommand(command, args)
  return execFile(command, args, {
    cwd: options.cwd ?? appRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 1024 * 1024 * 20,
  })
}

async function runQuiet(command, args) {
  try {
    return await run(command, args)
  } catch {
    return null
  }
}

async function findDeviceUdid(name, runtime) {
  if (simulatorUdid) {
    return simulatorUdid
  }

  const { stdout } = await run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])
  const payload = JSON.parse(stdout)
  const matches = []

  for (const [runtimeId, runtimeDevices] of Object.entries(payload.devices)) {
    for (const device of runtimeDevices) {
      if (name && device.name !== name) continue
      if (!name && !device.name.startsWith('iPhone')) continue
      if (runtime && !runtimeId.includes(runtime)) continue
      matches.push({ runtimeId, udid: device.udid, state: device.state })
    }
  }

  if (!name && matches.length > 0) {
    return (matches.find((match) => match.state === 'Booted') ?? matches[0]).udid
  }

  if (matches.length === 1) {
    return matches[0].udid
  }

  if (matches.length === 0) {
    throw new Error(
      runtime
        ? `Simulator device not found: ${name} (${runtime})`
        : `Simulator device not found: ${name}`,
    )
  }

  const options = matches.map((match) => `${match.udid} ${match.runtimeId}`).join('\n')
  throw new Error(
    [
      `Multiple simulators matched "${name}".`,
      'Set IOS_SIMULATOR_UDID or IOS_SIMULATOR_RUNTIME to choose one explicitly.',
      options,
    ].join('\n'),
  )
}

async function bootDevice(udid) {
  await runQuiet('open', ['-a', 'Simulator'])
  await runQuiet('xcrun', ['simctl', 'boot', udid])
  await run('xcrun', ['simctl', 'bootstatus', udid, '-b'])
}

async function buildNativeApp(udid) {
  await run('npm', ['run', 'ios:sync:qa-storekit'])

  const xcodebuildArgs = [
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'Scrappy Kin Prod',
    '-configuration',
    'Release',
    '-destination',
    `id=${udid}`,
    '-derivedDataPath',
    derivedDataPath,
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

async function installAndLaunch(udid) {
  if (!builtAppPathCache) {
    throw new Error('Native app has not been built yet.')
  }

  await fs.access(builtAppPathCache)
  await runQuiet('xcrun', ['simctl', 'terminate', udid, bundleId])
  await run('xcrun', ['simctl', 'install', udid, builtAppPathCache])
  await run('xcrun', ['simctl', 'launch', udid, bundleId])
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

async function verifyInstalledApp(udid) {
  const { stdout: appBundleStdout } = await run('xcrun', [
    'simctl',
    'get_app_container',
    udid,
    bundleId,
    'app',
  ])
  const appBundlePath = appBundleStdout.trim()
  const infoPlistPath = path.join(appBundlePath, 'Info.plist')

  const installedBundleId = await readPlistValue(infoPlistPath, 'CFBundleIdentifier')
  const capacitorDebug = await readPlistValue(infoPlistPath, 'CAPACITOR_DEBUG')
  const publicText = await readPublicBundleText(path.join(appBundlePath, 'public'))

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
    throw new Error(`QA StoreKit install verification failed: ${failures.join(', ')}`)
  }

  console.log(`Verified QA StoreKit app at ${appBundlePath}`)
}

async function main() {
  const udid = await findDeviceUdid(simulatorName, simulatorRuntime)
  await bootDevice(udid)
  await buildNativeApp(udid)
  await installAndLaunch(udid)
  await verifyInstalledApp(udid)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
