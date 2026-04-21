import type { Location } from 'history'
import type { FlowStepId } from './flowProgress'

export function getCurrentRoute(location: Pick<Location, 'pathname' | 'search'>) {
  return `${location.pathname}${location.search}`
}

export function readReturnTo(search: string) {
  const value = new URLSearchParams(search).get('returnTo')
  return value || null
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

export function buildFlowHref(step: FlowStepId, successTo?: string | null) {
  return buildOnboardingHref(step, successTo)
}

export function buildGmailHref(returnTo?: string | null, successTo?: string | null) {
  return withParams('/gmail', { returnTo, successTo })
}

export function buildReviewBatchHref(returnTo?: string | null) {
  return withParams('/review-batch', { returnTo })
}

export function buildSettingsHref(
  view?: 'profile' | 'gmail' | 'subscription' | 'privacy' | 'diagnostics' | 'about',
  returnTo?: string | null,
) {
  return withParams('/settings', { view, returnTo })
}

export function buildTemplateHref(returnTo?: string | null) {
  return withReturnTo('/template', returnTo)
}

export function buildBrokersHref(returnTo?: string | null) {
  return withReturnTo('/brokers', returnTo)
}

export function buildSentReviewHref(returnTo?: string | null) {
  return withReturnTo('/sent-emails', returnTo)
}
