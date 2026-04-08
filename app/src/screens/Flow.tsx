import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import {
  checkmarkCircle,
  closeCircle,
  createOutline,
} from 'ionicons/icons'
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import BrokerSelectionPanel from '../components/BrokerSelectionPanel'
import { completeOnboardingSend } from '../services/batchSend'
import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import {
  buildDeletionBody,
  buildDeletionSubject,
} from '../services/emailTemplate'
import {
  FLOW_STEP_IDS,
  hasStartedFlow,
  setSavedFlowStep,
  type FlowStepId,
} from '../services/flowProgress'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { deriveFallbackTarget, deriveOnboardingRedirect } from '../services/homeState'
import {
  buildOnboardingHref,
  buildSettingsHref,
  buildTemplateHref,
  getCurrentRoute,
  readSuccessTo,
} from '../services/navigation'
import { getQueue } from '../services/queueStore'
import {
  getDeletionTemplateDraft,
  resolveDeletionTemplate,
  type DeletionTemplateDraft,
} from '../services/templateStore'
import {
  clearUserProfileDraft,
  getActiveUserProfile,
  getUserProfileValidationErrors,
  setUserProfile,
  setUserProfileDraft,
  type UserProfile,
  type UserProfileErrors,
  type UserProfileField,
} from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppIcon from '../ui/primitives/AppIcon'
import AppInput from '../ui/primitives/AppInput'
import AppNotice from '../ui/primitives/AppNotice'
import AppSegmentedCard, { AppSegmentedCardSection } from '../ui/primitives/AppSegmentedCard'
import AppText from '../ui/primitives/AppText'
import GmailConnectionStatusCard from '../ui/patterns/GmailConnectionStatusCard'
import AppTopNav from '../ui/patterns/AppTopNav'
import ReadMoreSheetLink from '../ui/patterns/ReadMoreSheetLink'
import ReviewAssetCard from '../ui/patterns/ReviewAssetCard'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  state: '',
  partialZip: '',
}

type FlowProps = {
  stepId: FlowStepId
}

type StepConfig = {
  title: string
  render: () => ReactElement
  canContinue?: boolean
  showNext?: boolean
  showFooterClaim?: boolean
}

const stepIds = FLOW_STEP_IDS

function getPreviousStep(stepId: FlowStepId) {
  const currentIndex = stepIds.indexOf(stepId)
  if (currentIndex <= 0) {
    return null
  }
  return stepIds[currentIndex - 1]
}

function getNextStep(stepId: FlowStepId, gmailConnected: boolean) {
  if (stepId === 'request-review') {
    return gmailConnected ? 'final-review' : 'gmail-send'
  }

  const currentIndex = stepIds.indexOf(stepId)
  if (currentIndex < 0 || currentIndex >= stepIds.length - 1) {
    return null
  }

  return stepIds[currentIndex + 1]
}

export default function Flow({ stepId }: FlowProps) {
  const history = useHistory()
  const location = useLocation()
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const currentRoute = getCurrentRoute(location)
  const successTo = readSuccessTo(location.search)
  const currentIndex = stepIds.indexOf(stepId)
  const previousStep = getPreviousStep(stepId)
  const [isReady, setIsReady] = useState(false)
  const [flowStarted, setFlowStarted] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selectedBrokerIds, setSelectedBrokerIdsState] = useState<string[]>([])
  const [failedBrokerIds, setFailedBrokerIds] = useState<string[]>([])
  const [previewBroker, setPreviewBroker] = useState<Broker | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthInFlight, setOauthInFlight] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendInFlight, setSendInFlight] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<DeletionTemplateDraft | null>(null)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})

  async function refreshState() {
    const [status, profile, nextTemplateDraft, nextFlowStarted, nextBrokers, selectedIds, queue] =
      await Promise.all([
        getGmailStatus(),
        getActiveUserProfile(),
        getDeletionTemplateDraft(),
        hasStartedFlow(),
        loadBrokers(),
        getSelectedBrokerIds(),
        getQueue(),
      ])

    const selectableBrokers = filterSelectableBrokers(nextBrokers, queue)
    const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
    const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))

    if (filteredSelectedIds.length !== selectedIds.length) {
      await setSelectedBrokerIds(filteredSelectedIds)
    }

    setGmailConnected(status.connected)
    setProfileDraft(profile ?? emptyProfile)
    setTemplateDraft(nextTemplateDraft)
    setFlowStarted(nextFlowStarted)
    setProfileErrors({})
    setBrokers(selectableBrokers)
    setSelectedBrokerIdsState(filteredSelectedIds)
    setFailedBrokerIds(queue.filter((item) => item.status === 'failed').map((item) => item.brokerId))

    const selectedBroker = filteredSelectedIds.length
      ? selectableBrokers.find((broker) => broker.id === filteredSelectedIds[0]) ?? null
      : null
    setPreviewBroker(selectedBroker ?? selectableBrokers[0] ?? null)
    setIsReady(true)
  }

  useIonViewWillEnter(() => {
    setIsReady(false)
    void refreshState()
  })

  const selectedCount = selectedBrokerIds.length
  const requestReviewValidationErrors = getUserProfileValidationErrors(profileDraft)
  const profileComplete =
    Object.keys(requestReviewValidationErrors).length === 0 &&
    Boolean(profileDraft.fullName || profileDraft.email || profileDraft.city)
  const flowRedirect = isReady
    ? deriveOnboardingRedirect(
        {
          gmailConnected,
          hasProfile: profileComplete,
          selectedBrokerIds,
          brokers,
          queueSummary: { sent: 0, failed: 0, pending: 0, total: 0 },
          totalSentCount: 0,
          sentReviewItemCount: 0,
        },
        stepId,
        flowStarted,
      )
    : null
  const onboardingFallbackHref = isReady
    ? deriveFallbackTarget({
        gmailConnected,
        hasProfile: profileComplete,
        selectedBrokerIds,
        brokers,
        queueSummary: { sent: 0, failed: 0, pending: 0, total: 0 },
        totalSentCount: 0,
        sentReviewItemCount: 0,
      })
    : undefined

  useEffect(() => {
    if (!isReady) {
      return
    }

    if (flowRedirect && flowRedirect !== currentRoute) {
      history.replace(flowRedirect)
      return
    }

    void setSavedFlowStep(stepId)
    requestAnimationFrame(() => {
      void contentRef.current?.scrollToTop(0)
    })
  }, [currentRoute, flowRedirect, history, isReady, stepId])

  function renderStepContext(
    summary: string,
    sheetTitle?: string,
    sheetBody?: ReactNode,
    linkLabel?: string,
  ) {
    return (
      <div className="flow-context">
        <AppText intent="supporting">{summary}</AppText>
        {sheetTitle && sheetBody ? (
          <ReadMoreSheetLink
            label={linkLabel ?? sheetTitle}
            sheetTitle={sheetTitle}
            sheetBody={sheetBody}
          />
        ) : null}
      </div>
    )
  }

  function updateProfile(next: Partial<UserProfile>) {
    setProfileDraft((current) => {
      const updated = { ...current, ...next }
      void setUserProfileDraft(updated)
      setProfileErrors((existing) => {
        const nextErrors = { ...existing }
        for (const field of Object.keys(next) as UserProfileField[]) {
          const fieldError = getUserProfileValidationErrors(updated)[field]
          if (fieldError) {
            nextErrors[field] = fieldError
          } else {
            delete nextErrors[field]
          }
        }
        return nextErrors
      })
      return updated
    })
  }

  function normalizeZipInput(value: string) {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  async function toggleBroker(id: string, checked: boolean) {
    const next = checked
      ? [...selectedBrokerIds, id]
      : selectedBrokerIds.filter((item) => item !== id)
    setSelectedBrokerIdsState(next)
    const selectedBroker = next.length
      ? brokers.find((broker) => broker.id === next[0]) ?? null
      : null
    setPreviewBroker(selectedBroker ?? brokers[0] ?? null)
    await setSelectedBrokerIds(next)
  }

  async function selectAllBrokers() {
    const ids = brokers.map((broker) => broker.id)
    setSelectedBrokerIdsState(ids)
    setPreviewBroker(brokers[0] ?? null)
    await setSelectedBrokerIds(ids)
  }

  async function clearAllBrokers() {
    setSelectedBrokerIdsState([])
    setPreviewBroker(brokers[0] ?? null)
    await setSelectedBrokerIds([])
  }

  function validateProfile(profile: UserProfile) {
    const errors = getUserProfileValidationErrors(profile)
    setProfileErrors(errors)
    return errors
  }

  function validateProfileField(field: UserProfileField) {
    const nextError = getUserProfileValidationErrors(profileDraft)[field]
    setProfileErrors((existing) => {
      if (!nextError && !existing[field]) return existing
      const next = { ...existing }
      if (nextError) {
        next[field] = nextError
      } else {
        delete next[field]
      }
      return next
    })
  }

  function focusFirstInvalidProfileField(errors: UserProfileErrors) {
    const order: UserProfileField[] = ['fullName', 'email', 'city', 'state', 'partialZip']
    const firstInvalid = order.find((field) => errors[field])
    if (!firstInvalid) return

    const wrapper = document.querySelector(`[data-field-id="${firstInvalid}"]`) as HTMLElement | null
    wrapper?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = wrapper?.querySelector('input, textarea') as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    input?.focus()
  }

  async function handleConnectGmail() {
    try {
      setOauthError(null)
      setOauthInFlight(true)
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
      if (status.connected) {
        if (successTo) {
          history.replace(successTo)
          return
        }
        history.push(buildOnboardingHref('final-review'))
      }
    } catch (error) {
      const message = (error as Error).message ?? 'Sign-in didn’t finish. Please try again.'
      setOauthError(message)
    } finally {
      setOauthInFlight(false)
    }
  }

  function renderSummary(summary: string) {
    return (
      <div className="flow-context">
        <AppText intent="supporting">{summary}</AppText>
      </div>
    )
  }

  async function handleSendSelected() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const result = await completeOnboardingSend(profileDraft)

      if (result.sentCount === 0) {
        setSendError(result.failureMessage ?? 'Emails didn’t send.')
        return
      }
      history.replace('/home')
      return
    } catch (error) {
      setSendError((error as Error).message ?? 'Send failed.')
    } finally {
      setSendInFlight(false)
    }
  }

  function goToStep(nextStep: FlowStepId, replace = false) {
    const href = buildOnboardingHref(nextStep)
    if (replace) {
      history.replace(href)
      return
    }
    history.push(href)
  }

  async function goNext() {
    if (stepId === 'request-review') {
      const errors = validateProfile(profileDraft)
      if (Object.keys(errors).length > 0) {
        focusFirstInvalidProfileField(errors)
        return
      }
      await setUserProfile(profileDraft)
      await clearUserProfileDraft()
    }

    const nextStep = getNextStep(stepId, gmailConnected)
    if (nextStep) {
      goToStep(nextStep)
    }
  }

  const resolvedTemplate = resolveDeletionTemplate(profileDraft, templateDraft)
  const previewSignOff = resolvedTemplate.signOff || '[Your name]'
  const previewBodyTopText = `To [broker privacy team],\n\n${resolvedTemplate.intro}\n\nIDENTITY FOR LOOKUP:`
  const previewBodyBottomText = `WHAT I'M REQUESTING:\n${resolvedTemplate.requestBlock}\n\n${previewSignOff}`

  function previewBodyText(referenceId?: string) {
    if (!previewBroker || Object.keys(requestReviewValidationErrors).length > 0) return ''
    return buildDeletionBody(previewBroker, profileDraft, referenceId, resolvedTemplate).replace(
      /^To .+ Privacy\/Compliance Team,/,
      'To [broker privacy team],',
    )
  }

  const steps: Record<FlowStepId, StepConfig> = {
    intro: {
      title: 'Take back your privacy, on your terms',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body">
            Scrappy Kin helps you send opt-out emails to data brokers from your own Gmail account.
          </AppText>
          <div className="flow-intro-points">
            <div className="flow-intro-points__item">
              <div className="app-stack app-stack--tight">
                <AppText intent="body" emphasis>
                  What data brokers are
                </AppText>
                <AppText intent="body">
                  Data brokers are companies that collect, package, and sell people&apos;s personal
                  information.
                </AppText>
              </div>
            </div>
            <div className="flow-intro-points__item">
              <div className="app-stack app-stack--tight">
                <AppText intent="body" emphasis>
                  How Scrappy Kin works
                </AppText>
                <AppText intent="body">
                  You&apos;ll choose which data brokers to contact from a curated list, review the
                  opt-out emails, and approve them before anything is sent.
                </AppText>
              </div>
            </div>
            <div className="flow-intro-points__item">
              <div className="app-stack app-stack--tight">
                <AppText intent="body" emphasis>
                  How Gmail permission works
                </AppText>
                <AppText intent="body">
                  Scrappy Kin sends from your Gmail so you stay in control. We only ask for
                  permission to send emails, and you approve every email before it&apos;s sent. By
                  design, we cannot read your inbox or manage your mailbox.
                </AppText>
              </div>
            </div>
          </div>
        </div>
      ),
      canContinue: true,
      showFooterClaim: false,
    },
    brokers: {
      title: 'Pick brokers',
      render: () => (
        <BrokerSelectionPanel
          brokers={brokers}
          selectedIds={selectedBrokerIds}
          failedBrokerIds={failedBrokerIds}
          onToggle={toggleBroker}
          onSelectAll={selectAllBrokers}
          onClearAll={clearAllBrokers}
          context={
            <AppText intent="supporting">
              Feel free to start with one or two brokers, or select more if you already know what
              you want to send.
            </AppText>
          }
        />
      ),
      canContinue: selectedCount > 0,
      showFooterClaim: false,
    },
    'request-review': {
      title: 'Fill in your profile and review the email',
      render: () => (
        <section className="app-section-shell">
          <AppText intent="supporting">
            These are the details we recommend based on legal research and broker testing. They
            usually give brokers enough to find the right record while keeping what you share
            limited.
          </AppText>
          <AppText intent="caption">* Required</AppText>
          <div className="flow-request-preview">
            <AppSegmentedCard>
              <AppSegmentedCardSection>
                <AppText intent="label">Subject</AppText>
                <AppText intent="body">{buildDeletionSubject()}</AppText>
              </AppSegmentedCardSection>
              <AppSegmentedCardSection>
                <AppText intent="label">Body</AppText>
                <pre className="flow-email-plaintext">{previewBodyTopText}</pre>
              </AppSegmentedCardSection>
              <AppSegmentedCardSection>
                <div className="form-stack">
                  <AppInput
                    label="Full name"
                    fieldId="fullName"
                    required
                    value={profileDraft.fullName}
                    onChange={(value) => updateProfile({ fullName: value })}
                    onBlur={() => validateProfileField('fullName')}
                    error={profileErrors.fullName}
                  />
                  <AppInput
                    label="Email"
                    fieldId="email"
                    required
                    value={profileDraft.email}
                    onChange={(value) => updateProfile({ email: value })}
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    spellCheck={false}
                    onBlur={() => validateProfileField('email')}
                    error={profileErrors.email}
                  />
                  <AppInput
                    label="City"
                    fieldId="city"
                    required
                    value={profileDraft.city}
                    onChange={(value) => updateProfile({ city: value })}
                    onBlur={() => validateProfileField('city')}
                    error={profileErrors.city}
                  />
                  <AppInput
                    label="State"
                    fieldId="state"
                    value={profileDraft.state}
                    onChange={(value) => updateProfile({ state: value })}
                    placeholder="CA"
                  />
                  <AppInput
                    label="Zip Code (first 4 digits)"
                    fieldId="partialZip"
                    value={profileDraft.partialZip}
                    onChange={(value) => updateProfile({ partialZip: normalizeZipInput(value) })}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                  />
                </div>
              </AppSegmentedCardSection>
              <AppSegmentedCardSection>
                <pre className="flow-email-plaintext">{previewBodyBottomText}</pre>
              </AppSegmentedCardSection>
            </AppSegmentedCard>
          </div>
          <AppButton
            variant="secondary"
            size="sm"
            onClick={() => history.push(buildTemplateHref(currentRoute))}
          >
            Edit wording
          </AppButton>
        </section>
      ),
      canContinue: selectedCount > 0 && Object.keys(requestReviewValidationErrors).length === 0,
      showFooterClaim: false,
    },
    'gmail-send': {
      title: 'Connect Gmail to send',
      render: () =>
        gmailConnected ? (
          <section className="app-section-shell">
            <AppText intent="supporting">
              Gmail is already connected and ready to send from your account.
            </AppText>
            <GmailConnectionStatusCard
              connected
              connectedDescription="Send-only access is active. Scrappy Kin cannot read your inbox."
              disconnectedDescription=""
              connectedActions={
                <div className="flow-stack">
                  <AppButton onClick={() => goToStep('final-review')}>Continue to final review</AppButton>
                  <AppButton
                    variant="secondary"
                    onClick={() => history.push(buildSettingsHref('gmail', currentRoute))}
                  >
                    Manage in Settings
                  </AppButton>
                </div>
              }
            />
            {sendError ? (
              <AppNotice
                variant="error"
                title="Emails didn’t send"
                actions={
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={() => history.push(buildSettingsHref('gmail', currentRoute))}
                  >
                    Review Gmail settings
                  </AppButton>
                }
              >
                {sendError}
              </AppNotice>
            ) : null}
          </section>
        ) : (
          <section className="app-section-shell">
            {renderStepContext(
              'We use your Gmail account so the opt-out emails go out from you, not from a Scrappy Kin mailbox.',
              'Why use your Gmail account?',
              <div className="flow-stack">
                <AppText intent="body">Scrappy Kin is built to keep you in control.</AppText>
                <AppText intent="body">
                  Instead of asking you to trust a new Scrappy Kin inbox with your personal data, we
                  send from an account you already know and manage.
                </AppText>
                <AppText intent="body">
                  That keeps the line clear: you approve each batch, the emails go out from you, and
                  your data stays off our servers.
                </AppText>
              </div>,
              'Why use your Gmail account?',
            )}
            <AppText intent="body">Google will show its permission screen next.</AppText>
            <AppText intent="label">This access will</AppText>
            <AppSegmentedCard>
              <AppSegmentedCardSection>
                <div className="flow-access-row">
                  <AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />
                  <AppText intent="body">
                    <strong>Send</strong> opt-out emails from your Gmail account after you approve
                    each batch.
                  </AppText>
                </div>
              </AppSegmentedCardSection>
              <AppSegmentedCardSection>
                <div className="flow-access-row">
                  <AppIcon icon={closeCircle} size="sm" tone="danger" ariaLabel="Not allowed" />
                  <AppText intent="body">
                    <strong>Not</strong> allow Scrappy Kin to read, delete, or export your email
                  </AppText>
                </div>
              </AppSegmentedCardSection>
            </AppSegmentedCard>
            {oauthError ? (
              <AppNotice variant="error" title="Sign-in didn’t finish">
                {oauthError}
              </AppNotice>
            ) : null}
            {sendError ? (
              <AppNotice
                variant="error"
                title="Emails didn’t send"
                actions={
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={() => history.push(buildSettingsHref('gmail', currentRoute))}
                  >
                    Review Gmail settings
                  </AppButton>
                }
              >
                {sendError}
              </AppNotice>
            ) : null}
            <AppButton onClick={handleConnectGmail} disabled={oauthInFlight}>
              {oauthError ? 'Retry Google sign-in' : 'Continue to Google'}
            </AppButton>
          </section>
        ),
      showNext: false,
    },
    'final-review': {
      title: 'Final review',
      render: () => (
        <section className="app-section-shell">
          {renderSummary(
            'Review the broker list and the email below. If it looks right, this batch will send from your connected Gmail account.',
          )}
          <ReviewAssetCard
            title="Gmail connected"
            icon={checkmarkCircle}
            action={
              <button
                type="button"
                className="flow-inline-link"
                onClick={() => history.push(buildSettingsHref('gmail', currentRoute))}
              >
                Manage in Settings
              </button>
            }
          >
            <AppText intent="body">Send-only access is ready. No inbox access.</AppText>
          </ReviewAssetCard>
          <ReviewAssetCard
            title={selectedCount > 0 ? `${selectedCount} brokers selected` : 'No brokers selected'}
            action={
              <button
                type="button"
                className="review-asset-card__icon-action"
                aria-label="Edit brokers"
                onClick={() => goToStep('brokers')}
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
                aria-label="Edit opt-out email"
                onClick={() => goToStep('request-review')}
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
                  onClick={() => history.push(buildSettingsHref('gmail', currentRoute))}
                >
                  Review Gmail settings
                </AppButton>
              }
            >
              {sendError}
            </AppNotice>
          ) : null}
          <AppButton onClick={handleSendSelected} disabled={sendInFlight || !gmailConnected}>
            {sendInFlight ? 'Sending...' : `✉️ Send ${selectedCount || ''} opt-out emails`.trim()}
          </AppButton>
          <ServerBoundaryClaim />
        </section>
      ),
      showNext: false,
    },
  }

  const step = steps[stepId]

  if (!isReady) {
    return (
      <IonPage>
        <IonContent className="page-content" ref={contentRef} />
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonContent className="page-content" ref={contentRef}>
        <div className="flow-stack">
          <AppTopNav
            label={`Step ${currentIndex + 1} of ${stepIds.length}`}
            backHref={previousStep ? buildOnboardingHref(previousStep, successTo) : onboardingFallbackHref}
            backDisabled={!previousStep}
            progressCurrent={currentIndex + 1}
            progressTotal={stepIds.length}
            sticky
          />
          <AppHeading intent="section">{step.title}</AppHeading>
          {step.render()}
          {step.showNext === false ? null : (
            <>
              <div className="flow-actions">
                <AppButton onClick={() => void goNext()} disabled={step.canContinue === false} fullWidth>
                  Next
                </AppButton>
              </div>
              {step.showFooterClaim === false ? null : <ServerBoundaryClaim />}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
