import type { ExecutionLane } from '../config/buildInfo'

export function formatVersionCreatedAt(buildTime: string) {
  const date = new Date(buildTime)
  if (Number.isNaN(date.getTime())) return buildTime

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date)
}

export function formatExecutionLane(lane: ExecutionLane) {
  switch (lane) {
    case 'qa-device':
      return 'QA device'
    case 'production':
      return 'Production'
    case 'dev':
      return 'Development'
  }
}
