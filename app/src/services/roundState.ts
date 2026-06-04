import { ROUND_COOLDOWN_DAYS, addDays, formatNextRoundDate } from '../config/rounds'
import type { Broker } from './brokerStore'
import type { SentLogEntry } from './sentLog'

// ---------------------------------------------------------------------------
// Dashboard state identifiers
// ---------------------------------------------------------------------------

export type DashboardStateId =
  | 'free_remaining_locked'   // completed free round, paid brokers exist, no active subscription
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
    const paidBrokerCount = eligibleBrokerIds.length
    if (paidBrokerCount > 0 || hasAnySent) {
      return {
        stateId: 'free_remaining_locked',
        hero: 'Next up',
        metricValue: paidBrokerCount,
        metricLabel: paidBrokerCount === 1 ? 'broker available' : 'brokers available',
        bodyText: 'Subscribe to send opt-outs to the full audited list.',
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

  // Active subscription — check Gmail
  if (!input.gmailConnected) {
    return {
      stateId: 'gmail_disconnected',
      hero: 'Reconnect Gmail',
      metricValue: sentCount,
      metricLabel: sentCount === 1 ? 'opt-out email sent' : 'opt-out emails sent',
      bodyText: 'Reconnect Gmail before you send your next round.',
      primaryActionKind: 'reconnect_gmail',
      secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
      nextRoundOpensLabel: null,
      eligibleBrokerIds,
    }
  }

  // Active subscription, Gmail connected — do we have eligible brokers?
  if (eligibleBrokerIds.length > 0) {
    return {
      stateId: 'next_round_ready',
      hero: hasAnySent ? 'Your next round is ready' : 'Next up',
      metricValue: eligibleBrokerIds.length,
      metricLabel: eligibleBrokerIds.length === 1 ? 'broker available' : 'brokers available',
      bodyText: hasAnySent
        ? 'Brokers can re-add people over time. Send a fresh round of opt-outs to the current audited list.'
        : null,
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
    metricLabel: sentCount === 1 ? 'opt-out email sent' : 'opt-out emails sent',
    bodyText: null,
    primaryActionKind: 'none',
    secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
    nextRoundOpensLabel,
    eligibleBrokerIds: [],
  }
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

  switch (stateId) {
    case 'free_remaining_locked':
      return {
        stateId,
        hero: 'Next up',
        metricValue: input.brokers.length,
        metricLabel: 'brokers available',
        bodyText: 'Subscribe to send opt-outs to the full audited list.',
        primaryActionKind: 'subscribe',
        secondaryActionKind: hasAnySent ? 'view_sent' : 'none',
        nextRoundOpensLabel: null,
        eligibleBrokerIds: input.brokers.map((b) => b.id),
      }

    case 'all_caught_up': {
      const nextDate = addDays(now, ROUND_COOLDOWN_DAYS)
      return {
        stateId,
        hero: "You're all set!",
        metricValue: sentCount || 12,
        metricLabel: 'opt-out emails sent',
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
        metricValue: input.brokers.length,
        metricLabel: 'brokers available',
        bodyText: 'Brokers can re-add people over time. Send a fresh round of opt-outs to the current audited list.',
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
        metricLabel: 'opt-out emails sent',
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
