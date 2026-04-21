import type { Broker, BrokerCatalogSummary } from './brokerStore'
import type { FlowStepId } from './flowProgress'
import { buildOnboardingHref } from './navigation'
import type { QueueItem } from './queueStore'

type HomeRedirectTarget = string

type HomeReadyState = {
  mode: 'subscribed' | 'unsubscribed'
  remainingCount: number
  canReviewSent: boolean
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
  onboardingSentCount: number
  totalSentCount: number
  sentReviewItemCount: number
  subscriptionActive: boolean
  brokerSummary: BrokerCatalogSummary
}

type DeriveEntryTargetInput = Pick<
  DeriveHomeStateInput,
  'gmailConnected' | 'hasProfile' | 'onboardingSentCount' | 'totalSentCount' | 'sentReviewItemCount'
>

function buildFlowStepHref(step: FlowStepId): HomeRedirectTarget {
  return buildOnboardingHref(step)
}

function hasAnyCompletedSend(input: Pick<DeriveEntryTargetInput, 'onboardingSentCount' | 'totalSentCount' | 'sentReviewItemCount'>) {
  return input.onboardingSentCount > 0 || input.totalSentCount > 0 || input.sentReviewItemCount > 0
}

function buildPostSendResumeTarget(lastFlowStep?: FlowStepId | null) {
  if (lastFlowStep === 'beat-subscribe') {
    return buildFlowStepHref('beat-subscribe')
  }
  return buildFlowStepHref('beat-sent')
}

export function deriveEntryTarget(
  input: DeriveEntryTargetInput,
  lastFlowStep?: FlowStepId | null,
  flowStarted = false,
): HomeRedirectTarget | null {
  if (flowStarted && input.onboardingSentCount > 0) {
    return buildPostSendResumeTarget(lastFlowStep)
  }

  if (hasAnyCompletedSend(input)) {
    return null
  }

  if (!flowStarted) {
    return buildFlowStepHref('intro')
  }

  if (lastFlowStep === 'intro' || lastFlowStep === null || typeof lastFlowStep === 'undefined') {
    return buildFlowStepHref('starter-set')
  }

  if (lastFlowStep === 'starter-set') {
    return buildFlowStepHref('request-review')
  }

  if (!input.hasProfile) {
    return buildFlowStepHref('request-review')
  }

  if (!input.gmailConnected) {
    return buildFlowStepHref('gmail-send')
  }

  return buildFlowStepHref('final-review')
}

export function deriveOnboardingRedirect(
  input: DeriveEntryTargetInput,
  requestedStep: FlowStepId,
  flowStarted = false,
) {
  if (flowStarted && input.onboardingSentCount > 0) {
    if (requestedStep === 'beat-sent' || requestedStep === 'beat-subscribe') {
      return null
    }
    return buildFlowStepHref('beat-sent')
  }

  if ((requestedStep === 'beat-sent' || requestedStep === 'beat-subscribe') && input.onboardingSentCount === 0) {
    if (hasAnyCompletedSend(input)) {
      return '/home'
    }
    return buildFlowStepHref(flowStarted ? 'starter-set' : 'intro')
  }

  if (requestedStep === 'intro') {
    return null
  }

  if (requestedStep === 'starter-set') {
    return flowStarted ? null : buildFlowStepHref('intro')
  }

  if (!flowStarted) {
    return buildFlowStepHref('intro')
  }

  if (requestedStep === 'request-review') {
    return null
  }

  if (!input.hasProfile) {
    return buildFlowStepHref('request-review')
  }

  if (requestedStep === 'gmail-send') {
    return null
  }

  if (!input.gmailConnected) {
    return buildFlowStepHref('gmail-send')
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
  const redirectTarget = deriveEntryTarget(
    {
      gmailConnected: input.gmailConnected,
      hasProfile: input.hasProfile,
      onboardingSentCount: input.onboardingSentCount,
      totalSentCount: input.totalSentCount,
      sentReviewItemCount: input.sentReviewItemCount,
    },
    lastFlowStep,
    flowStarted,
  )
  if (redirectTarget) {
    return {
      kind: 'redirect',
      target: redirectTarget,
    }
  }

  return {
    kind: 'ready',
    state: {
      mode: input.subscriptionActive ? 'subscribed' : 'unsubscribed',
      remainingCount: input.brokerSummary.remainingBrokerCount,
      canReviewSent: input.sentReviewItemCount > 0,
    },
  }
}
