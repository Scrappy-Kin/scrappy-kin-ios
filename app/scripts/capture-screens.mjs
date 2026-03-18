import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:4173'
const outputDir =
  process.env.CAPTURE_OUTPUT_DIR ??
  path.join(repoRoot, 'docs', 'strategy', 'local-ui-review-screens')

const device = devices['iPhone 14']
const defaultViewport = { ...device.viewport }

const pages = [
  { path: '/home', file: '01-home.png' },
  { path: '/brokers', file: '02-brokers.png' },
  { path: '/settings', file: '03-settings.png' },
  { path: '/flow', file: '04-flow-step-1-welcome.png' },
]

const seededProfile = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  city: 'Toronto',
  country: 'Canada',
  partialPostcode: 'M5V',
}

const seededBrokerIds = ['truepeoplesearch-com', 'data-axle-com']

async function preparePageForCapture(page) {
  return page.evaluate((viewportHeight) => {
    const ionContent = document.querySelector('ion-content')
    const innerScroll = ionContent?.shadowRoot?.querySelector('.inner-scroll')
    if (!(ionContent instanceof HTMLElement) || !(innerScroll instanceof HTMLElement)) {
      return viewportHeight
    }

    const isScrollable = innerScroll.scrollHeight > innerScroll.clientHeight + 1
    if (!isScrollable) {
      return viewportHeight
    }

    const tabBar = document.querySelector('ion-tab-bar')
    if (tabBar instanceof HTMLElement) {
      tabBar.style.display = 'none'
    }

    ionContent.style.height = 'auto'
    ionContent.style.contain = 'none'

    innerScroll.style.position = 'relative'
    innerScroll.style.overflowY = 'visible'
    innerScroll.style.height = 'auto'
    innerScroll.style.paddingBottom = '96px'
    const topOffset = ionContent.getBoundingClientRect().top
    return Math.max(viewportHeight, Math.ceil(topOffset + innerScroll.scrollHeight + 120))
  }, defaultViewport.height)
}

async function ensureAppIsReachable() {
  const response = await fetch(baseUrl)
  if (!response.ok) {
    throw new Error(`Preview app responded with ${response.status} at ${baseUrl}`)
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function captureRoute(page, routePath, fileName, summaries) {
  await page.setViewportSize(defaultViewport)
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const viewportHeight = await preparePageForCapture(page)
  await page.setViewportSize({ width: defaultViewport.width, height: viewportHeight })
  await page.waitForTimeout(100)
  const destination = path.join(outputDir, fileName)
  await page.screenshot({ path: destination })
  const bodyText = normalizeText(await page.locator('body').innerText())
  summaries.push({ file: fileName, route: routePath, summary: bodyText.slice(0, 500) })
  console.log(`${fileName} <- ${routePath}`)
}

async function captureFlowStep(page, fileName, summaries) {
  await page.waitForTimeout(300)
  const viewportHeight = await preparePageForCapture(page)
  await page.setViewportSize({ width: defaultViewport.width, height: viewportHeight })
  await page.waitForTimeout(100)
  const destination = path.join(outputDir, fileName)
  await page.screenshot({ path: destination })
  const bodyText = normalizeText(await page.locator('body').innerText())
  summaries.push({ file: fileName, route: page.url().replace(baseUrl, ''), summary: bodyText.slice(0, 500) })
  console.log(`${fileName} <- ${page.url()}`)
}

async function captureCurrentPage(page, fileName, summaries) {
  await captureFlowStep(page, fileName, summaries)
}

async function openFlowStep(page, nextClicks) {
  await page.setViewportSize(defaultViewport)
  await page.goto(`${baseUrl}/flow`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  for (let index = 0; index < nextClicks; index += 1) {
    await page.getByRole('button', { name: 'Next' }).click()
    await page.waitForTimeout(300)
  }
}

async function wipeLocalAppState(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

async function seedPostAuthState(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await page.evaluate(
    async ({ profile, brokerIds }) => {
      const secureStore = await import('/src/services/secureStore.ts')
      await secureStore.setEncrypted('gmail_tokens', {
        accessToken: 'mock-access-token',
        expiresAt: Date.now() + 60 * 60 * 1000,
      })
      await secureStore.setEncrypted('user_profile', profile)
      await secureStore.setEncrypted('selected_brokers', brokerIds)
    },
    { profile: seededProfile, brokerIds: seededBrokerIds },
  )
}

async function mockSuccessfulGmailSend(page) {
  await page.route('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: `mock-${Date.now()}` }),
    })
  })
}

async function main() {
  await ensureAppIsReachable()
  await fs.mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ ...device })
  const page = await context.newPage()
  const summaries = []

  try {
    await wipeLocalAppState(page)

    for (const entry of pages) {
      await captureRoute(page, entry.path, entry.file, summaries)
    }

    await openFlowStep(page, 1)
    await captureFlowStep(page, '05-flow-step-2-email-preview.png', summaries)

    await openFlowStep(page, 2)
    await captureFlowStep(page, '06-flow-step-3-gmail-login.png', summaries)

    await wipeLocalAppState(page)
    await seedPostAuthState(page)

    await openFlowStep(page, 3)
    await captureFlowStep(page, '07-flow-step-4-gmail-permissions.png', summaries)

    await openFlowStep(page, 4)
    await captureFlowStep(page, '08-flow-step-5-profile.png', summaries)

    await openFlowStep(page, 5)
    await captureFlowStep(page, '09-flow-step-6-brokers.png', summaries)

    await openFlowStep(page, 6)
    await captureFlowStep(page, '10-flow-step-7-ready.png', summaries)

    await page.getByRole('button', { name: 'Send now' }).click()
    await page.waitForURL(`${baseUrl}/home`)
    await captureCurrentPage(page, '11-home-ready-to-send.png', summaries)

    await mockSuccessfulGmailSend(page)
    await page.getByRole('button', { name: 'Send selected requests' }).click()
    await page.waitForFunction(
      ({ expectedSummary, expectedButton }) => {
        const text = document.body.innerText
        return text.includes(expectedSummary) && text.includes(expectedButton)
      },
      {
        expectedSummary: 'Sent: 2 · Failed: 0 · Pending: 0',
        expectedButton: 'Send selected requests',
      },
    )
    await captureCurrentPage(page, '12-home-after-send-all.png', summaries)

    const manifestPath = path.join(outputDir, 'manifest.json')
    await fs.writeFile(manifestPath, JSON.stringify({ baseUrl, outputDir, captures: summaries }, null, 2))
    console.log(`manifest.json <- ${manifestPath}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
