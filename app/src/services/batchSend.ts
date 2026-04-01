import { getSelectedBrokerIds, loadBrokers, setSelectedBrokerIds } from './brokerStore'
import { clearFlowProgress } from './flowProgress'
import { getSendFailureMessage, sendAll } from './sendQueue'
import { getQueue } from './queueStore'
import { clearUserProfileDraft, setUserProfile, type UserProfile } from './userProfile'

type BatchSendResult = {
  sentCount: number
  failureMessage: string | null
}

export async function executeBatchSend(profile: UserProfile): Promise<BatchSendResult> {
  await setUserProfile(profile)
  await clearUserProfileDraft()

  const brokers = await loadBrokers()
  const selectedIds = await getSelectedBrokerIds()
  const targetIds = selectedIds.length > 0 ? selectedIds : brokers.map((broker) => broker.id)
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
  const result = await executeBatchSend(profile)
  if (result.sentCount > 0) {
    await clearFlowProgress()
  }
  return result
}
