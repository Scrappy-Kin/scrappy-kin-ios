import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import { chromium, firefox, webkit } from 'playwright'

const appRoot = new URL('..', import.meta.url)
const catalogPath = new URL('src/assets/broker-lists/email-only-brokers.v1.0.1.json', appRoot)
const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://localhost:4173'
const browserName = process.env.CAPTURE_BROWSER ?? 'chromium'
const executablePath = process.env.CAPTURE_EXECUTABLE_PATH
const configuredCdpEndpoint = process.env.CAPTURE_CDP_ENDPOINT
const defaultCdpEndpoint = process.env.CAPTURE_CDP_AUTODETECT === '0' ? '' : 'http://127.0.0.1:9222'
const shouldPrintHelp = process.argv.includes('--help') || process.argv.includes('-h')
const launchCatalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'))
const launchBrokers = Array.isArray(launchCatalog) ? launchCatalog : launchCatalog.brokers
const launchBrokerCount = launchBrokers.length
const launchStarterCount = launchBrokers.filter((broker) => typeof broker.starterOrder === 'number').length
const paidBrokerCount = launchBrokerCount - launchStarterCount

const browserEngines = {
  chromium,
  firefox,
  webkit,
}

const forbiddenCopy = [
  /manual broker picker/i,
  /per-broker/i,
  /\bpick brokers\b/i,
  /\bchoose brokers\b/i,
  /\bskip broker\b/i,
  /\bremove broker\b/i,
  /create (?:a )?scrappy kin account/i,
  /sign (?:in|up) (?:to|for|with) (?:a )?scrappy kin account/i,
  /scrappy kin (?:manages|handles|stores|keeps) (?:your )?(?:billing|card|payment)/i,
  /\bwe (?:store|keep|handle|manage) (?:your )?(?:card|billing|payment)/i,
  /review-safe mode/i,
  /safe send/i,
  /demo mode/i,
]

const routeCrashCopy = [
  /QA arm missing/i,
  /Preparing capture scenario/i,
  /Capture scenario failed/i,
  /Unknown capture scenario/i,
  /Cannot GET/i,
]

function printHelp() {
  console.log(`Usage:
  npm run test:launch-harness

Optional:
  CAPTURE_BASE_URL=http://localhost:4173 npm run test:launch-harness
  CAPTURE_BROWSER=webkit npm run test:launch-harness
  CAPTURE_CDP_ENDPOINT=http://127.0.0.1:9222 npm run test:launch-harness
  CAPTURE_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:launch-harness`)
}

function isKnownBrowserRuntimeFailure(message) {
  return (
    message.includes('MachPortRendezvousServer') ||
    message.includes('bootstrap_check_in') ||
    message.includes('SIGABRT') ||
    message.includes('Abort trap')
  )
}

function explainBrowserFailure(message) {
  if (isKnownBrowserRuntimeFailure(message)) {
    return [
      'Browser runtime unavailable from this execution surface.',
      'This is a macOS browser-launch/sandbox failure, not a web-harness route failure.',
      'Start the VM browser sidecar, set CAPTURE_CDP_ENDPOINT, or run this command from a normal Terminal.',
    ].join('\n')
  }

  if (message.includes('Executable doesn\'t exist')) {
    return [
      'Playwright browser executable is missing.',
      'Install browsers with: npx playwright install chromium',
      'Do not install browser binaries into a temp workaround cache from an agent sandbox.',
    ].join('\n')
  }

  return message
}

async function readPreviewIndex() {
  try {
    const response = await fetch(baseUrl)
    if (!response.ok) {
      return null
    }
    return await response.text()
  } catch {
    return null
  }
}

function isHarnessPreviewIndex(html) {
  return html.includes('src="/assets/') || html.includes('href="/assets/')
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: appRoot,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: options.stdio ?? 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}

async function buildHarnessBundle() {
  console.log('[launch-harness] Building web harness bundle')
  await runProcess('npm', ['run', 'build:dev'], {
    env: { SCRAPPY_WEB_HARNESS: '1' },
  })
}

function startPreviewServer() {
  const child = spawn('npm', ['run', 'preview:dev'], {
    cwd: appRoot,
    env: process.env,
    detached: true,
    stdio: 'ignore',
  })

  return {
    child,
    stop: () => {
      if (child.killed) {
        return
      }
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        try {
          child.kill('SIGTERM')
        } catch {
          // Best effort cleanup. If the host refuses process signals, the
          // command still reports the test result and the caller can stop the
          // preview server manually.
        }
      }
    },
  }
}

async function waitForPreview(startedPreview) {
  const startedAt = Date.now()
  const timeoutMs = 45_000

  while (Date.now() - startedAt < timeoutMs) {
    const html = await readPreviewIndex()
    if (html && isHarnessPreviewIndex(html)) {
      return
    }
    if (startedPreview.child.exitCode !== null) {
      throw new Error([
        'Preview server exited before the app became reachable.',
      ].join('\n'))
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error([
    `Timed out waiting for ${baseUrl}.`,
  ].join('\n'))
}

async function ensurePreviewServer() {
  const existingIndex = await readPreviewIndex()
  if (existingIndex) {
    console.log(`[launch-harness] Reusing preview server at ${baseUrl}`)
    await buildHarnessBundle()

    const rebuiltIndex = await readPreviewIndex()
    if (!rebuiltIndex || !isHarnessPreviewIndex(rebuiltIndex)) {
      throw new Error([
        `A server is already running at ${baseUrl}, but it is not serving a web-harness build.`,
        'Its asset URLs are relative, so direct /capture/... routes will fail under /capture/assets/...',
        'Stop that server, then rerun npm run test:launch-harness so preview:dev can rebuild with SCRAPPY_WEB_HARNESS=1.',
      ].join('\n'))
    }
    return null
  }

  console.log('[launch-harness] Starting preview:dev')
  const startedPreview = startPreviewServer()
  await waitForPreview(startedPreview)
  console.log(`[launch-harness] Preview server ready at ${baseUrl}`)
  return startedPreview
}

async function createBrowser() {
  const cdpEndpoint = configuredCdpEndpoint || defaultCdpEndpoint
  if (cdpEndpoint) {
    try {
      const browser = await chromium.connectOverCDP(cdpEndpoint, { timeout: 2_000 })
      console.log(`[launch-harness] Using browser sidecar at ${cdpEndpoint}`)
      return {
        browser,
        connectedOverCdp: true,
        close: async () => {
          await browser.close().catch(() => {})
        },
      }
    } catch (error) {
      if (configuredCdpEndpoint) {
        throw new Error([
          `CAPTURE_CDP_ENDPOINT is set but not reachable: ${configuredCdpEndpoint}`,
          'Start the VM browser sidecar or unset CAPTURE_CDP_ENDPOINT to use normal Playwright launch.',
          error instanceof Error ? error.message : String(error),
        ].join('\n'))
      }
    }
  }

  const engine = browserEngines[browserName]
  if (!engine) {
    throw new Error(`Unknown CAPTURE_BROWSER: ${browserName}`)
  }

  const launchOptions = {
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  }

  try {
    const browser = await engine.launch(launchOptions)
    return {
      browser,
      close: async () => {
        await browser.close()
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (
      !executablePath &&
      browserName === 'chromium' &&
      (message.includes('Executable doesn\'t exist') || isKnownBrowserRuntimeFailure(message))
    ) {
      const fallbackExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      try {
        await fs.access(fallbackExecutable)
        const browser = await chromium.launch({
          headless: true,
          executablePath: fallbackExecutable,
        })
        return {
          browser,
          close: async () => {
            await browser.close()
          },
        }
      } catch (fallbackError) {
        if (fallbackError?.code === 'ENOENT') {
          throw new Error(explainBrowserFailure(message))
        }
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        throw new Error(explainBrowserFailure(fallbackMessage))
      }
    }
    throw new Error(explainBrowserFailure(message))
  }
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function formatMatcher(matcher) {
  return matcher instanceof RegExp ? matcher.toString() : JSON.stringify(matcher)
}

async function bodyText(page) {
  return normalizeText(await page.locator('body').innerText())
}

function includesMatcher(text, matcher) {
  return matcher instanceof RegExp
    ? matcher.test(text)
    : text.toLocaleLowerCase().includes(matcher.toLocaleLowerCase())
}

async function assertVisibleText(page, matcher) {
  const text = await bodyText(page)
  if (!includesMatcher(text, matcher)) {
    throw new Error(`Missing expected text: ${formatMatcher(matcher)}`)
  }
}

async function assertAbsentText(page, matcher) {
  const text = await bodyText(page)
  if (includesMatcher(text, matcher)) {
    throw new Error(`Unexpected text present: ${formatMatcher(matcher)}`)
  }
}

async function assertNoCrashOrForbiddenCopy(page) {
  for (const matcher of routeCrashCopy) {
    await assertAbsentText(page, matcher)
  }
  for (const matcher of forbiddenCopy) {
    await assertAbsentText(page, matcher)
  }
}

async function openScenario(page, scenario) {
  const url = `${baseUrl}/capture/${scenario}?qa=1`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !document.body.innerText.includes('Preparing capture scenario'))
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(250)
  await assertNoCrashOrForbiddenCopy(page)
}

async function clickButtonByName(page, name) {
  await page.getByRole('button', { name }).first().click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(250)
}

async function assertDashboardState(page, scenario, expected, absent = []) {
  await openScenario(page, scenario)
  for (const matcher of expected) {
    await assertVisibleText(page, matcher)
  }
  for (const matcher of absent) {
    await assertAbsentText(page, matcher)
  }
}

const checks = [
  {
    id: 'home-free-round-complete-subscription-needed',
    run: (page) =>
      assertDashboardState(page, 'home-unsubscribed', [
        'Next up',
        `${launchStarterCount} opt-out emails sent`,
        new RegExp(`${paidBrokerCount} (?:more )?brokers are available`, 'i'),
        /Subscribe/i,
        'Apple manages billing',
      ]),
  },
  {
    id: 'home-subscribed-next-round-ready',
    run: (page) =>
      assertDashboardState(page, 'home-subscribed', [
        'Your next round is ready',
        `${launchStarterCount} opt-out emails sent`,
        new RegExp(`${paidBrokerCount} (?:more )?brokers are available with your subscription`, 'i'),
        'Start next round',
        'View previous sends',
      ]),
  },
  {
    id: 'home-subscribed-all-caught-up',
    run: (page) =>
      assertDashboardState(
        page,
        'home-all-caught-up',
        [
          'You\'re all set!',
          `${launchBrokerCount} opt-out emails sent`,
          'Your next round opens on',
        ],
        [/Subscribe/i, /Start next round/i],
      ),
  },
  {
    id: 'home-active-no-local-history',
    run: (page) =>
      assertDashboardState(
        page,
        'home-active-no-local-history',
        [
          'Your subscription is active',
          '0 opt-out emails sent',
          'This is a fresh install',
          'Set up a round',
        ],
        [/Subscribe/i, /View sent/i],
      ),
  },
  {
    id: 'home-gmail-disconnected',
    run: (page) =>
      assertDashboardState(
        page,
        'home-gmail-disconnected',
        [
          'Reconnect Gmail',
          '5 opt-out emails sent',
        ],
        [/Subscribe/i],
      ),
  },
  {
    id: 'home-entitlement-expired-locked',
    run: (page) =>
      assertDashboardState(page, 'home-entitlement-expired', [
        'Next up',
        `${launchBrokerCount} opt-out emails sent`,
        /0 brokers are available/i,
        /Subscribe/i,
        'Apple manages billing',
      ]),
  },
  {
    id: 'batch-size-selector',
    run: async (page) => {
      const options = [
        { name: 'Quiet', count: 3 },
        { name: 'Steady', count: 5 },
        { name: 'Fast', count: 10 },
        { name: 'All at once', count: paidBrokerCount },
      ]

      for (const option of options) {
        await openScenario(page, 'batch-size')
        await clickButtonByName(page, new RegExp(`^${option.name}\\b`))
        await clickButtonByName(page, 'Save')
        await assertNoCrashOrForbiddenCopy(page)
        await assertVisibleText(page, `${option.count} brokers selected`)
        await assertVisibleText(page, `Send ${option.count} opt-out emails`)
      }
    },
  },
  {
    id: 'app-review-test-recipient-notice',
    run: async (page) => {
      for (const scenario of ['flow-final-review', 'review-batch']) {
        await openScenario(page, scenario)
        await assertVisibleText(page, 'App Review demo recipients')
        await assertVisibleText(
          page,
          'For the App Review demo email, these emails are sent to Scrappy Kin test inboxes instead of broker inboxes.',
        )
        await assertVisibleText(
          page,
          'The broker list, email content, Gmail authorization and send flow, and sent history work the same as the live app.',
        )
      }
    },
  },
  {
    id: 'post-send-flow-updates-dashboard',
    run: async (page) => {
      await openScenario(page, 'flow-beat-sent')
      await assertVisibleText(page, 'Check your Gmail inbox over the next few days to see broker replies.')
      await clickButtonByName(page, 'Next')
      await assertNoCrashOrForbiddenCopy(page)
      await assertVisibleText(page, 'Stay on top of it.')
      await clickButtonByName(page, 'Later')
      await assertNoCrashOrForbiddenCopy(page)
      await assertVisibleText(page, 'Next up')
      await assertVisibleText(page, `${launchStarterCount} opt-out emails sent`)
      await assertVisibleText(page, new RegExp(`${paidBrokerCount} (?:more )?brokers are available`, 'i'))
      await assertVisibleText(page, /Subscribe/i)
    },
  },
  {
    id: 'launch-copy-smoke',
    run: async (page) => {
      const scenarios = [
        'home-unsubscribed',
        'home-subscribed',
        'home-all-caught-up',
        'home-active-no-local-history',
        'home-gmail-disconnected',
        'home-entitlement-expired',
        'flow-beat-subscribe',
        'settings-subscription',
        'review-batch',
        'batch-size',
      ]

      for (const scenario of scenarios) {
        await openScenario(page, scenario)
      }
    },
  },
]

async function runChecks(page) {
  const failures = []

  for (const check of checks) {
    try {
      await check.run(page)
      console.log(`[launch-harness] PASS ${check.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ id: check.id, message })
      console.error(`[launch-harness] FAIL ${check.id}`)
      console.error(`  ${message}`)
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} launch harness ${failures.length === 1 ? 'check' : 'checks'} failed.`)
  }
}

async function main() {
  if (shouldPrintHelp) {
    printHelp()
    return
  }

  const startedPreview = await ensurePreviewServer()
  let browserHandle = null
  let page = null

  try {
    browserHandle = await createBrowser()
    const { browser } = browserHandle
    page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })

    await runChecks(page)
    console.log('[launch-harness] PASS all launch harness checks')
  } finally {
    if (page && !browserHandle?.connectedOverCdp) {
      await page.close().catch(() => {})
    }
    if (browserHandle) {
      await browserHandle.close()
    }
    if (startedPreview) {
      startedPreview.stop()
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
