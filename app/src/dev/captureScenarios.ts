import { IS_DEV_BUILD } from '../config/buildInfo'
import { setSelectedBrokerIds } from '../services/brokerStore'
import { setTotalSentCount } from '../services/metricsStore'
import { setEncrypted, wipeAllLocalData } from '../services/secureStore'
import { setQueue, type QueueItem } from '../services/queueStore'
import { setUserProfile, type UserProfile } from '../services/userProfile'

type CaptureScenarioDefinition = {
  route: string
  seed?: () => Promise<void>
}

type GmailTokenPayload = {
  accessToken: string
  expiresAt: number
}

const CAPTURE_GMAIL_TOKEN_KEY = 'gmail_tokens'
const seededProfile: UserProfile = {
  fullName: 'Your name',
  email: 'your@email.com',
  city: 'Your city',
  state: 'TX',
  partialZip: '7870',
}
const seededBrokerIds = ['broker-happy-path', 'broker-needs-retry']

function buildConnectedToken(): GmailTokenPayload {
  return {
    accessToken: 'capture-access-token',
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

function buildQueue(status: QueueItem['status']): QueueItem[] {
  return [
    {
      brokerId: 'broker-happy-path',
      status,
      referenceId: 'ABC123',
      gmailMessageId: status === 'sent' ? 'gmail-msg-1' : undefined,
      gmailThreadId: status === 'sent' ? 'gmail-thread-1' : undefined,
    },
    {
      brokerId: 'broker-needs-retry',
      status,
      referenceId: 'DEF456',
      gmailMessageId: status === 'sent' ? 'gmail-msg-2' : undefined,
      gmailThreadId: status === 'sent' ? 'gmail-thread-2' : undefined,
    },
  ]
}

function buildRetryPreviewQueue(): QueueItem[] {
  return [
    {
      brokerId: 'broker-happy-path',
      status: 'failed',
      referenceId: 'ABC123',
    },
    {
      brokerId: 'broker-needs-retry',
      status: 'failed',
      referenceId: 'DEF456',
    },
    {
      brokerId: 'broker-already-sent',
      status: 'sent',
      referenceId: 'GHI789',
      gmailMessageId: 'gmail-msg-3',
      gmailThreadId: 'gmail-thread-3',
    },
  ]
}

async function seedProfileAndBrokers() {
  await setUserProfile(seededProfile)
  await setSelectedBrokerIds(seededBrokerIds)
}

async function seedConnectedState() {
  await seedProfileAndBrokers()
  await setEncrypted(CAPTURE_GMAIL_TOKEN_KEY, buildConnectedToken())
}

const captureScenarios: Record<string, CaptureScenarioDefinition> = {
  home: { route: '/home' },
  brokers: { route: '/brokers' },
  'brokers-retry-state': {
    route: '/brokers?returnTo=%2Fhome',
    seed: async () => {
      await setUserProfile(seededProfile)
      await setSelectedBrokerIds(['broker-happy-path'])
      await setQueue(buildRetryPreviewQueue())
      await setTotalSentCount(1)
    },
  },
  settings: {
    route: '/settings',
    seed: async () => {
      await setUserProfile(seededProfile)
    },
  },
  'flow-intro': { route: '/onboarding/intro' },
  'flow-brokers': {
    route: '/onboarding/brokers',
    seed: async () => {
      await setSelectedBrokerIds([])
    },
  },
  'flow-request-review': {
    route: '/onboarding/request-review',
    seed: seedProfileAndBrokers,
  },
  'flow-gmail-send': {
    route: '/onboarding/gmail-send',
    seed: seedProfileAndBrokers,
  },
  'flow-final-review': {
    route: '/onboarding/final-review',
    seed: seedConnectedState,
  },
  'home-after-send': {
    route: '/home',
    seed: async () => {
      await seedConnectedState()
      await setQueue(buildQueue('sent'))
      await setTotalSentCount(seededBrokerIds.length)
    },
  },
  'review-batch': {
    route: '/review-batch?returnTo=%2Fhome',
    seed: seedConnectedState,
  },
}

export function listCaptureScenarios() {
  return Object.keys(captureScenarios)
}

export async function applyCaptureScenario(id: string) {
  if (!IS_DEV_BUILD) {
    throw new Error('Capture scenarios are available in dev builds only.')
  }

  const scenario = captureScenarios[id]
  if (!scenario) {
    throw new Error(`Unknown capture scenario: ${id}`)
  }

  await wipeAllLocalData()
  if (scenario.seed) {
    await scenario.seed()
  }
  return scenario.route
}
