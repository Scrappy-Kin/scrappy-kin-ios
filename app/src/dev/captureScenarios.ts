import { IS_DEV_BUILD, isQaDeviceLane } from '../config/buildInfo'
import { APP_REVIEW_PROFILE_EMAIL } from '../config/appReviewTestRecipients'
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

const appReviewProfile: UserProfile = {
  ...seededProfile,
  email: APP_REVIEW_PROFILE_EMAIL,
}

function buildConnectedToken(): GmailTokenPayload {
  return {
    accessToken: 'FIXTURE_CAPTURE_ONLY__NOT_A_REAL_TOKEN',
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

function buildQueue(status: QueueItem['status'], brokerIds: string[]): QueueItem[] {
  const lastAttemptAt = new Date().toISOString()

  return brokerIds.map((brokerId, index) => ({
    brokerId,
    status,
    referenceId: `REF-${index + 1}`,
    lastAttemptAt: status === 'sent' ? lastAttemptAt : undefined,
    gmailMessageId: status === 'sent' ? `gmail-msg-${index + 1}` : undefined,
    gmailThreadId: status === 'sent' ? `gmail-thread-${index + 1}` : undefined,
  }))
}

async function seedProfileAndSelection(profile = seededProfile) {
  await setUserProfile(profile)
  const starterIds = await loadStarterBrokerIds()
  await setSelectedBrokerIds(starterIds)
}

async function seedConnectedState(profile = seededProfile) {
  await seedProfileAndSelection(profile)
  await setEncrypted(CAPTURE_GMAIL_TOKEN_KEY, buildConnectedToken())
}

async function seedPostSendState(step: 'beat-sent' | 'beat-subscribe' | null) {
  await seedConnectedState()

  const starterIds = await loadStarterBrokerIds()

  await setQueue(buildQueue('sent', starterIds))
  await setTotalSentCount(starterIds.length)
  await setSelectedBrokerIds([])

  if (step) {
    await setOnboardingSentCount(starterIds.length)
    await setSavedFlowStep(step)
  } else {
    await clearFlowProgress()
  }
}

async function seedAllBrokersSentState() {
  await seedConnectedState()

  const brokerIds = (await loadBrokers()).map((broker) => broker.id)

  await setQueue(buildQueue('sent', brokerIds))
  await setTotalSentCount(brokerIds.length)
  await setSelectedBrokerIds([])
  await clearFlowProgress()
}

async function seedPostSendWithoutGmail() {
  await seedProfileAndSelection()

  const starterIds = await loadStarterBrokerIds()

  await setQueue(buildQueue('sent', starterIds))
  await setTotalSentCount(starterIds.length)
  await setSelectedBrokerIds([])
  await clearFlowProgress()
}

const captureScenarios: Record<string, CaptureScenarioDefinition> = {
  home: { route: '/home' },
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
  'settings-profile': {
    route: '/settings?view=profile',
    seed: async () => {
      await setUserProfile(seededProfile)
    },
  },
  'settings-privacy': {
    route: '/settings?view=privacy',
    seed: async () => {
      await setUserProfile(seededProfile)
    },
  },
  'settings-diagnostics': {
    route: '/settings?view=diagnostics',
    seed: async () => {
      await setUserProfile(seededProfile)
    },
  },
  'settings-support': {
    route: '/settings?view=support',
    seed: async () => {
      await setUserProfile(seededProfile)
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
      const starterIds = await loadStarterBrokerIds()
      await setSelectedBrokerIds(starterIds)
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
      await seedConnectedState(appReviewProfile)
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
  'home-active-no-local-history': {
    route: '/home',
    seed: async () => {
      await setDevSubscriptionEntitled(true)
    },
  },
  'home-all-caught-up': {
    route: '/home',
    seed: async () => {
      await seedAllBrokersSentState()
      await setDevSubscriptionEntitled(true)
    },
  },
  'home-gmail-disconnected': {
    route: '/home',
    seed: async () => {
      await seedPostSendWithoutGmail()
      await setDevSubscriptionEntitled(true)
    },
  },
  'home-entitlement-expired': {
    route: '/home',
    seed: async () => {
      await seedAllBrokersSentState()
      await setDevSubscriptionEntitled(false)
    },
  },
  'review-batch': {
    route: '/review-batch?returnTo=%2Fhome',
    seed: async () => {
      await seedPostSendState(null)
      await setUserProfile(appReviewProfile)
      await setDevSubscriptionEntitled(true)
    },
  },
  'batch-size': {
    route: '/batch-size?returnTo=%2Freview-batch',
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
  if (!IS_DEV_BUILD && !isQaDeviceLane()) {
    throw new Error('Capture scenarios are available in dev and QADevice builds only.')
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
