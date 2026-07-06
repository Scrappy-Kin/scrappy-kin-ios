import type { ReactNode } from 'react'

export function buildAppListRowAccessibilityLabel(
  title: ReactNode,
  description?: string,
  accessibilityLabel?: string,
) {
  if (accessibilityLabel) return accessibilityLabel
  if (typeof title === 'string' && description) {
    return `${title}. ${description}`
  }
  return undefined
}
