import { IS_DEV_BUILD } from '../config/buildInfo'
import {
  loadBrokers,
  loadStarterBrokerIds,
  setSelectedBrokerIds,
} from '../services/brokerStore'
import {
  clearFlowProgress,
  setOnboardingSentCount,
  setSavedFlowStep,
} from '../services/flowProgress'
import { setTotalSentCount } from '../services/metricsStore'
import { setEncrypted, wipeAllLocalData } from '../services/secureStore'
import { setQueue, type QueueItem } from '../services/queueStore'
import {
  clearDevSubscriptionState,
  setDevSubscriptionEntitled,
} from '../services/subscription'
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

function buildConnectedToken(): GmailTokenPayload {
  return {
    accessToken: 'FIXTURE_CAPTURE_ONLY__NOT_A_REAL_TOKEN',
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

function buildQueue(status: QueueItem['status'], brokerIds: string[]): QueueItem[] {
  return brokerIds.map((brokerId, index) => ({
    brokerId,
    status,
    referenceId: `REF-${index + 1}`,
    gmailMessageId: status === 'sent' ? `gmail-msg-${index + 1}` : undefined,
    gmailThreadId: status === 'sent' ? `gmail-thread-${index + 1}` : undefined,
  }))
}

function buildRetryPreviewQueue(): QueueItem[] {
  return [
    {
      brokerId: 'spokeo-com',
      status: 'failed',
      referenceId: 'ABC123',
    },
    {
      brokerId: 'whitepages-com',
      status: 'failed',
      referenceId: 'DEF456',
    },
    {
      brokerId: 'beenverified-com',
      status: 'sent',
      referenceId: 'GHI789',
      gmailMessageId: 'gmail-msg-3',
      gmailThreadId: 'gmail-thread-3',
    },
  ]
}

async function seedProfileAndSelection() {
  await setUserProfile(seededProfile)
  const starterIds = await loadStarterBrokerIds()
  await setSelectedBrokerIds(starterIds)
}

async function seedConnectedState() {
  await seedProfileAndSelection()
  await setEncrypted(CAPTURE_GMAIL_TOKEN_KEY, buildConnectedToken())
}

async function seedPostSendState(step: 'beat-sent' | 'beat-subscribe' | null) {
  await seedConnectedState()

  const [starterIds, brokers] = await Promise.all([loadStarterBrokerIds(), loadBrokers()])
  const remainingBrokerIds = brokers
    .map((broker) => broker.id)
    .filter((brokerId) => !starterIds.includes(brokerId))

  await setQueue(buildQueue('sent', starterIds))
  await setTotalSentCount(starterIds.length)
  await setSelectedBrokerIds(remainingBrokerIds)

  if (step) {
    await setOnboardingSentCount(starterIds.length)
    await setSavedFlowStep(step)
  } else {
    await clearFlowProgress()
  }
}

const captureScenarios: Record<string, CaptureScenarioDefinition> = {
  home: { route: '/home' },
  brokers: { route: '/brokers' },
  'brokers-retry-state': {
    route: '/brokers?returnTo=%2Fhome',
    seed: async () => {
      await setUserProfile(seededProfile)
      await setSelectedBrokerIds(['spokeo-com'])
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
  'settings-subscription': {
    route: '/settings?view=subscription',
    seed: async () => {
      await seedPostSendState(null)
      await setDevSubscriptionEntitled(false)
    },
  },
  'flow-intro': { route: '/onboarding/intro' },
  'flow-starter-set': {
    route: '/onboarding/starter-set',
    seed: async () => {
      await setSavedFlowStep('starter-set')
    },
  },
  'flow-request-review': {
    route: '/onboarding/request-review',
    seed: async () => {
      await seedProfileAndSelection()
      await setSavedFlowStep('request-review')
    },
  },
  'flow-gmail-send': {
    route: '/onboarding/gmail-send',
    seed: async () => {
      await seedProfileAndSelection()
      await setSavedFlowStep('gmail-send')
    },
  },
  'flow-final-review': {
    route: '/onboarding/final-review',
    seed: async () => {
      await seedConnectedState()
      await setSavedFlowStep('final-review')
    },
  },
  'flow-beat-sent': {
    route: '/onboarding/beat-sent',
    seed: async () => {
      await seedPostSendState('beat-sent')
      await setDevSubscriptionEntitled(false)
    },
  },
  'flow-beat-subscribe': {
    route: '/onboarding/beat-subscribe',
    seed: async () => {
      await seedPostSendState('beat-subscribe')
      await setDevSubscriptionEntitled(false)
    },
  },
  'home-unsubscribed': {
    route: '/home',
    seed: async () => {
      await seedPostSendState(null)
      await setDevSubscriptionEntitled(false)
    },
  },
  'home-subscribed': {
    route: '/home',
    seed: async () => {
      await seedPostSendState(null)
      await setDevSubscriptionEntitled(true)
    },
  },
  'review-batch': {
    route: '/review-batch?returnTo=%2Fhome',
    seed: async () => {
      await seedPostSendState(null)
      await setDevSubscriptionEntitled(true)
    },
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
  await clearDevSubscriptionState()
  if (scenario.seed) {
    await scenario.seed()
  }
  return scenario.route
}
