import { describe, expect, it } from 'vitest'
import {
  APP_REVIEW_PROFILE_EMAIL,
  APP_REVIEW_TEST_RECIPIENT_EMAILS,
} from '../config/appReviewTestRecipients'
import {
  APP_REVIEW_TEST_RECIPIENT_ERROR,
  QA_DEVICE_BLOCKED_SEND_MESSAGE,
  assertCanSendToRecipient,
  deriveSendSafetyMode,
  usesAppReviewTestRecipients,
} from './sendSafety'

describe('deriveSendSafetyMode', () => {
  it('keeps normal production profiles live', () => {
    expect(
      deriveSendSafetyMode({
        executionLane: 'production',
        profileEmail: 'person@example.com',
      }),
    ).toBe('live')
  })

  it('uses demo recipients for the App Review profile email in production', () => {
    expect(
      deriveSendSafetyMode({
        executionLane: 'production',
        profileEmail: APP_REVIEW_PROFILE_EMAIL,
      }),
    ).toBe('demo_recipients')
  })

  it('uses demo recipients for the App Review profile email in QADevice', () => {
    const mode = deriveSendSafetyMode({
      executionLane: 'qa-device',
      profileEmail: APP_REVIEW_PROFILE_EMAIL,
    })

    expect(mode).toBe('demo_recipients')
    expect(usesAppReviewTestRecipients(mode)).toBe(true)
  })

  it('blocks non-demo profile sends in QADevice', () => {
    expect(
      deriveSendSafetyMode({
        executionLane: 'qa-device',
        profileEmail: 'person@example.com',
      }),
    ).toBe('qa_blocked')
  })
})

describe('assertCanSendToRecipient', () => {
  it('rejects non-test recipients in App Review demo mode', () => {
    expect(() =>
      assertCanSendToRecipient({
        executionLane: 'production',
        recipientEmail: 'privacy@broker.example',
        appReviewTestRecipients: true,
      }),
    ).toThrow(APP_REVIEW_TEST_RECIPIENT_ERROR)
  })

  it('rejects non-test recipients in QADevice before Gmail send', () => {
    expect(() =>
      assertCanSendToRecipient({
        executionLane: 'qa-device',
        recipientEmail: 'privacy@broker.example',
      }),
    ).toThrow(QA_DEVICE_BLOCKED_SEND_MESSAGE)
  })

  it('allows test inbox recipients in QADevice', () => {
    expect(() =>
      assertCanSendToRecipient({
        executionLane: 'qa-device',
        recipientEmail: APP_REVIEW_TEST_RECIPIENT_EMAILS[0],
      }),
    ).not.toThrow()
  })
})
