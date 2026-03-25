import { IS_DEV_BUILD } from '../config/buildInfo'
import { setSelectedBrokerIds } from '../services/brokerStore'
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
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  city: 'Austin',
  state: 'TX',
  partialZip: '7870',
}
const seededBrokerIds = ['truepeoplesearch-com', 'data-axle-com']

function buildConnectedToken(): GmailTokenPayload {
  return {
    accessToken: 'capture-access-token',
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
}

function buildQueue(status: QueueItem['status']): QueueItem[] {
  return [
    {
      brokerId: 'truepeoplesearch-com',
      status,
      referenceId: 'ABC123',
      gmailMessageId: status === 'sent' ? 'gmail-msg-1' : undefined,
      gmailThreadId: status === 'sent' ? 'gmail-thread-1' : undefined,
    },
    {
      brokerId: 'data-axle-com',
      status,
      referenceId: 'DEF456',
      gmailMessageId: status === 'sent' ? 'gmail-msg-2' : undefined,
      gmailThreadId: status === 'sent' ? 'gmail-thread-2' : undefined,
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
  settings: {
    route: '/settings',
    seed: async () => {
      await setUserProfile(seededProfile)
    },
  },
  'flow-intro': { route: '/flow?step=intro' },
  'flow-brokers': {
    route: '/flow?step=brokers',
    seed: async () => {
      await setSelectedBrokerIds([])
    },
  },
  'flow-request-review': {
    route: '/flow?step=request-review',
    seed: seedProfileAndBrokers,
  },
  'flow-gmail-send': {
    route: '/flow?step=gmail-send',
    seed: seedProfileAndBrokers,
  },
  'flow-final-review': {
    route: '/flow?step=final-review',
    seed: seedConnectedState,
  },
  'home-ready-to-send': {
    route: '/home',
    seed: async () => {
      await seedConnectedState()
      await setQueue(buildQueue('pending'))
    },
  },
  'home-after-send': {
    route: '/home',
    seed: async () => {
      await seedConnectedState()
      await setQueue(buildQueue('sent'))
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
  if (scenario.seed) {
    await scenario.seed()
  }
  return scenario.route
}
