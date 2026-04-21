import { Preferences } from '@capacitor/preferences'

const FLOW_LAST_STEP_KEY = 'flow_last_step'
const FLOW_STARTED_KEY = 'flow_started'
const FLOW_ONBOARDING_SENT_COUNT_KEY = 'flow_onboarding_sent_count'

export const FLOW_PRIMARY_STEP_IDS = [
  'intro',
  'starter-set',
  'request-review',
  'gmail-send',
  'final-review',
] as const

export const FLOW_POST_SEND_STEP_IDS = ['beat-sent', 'beat-subscribe'] as const

export const FLOW_STEP_IDS = [...FLOW_PRIMARY_STEP_IDS, ...FLOW_POST_SEND_STEP_IDS] as const

export type FlowStepId = (typeof FLOW_STEP_IDS)[number]

export function isFlowStepId(value: string | null): value is FlowStepId {
  return value !== null && FLOW_STEP_IDS.includes(value as FlowStepId)
}

export async function getSavedFlowStep() {
  const stored = await Preferences.get({ key: FLOW_LAST_STEP_KEY })
  return isFlowStepId(stored.value) ? stored.value : null
}

export async function setSavedFlowStep(step: FlowStepId) {
  await markFlowStarted()
  await Preferences.set({ key: FLOW_LAST_STEP_KEY, value: step })
}

export async function hasStartedFlow() {
  const stored = await Preferences.get({ key: FLOW_STARTED_KEY })
  return stored.value === 'true'
}

export async function markFlowStarted() {
  await Preferences.set({ key: FLOW_STARTED_KEY, value: 'true' })
}

export async function getOnboardingSentCount() {
  const stored = await Preferences.get({ key: FLOW_ONBOARDING_SENT_COUNT_KEY })
  const count = Number.parseInt(stored.value ?? '', 10)
  return Number.isFinite(count) ? count : 0
}

export async function setOnboardingSentCount(count: number) {
  await markFlowStarted()
  await Preferences.set({ key: FLOW_ONBOARDING_SENT_COUNT_KEY, value: String(Math.max(0, count)) })
}

export async function clearSavedFlowStep() {
  await Preferences.remove({ key: FLOW_LAST_STEP_KEY })
}

export async function clearFlowProgress() {
  await Promise.all([
    Preferences.remove({ key: FLOW_LAST_STEP_KEY }),
    Preferences.remove({ key: FLOW_STARTED_KEY }),
    Preferences.remove({ key: FLOW_ONBOARDING_SENT_COUNT_KEY }),
  ])
}
