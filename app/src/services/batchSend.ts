import {
  DEFAULT_ROUND_SIZE,
  getSelectedBrokerIds,
  getSelectedRoundSize,
  loadBrokers,
  loadStarterBrokerIds,
  setSelectedBrokerIds,
  setSelectedRoundSize,
} from './brokerStore'
import { setOnboardingSentCount } from './flowProgress'
import { computeBrokerEligibility, getEligibleBrokerIds } from './roundState'
import { getSendFailureMessage, sendAll } from './sendQueue'
import { getMergedSentLog } from './sentLog'
import { clearUserProfileDraft, setUserProfile, type UserProfile } from './userProfile'

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

  const brokers = await loadBrokers()
  const selectedIds = await getSelectedBrokerIds()
  const targetIds =
    targetBrokerIds && targetBrokerIds.length > 0
      ? targetBrokerIds
      : selectedIds.length > 0
        ? selectedIds
        : brokers.map((broker) => broker.id)
  const summary = await sendAll(brokers, targetIds)

  const selectedRoundSize = await getSelectedRoundSize()
  const sentLog = await getMergedSentLog(brokers)
  const eligibleIds = new Set(getEligibleBrokerIds(computeBrokerEligibility(brokers, sentLog)))
  const remainingSelectedIds = brokers
    .filter((broker) => eligibleIds.has(broker.id))
    .slice(0, selectedRoundSize)
    .map((broker) => broker.id)
  await setSelectedBrokerIds(remainingSelectedIds)

  if (summary.sent === 0) {
    return {
      sentCount: 0,
      failureMessage: await getSendFailureMessage(),
    }
  }

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
