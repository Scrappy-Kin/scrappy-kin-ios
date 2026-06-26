import path from 'node:path'
import fs from 'node:fs/promises'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { loadLocalEnv } from './local-env.mjs'
import { resolveXcodeDerivedDataPath } from './xcode-runtime-paths.mjs'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

await loadLocalEnv(path.join(appRoot, '.env.local'))

const simulatorName = process.env.IOS_SIMULATOR_NAME
const simulatorRuntime = process.env.IOS_SIMULATOR_RUNTIME
const simulatorUdid = process.env.IOS_SIMULATOR_UDID
const derivedDataPath = await resolveXcodeDerivedDataPath('ScrappyKinA11yTests')
const resultBundlePath = process.env.IOS_A11Y_RESULT_BUNDLE_PATH
  ?? path.join(appRoot, 'tmp', 'a11y-tests', 'ScrappyKinA11y.xcresult')
const scenarioFilterPath = '/tmp/scrappy-kin-a11y-scenario.txt'

// Resolve the scenario filter from CLI args, tolerating the npm `--` separator
// that `ios:test:a11y:spot` injects (argv arrives as `--scenario -- <id>`).
function readScenarioArg() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const flagIndex = args.indexOf('--scenario')
  if (flagIndex !== -1 && args[flagIndex + 1]) {
    return args[flagIndex + 1]
  }
  // Also accept a bare trailing positional (`ios:test:a11y -- <id>`).
  const positional = args.filter((arg) => !arg.startsWith('--'))
  return positional.at(-1) ?? null
}

const requestedScenario = readScenarioArg() ?? process.env.SCRAPPY_A11Y_SCENARIO ?? ''
const isSpotCheck = requestedScenario !== ''

function logCommand(command, args) {
  console.log(`$ ${command} ${args.join(' ')}`)
}

// A scenario filter runs a single screen for fast iteration. It is NOT the
// launch gate — green here does not mean the suite is green. Make that explicit
// at both ends of the run so a spot check is never mistaken for a full pass.
function printSpotCheckBanner() {
  console.log('')
  console.log(`⚠  Spot check — single scenario only (${requestedScenario}). NOT a suite pass.`)
  console.log('   Run `npm run ios:test:a11y` (full, collect-all) before calling it green.')
  console.log('')
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

async function main() {
  if (isSpotCheck) printSpotCheckBanner()
  const udid = await findDeviceUdid(simulatorName, simulatorRuntime)
  await bootDevice(udid)
  await run('npm', ['run', 'ios:sync:qa-device'])
  await fs.rm(resultBundlePath, { recursive: true, force: true })
  if (requestedScenario) {
    await fs.writeFile(scenarioFilterPath, requestedScenario, 'utf8')
  } else {
    await fs.rm(scenarioFilterPath, { force: true })
  }
  await run('xcodebuild', [
    'test',
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'Scrappy Kin Prod',
    '-configuration',
    'QADevice',
    '-destination',
    `id=${udid}`,
    '-derivedDataPath',
    derivedDataPath,
    '-resultBundlePath',
    resultBundlePath,
  ])
}

main()
  .then(() => {
    if (isSpotCheck) printSpotCheckBanner()
  })
  .catch((error) => {
    console.error(error.message)
    if (isSpotCheck) printSpotCheckBanner()
    process.exitCode = 1
  })
