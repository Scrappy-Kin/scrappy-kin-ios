import {
  isAppReviewProfileEmail,
  isAppReviewSinkEmail,
} from '../config/appReviewTestRecipients'
import type { ExecutionLane } from '../config/buildInfo'

export type SendSafetyMode = 'live' | 'demo_recipients' | 'qa_blocked'

export const SEND_SAFETY_NOTICES: Partial<Record<SendSafetyMode, {
  title: string
  body: string[]
}>> = {
  demo_recipients: {
    title: 'DEMO RECIPIENTS ACTIVE',
    body: [
      'This profile sends broker emails to Scrappy Kin test inboxes instead of broker inboxes.',
      'Broker list, email content, Gmail authorization, send flow, and sent history work like the live app.',
    ],
  },
  qa_blocked: {
    title: 'DEMO PROFILE REQUIRED',
    body: [
      'This QA build only sends when the local profile email is app-review-redacted-02@example.invalid.',
      'Use that profile to send to Scrappy Kin test inboxes. Otherwise no emails are sent.',
    ],
  },
}

export const APP_REVIEW_TEST_RECIPIENT_ERROR =
  'App Review test-recipient mode blocked a non-test broker recipient before Gmail send.'

export const QA_DEVICE_BLOCKED_SEND_MESSAGE =
  'This QA build only sends when the local profile email is app-review-redacted-02@example.invalid. No emails were sent.'

type SendSafetyInput = {
  executionLane: ExecutionLane
  profileEmail: string
}

type SendRecipientInput = {
  executionLane: ExecutionLane
  recipientEmail: string
  appReviewTestRecipients?: boolean
}

export function deriveSendSafetyMode({
  executionLane,
  profileEmail,
}: SendSafetyInput): SendSafetyMode {
  if (isAppReviewProfileEmail(profileEmail)) {
    return 'demo_recipients'
  }

  if (executionLane === 'qa-device') {
    return 'qa_blocked'
  }

  return 'live'
}

export function usesAppReviewTestRecipients(mode: SendSafetyMode) {
  return mode === 'demo_recipients'
}

export function isSendBlockedBySafetyMode(mode: SendSafetyMode) {
  return mode === 'qa_blocked'
}

export function assertCanSendToRecipient({
  executionLane,
  recipientEmail,
  appReviewTestRecipients = false,
}: SendRecipientInput) {
  if (appReviewTestRecipients && !isAppReviewSinkEmail(recipientEmail)) {
    throw new Error(APP_REVIEW_TEST_RECIPIENT_ERROR)
  }

  if (executionLane === 'qa-device' && !isAppReviewSinkEmail(recipientEmail)) {
    throw new Error(QA_DEVICE_BLOCKED_SEND_MESSAGE)
  }
}

export function isQaDeviceSendBlockedMessage(message: string | null | undefined) {
  return message === QA_DEVICE_BLOCKED_SEND_MESSAGE
}
