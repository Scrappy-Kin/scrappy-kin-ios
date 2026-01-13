import { getEncrypted, setEncrypted } from './secureStore'

const LOGS_KEY = 'diagnostic_logs'
const LOG_OPT_IN_KEY = 'diagnostic_opt_in'
const LOG_LIMIT = 50

export type LogEvent = {
  timestamp: string
  event: string
  status?: string
  brokerHash?: string
  metadata?: Record<string, string>
}

export async function getLogOptIn() {
  const stored = await getEncrypted<boolean>(LOG_OPT_IN_KEY)
  return stored ?? false
}

export async function setLogOptIn(enabled: boolean) {
  await setEncrypted(LOG_OPT_IN_KEY, enabled)
}

export async function logEvent(event: string, details: Partial<LogEvent> = {}) {
  const optIn = await getLogOptIn()
  if (!optIn) return

  const existing = (await getEncrypted<LogEvent[]>(LOGS_KEY)) ?? []
  const next: LogEvent[] = [
    {
      timestamp: new Date().toISOString(),
      event,
      status: details.status,
      brokerHash: details.brokerHash,
      metadata: details.metadata,
    },
    ...existing,
  ].slice(0, LOG_LIMIT)

  await setEncrypted(LOGS_KEY, next)
}

export async function exportLogsAsText() {
  const logs = (await getEncrypted<LogEvent[]>(LOGS_KEY)) ?? []
  if (logs.length === 0) return ''
  return logs
    .map((log) => {
      const meta = log.metadata ? ` ${JSON.stringify(log.metadata)}` : ''
      return `${log.timestamp} ${log.event} ${log.status ?? ''} ${log.brokerHash ?? ''}${meta}`.trim()
    })
    .join('\n')
}

export async function wipeLogs() {
  await setEncrypted(LOGS_KEY, [])
}
