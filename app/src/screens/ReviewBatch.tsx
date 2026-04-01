import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { checkmarkCircle, createOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { executeBatchSend } from '../services/batchSend'
import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds as persistSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import { buildDeletionBody, buildDeletionSubject } from '../services/emailTemplate'
import { getGmailStatus } from '../services/googleAuth'
import { getCurrentRoute, readReturnTo } from '../services/navigation'
import { getQueue } from '../services/queueStore'
import {
  buildTaskHref,
  deriveReviewBatchTaskRedirect,
} from '../services/taskRoutes'
import {
  getDeletionTemplateDraft,
  resolveDeletionTemplate,
  type DeletionTemplateDraft,
} from '../services/templateStore'
import { getActiveUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppIcon from '../ui/primitives/AppIcon'
import AppNotice from '../ui/primitives/AppNotice'
import AppSegmentedCard, { AppSegmentedCardSection } from '../ui/primitives/AppSegmentedCard'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import ReviewAssetCard from '../ui/patterns/ReviewAssetCard'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'

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
  const [isReady, setIsReady] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<string[]>([])
  const [previewBroker, setPreviewBroker] = useState<Broker | null>(null)
  const [templateDraft, setTemplateDraft] = useState<DeletionTemplateDraft | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendInFlight, setSendInFlight] = useState(false)

  async function refreshState() {
    const [status, profile, nextTemplateDraft, nextBrokers, selectedIds, queue] = await Promise.all([
      getGmailStatus(),
      getActiveUserProfile(),
      getDeletionTemplateDraft(),
      loadBrokers(),
      getSelectedBrokerIds(),
      getQueue(),
    ])

    const selectableBrokers = filterSelectableBrokers(nextBrokers, queue)
    const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
    const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))

    if (filteredSelectedIds.length !== selectedIds.length) {
      await persistSelectedBrokerIds(filteredSelectedIds)
    }

    const selectedBroker = filteredSelectedIds.length
      ? selectableBrokers.find((broker) => broker.id === filteredSelectedIds[0]) ?? null
      : null

    setGmailConnected(status.connected)
    setProfileDraft(profile ?? emptyProfile)
    setTemplateDraft(nextTemplateDraft)
    setBrokers(selectableBrokers)
    setSelectedBrokerIds(filteredSelectedIds)
    setPreviewBroker(selectedBroker ?? selectableBrokers[0] ?? null)
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
          selectedBrokerIds,
          brokers,
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

  async function handleSendSelected() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const result = await executeBatchSend(profileDraft)
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

  const resolvedTemplate = resolveDeletionTemplate(profileDraft, templateDraft)

  function previewBodyText(referenceId?: string) {
    if (!previewBroker) return ''
    return buildDeletionBody(previewBroker, profileDraft, referenceId, resolvedTemplate).replace(
      /^To .+ Privacy\/Compliance Team,/,
      'To [broker privacy team],',
    )
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
          <AppHeading intent="section">Review next batch</AppHeading>
          <section className="app-section-shell">
            <AppText intent="supporting">
              Review the broker list and the email below. If it looks right, this batch will send
              from your connected Gmail account.
            </AppText>
            <ReviewAssetCard
              title="Gmail connected"
              icon={checkmarkCircle}
              action={
                <button
                  type="button"
                  className="flow-inline-link"
                  onClick={() =>
                    history.push(
                      buildTaskHref('repair_gmail', {
                        returnTo: currentRoute,
                        successTo: currentRoute,
                      }),
                    )
                  }
                >
                  Manage Gmail
                </button>
              }
            >
              <AppText intent="body">Send-only access is ready. No inbox access.</AppText>
            </ReviewAssetCard>
            <ReviewAssetCard
              title={
                selectedBrokerIds.length > 0
                  ? `${selectedBrokerIds.length} brokers selected`
                  : 'No brokers selected'
              }
              action={
                <button
                  type="button"
                  className="review-asset-card__icon-action"
                  aria-label="Edit brokers"
                  onClick={() =>
                    history.push(buildTaskHref('edit_brokers_for_batch', { returnTo: currentRoute }))
                  }
                >
                  <AppIcon icon={createOutline} size="sm" />
                </button>
              }
            >
              <AppText intent="body">
                Review or change the broker list before you send the batch.
              </AppText>
            </ReviewAssetCard>
            <ReviewAssetCard
              title="Email preview"
              action={
                <button
                  type="button"
                  className="review-asset-card__icon-action"
                  aria-label="Edit email wording"
                  onClick={() =>
                    history.push(buildTaskHref('edit_template_for_batch', { returnTo: currentRoute }))
                  }
                >
                  <AppIcon icon={createOutline} size="sm" />
                </button>
              }
            >
              <AppSegmentedCard>
                <AppSegmentedCardSection>
                  <AppText intent="label">Subject</AppText>
                  <AppText intent="body">{buildDeletionSubject('ABC123')}</AppText>
                </AppSegmentedCardSection>
                <AppSegmentedCardSection>
                  <AppText intent="label">Body</AppText>
                  <pre className="flow-email-plaintext">{previewBodyText('ABC123')}</pre>
                </AppSegmentedCardSection>
              </AppSegmentedCard>
            </ReviewAssetCard>
            {sendError ? (
              <AppNotice
                variant="error"
                title="Emails didn’t send"
                actions={
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      history.push(
                        buildTaskHref('repair_gmail', {
                          returnTo: currentRoute,
                          successTo: currentRoute,
                        }),
                      )
                    }
                  >
                    Review Gmail settings
                  </AppButton>
                }
              >
                {sendError}
              </AppNotice>
            ) : null}
            <AppButton onClick={handleSendSelected} disabled={sendInFlight || !gmailConnected}>
              {sendInFlight
                ? 'Sending...'
                : `✉️ Send ${selectedBrokerIds.length || ''} opt-out emails`.trim()}
            </AppButton>
            <ServerBoundaryClaim />
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
