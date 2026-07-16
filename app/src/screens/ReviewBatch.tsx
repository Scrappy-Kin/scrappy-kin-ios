import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import dataRescueIllustration from '../assets/illustrations/onboarding-data-rescue.svg'
import { useEffect, useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { getExecutionLane } from '../config/buildInfo'
import { executeBatchSend } from '../services/batchSend'
import {
  DEFAULT_ROUND_SIZE,
  type Broker,
  getSelectedBrokerIds,
  getSelectedRoundSize,
  loadBrokers,
  setSelectedBrokerIds as persistSelectedBrokerIds,
} from '../services/brokerStore'
import { getGmailStatus } from '../services/googleAuth'
import { getCurrentRoute, readReturnTo } from '../services/navigation'
import { computeBrokerEligibility, getEligibleBrokerIds } from '../services/roundState'
import { deriveSendSafetyMode, isSendBlockedBySafetyMode } from '../services/sendSafety'
import { getMergedSentLog } from '../services/sentLog'
import { getSubscriptionSnapshot } from '../services/subscription'
import {
  buildTaskHref,
  deriveReviewBatchTaskRedirect,
} from '../services/taskRoutes'
import { getActiveUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppTopNav from '../ui/patterns/AppTopNav'
import RoundReviewSummary, { ReviewEditIconButton } from '../ui/patterns/RoundReviewSummary'
import SendFailureNotice from '../ui/patterns/SendFailureNotice'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  state: '',
  partialZip: '',
}

export default function ReviewBatch() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const returnTo = readReturnTo(location.search) ?? '/home'
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<string[]>([])
  const [selectedBrokers, setSelectedBrokers] = useState<Broker[]>([])
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendInFlight, setSendInFlight] = useState(false)
  const sendSafetyMode = deriveSendSafetyMode({
    executionLane: getExecutionLane(),
    profileEmail: profileDraft.email,
  })
  const sendBlockedBySafetyMode = isSendBlockedBySafetyMode(sendSafetyMode)

  async function refreshState() {
    const nextBrokers = await loadBrokers()
    const [status, profile, selectedIds, selectedRoundSize, sentLog, subscriptionSnapshot] = await Promise.all([
      getGmailStatus(),
      getActiveUserProfile(),
      getSelectedBrokerIds(),
      getSelectedRoundSize(),
      getMergedSentLog(nextBrokers),
      getSubscriptionSnapshot(),
    ])

    setSubscriptionActive(subscriptionSnapshot.active)
    setGmailConnected(status.connected)
    setProfileDraft(profile ?? emptyProfile)

    if (!subscriptionSnapshot.active) {
      setSelectedBrokerIds([])
      setSelectedBrokers([])
      setIsReady(true)
      return
    }

    const eligibility = computeBrokerEligibility(nextBrokers, sentLog)
    const eligibleIds = getEligibleBrokerIds(eligibility)
    const selectableBrokers = nextBrokers.filter((broker) => eligibleIds.includes(broker.id))
    const selectableBrokerIds = new Set(eligibleIds)
    const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))
    const defaultRoundSize = Math.min(selectedRoundSize || DEFAULT_ROUND_SIZE, selectableBrokers.length)
    const nextSelectedIds =
      filteredSelectedIds.length > 0 && filteredSelectedIds.length !== selectableBrokers.length
        ? filteredSelectedIds
        : selectableBrokers.slice(0, defaultRoundSize).map((broker) => broker.id)

    if (
      nextSelectedIds.length !== selectedIds.length ||
      nextSelectedIds.some((id, index) => id !== selectedIds[index])
    ) {
      await persistSelectedBrokerIds(nextSelectedIds)
    }

    setSelectedBrokerIds(nextSelectedIds)
    setSelectedBrokers(selectableBrokers.filter((broker) => nextSelectedIds.includes(broker.id)))
    setIsReady(true)
  }

  useIonViewWillEnter(() => {
    setIsReady(false)
    void refreshState()
  })

  const profileComplete = Boolean(
    profileDraft.fullName &&
      profileDraft.email &&
      profileDraft.city,
  )

  const reviewRedirect = isReady
    ? deriveReviewBatchTaskRedirect(
        {
          gmailConnected,
          hasProfile: profileComplete,
          subscriptionActive,
        },
        currentRoute,
        returnTo,
      )
    : null

  useEffect(() => {
    if (!isReady || !reviewRedirect || reviewRedirect === currentRoute) {
      return
    }
    history.replace(reviewRedirect)
  }, [currentRoute, history, isReady, reviewRedirect])

  useRouteFocus(currentRoute, isReady && (!reviewRedirect || reviewRedirect === currentRoute), headingRef)

  async function handleSendSelected() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const subscriptionSnapshot = await getSubscriptionSnapshot()
      if (!subscriptionSnapshot.active) {
        setSubscriptionActive(false)
        return
      }
      const result = await executeBatchSend(profileDraft, selectedBrokerIds)
      if (result.sentCount === 0) {
        setSendError(result.failureMessage ?? 'Emails didn’t send.')
        await refreshState()
        return
      }
      history.replace('/home')
    } catch (error) {
      setSendError((error as Error).message ?? 'Send failed.')
    } finally {
      setSendInFlight(false)
    }
  }

  if (!isReady) {
    return (
      <IonPage>
        <IonContent className="page-content" />
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} action={<SettingsShortcut />} />
          <AppHeading intent="section" level={1} ref={headingRef} tabIndex={-1}>
            Send your next round of opt-out emails
          </AppHeading>
          <section className="app-section-shell">
            <img
              className="round-review-illustration"
              src={dataRescueIllustration}
              alt=""
              aria-hidden="true"
            />
            <RoundReviewSummary
              brokerCount={selectedBrokerIds.length}
              brokerNames={selectedBrokers.map((broker) => broker.name)}
              gmailAction={
                <ReviewEditIconButton
                  label="Edit Gmail connection"
                  onClick={() =>
                    history.push(
                      buildTaskHref('repair_gmail', {
                        returnTo: currentRoute,
                        successTo: currentRoute,
                      }),
                    )
                  }
                />
              }
              brokersAction={
                <ReviewEditIconButton
                  label="Edit round size"
                  onClick={() =>
                    history.push(buildTaskHref('edit_batch_size', { returnTo: currentRoute }))
                  }
                />
              }
              templateAction={
                <ReviewEditIconButton
                  label="Edit email template"
                  onClick={() =>
                    history.push(buildTaskHref('edit_template_for_batch', { returnTo: currentRoute }))
                  }
                />
              }
              sendSafetyMode={sendSafetyMode}
            />
            {sendError ? (
              <SendFailureNotice
                message={sendError}
                onReviewGmail={() =>
                  history.push(
                    buildTaskHref('repair_gmail', {
                      returnTo: currentRoute,
                      successTo: currentRoute,
                    }),
                  )
                }
              />
            ) : null}
            <AppButton
              onClick={handleSendSelected}
              disabled={
                sendBlockedBySafetyMode ||
                sendInFlight ||
                !gmailConnected ||
                selectedBrokerIds.length === 0
              }
            >
              {sendInFlight
                ? 'Sending...'
                : `Send ${selectedBrokerIds.length || ''} opt-out emails`.trim()}
            </AppButton>
            <ServerBoundaryClaim />
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
