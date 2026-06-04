import { chromium, firefox, webkit } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://localhost:4173'
const browserName = process.env.CAPTURE_BROWSER ?? 'chromium'
const executablePath = process.env.CAPTURE_EXECUTABLE_PATH
const configuredCdpEndpoint = process.env.CAPTURE_CDP_ENDPOINT
const defaultCdpEndpoint =
  process.env.CAPTURE_CDP_AUTODETECT === '0' || browserName !== 'chromium' || executablePath
    ? ''
    : 'http://127.0.0.1:9222'
const shouldLaunchBrowser = !process.argv.includes('--http-only')
const shouldPrintHelp = process.argv.includes('--help') || process.argv.includes('-h')

const routes = [
  '/',
  '/ui-harness/review-board',
  '/ui-harness/screenshots',
  '/capture/flow-intro?qa=1',
]

const browserEngines = {
  chromium,
  firefox,
  webkit,
}

function printHelp() {
  console.log(`Usage:
  npm run qa:agent-browser
  npm run qa:web-preflight
  npm run qa:web-preflight -- --http-only

Default agent flow:
  1. Start the preview server: npm run preview:dev
  2. Run route preflight: npm run qa:agent-browser
  3. Run screenshot capture: npm run capture:screens:manual -- --id flow-intro

Optional:
  CAPTURE_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run qa:web-preflight`)
}

function explainBrowserFailure(message) {
  if (
    message.includes('MachPortRendezvousServer') ||
    message.includes('bootstrap_check_in') ||
    message.includes('SIGABRT') ||
    message.includes('Abort trap')
  ) {
    return [
      'Browser runtime unavailable from this execution surface.',
      'This is a macOS browser-launch/sandbox failure, not a web-harness route failure.',
      'Start the VM browser sidecar, set CAPTURE_CDP_ENDPOINT, or run capture:screens:manual from a normal Terminal outside the Codex shell sandbox.',
    ].join('\n')
  }

  if (message.includes('Executable doesn\'t exist')) {
    return [
      'Playwright browser executable is missing.',
      'Install browsers with: npx playwright install chromium',
      'If using a repo-local cache, set PLAYWRIGHT_BROWSERS_PATH before installing and running capture.',
    ].join('\n')
  }

  return message
}

async function connectToCdpBrowser() {
  const cdpEndpoint = configuredCdpEndpoint || defaultCdpEndpoint
  if (!cdpEndpoint) {
    return null
  }

  try {
    const browser = await chromium.connectOverCDP(cdpEndpoint, { timeout: 2_000 })
    console.log(`[browser-qa-preflight] Using browser sidecar at ${cdpEndpoint}`)
    return browser
  } catch (error) {
    if (!configuredCdpEndpoint) {
      return null
    }

    throw new Error([
      `CAPTURE_CDP_ENDPOINT is set but not reachable: ${configuredCdpEndpoint}`,
      'Start the VM browser sidecar or unset CAPTURE_CDP_ENDPOINT to use normal Playwright launch.',
      error instanceof Error ? error.message : String(error),
    ].join('\n'))
  }
}

async function checkRoute(route) {
  const url = `${baseUrl}${route}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }
  console.log(`[browser-qa-preflight] HTTP ${response.status}: ${url}`)
}

async function checkBrowser() {
  const cdpBrowser = await connectToCdpBrowser()
  if (cdpBrowser) {
    const context = await cdpBrowser.newContext()
    try {
      const page = await context.newPage()
      await page.goto(`${baseUrl}/capture/flow-intro?qa=1`, { waitUntil: 'networkidle' })
      await page.screenshot()
      console.log('[browser-qa-preflight] sidecar launch and screenshot OK')
    } finally {
      await context.close().catch(() => {})
      await cdpBrowser.close().catch(() => {})
    }
    return
  }

  const engine = browserEngines[browserName]
  if (!engine) {
    throw new Error(`Unknown CAPTURE_BROWSER: ${browserName}`)
  }

  try {
    const browser = await engine.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    })
    const page = await browser.newPage()
    await page.goto(`${baseUrl}/capture/flow-intro?qa=1`, { waitUntil: 'networkidle' })
    await page.screenshot()
    await browser.close()
    console.log(`[browser-qa-preflight] ${browserName} launch and screenshot OK`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!executablePath && browserName === 'chromium' && message.includes('Executable doesn\'t exist')) {
      const fallbackExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      try {
        await fs.access(fallbackExecutable)
        const browser = await chromium.launch({
          headless: true,
          executablePath: fallbackExecutable,
        })
        const page = await browser.newPage()
        await page.goto(`${baseUrl}/capture/flow-intro?qa=1`, { waitUntil: 'networkidle' })
        await page.screenshot()
        await browser.close()
        console.log(`[browser-qa-preflight] chromium launch and screenshot OK via ${fallbackExecutable}`)
        return
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

async function main() {
  if (shouldPrintHelp) {
    printHelp()
    return
  }

  for (const route of routes) {
    await checkRoute(route)
  }

  if (!shouldLaunchBrowser) {
    console.log('[browser-qa-preflight] Skipped browser launch because --http-only was passed')
    return
  }

  await checkBrowser()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
