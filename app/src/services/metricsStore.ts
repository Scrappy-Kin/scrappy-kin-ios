import { getEncrypted, setEncrypted } from './secureStore'

const TOTAL_SENT_COUNT_KEY = 'metrics_total_sent_count'

export async function getTotalSentCount() {
  return (await getEncrypted<number>(TOTAL_SENT_COUNT_KEY)) ?? 0
}

export async function incrementTotalSentCount(amount = 1) {
  const current = await getTotalSentCount()
  const next = Math.max(0, current + amount)
  await setEncrypted(TOTAL_SENT_COUNT_KEY, next)
  return next
}

export async function setTotalSentCount(value: number) {
  const next = Math.max(0, value)
  await setEncrypted(TOTAL_SENT_COUNT_KEY, next)
  return next
}
