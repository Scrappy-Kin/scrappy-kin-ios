import type { Location } from 'history'
import type { FlowStepId } from './flowProgress'

export type SettingsView = 'profile' | 'gmail' | 'subscription' | 'privacy' | 'diagnostics' | 'support'
export type SettingsNotice =
  | 'profile-saved'
  | 'wording-saved'
  | 'round-size-saved'

const settingsNoticeSet = new Set<SettingsNotice>([
  'profile-saved',
  'wording-saved',
  'round-size-saved',
])

export function getCurrentRoute(location: Pick<Location, 'pathname' | 'search'>) {
  return `${location.pathname}${location.search}`
}

export function readReturnTo(search: string) {
  const value = new URLSearchParams(search).get('returnTo')
  return value || null
}

export function readBackTo(search: string) {
  const value = new URLSearchParams(search).get('backTo')
  return value || null
}

export function readSettingsNotice(search: string) {
  const value = new URLSearchParams(search).get('notice')
  return settingsNoticeSet.has(value as SettingsNotice) ? (value as SettingsNotice) : null
}

export function readSuccessTo(search: string) {
  const value = new URLSearchParams(search).get('successTo')
  return value || null
}

function withParams(
  pathname: string,
  paramsInput: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(paramsInput)) {
    if (value) {
      params.set(key, value)
    }
  }
  if (params.size === 0) return pathname
  return `${pathname}?${params.toString()}`
}

export function withReturnTo(pathname: string, returnTo?: string | null) {
  return withParams(pathname, { returnTo })
}

export function buildOnboardingHref(step: FlowStepId, successTo?: string | null) {
  return withParams(`/onboarding/${step}`, { successTo })
}

export function buildGmailHref(returnTo?: string | null, successTo?: string | null) {
  return withParams('/gmail', { returnTo, successTo })
}

export function buildReviewBatchHref(returnTo?: string | null) {
  return withParams('/review-batch', { returnTo })
}

export function buildSettingsHref(
  view?: SettingsView,
  returnTo?: string | null,
  notice?: SettingsNotice | null,
  backTo?: string | null,
) {
  return withParams('/settings', { view, returnTo, notice, backTo })
}

export function withSettingsNotice(href: string, notice: SettingsNotice) {
  const [pathname, search = ''] = href.split('?')
  if (pathname !== '/settings') return href
  const params = new URLSearchParams(search)
  params.set('notice', notice)
  return `${pathname}?${params.toString()}`
}

export function buildTemplateHref(returnTo?: string | null) {
  return withReturnTo('/template', returnTo)
}

export function buildBatchSizeHref(returnTo?: string | null) {
  return withReturnTo('/batch-size', returnTo)
}

export function buildSentReviewHref(returnTo?: string | null) {
  return withReturnTo('/sent-emails', returnTo)
}
