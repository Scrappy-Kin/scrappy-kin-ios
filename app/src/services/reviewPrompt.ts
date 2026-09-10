import { Capacitor, registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { App } from '@capacitor/app'
import { IS_DEV_BUILD } from '../config/buildInfo'

export const REVIEW_LAST_ATTEMPTED_VERSION_KEY = 'review_last_attempted_marketing_version'
const ReviewNative = registerPlugin<{
  request(): Promise<{ requested: boolean }>
}>('ReviewPrompt')

let generation = 0
let opportunity: number | null = null
let requesting = false
let qaMarketingVersion: string | null = null

// Only a fresh send can create an opportunity. Never persist a pending prompt.
export function discardReviewOpportunity() {
  generation += 1
  opportunity = null
}

export function beginReviewRound() {
  discardReviewOpportunity()
  return generation
}

export function completeReviewRound(
  round: number,
  summary: { sent: number; failed: number; pending: number; total: number; newlySent: number },
) {
  if (
    round === generation && summary.total > 0 && summary.newlySent > 0 &&
    summary.sent === summary.total && summary.failed === 0 && summary.pending === 0
  ) {
    opportunity = round
  }
}

export function setReviewMarketingVersionForQa(version: string | null) {
  if (IS_DEV_BUILD) qaMarketingVersion = version
}

async function getMarketingVersion() {
  if (IS_DEV_BUILD && qaMarketingVersion) return qaMarketingVersion
  const { version } = await App.getInfo()
  return version.trim()
}

export async function requestDashboardReview(stillReady: () => boolean) {
  if (opportunity === null || requesting) return 'skipped' as const
  const candidate = opportunity
  requesting = true
  const eligible = () => opportunity === candidate && generation === candidate && stillReady()
  try {
    const marketingVersion = await getMarketingVersion()
    if (!marketingVersion || !eligible()) return 'skipped' as const
    const { value } = await Preferences.get({ key: REVIEW_LAST_ATTEMPTED_VERSION_KEY })
    if (value === marketingVersion || !eligible()) return 'skipped' as const
    if (!Capacitor.isNativePlatform() && !IS_DEV_BUILD) return 'skipped' as const

    // Write before crossing the bridge: a process interruption must not cause a retry.
    await Preferences.set({ key: REVIEW_LAST_ATTEMPTED_VERSION_KEY, value: marketingVersion })
    if (!eligible()) {
      await Preferences.remove({ key: REVIEW_LAST_ATTEMPTED_VERSION_KEY })
      return 'skipped' as const
    }
    opportunity = null
    if (!Capacitor.isNativePlatform()) return 'preview' as const
    const { requested } = await ReviewNative.request()
    if (!requested) {
      await Preferences.remove({ key: REVIEW_LAST_ATTEMPTED_VERSION_KEY })
      return 'skipped' as const
    }
    return 'requested' as const
  } catch {
    // Optional UI must not break Home. If bridge completion is unknown, do not retry.
    return 'skipped' as const
  } finally {
    if (opportunity === candidate) opportunity = null
    requesting = false
  }
}
