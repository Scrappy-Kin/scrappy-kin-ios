import type { DashboardStateId } from './roundState'

// ---------------------------------------------------------------------------
// QA-only in-memory override store.
// This module is imported in qa-storekit and dev lanes only via the
// QaDashboardSheet component. It has no effect in production.
// ---------------------------------------------------------------------------

type Listener = () => void

let currentOverride: DashboardStateId | null = null
const listeners = new Set<Listener>()

export function getQaOverride(): DashboardStateId | null {
  return currentOverride
}

export function setQaOverride(next: DashboardStateId | null): void {
  currentOverride = next
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeQaOverride(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
