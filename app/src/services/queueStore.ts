import { getEncrypted, setEncrypted } from './secureStore'

export type QueueStatus = 'pending' | 'sent' | 'failed'

export type QueueItem = {
  brokerId: string
  status: QueueStatus
  referenceId: string
  lastAttemptAt?: string
  errorCode?: string
  errorStatus?: number
  errorDetail?: string
  gmailMessageId?: string
  gmailThreadId?: string
}

const QUEUE_KEY = 'send_queue'

function createReferenceId() {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

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
      const backfilled = existing.map((item) =>
        item.referenceId ? item : { ...item, referenceId: createReferenceId() },
      )
      await setQueue(backfilled)
      return backfilled
    }
  }
  const queue = brokerIds.map((brokerId) => ({
    brokerId,
    status: 'pending' as QueueStatus,
    referenceId: createReferenceId(),
  }))
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
      ? {
          ...entry,
          status: 'pending' as QueueStatus,
          errorCode: undefined,
          errorStatus: undefined,
          errorDetail: undefined,
          gmailMessageId: undefined,
          gmailThreadId: undefined,
        }
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
