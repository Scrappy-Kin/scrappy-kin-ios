import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(appRoot, '..')

const defaultCaptureScheme = 'scrappykin-review'
const simulatorName = process.env.IOS_SIMULATOR_NAME
const simulatorRuntime = process.env.IOS_SIMULATOR_RUNTIME
const simulatorUdid = process.env.IOS_SIMULATOR_UDID
const bundleId = process.env.IOS_BUNDLE_ID ?? 'com.scrappykin.ios.dev'
const captureScheme = process.env.IOS_CAPTURE_SCHEME ?? defaultCaptureScheme
const derivedDataRoot = process.env.XCODE_DERIVED_DATA_ROOT ?? '/Volumes/T7-Dev/Xcode-DerivedData'
const derivedDataPath =
  process.env.IOS_DERIVED_DATA_PATH ?? path.join(derivedDataRoot, 'ScrappyKinCapture')
const productOutputDir =
  process.env.CAPTURE_OUTPUT_DIR ??
  path.join(appRoot, 'dist', 'review-artifacts', 'local-ui-review-screens')
const harnessOutputDir =
  process.env.CAPTURE_HARNESS_OUTPUT_DIR ??
  path.join(appRoot, 'dist', 'review-artifacts', 'harness')

const captures = [
  { scenario: 'home', file: path.join(productOutputDir, '01-home.png') },
  { scenario: 'brokers', file: path.join(productOutputDir, '02-brokers.png') },
  { scenario: 'settings', file: path.join(productOutputDir, '03-settings.png') },
  { scenario: 'flow-intro', file: path.join(productOutputDir, '04-flow-step-1-intro.png') },
  { scenario: 'flow-starter-set', file: path.join(productOutputDir, '05-flow-step-2-starter-set.png') },
  {
    scenario: 'flow-request-review',
    file: path.join(productOutputDir, '06-flow-step-3-request-review.png'),
  },
  { scenario: 'flow-gmail-send', file: path.join(productOutputDir, '07-flow-step-4-gmail-send.png') },
  {
    scenario: 'flow-final-review',
    file: path.join(productOutputDir, '08-flow-step-5-final-review.png'),
  },
  { scenario: 'flow-beat-sent', file: path.join(productOutputDir, '09-flow-beat-sent.png') },
  { scenario: 'flow-beat-subscribe', file: path.join(productOutputDir, '10-flow-beat-subscribe.png') },
  { scenario: 'home-unsubscribed', file: path.join(productOutputDir, '11-home-unsubscribed.png') },
  { scenario: 'home-subscribed', file: path.join(productOutputDir, '12-home-subscribed.png') },
  { scenario: 'settings-subscription', file: path.join(productOutputDir, '13-settings-subscription.png') },
  { route: 'ui-harness/primitives', file: path.join(harnessOutputDir, 'primitives.png') },
  { route: 'ui-harness/patterns', file: path.join(harnessOutputDir, 'patterns.png') },
]

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

async function runQuiet(command, args, options = {}) {
  try {
    return await run(command, args, options)
  } catch (error) {
    if (!options.allowFailure) {
      throw error
    }
    return null
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  await runQuiet('open', ['-a', 'Simulator'], { allowFailure: true })
  await runQuiet('xcrun', ['simctl', 'boot', udid], { allowFailure: true })
  await run('xcrun', ['simctl', 'bootstatus', udid, '-b'])
}

async function overrideStatusBar(udid) {
  await runQuiet(
    'xcrun',
    [
      'simctl',
      'status_bar',
      udid,
      'override',
      '--time',
      '9:41',
      '--batteryState',
      'charged',
      '--batteryLevel',
      '100',
      '--cellularMode',
      'active',
      '--cellularBars',
      '4',
      '--wifiBars',
      '3',
    ],
    { allowFailure: true },
  )
}

async function clearStatusBar(udid) {
  await runQuiet('xcrun', ['simctl', 'status_bar', udid, 'clear'], { allowFailure: true })
}

async function buildNativeApp(udid) {
  await run('npm', ['run', 'build:dev'])
  await run('npx', ['cap', 'sync', 'ios'])
  const xcodebuildArgs = [
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'App',
    '-configuration',
    'Debug',
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

function builtAppPath() {
  if (!builtAppPathCache) {
    throw new Error('Native app has not been built yet.')
  }
  return builtAppPathCache
}

async function installAndLaunch(udid) {
  const appPath = builtAppPath()
  await fs.access(appPath)
  await runQuiet('xcrun', ['simctl', 'terminate', udid, bundleId], { allowFailure: true })
  await run('xcrun', ['simctl', 'install', udid, appPath])
  await run('xcrun', ['simctl', 'launch', udid, bundleId])
  await delay(2500)
}

function routeToUrl(route) {
  return `${captureScheme}://${route}?qa=1`
}

async function openRoute(udid, route, waitMs = 1400) {
  await run('xcrun', ['simctl', 'openurl', udid, routeToUrl(route)])
  await delay(waitMs)
}

async function captureRoute(udid, route, file) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await openRoute(udid, route)
  await run('xcrun', ['simctl', 'io', udid, 'screenshot', file])
}

async function writeManifest(udid) {
  const manifestPath = path.join(productOutputDir, 'manifest.json')
  const payload = {
    device: simulatorName ?? 'first available iPhone simulator',
    udid,
    bundleId,
    captureScheme,
    captures: captures.map((entry) => ({
      route: entry.route ?? `capture/${entry.scenario}`,
      file: entry.file,
    })),
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(payload, null, 2)}\n`)
}

async function main() {
  await fs.mkdir(productOutputDir, { recursive: true })
  await fs.mkdir(harnessOutputDir, { recursive: true })

  const udid = await findDeviceUdid(simulatorName, simulatorRuntime)
  await bootDevice(udid)
  await overrideStatusBar(udid)

  try {
    await buildNativeApp(udid)
    await installAndLaunch(udid)
    await openRoute(udid, 'capture/home', 2200)

    for (const entry of captures) {
      const route = entry.route ?? `capture/${entry.scenario}`
      await captureRoute(udid, route, entry.file)
      console.log(`${entry.file} <- ${route}`)
    }

    await writeManifest(udid)
  } finally {
    await clearStatusBar(udid)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
