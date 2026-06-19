import {
  getAppReviewSinkEmail,
} from '../config/appReviewTestRecipients'
import { getExecutionLane } from '../config/buildInfo'
import type { Broker } from './brokerStore'
import {
  deriveSendSafetyMode,
  usesAppReviewTestRecipients,
} from './sendSafety'

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
  const mode = deriveSendSafetyMode({
    executionLane: getExecutionLane(),
    profileEmail,
  })

  if (!usesAppReviewTestRecipients(mode)) {
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
