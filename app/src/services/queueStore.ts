import { getEncrypted, setEncrypted } from './secureStore'

export type QueueStatus = 'pending' | 'sent' | 'failed'

export type QueueItem = {
  brokerId: string
  status: QueueStatus
  lastAttemptAt?: string
  errorCode?: string
}

const QUEUE_KEY = 'send_queue'

export async function getQueue() {
  return (await getEncrypted<QueueItem[]>(QUEUE_KEY)) ?? []
}

export async function setQueue(queue: QueueItem[]) {
  await setEncrypted(QUEUE_KEY, queue)
}

export async function initializeQueue(brokerIds: string[]) {
  const existing = await getQueue()
  if (existing.length > 0) {
    const existingIds = new Set(existing.map((item) => item.brokerId))
    const nextIds = new Set(brokerIds)
    const same =
      existingIds.size === nextIds.size &&
      Array.from(existingIds).every((id) => nextIds.has(id))
    if (same) {
      return existing
    }
  }
  const queue = brokerIds.map((brokerId) => ({ brokerId, status: 'pending' as QueueStatus }))
  await setQueue(queue)
  return queue
}

export async function updateQueueItem(item: QueueItem) {
  const queue = await getQueue()
  const updated = queue.map((entry) => (entry.brokerId === item.brokerId ? item : entry))
  await setQueue(updated)
  return updated
}

export async function resetFailedToPending() {
  const queue = await getQueue()
  const updated = queue.map((entry) =>
    entry.status === 'failed'
      ? { ...entry, status: 'pending' as QueueStatus, errorCode: undefined }
      : entry,
  )
  await setQueue(updated)
  return updated
}

export function summarizeQueue(queue: QueueItem[]) {
  let sent = 0
  let failed = 0
  let pending = 0
  for (const item of queue) {
    if (item.status === 'sent') sent++
    if (item.status === 'failed') failed++
    if (item.status === 'pending') pending++
  }
  return { sent, failed, pending, total: queue.length }
}
