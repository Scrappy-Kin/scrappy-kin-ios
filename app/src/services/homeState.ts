import type { Broker } from './brokerStore'
import { FLOW_STEP_IDS, type FlowStepId } from './flowProgress'
import { buildOnboardingHref } from './navigation'
import type { QueueItem } from './queueStore'

type HomeRedirectTarget = string

type HomeReadyState = {
  mode: 'next-up' | 'all-done'
  remainingCount: number
  canReviewSent: boolean
  remainingLabel: 'left-in-round' | 'available-next-round'
}

export type DerivedHomeState =
  | {
      kind: 'redirect'
      target: HomeRedirectTarget
    }
  | {
      kind: 'ready'
      state: HomeReadyState
    }

type DeriveHomeStateInput = {
  gmailConnected: boolean
  hasProfile: boolean
  selectedBrokerIds: string[]
  brokers: Broker[]
  queueSummary: {
    sent: number
    failed: number
    pending: number
    total: number
  }
  totalSentCount: number
  sentReviewItemCount: number
}

function buildFlowStepHref(step: FlowStepId): HomeRedirectTarget {
  return buildOnboardingHref(step)
}

function hasAnySetupProgress(input: DeriveHomeStateInput) {
  return (
    input.hasProfile ||
    input.gmailConnected ||
    input.queueSummary.total > 0 ||
    input.selectedBrokerIds.length > 0
  )
}

function getEarliestFlowStep(input: DeriveHomeStateInput, flowStarted = false): FlowStepId {
  if (!input.selectedBrokerIds.length) {
    return !flowStarted && !hasAnySetupProgress(input) ? 'intro' : 'brokers'
  }

  if (!input.hasProfile) {
    return 'request-review'
  }

  if (!input.gmailConnected) {
    return 'gmail-send'
  }

  return 'final-review'
}

function getEarliestIncompleteStep(input: DeriveHomeStateInput): FlowStepId | null {
  const {
    gmailConnected,
    hasProfile,
    selectedBrokerIds,
    queueSummary,
    totalSentCount,
  } = input

  const hasCompletedSend = queueSummary.sent > 0 || totalSentCount > 0
  if (hasCompletedSend) {
    return null
  }

  if (!selectedBrokerIds.length) {
    return hasAnySetupProgress(input) ? 'brokers' : 'intro'
  }

  if (!hasProfile) {
    return 'request-review'
  }

  if (!gmailConnected) {
    return 'gmail-send'
  }

  return 'final-review'
}

export function deriveFallbackTarget(input: DeriveHomeStateInput): HomeRedirectTarget {
  const earliestIncomplete = getEarliestIncompleteStep(input)
  if (!earliestIncomplete) {
    return '/home'
  }
  return buildFlowStepHref(earliestIncomplete)
}

export function deriveEntryTarget(
  input: DeriveHomeStateInput,
  lastFlowStep?: FlowStepId | null,
  flowStarted = false,
): HomeRedirectTarget | null {
  const earliestIncomplete = getEarliestIncompleteStep(input)
  if (!earliestIncomplete) {
    return null
  }

  if (!flowStarted) {
    return deriveFallbackTarget(input)
  }

  if (!lastFlowStep) {
    return buildFlowStepHref(earliestIncomplete)
  }

  const earliestIndex = FLOW_STEP_IDS.indexOf(earliestIncomplete)
  const savedIndex = FLOW_STEP_IDS.indexOf(lastFlowStep)
  const resumeStep = FLOW_STEP_IDS[Math.min(savedIndex, earliestIndex)]
  return buildFlowStepHref(resumeStep)
}

export function deriveOnboardingRedirect(
  input: DeriveHomeStateInput,
  requestedStep: FlowStepId,
  flowStarted = false,
) {
  const earliestIncomplete = getEarliestFlowStep(input, flowStarted)

  if (requestedStep === 'intro') {
    return null
  }

  if (requestedStep === 'brokers') {
    if (!flowStarted && !hasAnySetupProgress(input)) {
      return buildFlowStepHref('intro')
    }
    return null
  }

  if (requestedStep === 'request-review') {
    if (earliestIncomplete === 'intro' || earliestIncomplete === 'brokers') {
      return buildFlowStepHref(earliestIncomplete)
    }
    return null
  }

  if (requestedStep === 'gmail-send') {
    if (
      earliestIncomplete === 'intro' ||
      earliestIncomplete === 'brokers' ||
      earliestIncomplete === 'request-review'
    ) {
      return buildFlowStepHref(earliestIncomplete)
    }
    return null
  }

  if (requestedStep === 'final-review' && earliestIncomplete !== 'final-review') {
    return buildFlowStepHref(earliestIncomplete)
  }

  return null
}

export function buildSentReviewItems(queue: QueueItem[], brokers: Broker[]) {
  const brokerMap = new Map(brokers.map((broker) => [broker.id, broker.name]))
  return queue
    .filter((item) => item.status === 'sent')
    .map((item) => ({
      brokerName: brokerMap.get(item.brokerId) ?? item.brokerId,
      referenceId: item.referenceId,
      status: item.status,
      lastAttemptAt: item.lastAttemptAt,
    }))
}

export function deriveHomeState(
  input: DeriveHomeStateInput,
  lastFlowStep?: FlowStepId | null,
  flowStarted = false,
): DerivedHomeState {
  const {
    selectedBrokerIds,
    brokers,
    queueSummary,
    totalSentCount,
    sentReviewItemCount,
  } = input

  const remainingCount = Math.max(0, brokers.length - selectedBrokerIds.length)
  const hasCompletedSend = queueSummary.sent > 0 || totalSentCount > 0

  if (!hasCompletedSend) {
    return {
      kind: 'redirect',
      target: deriveEntryTarget(input, lastFlowStep, flowStarted) ?? buildFlowStepHref('final-review'),
    }
  }

  if (queueSummary.failed > 0 || remainingCount > 0) {
    return {
      kind: 'ready',
      state: {
        mode: 'next-up',
        remainingCount,
        canReviewSent: sentReviewItemCount > 0,
        remainingLabel:
          selectedBrokerIds.length > 0 ? 'left-in-round' : 'available-next-round',
      },
    }
  }

  return {
    kind: 'ready',
    state: {
      mode: 'all-done',
      remainingCount,
      canReviewSent: sentReviewItemCount > 0,
      remainingLabel: 'left-in-round',
    },
  }
}
