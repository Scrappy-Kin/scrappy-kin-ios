import type { Broker } from './brokerStore'
import type { FlowStepId } from './flowProgress'
import {
  buildBrokersHref,
  buildGmailHref,
  buildOnboardingHref,
  buildReviewBatchHref,
  buildSentReviewHref,
  buildSettingsHref,
  buildTemplateHref,
} from './navigation'

export type TaskIntent =
  | 'onboarding'
  | 'review_next_batch'
  | 'repair_gmail'
  | 'edit_brokers_for_batch'
  | 'edit_template_for_batch'
  | 'edit_profile_for_batch'
  | 'review_sent'

export type EditBehavior = 'autosave' | 'explicit_save'

type TaskRouteInput = {
  returnTo?: string | null
  successTo?: string | null
  currentRoute?: string | null
  step?: FlowStepId
}

export type TaskRouteStateInput = {
  gmailConnected: boolean
  hasProfile: boolean
  selectedBrokerIds: string[]
  brokers: Broker[]
}

type TaskRouteDefinition = {
  href: (input: TaskRouteInput) => string
  successHref?: (input: TaskRouteInput) => string
  editBehavior?: EditBehavior
}

const TASK_ROUTES: Record<TaskIntent, TaskRouteDefinition> = {
  onboarding: {
    href: ({ step }) => buildOnboardingHref(step ?? 'intro'),
  },
  review_next_batch: {
    href: ({ returnTo }) => buildReviewBatchHref(returnTo ?? '/home'),
  },
  repair_gmail: {
    href: ({ returnTo, successTo }) => buildGmailHref(returnTo ?? '/home', successTo ?? returnTo ?? '/home'),
    successHref: ({ successTo, returnTo }) => successTo ?? returnTo ?? '/home',
  },
  edit_brokers_for_batch: {
    href: ({ returnTo }) => buildBrokersHref(returnTo ?? '/home'),
    successHref: ({ returnTo }) => returnTo ?? '/home',
    editBehavior: 'autosave',
  },
  edit_template_for_batch: {
    href: ({ returnTo }) => buildTemplateHref(returnTo ?? '/home'),
    successHref: ({ returnTo }) => returnTo ?? '/home',
    editBehavior: 'explicit_save',
  },
  edit_profile_for_batch: {
    href: ({ returnTo }) => buildSettingsHref('profile', returnTo ?? '/home'),
    successHref: ({ returnTo }) => returnTo ?? '/home',
    editBehavior: 'explicit_save',
  },
  review_sent: {
    href: ({ returnTo }) => buildSentReviewHref(returnTo ?? '/home'),
  },
}

export function buildTaskHref(intent: TaskIntent, input: TaskRouteInput = {}) {
  return TASK_ROUTES[intent].href(input)
}

export function getTaskSuccessHref(intent: TaskIntent, input: TaskRouteInput = {}) {
  return TASK_ROUTES[intent].successHref?.(input) ?? '/home'
}

export function getTaskEditBehavior(intent: TaskIntent) {
  return TASK_ROUTES[intent].editBehavior ?? null
}

export function deriveNextBatchTaskTarget(
  input: TaskRouteStateInput,
  returnTo: string | null = '/home',
) {
  const reviewBatchHref = buildTaskHref('review_next_batch', { returnTo })

  if (input.selectedBrokerIds.length === 0) {
    return buildTaskHref('edit_brokers_for_batch', { returnTo: reviewBatchHref })
  }

  if (!input.hasProfile) {
    return buildTaskHref('edit_profile_for_batch', { returnTo: reviewBatchHref })
  }

  if (!input.gmailConnected) {
    return buildTaskHref('repair_gmail', { returnTo, successTo: reviewBatchHref })
  }

  return reviewBatchHref
}

export function deriveReviewBatchTaskRedirect(
  input: TaskRouteStateInput,
  currentRoute: string,
  returnTo: string | null = '/home',
) {
  if (input.selectedBrokerIds.length === 0) {
    return buildTaskHref('edit_brokers_for_batch', { returnTo })
  }

  if (!input.hasProfile) {
    return buildTaskHref('edit_profile_for_batch', { returnTo: currentRoute })
  }

  if (!input.gmailConnected) {
    return buildTaskHref('repair_gmail', { returnTo, successTo: currentRoute })
  }

  return null
}
