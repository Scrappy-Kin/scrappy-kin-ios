import { ROUND_COOLDOWN_DAYS, addDays, formatNextRoundDate } from '../config/rounds'
import { DEFAULT_ROUND_SIZE, type Broker } from './brokerStore'
import type { SentLogEntry } from './sentLog'

// ---------------------------------------------------------------------------
// Dashboard state identifiers
// ---------------------------------------------------------------------------

export type DashboardStateId =
  | 'free_remaining_locked'   // completed free round, paid brokers exist, no active subscription
  | 'active_no_local_history'  // active access after local data was deleted or app was reinstalled
  | 'all_caught_up'           // active access, nothing eligible to send right now
  | 'next_round_ready'        // active access, eligible brokers are available
  | 'gmail_disconnected'      // active access, but Gmail is not connected
  | 'entitlement_expired'     // no active entitlement, no remaining free brokers

// ---------------------------------------------------------------------------
// Eligibility helpers
// ---------------------------------------------------------------------------

export type BrokerEligibility = {
  brokerId: string
  eligible: boolean
  lastSentAt: string | null
  nextEligibleAt: string | null
}

export function computeBrokerEligibility(
  brokers: Broker[],
  sentLog: SentLogEntry[],
  now: Date = new Date(),
): BrokerEligibility[] {
  const lastSentByBrokerId = new Map<string, string>()
  for (const entry of sentLog) {
    const existing = lastSentByBrokerId.get(entry.brokerId)
    if (!existing || entry.sentAt > existing) {
      lastSentByBrokerId.set(entry.brokerId, entry.sentAt)
    }
  }

  return brokers.map((broker) => {
    const lastSentAt = lastSentByBrokerId.get(broker.id) ?? null
    if (!lastSentAt) {
      return { brokerId: broker.id, eligible: true, lastSentAt: null, nextEligibleAt: null }
    }
    const nextEligibleDate = addDays(new Date(lastSentAt), ROUND_COOLDOWN_DAYS)
    const eligible = now >= nextEligibleDate
    return {
      brokerId: broker.id,
      eligible,
      lastSentAt,
      nextEligibleAt: nextEligibleDate.toISOString(),
    }
  })
}

export function getEligibleBrokerIds(eligibility: BrokerEligibility[]): string[] {
  return eligibility.filter((e) => e.eligible).map((e) => e.brokerId)
}

// ---------------------------------------------------------------------------
// Round state derivation
// ---------------------------------------------------------------------------

export type RoundStateInput = {
  brokers: Broker[]
  sentLog: SentLogEntry[]
  subscriptionActive: boolean
  gmailConnected: boolean
  totalSentCount: number
  selectedRoundSize?: number
  now?: Date
  qaOverride?: DashboardStateId | null
}

export type DashboardCopy = {
  stateId: DashboardStateId
  hero: string
  metricValue: string | number
  metricLabel: string
  bodyText: string | null
  primaryActionKind: 'start_round' | 'subscribe' | 'reconnect_gmail' | 'none'
  secondaryActionKind: 'view_sent' | 'none'
  nextRoundOpensLabel: string | null
  eligibleBrokerIds: string[]
}

export function deriveRoundState(input: RoundStateInput): DashboardCopy {
  const now = input.now ?? new Date()
  const brokerIds = new Set(input.brokers.map((broker) => broker.id))
  const catalogSentCount = input.sentLog.filter((entry) => brokerIds.has(entry.brokerId)).length

  // QA override: feed a canned state without changing action wiring
  if (input.qaOverride) {
    return buildQaOverrideState(input.qaOverride, input, now)
  }

  const eligibility = computeBrokerEligibility(input.brokers, input.sentLog, now)
  const eligibleBrokerIds = getEligibleBrokerIds(eligibility)
  const hasAnySent = input.totalSentCount > 0 || input.sentLog.length > 0
  const sentCount =
    input.sentLog.length > 0
      ? catalogSentCount
      : Math.min(input.totalSentCount, input.brokers.length)

  // No active entitlement and no remaining access
  if (!input.subscriptionActive) {
    const availableBrokerCount = eligibleBrokerIds.length
    if (availableBrokerCount > 0 || hasAnySent) {
      const showSentMetric = hasAnySent
      return {
        stateId: 'free_remaining_locked',
        hero: 'Next up',
        metricValue: showSentMetric ? sentCount : availableBrokerCount,
        metricLabel: showSentMetric
          ? formatSentMetricLabel(sentCount)
          : formatBrokerMetricLabel(availableBrokerCount),
        bodyText: showSentMetric
          ? `${formatBrokerAvailability(availableBrokerCount)} after your first round. Subscribe to send opt-outs to the full audited list.`
          : 'Subscribe to send opt-outs to the full audited list.',
        primaryActionKind: 'subscribe',
        secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds,
      }
    }
    return {
      stateId: 'entitlement_expired',
      hero: 'Next up',
      metricValue: 0,
      metricLabel: 'brokers available',
      bodyText: 'Subscribe to send opt-outs to the full audited list.',
      primaryActionKind: 'subscribe',
      secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
      nextRoundOpensLabel: null,
      eligibleBrokerIds: [],
    }
  }

  if (!hasAnySent) {
    return {
      stateId: 'active_no_local_history',
      hero: 'Your subscription is active',
      metricValue: 0,
      metricLabel: formatSentMetricLabel(0),
      bodyText:
        'This is a fresh install, so Scrappy Kin does not have your previous app history. Set up your email details and Gmail when you’re ready to send a round.',
      primaryActionKind: 'start_round',
      secondaryActionKind: 'none',
      nextRoundOpensLabel: null,
      eligibleBrokerIds,
    }
  }

  // Active subscription — check Gmail
  if (!input.gmailConnected) {
    return {
      stateId: 'gmail_disconnected',
      hero: 'Reconnect Gmail',
      metricValue: sentCount,
      metricLabel: formatSentMetricLabel(sentCount),
      bodyText: 'Reconnect Gmail before you send your next round.',
      primaryActionKind: 'reconnect_gmail',
      secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
      nextRoundOpensLabel: null,
      eligibleBrokerIds,
    }
  }

  // Active subscription, Gmail connected — do we have eligible brokers?
  if (eligibleBrokerIds.length > 0) {
    const hasEligibleUnsentBrokers = eligibility.some(
      (entry) => entry.eligible && entry.lastSentAt === null,
    )
    return {
      stateId: 'next_round_ready',
      hero: hasAnySent ? 'Your next round is ready' : 'Next up',
      metricValue: hasAnySent ? sentCount : eligibleBrokerIds.length,
      metricLabel: hasAnySent
        ? formatSentMetricLabel(sentCount)
        : formatBrokerMetricLabel(eligibleBrokerIds.length),
      bodyText: buildNextRoundBodyText(
        hasAnySent,
        hasEligibleUnsentBrokers,
        eligibleBrokerIds.length,
        input.selectedRoundSize,
      ),
      primaryActionKind: 'start_round',
      secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
      nextRoundOpensLabel: null,
      eligibleBrokerIds,
    }
  }

  // All caught up — compute next round date from earliest eligible-again broker
  const nextRoundDate = computeNextRoundDate(eligibility, now)
  const nextRoundOpensLabel = nextRoundDate
    ? `Your next round opens on ${formatNextRoundDate(nextRoundDate)}.`
    : null

  return {
    stateId: 'all_caught_up',
    hero: "You're all set!",
    metricValue: sentCount,
    metricLabel: formatSentMetricLabel(sentCount),
    bodyText: null,
    primaryActionKind: 'none',
    secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
    nextRoundOpensLabel,
    eligibleBrokerIds: [],
  }
}

function formatBrokerMetricLabel(count: number): string {
  return count === 1 ? 'broker available' : 'brokers available'
}

function formatBrokerAvailability(count: number): string {
  return `${count} ${count === 1 ? 'broker is' : 'brokers are'} available`
}

function getRemainingRoundCount(count: number, selectedRoundSize?: number): number {
  const roundSize = Math.max(1, selectedRoundSize ?? DEFAULT_ROUND_SIZE)
  return Math.max(1, Math.ceil(count / roundSize))
}

function formatBrokerRemainingAcrossRounds(count: number, selectedRoundSize?: number): string {
  const brokerPhrase = `${count} ${count === 1 ? 'broker remains' : 'brokers remain'}`
  const roundCount = getRemainingRoundCount(count, selectedRoundSize)
  const roundPhrase = `${roundCount} ${roundCount === 1 ? 'round' : 'rounds'}`
  return `${brokerPhrase} across ${roundPhrase} at your current round size`
}

function buildNextRoundBodyText(
  hasAnySent: boolean,
  hasEligibleUnsentBrokers: boolean,
  eligibleBrokerCount: number,
  selectedRoundSize?: number,
) {
  if (!hasAnySent) {
    return null
  }

  if (hasEligibleUnsentBrokers) {
    return `${formatBrokerRemainingAcrossRounds(eligibleBrokerCount, selectedRoundSize)}.`
  }

  return 'Brokers can re-add people over time. Send a fresh round of opt-outs to the current audited list.'
}

function formatSentMetricLabel(count: number): string {
  return count === 1 ? 'opt-out email sent' : 'opt-out emails sent'
}

function computeNextRoundDate(
  eligibility: BrokerEligibility[],
  now: Date,
): Date | null {
  let earliest: Date | null = null
  for (const e of eligibility) {
    if (!e.nextEligibleAt) continue
    const d = new Date(e.nextEligibleAt)
    if (d <= now) continue
    if (!earliest || d < earliest) {
      earliest = d
    }
  }
  return earliest
}

// ---------------------------------------------------------------------------
// QA override builder — feeds the derivation layer's output shape with canned
// data so the same Home rendering path handles all states.
// ---------------------------------------------------------------------------

function buildQaOverrideState(
  stateId: DashboardStateId,
  input: RoundStateInput,
  now: Date,
): DashboardCopy {
  const sentCount = Math.max(input.totalSentCount, input.sentLog.length)
  const hasAnySent = sentCount > 0
  const availableAfterFreeRound = Math.max(0, input.brokers.length - Math.min(sentCount, input.brokers.length))

  switch (stateId) {
    case 'free_remaining_locked':
      return {
        stateId,
        hero: 'Next up',
        metricValue: sentCount,
        metricLabel: formatSentMetricLabel(sentCount),
        bodyText: `${formatBrokerAvailability(availableAfterFreeRound)} after your first round. Subscribe to send opt-outs to the full audited list.`,
        primaryActionKind: 'subscribe',
        secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: input.brokers.map((b) => b.id),
      }

    case 'active_no_local_history':
      return {
        stateId,
        hero: 'Your subscription is active',
        metricValue: 0,
        metricLabel: formatSentMetricLabel(0),
        bodyText:
          'This is a fresh install, so Scrappy Kin does not have your previous app history. Set up your email details and Gmail when you’re ready to send a round.',
        primaryActionKind: 'start_round',
        secondaryActionKind: 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: input.brokers.map((b) => b.id),
      }

    case 'all_caught_up': {
      const nextDate = addDays(now, ROUND_COOLDOWN_DAYS)
      return {
        stateId,
        hero: "You're all set!",
        metricValue: sentCount || 12,
        metricLabel: formatSentMetricLabel(sentCount || 12),
        bodyText: null,
        primaryActionKind: 'none',
        secondaryActionKind: 'view_sent',
        nextRoundOpensLabel: `Your next round opens on ${formatNextRoundDate(nextDate)}.`,
        eligibleBrokerIds: [],
      }
    }

    case 'next_round_ready':
      return {
        stateId,
        hero: 'Your next round is ready',
        metricValue: sentCount,
        metricLabel: formatSentMetricLabel(sentCount),
        bodyText: `${formatBrokerRemainingAcrossRounds(input.brokers.length, input.selectedRoundSize)}.`,
        primaryActionKind: 'start_round',
        secondaryActionKind: 'view_sent',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: input.brokers.map((b) => b.id),
      }

    case 'gmail_disconnected':
      return {
        stateId,
        hero: 'Reconnect Gmail',
        metricValue: sentCount,
        metricLabel: formatSentMetricLabel(sentCount),
        bodyText: 'Reconnect Gmail before you send your next round.',
        primaryActionKind: 'reconnect_gmail',
        secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: [],
      }

    case 'entitlement_expired':
      return {
        stateId,
        hero: 'Next up',
        metricValue: input.brokers.length,
        metricLabel: 'brokers available',
        bodyText: 'Subscribe to send opt-outs to the full audited list.',
        primaryActionKind: 'subscribe',
        secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: [],
      }
  }
}
