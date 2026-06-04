import {
  getAppReviewSinkEmail,
  isAppReviewProfileEmail,
} from '../config/appReviewTestRecipients'
import type { Broker } from './brokerStore'

type RecipientRoutingInput = {
  broker: Pick<Broker, 'contactEmail'>
  brokerIndex: number
  profileEmail: string
}

export type RecipientRoutingResult = {
  to: string
  usesAppReviewTestRecipient: boolean
}

export function resolveBrokerRecipientForSend({
  broker,
  brokerIndex,
  profileEmail,
}: RecipientRoutingInput): RecipientRoutingResult {
  if (!isAppReviewProfileEmail(profileEmail)) {
    return {
      to: broker.contactEmail,
      usesAppReviewTestRecipient: false,
    }
  }

  return {
    to: getAppReviewSinkEmail(brokerIndex),
    usesAppReviewTestRecipient: true,
  }
}
