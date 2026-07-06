import {
  DEFAULT_ROUND_SIZE,
  getSelectedBrokerIds,
  getSelectedRoundSize,
  loadBrokers,
  loadStarterBrokerIds,
  setSelectedBrokerIds,
  setSelectedRoundSize,
} from './brokerStore'
import { getExecutionLane } from '../config/buildInfo'
import { setOnboardingSentCount } from './flowProgress'
import { computeBrokerEligibility, getEligibleBrokerIds } from './roundState'
import { getSendFailureMessage, sendAll } from './sendQueue'
import { deriveSendSafetyMode, QA_DEVICE_BLOCKED_SEND_MESSAGE } from './sendSafety'
import { getMergedSentLog } from './sentLog'
import { clearUserProfileDraft, setUserProfile, type UserProfile } from './userProfile'
import { logEvent } from './logStore'

type BatchSendResult = {
  sentCount: number
  failureMessage: string | null
}

export async function executeBatchSend(
  profile: UserProfile,
  targetBrokerIds?: string[],
): Promise<BatchSendResult> {
  await setUserProfile(profile)
  await clearUserProfileDraft()

  const sendSafetyMode = deriveSendSafetyMode({
    executionLane: getExecutionLane(),
    profileEmail: profile.email,
  })
  if (sendSafetyMode === 'qa_blocked') {
    await logEvent('send_batch_failed', {
      metadata: {
        count: String(targetBrokerIds?.length ?? 0),
        sendSafetyMode,
        failureCategory: 'qa_blocked',
      },
    })
    return {
      sentCount: 0,
      failureMessage: QA_DEVICE_BLOCKED_SEND_MESSAGE,
    }
  }

  const brokers = await loadBrokers()
  const selectedIds = await getSelectedBrokerIds()
  const targetIds =
    targetBrokerIds && targetBrokerIds.length > 0 ? targetBrokerIds : selectedIds

  if (targetIds.length === 0) {
    await logEvent('send_batch_failed', {
      metadata: {
        count: '0',
        sendSafetyMode,
        failureCategory: 'no_selection',
      },
    })
    return {
      sentCount: 0,
      failureMessage: 'No brokers selected. Please select at least one broker before sending.',
    }
  }

  await logEvent('send_batch_started', {
    metadata: {
      count: String(targetIds.length),
      sendSafetyMode,
    },
  })

  let summary: Awaited<ReturnType<typeof sendAll>>
  try {
    summary = await sendAll(brokers, targetIds)
  } catch (error) {
    await logEvent('send_batch_failed', {
      metadata: {
        count: String(targetIds.length),
        sendSafetyMode,
        failureCategory: 'exception',
      },
    })
    throw error
  }

  const selectedRoundSize = await getSelectedRoundSize()
  const sentLog = await getMergedSentLog(brokers)
  const eligibleIds = new Set(getEligibleBrokerIds(computeBrokerEligibility(brokers, sentLog)))
  const remainingSelectedIds = brokers
    .filter((broker) => eligibleIds.has(broker.id))
    .slice(0, selectedRoundSize)
    .map((broker) => broker.id)
  await setSelectedBrokerIds(remainingSelectedIds)

  if (summary.sent === 0) {
    await logEvent('send_batch_failed', {
      metadata: {
        count: String(targetIds.length),
        sendSafetyMode,
        failureCategory: 'send_failed',
      },
    })
    return {
      sentCount: 0,
      failureMessage: await getSendFailureMessage(),
    }
  }

  await logEvent('send_batch_success', {
    metadata: {
      count: String(summary.sent),
      sendSafetyMode,
    },
  })
  return {
    sentCount: summary.sent,
    failureMessage: null,
  }
}

export async function completeOnboardingSend(profile: UserProfile) {
  const starterBrokerIds = await loadStarterBrokerIds()
  const result = await executeBatchSend(profile, starterBrokerIds)
  if (result.sentCount > 0) {
    const brokers = await loadBrokers()
    const sentLog = await getMergedSentLog(brokers)
    const eligibleIds = new Set(getEligibleBrokerIds(computeBrokerEligibility(brokers, sentLog)))
    const remainingCatalogIds = brokers
      .filter((broker) => eligibleIds.has(broker.id))
      .slice(0, DEFAULT_ROUND_SIZE)
      .map((broker) => broker.id)

    await Promise.all([
      setSelectedBrokerIds(remainingCatalogIds),
      setSelectedRoundSize(DEFAULT_ROUND_SIZE),
      setOnboardingSentCount(result.sentCount),
    ])
  }
  return result
}
