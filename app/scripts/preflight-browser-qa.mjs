import { chromium, firefox, webkit } from 'playwright'

const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://localhost:4173'
const browserName = process.env.CAPTURE_BROWSER ?? 'chromium'
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
  3. Use the Codex Playwright MCP/browser tool for screenshots`)
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
      'Use the Codex Playwright MCP/browser lane for agent visual QA, or run capture:screens:manual from a normal Terminal outside the Codex shell sandbox.',
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

async function checkRoute(route) {
  const url = `${baseUrl}${route}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }
  console.log(`[browser-qa-preflight] HTTP ${response.status}: ${url}`)
}

async function checkBrowser() {
  const engine = browserEngines[browserName]
  if (!engine) {
    throw new Error(`Unknown CAPTURE_BROWSER: ${browserName}`)
  }

  try {
    const browser = await engine.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`${baseUrl}/capture/flow-intro?qa=1`, { waitUntil: 'networkidle' })
    await page.screenshot()
    await browser.close()
    console.log(`[browser-qa-preflight] ${browserName} launch and screenshot OK`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
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
