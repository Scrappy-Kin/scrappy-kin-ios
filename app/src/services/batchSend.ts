import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  loadStarterBrokerIds,
  setSelectedBrokerIds,
} from './brokerStore'
import { setOnboardingSentCount } from './flowProgress'
import { getSendFailureMessage, sendAll } from './sendQueue'
import { getQueue } from './queueStore'
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

  const updatedQueue = await getQueue()
  const remainingSelectedIds = updatedQueue
    .filter((item) => item.status !== 'sent')
    .map((item) => item.brokerId)
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
    const updatedQueue = await getQueue()
    const remainingCatalogIds = filterSelectableBrokers(brokers, updatedQueue).map((broker) => broker.id)

    await Promise.all([
      setSelectedBrokerIds(remainingCatalogIds),
      setOnboardingSentCount(result.sentCount),
    ])
  }
  return result
}
