import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices, firefox } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const appRoot = path.resolve(__dirname, '..')

const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://localhost:4173'
const browserName = process.env.CAPTURE_BROWSER ?? 'chromium'
const executablePath = process.env.CAPTURE_EXECUTABLE_PATH
const outputDirs = process.env.CAPTURE_OUTPUT_DIR
  ? [process.env.CAPTURE_OUTPUT_DIR]
  : [
      path.join(appRoot, 'public', 'review-artifacts'),
      path.join(appRoot, 'dist', 'review-artifacts'),
    ]

const device = devices['iPhone 14']
const defaultViewport = { ...device.viewport }

const capturePlan = [
  {
    id: 'flow-intro',
    title: 'Flow: intro',
    description: 'Longform onboarding intro, trust stance, and disclosure entry points.',
    group: 'onboarding',
    route: '/capture/flow-intro?qa=1',
    file: '01-flow-intro.png',
  },
  {
    id: 'flow-starter-set',
    title: 'Flow: starter set',
    description: 'The fixed taster round that replaces onboarding broker selection.',
    group: 'onboarding',
    route: '/capture/flow-starter-set?qa=1',
    file: '02-flow-starter-set.png',
  },
  {
    id: 'flow-request-review',
    title: 'Flow: email review',
    description: 'Template, inline fields, and the editable opt-out email artifact.',
    group: 'onboarding',
    route: '/capture/flow-request-review?qa=1',
    file: '03-flow-request-review.png',
  },
  {
    id: 'flow-gmail-send',
    title: 'Flow: Gmail connect',
    description: 'Send-only consent explanation before Google auth.',
    group: 'onboarding',
    route: '/capture/flow-gmail-send?qa=1',
    file: '04-flow-gmail-send.png',
  },
  {
    id: 'flow-final-review',
    title: 'Flow: final review',
    description: 'Connected Gmail, broker summary, and final send checkpoint.',
    group: 'onboarding',
    route: '/capture/flow-final-review?qa=1',
    file: '05-flow-final-review.png',
  },
  {
    id: 'flow-beat-sent',
    title: 'Flow: beat 1',
    description: 'Post-send confirmation before the subscription offer.',
    group: 'subscription',
    route: '/capture/flow-beat-sent?qa=1',
    file: '06-flow-beat-sent.png',
  },
  {
    id: 'flow-beat-subscribe',
    title: 'Flow: beat 2',
    description: 'Subscription offer, restore path, and later dismissal.',
    group: 'subscription',
    route: '/capture/flow-beat-subscribe?qa=1',
    file: '07-flow-beat-subscribe.png',
  },
  {
    id: 'review-batch',
    title: 'App: review batch',
    description: 'Post-onboarding batch review and send flow from Home.',
    group: 'dashboard',
    route: '/capture/review-batch?qa=1',
    file: '08-review-batch.png',
  },
  {
    id: 'home-unsubscribed',
    title: 'Home: unsubscribed',
    description: 'Dashboard card after the free taster when subscription is inactive.',
    group: 'dashboard',
    route: '/capture/home-unsubscribed?qa=1',
    file: '09-home-unsubscribed.png',
  },
  {
    id: 'home-subscribed',
    title: 'Home: subscribed',
    description: 'Dashboard card after the free taster when subscription is active.',
    group: 'dashboard',
    route: '/capture/home-subscribed?qa=1',
    file: '10-home-subscribed.png',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Top-level Settings entry point for profile, Gmail, subscription, privacy, diagnostics, and support.',
    group: 'settings',
    route: '/capture/settings?qa=1',
    file: '11-settings-home.png',
  },
  {
    id: 'settings-subscription',
    title: 'Settings: subscription',
    description: 'Top-level subscription management with restore and Apple billing copy.',
    group: 'settings',
    route: '/capture/settings-subscription?qa=1',
    file: '12-settings-subscription.png',
  },
  {
    id: 'settings-profile',
    title: 'Settings: profile',
    description: 'Editable personal details used in broker opt-out emails.',
    group: 'settings',
    route: '/capture/settings-profile?qa=1',
    file: '13-settings-profile.png',
  },
  {
    id: 'settings-privacy',
    title: 'Settings: privacy',
    description: 'On-device data and deletion controls.',
    group: 'settings',
    route: '/capture/settings-privacy?qa=1',
    file: '14-settings-privacy.png',
  },
  {
    id: 'settings-diagnostics',
    title: 'Settings: diagnostics',
    description: 'Local diagnostics capture, export, and wipe actions.',
    group: 'settings',
    route: '/capture/settings-diagnostics?qa=1',
    file: '15-settings-diagnostics.png',
  },
  {
    id: 'settings-support',
    title: 'Settings: support',
    description: 'Help, legal links, support email, and build metadata on one surface.',
    group: 'settings',
    route: '/capture/settings-support?qa=1',
    file: '16-settings-support.png',
  },
]

function parseArgs(argv) {
  const options = {
    group: null,
    id: null,
    list: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--group') {
      options.group = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (arg === '--id') {
      options.id = argv[index + 1] ?? null
      index += 1
      continue
    }
    if (arg === '--list') {
      options.list = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }

  return options
}

function printHelp() {
  console.log(`Usage:
  npm run capture:screens:manual
  npm run capture:screens:manual -- --group onboarding
  npm run capture:screens:manual -- --group subscription
  npm run capture:screens:manual -- --group dashboard
  npm run capture:screens:manual -- --group settings
  npm run capture:screens:manual -- --id flow-beat-subscribe
  npm run capture:screens:manual -- --list`)
}

function assertSupportedEntrypoint() {
  if (process.env.npm_lifecycle_event !== 'capture:screens') {
    return
  }

  if (process.env.CAPTURE_SCREENS_LEGACY_OK === '1') {
    return
  }

  throw new Error([
    'npm run capture:screens is a legacy alias and is intentionally blocked by default.',
    '',
    'For agent visual QA:',
    '  1. Start the preview server: npm run preview:dev',
    '  2. Run the route preflight: npm run qa:agent-browser',
    '  3. Use the Codex Playwright MCP/browser tool for screenshots',
    '',
    'For manual screenshot capture from a normal Terminal, CI, or another proven unsandboxed runner:',
    '  npm run capture:screens:manual -- --group onboarding',
    '',
    'If an old automation truly needs this alias, set CAPTURE_SCREENS_LEGACY_OK=1 for that run.',
  ].join('\n'))
}

function selectCapturePlan(options) {
  let entries = capturePlan

  if (options.group) {
    entries = entries.filter((entry) => entry.group === options.group)
  }

  if (options.id) {
    entries = entries.filter((entry) => entry.id === options.id)
  }

  return entries
}

function isFilteredRun(options) {
  return Boolean(options.group || options.id)
}

async function readExistingManifest() {
  const manifestPath = path.join(outputDirs[0], 'manifest.json')

  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.captures)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function mergeCaptures(existingCaptures, nextCaptures) {
  const replacedIds = new Set(nextCaptures.map((entry) => entry.id))
  const merged = [
    ...existingCaptures.filter((entry) => !replacedIds.has(entry.id)),
    ...nextCaptures,
  ]
  const planOrder = new Map(capturePlan.map((entry, index) => [entry.id, index]))

  merged.sort((left, right) => {
    const leftOrder = planOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = planOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })

  return merged
}

async function removeFiles(outputDir, fileNames) {
  await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        await fs.unlink(path.join(outputDir, fileName))
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return
        }
        throw error
      }
    }),
  )
}

async function pruneStaleArtifacts(existingManifest, nextCaptures) {
  const nextFiles = new Set(nextCaptures.map((entry) => entry.file))
  const staleFiles = (existingManifest?.captures ?? [])
    .map((entry) => entry.file)
    .filter((fileName) => !nextFiles.has(fileName))

  if (staleFiles.length === 0) {
    return
  }

  await Promise.all(outputDirs.map((outputDir) => removeFiles(outputDir, staleFiles)))
}

async function resetOutputDirs(existingManifest) {
  const knownFiles = new Set(capturePlan.map((entry) => entry.file))
  for (const fileName of existingManifest?.captures ?? []) {
    knownFiles.add(fileName.file)
  }
  const removableFiles = [...knownFiles, 'manifest.json']
  await Promise.all(outputDirs.map((outputDir) => removeFiles(outputDir, removableFiles)))
}

async function resolveBrowserLaunchOptions() {
  if (executablePath) {
    return { executablePath }
  }

  return {}
}

function browserRuntimeHint(cause) {
  if (!(cause instanceof Error)) {
    return ''
  }

  if (
    cause.message.includes('MachPortRendezvousServer') ||
    cause.message.includes('bootstrap_check_in') ||
    cause.message.includes('SIGABRT') ||
    cause.message.includes('Abort trap')
  ) {
    return [
      '',
      'Browser runtime unavailable from this execution surface.',
      'This is a macOS browser-launch/sandbox failure, not a web-harness route failure.',
      'Use the Codex Playwright MCP/browser lane for agent visual QA, or run this capture command from a normal Terminal outside the Codex shell sandbox.',
    ].join('\n')
  }

  return ''
}

async function launchBrowser() {
  const launchOptions = {
    headless: true,
    ...(await resolveBrowserLaunchOptions()),
  }

  if (browserName === 'firefox') {
    try {
      return await firefox.launch(launchOptions)
    } catch (cause) {
      throw new Error(`${cause instanceof Error ? cause.message : cause}${browserRuntimeHint(cause)}`)
    }
  }

  try {
    return await chromium.launch(launchOptions)
  } catch (cause) {
    if (
      executablePath ||
      !(cause instanceof Error) ||
      !cause.message.includes('Executable doesn\'t exist')
    ) {
      throw new Error(`${cause.message}${browserRuntimeHint(cause)}`)
    }

    const fallbackExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    await fs.access(fallbackExecutable)
    try {
      return await chromium.launch({
        headless: true,
        executablePath: fallbackExecutable,
      })
    } catch (fallbackCause) {
      throw new Error(
        `${fallbackCause instanceof Error ? fallbackCause.message : fallbackCause}${browserRuntimeHint(fallbackCause)}`,
      )
    }
  }
}

async function ensureAppIsReachable() {
  let response

  try {
    response = await fetch(baseUrl)
  } catch {
    throw new Error(
      `Could not reach ${baseUrl}. Start the dev preview first with: cd app && npm run preview:dev`,
    )
  }

  if (!response.ok) {
    throw new Error(`Preview app responded with ${response.status} at ${baseUrl}`)
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

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

async function captureEntry(page, entry, captures) {
  await page.setViewportSize(defaultViewport)
  await page.goto(`${baseUrl}${entry.route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(450)

  const viewportHeight = await preparePageForCapture(page)
  await page.setViewportSize({ width: defaultViewport.width, height: viewportHeight })
  await page.waitForTimeout(120)

  const screenshotBuffer = await page.screenshot()
  await Promise.all(
    outputDirs.map((outputDir) =>
      fs.writeFile(path.join(outputDir, entry.file), screenshotBuffer),
    ),
  )
  const bodyText = normalizeText(await page.locator('body').innerText())

  captures.push({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    group: entry.group,
    route: entry.route,
    file: entry.file,
    imagePath: `/review-artifacts/${entry.file}`,
    summary: bodyText.slice(0, 280),
  })

  console.log(`${entry.file} <- ${entry.route}`)
}

async function main() {
  assertSupportedEntrypoint()

  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  if (options.list) {
    console.log(JSON.stringify(capturePlan, null, 2))
    return
  }

  const selectedEntries = selectCapturePlan(options)
  if (selectedEntries.length === 0) {
    throw new Error('No capture entries matched the requested filters.')
  }
  const filteredRun = isFilteredRun(options)
  const existingManifest = await readExistingManifest()

  await ensureAppIsReachable()
  await Promise.all(outputDirs.map((outputDir) => fs.mkdir(outputDir, { recursive: true })))
  if (filteredRun) {
    await pruneStaleArtifacts(existingManifest, selectedEntries)
  } else {
    await resetOutputDirs(existingManifest)
  }

  const browser = await launchBrowser()
  const context = await browser.newContext({ ...device })
  const page = await context.newPage()
  const captures = []

  try {
    for (const entry of selectedEntries) {
      await captureEntry(page, entry, captures)
    }

    const mergedCaptures = filteredRun && existingManifest
      ? mergeCaptures(existingManifest.captures, captures)
      : captures

    const manifest = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        outputDir: outputDirs[0],
        captures: mergedCaptures,
      },
      null,
      2,
    )
    await Promise.all(
      outputDirs.map(async (outputDir) => {
        const manifestPath = path.join(outputDir, 'manifest.json')
        await fs.writeFile(manifestPath, manifest)
        console.log(`manifest.json <- ${manifestPath}`)
      }),
    )
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
