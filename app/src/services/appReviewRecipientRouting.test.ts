import { describe, expect, it } from 'vitest'
import {
  APP_REVIEW_PROFILE_EMAIL,
  APP_REVIEW_TEST_RECIPIENT_EMAILS,
  isAppReviewProfileEmail,
} from '../config/appReviewTestRecipients'
import type { Broker } from './brokerStore'
import { resolveBrokerRecipientForSend } from './appReviewRecipientRouting'

function broker(id: string, contactEmail = `privacy@${id}.example`): Broker {
  return {
    id,
    name: `Broker ${id}`,
    contactEmail,
  }
}

describe('App Review recipient routing', () => {
  it('keeps real broker recipients for normal production profiles', () => {
    const sourceBroker = broker('a', 'privacy@broker.example')

    const result = resolveBrokerRecipientForSend({
      broker: sourceBroker,
      brokerIndex: 0,
      profileEmail: 'person@example.com',
    })

    expect(result).toEqual({
      to: 'privacy@broker.example',
      usesAppReviewTestRecipient: false,
    })
  })

  it('maps the App Review profile email to Scrappy Kin test inboxes', () => {
    const result = resolveBrokerRecipientForSend({
      broker: broker('a', 'privacy@broker.example'),
      brokerIndex: 1,
      profileEmail: APP_REVIEW_PROFILE_EMAIL,
    })

    expect(result).toEqual({
      to: APP_REVIEW_TEST_RECIPIENT_EMAILS[1],
      usesAppReviewTestRecipient: true,
    })
  })

  it('normalizes App Review profile email matching by trim and case', () => {
    expect(isAppReviewProfileEmail(`  ${APP_REVIEW_PROFILE_EMAIL.toUpperCase()}  `)).toBe(true)
  })

  it('preserves broker identity while changing only the outbound recipient', () => {
    const sourceBroker = broker('data-axle-com', 'privacyteam@data-axle.com')

    const result = resolveBrokerRecipientForSend({
      broker: sourceBroker,
      brokerIndex: 0,
      profileEmail: APP_REVIEW_PROFILE_EMAIL,
    })

    expect(sourceBroker).toEqual({
      id: 'data-axle-com',
      name: 'Broker data-axle-com',
      contactEmail: 'privacyteam@data-axle.com',
    })
    expect(result.to).toBe(APP_REVIEW_TEST_RECIPIENT_EMAILS[0])
  })
})
