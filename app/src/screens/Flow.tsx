import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import {
  checkmarkCircle,
  createOutline,
} from 'ionicons/icons'
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import onboardingSuccessIllustration from '../assets/illustrations/onboarding-success.svg'
import { isQaStoreKitLane } from '../config/buildInfo'
import { QA_STOREKIT_SEND_NOTICE } from '../config/qaStoreKit'
import { SUBSCRIPTION_PRICE_BUTTON_LABEL } from '../config/subscription'
import { completeOnboardingSend } from '../services/batchSend'
import {
  loadStarterBrokers,
  type Broker,
} from '../services/brokerStore'
import {
  buildDeletionSubject,
} from '../services/emailTemplate'
import {
  FLOW_PRIMARY_STEP_IDS,
  FLOW_STEP_IDS,
  getOnboardingSentCount,
  hasStartedFlow,
  setSavedFlowStep,
  clearFlowProgress,
  type FlowStepId,
} from '../services/flowProgress'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { deriveOnboardingRedirect } from '../services/homeState'
import { buildOnboardingHref, buildSettingsHref, buildTemplateHref, getCurrentRoute, readSuccessTo } from '../services/navigation'
import { getQueue } from '../services/queueStore'
import { getSubscriptionSnapshot, purchaseSubscription, restoreSubscriptionPurchases, type SubscriptionSnapshot } from '../services/subscription'
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
import GmailAccessExplainer, { GMAIL_CONNECTED_DESCRIPTION } from '../ui/patterns/GmailAccessExplainer'
import GmailConnectionStatusCard from '../ui/patterns/GmailConnectionStatusCard'
import AppTopNav from '../ui/patterns/AppTopNav'
import ReviewAssetCard from '../ui/patterns/ReviewAssetCard'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'
import SubscriptionDiagnosticsNotice from '../ui/patterns/SubscriptionDiagnosticsNotice'
import SubscriptionOfferCard from '../ui/patterns/SubscriptionOfferCard'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'

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
  title: ReactNode
  accessibilityTitle?: string
  leadVisual?: ReactNode
  intro?: ReactNode
  subtitle?: ReactNode
  render: () => ReactElement
  canContinue?: boolean
  showNext?: boolean
  nextLabel?: string
  nextAccessibilityDescription?: string
  footer?: ReactNode
  showFooterClaim?: boolean
}

type StepNavConfig = {
  backHref?: string | null
  label?: string
  progressCurrent?: number
  progressTotal?: number
}

type InlineNotice = {
  variant: 'error' | 'success' | 'info'
  title: string
  body: string
}

function getPreviousPrimaryStep(stepId: FlowStepId) {
  const currentIndex = FLOW_PRIMARY_STEP_IDS.indexOf(stepId as (typeof FLOW_PRIMARY_STEP_IDS)[number])
  if (currentIndex <= 0) {
    return null
  }
  return FLOW_PRIMARY_STEP_IDS[currentIndex - 1]
}

function getNextStep(stepId: FlowStepId, gmailConnected: boolean) {
  if (stepId === 'request-review') {
    return gmailConnected ? 'final-review' : 'gmail-send'
  }

  if (stepId === 'beat-sent') {
    return 'beat-subscribe'
  }

  const currentIndex = FLOW_STEP_IDS.indexOf(stepId)
  if (currentIndex < 0 || currentIndex >= FLOW_STEP_IDS.length - 1) {
    return null
  }

  return FLOW_STEP_IDS[currentIndex + 1]
}

export default function Flow({ stepId }: FlowProps) {
  const history = useHistory()
  const location = useLocation()
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const nextDescriptionId = 'flow-next-description'
  const currentRoute = getCurrentRoute(location)
  const successTo = readSuccessTo(location.search)
  const primaryStepIndex = FLOW_PRIMARY_STEP_IDS.indexOf(stepId as (typeof FLOW_PRIMARY_STEP_IDS)[number])
  const previousPrimaryStep = getPreviousPrimaryStep(stepId)
  const [isReady, setIsReady] = useState(false)
  const [flowStarted, setFlowStarted] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [starterBrokers, setStarterBrokers] = useState<Broker[]>([])
  const [onboardingSentCount, setOnboardingSentCountState] = useState(0)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthInFlight, setOauthInFlight] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendInFlight, setSendInFlight] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<DeletionTemplateDraft | null>(null)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)
  const [subscriptionNotice, setSubscriptionNotice] = useState<InlineNotice | null>(null)
  const [subscriptionBusy, setSubscriptionBusy] = useState<'purchase' | 'restore' | null>(null)
  const [totalSentCount, setTotalSentCount] = useState(0)
  const [sentReviewItemCount, setSentReviewItemCount] = useState(0)
  const isQaStoreKit = isQaStoreKitLane()

  async function refreshState() {
    const [
      status,
      profile,
      nextTemplateDraft,
      nextFlowStarted,
      nextStarterBrokers,
      nextOnboardingSentCount,
      nextSubscriptionSnapshot,
      queue,
    ] = await Promise.all([
      getGmailStatus(),
      getActiveUserProfile(),
      getDeletionTemplateDraft(),
      hasStartedFlow(),
      loadStarterBrokers(),
      getOnboardingSentCount(),
      getSubscriptionSnapshot(),
      getQueue(),
    ])

    setGmailConnected(status.connected)
    setProfileDraft(profile ?? emptyProfile)
    setTemplateDraft(nextTemplateDraft)
    setFlowStarted(nextFlowStarted)
    setProfileErrors({})
    setStarterBrokers(nextStarterBrokers)
    setOnboardingSentCountState(nextOnboardingSentCount)
    setSubscriptionSnapshot(nextSubscriptionSnapshot)
    setTotalSentCount(queue.filter((item) => item.status === 'sent').length)
    setSentReviewItemCount(queue.filter((item) => item.status === 'sent').length)
    setIsReady(true)
  }

  useIonViewWillEnter(() => {
    setIsReady(false)
    void refreshState()
  })

  const requestReviewValidationErrors = getUserProfileValidationErrors(profileDraft)
  const profileComplete =
    Object.keys(requestReviewValidationErrors).length === 0 &&
    Boolean(profileDraft.fullName && profileDraft.email && profileDraft.city)

  const flowRedirect = isReady
    ? deriveOnboardingRedirect(
        {
          gmailConnected,
          hasProfile: profileComplete,
          onboardingSentCount,
          totalSentCount,
          sentReviewItemCount,
        },
        stepId,
        flowStarted,
      )
    : null
  const shouldFocusCurrentStep = isReady && (!flowRedirect || flowRedirect === currentRoute)

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

  useRouteFocus(stepId, shouldFocusCurrentStep, headingRef)

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

  const subscribeButtonLabel =
    subscriptionSnapshot?.product.buttonPriceLabel ?? SUBSCRIPTION_PRICE_BUTTON_LABEL

  async function handleSendStarterRound() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const result = await completeOnboardingSend(profileDraft)

      if (result.sentCount === 0) {
        setSendError(result.failureMessage ?? 'Emails didn’t send.')
        return
      }

      history.replace(buildOnboardingHref('beat-sent'))
    } catch (error) {
      setSendError((error as Error).message ?? 'Send failed.')
    } finally {
      setSendInFlight(false)
    }
  }

  async function handleSubscribe() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('purchase')
    const result = await purchaseSubscription()
    setSubscriptionSnapshot(result.snapshot)
    setSubscriptionBusy(null)

    if (result.status === 'cancelled') {
      return
    }

    if (result.status === 'error') {
      setSubscriptionNotice({
        variant: 'error',
        title: 'Subscription didn’t start',
        body: result.message,
      })
      return
    }

    await clearFlowProgress()
    history.replace('/home')
  }

  async function handleRestorePurchases() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('restore')
    const result = await restoreSubscriptionPurchases()
    setSubscriptionSnapshot(result.snapshot)
    setSubscriptionBusy(null)

    if (result.status === 'restored' && result.snapshot.active) {
      await clearFlowProgress()
      history.replace('/home')
      return
    }

    setSubscriptionNotice({
      variant: result.status === 'restored' ? 'success' : 'error',
      title: result.status === 'restored' ? 'Purchases restored' : 'Restore didn’t complete',
      body: result.message,
    })
  }

  async function handleBeatLater() {
    await clearFlowProgress()
    history.replace('/home')
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

  function renderStepContext(summary: string) {
    return (
      <div className="flow-context">
        <AppText intent="supporting">{summary}</AppText>
      </div>
    )
  }

  const resolvedTemplate = resolveDeletionTemplate(profileDraft, templateDraft)
  const previewSignOff = resolvedTemplate.signOff || '[Your name]'
  const previewBodyTopText = `To [broker privacy team],\n\n${resolvedTemplate.intro}\n\nIDENTITY FOR LOOKUP:`
  const previewBodyBottomText = `WHAT I'M REQUESTING:\n${resolvedTemplate.requestBlock}\n\n${previewSignOff}`

  function getStepNavConfig(): StepNavConfig {
    if (stepId === 'beat-sent') {
      return {}
    }

    if (stepId === 'beat-subscribe') {
      return {}
    }

    return {
      backHref: previousPrimaryStep ? buildOnboardingHref(previousPrimaryStep, successTo) : undefined,
      label:
        primaryStepIndex >= 0
          ? `Step ${primaryStepIndex + 1} of ${FLOW_PRIMARY_STEP_IDS.length}`
          : undefined,
      progressCurrent: primaryStepIndex >= 0 ? primaryStepIndex + 1 : undefined,
      progressTotal: primaryStepIndex >= 0 ? FLOW_PRIMARY_STEP_IDS.length : undefined,
    }
  }

  const steps: Record<FlowStepId, StepConfig> = {
    intro: {
      accessibilityTitle: 'Take Back Your Privacy, On Your Terms',
      title: (
        <>
          Take Back Your Privacy,
          <br />
          On Your Terms
        </>
      ),
      render: () => (
        <div className="flow-stack">
          <AppText intent="body">
            Scrappy Kin helps you send opt-out emails to data brokers from your own Gmail account.
          </AppText>
          <div className="flow-intro-points">
            <div className="flow-intro-points__item">
              <AppText
                intent="body"
                accessibilityLabel="Data brokers are companies that collect, package, and sell people's personal information."
              >
                <strong>Data brokers are</strong> companies that collect, package, and sell people&apos;s personal information.
              </AppText>
            </div>
            <div className="flow-intro-points__item">
              <AppText
                intent="body"
                accessibilityLabel="You review the opt-out emails, approve them, and send from your own Gmail account."
              >
                <strong>You</strong> review the opt-out emails, approve them, and send from your own Gmail account.
              </AppText>
            </div>
            <div className="flow-intro-points__item">
              <AppText
                intent="body"
                accessibilityLabel="Scrappy Kin is built to keep you in control. We only ask for send permission. We cannot read your inbox or manage your mailbox."
              >
                <strong>Scrappy Kin is built to keep you in control.</strong> We only ask for send permission. We cannot read your inbox or manage your mailbox.
              </AppText>
            </div>
          </div>
        </div>
      ),
      canContinue: true,
      showFooterClaim: false,
    },
    'starter-set': {
      title: 'Your first round is ready.',
      intro: 'Removing your data isn’t a one-time fix. Brokers re-add you. It’s an ongoing practice — like weeding.',
      subtitle: '$4.99/year — first round on us.',
      render: () => (
        <section className="app-section-shell">
          <AppSegmentedCard>
            <AppSegmentedCardSection>
              <AppText intent="label">Your starter set</AppText>
              <div className="app-stack">
                {starterBrokers.map((broker) => (
                  <div className="flow-access-row" key={broker.id}>
                    <AppIcon icon={checkmarkCircle} size="sm" tone="primary" />
                    <AppText intent="body">{broker.name}</AppText>
                  </div>
                ))}
              </div>
            </AppSegmentedCardSection>
            <AppSegmentedCardSection>
              <AppText intent="supporting">
                Most brokers reply within a few days. Keeping rounds small means you can see what’s happening and follow up if needed.
              </AppText>
            </AppSegmentedCardSection>
          </AppSegmentedCard>
        </section>
      ),
      canContinue: true,
      nextAccessibilityDescription: 'No card. No auto-subscribe.',
      showFooterClaim: false,
    },
    'request-review': {
      title: 'Review your opt-out email',
      render: () => (
        <section className="app-section-shell">
          <AppText intent="supporting">
            These are the details we recommend based on legal research and broker testing. They usually give brokers enough to find the right record while keeping what you share limited.
          </AppText>
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
                    onChange={(value) => updateProfile({ state: value.toUpperCase() })}
                    autoCapitalize="characters"
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
      canContinue: Object.keys(requestReviewValidationErrors).length === 0,
      showFooterClaim: false,
    },
    'gmail-send': {
      title: 'Connect Your Gmail',
      render: () =>
        gmailConnected ? (
          <section className="app-section-shell">
            <AppText intent="supporting">
              Gmail is already connected and ready to send from your account.
            </AppText>
            <GmailConnectionStatusCard
              connected
              connectedDescription={GMAIL_CONNECTED_DESCRIPTION}
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
            <GmailAccessExplainer showGooglePermissionHint />
            {oauthError ? (
              <AppNotice variant="error" title="Sign-in didn’t finish">
                {oauthError}
              </AppNotice>
            ) : null}
            <AppButton onClick={handleConnectGmail} disabled={oauthInFlight}>
              {oauthError ? 'Retry Google sign-in' : 'Continue to Google'}
            </AppButton>
          </section>
        ),
      showNext: false,
      showFooterClaim: false,
    },
    'final-review': {
      title: 'Final review',
      render: () => (
        <section className="app-section-shell">
          {renderStepContext(
            'Review the starter broker list and the email below. If it looks right, this batch will send from your connected Gmail account.',
          )}
          {isQaStoreKit ? (
            <AppNotice variant="warning" title="QA send lane">
              {QA_STOREKIT_SEND_NOTICE}
            </AppNotice>
          ) : null}
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
            <AppText intent="body">{GMAIL_CONNECTED_DESCRIPTION}</AppText>
          </ReviewAssetCard>
          <ReviewAssetCard title={`${starterBrokers.length} brokers in your first round`}>
            <AppText intent="body">
              Your starter set is ready. The first round is fixed here so you can review and send without configuring anything extra.
            </AppText>
          </ReviewAssetCard>
          <ReviewAssetCard
            title="Email wording ready"
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
            <AppText intent="body">
              Everything is ready to go. Make a last edit if you want, or send this round as is.
            </AppText>
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
          <AppButton onClick={handleSendStarterRound} disabled={sendInFlight || !gmailConnected}>
            {sendInFlight ? 'Sending...' : `✉️ Send ${starterBrokers.length} opt-out emails`}
          </AppButton>
          <ServerBoundaryClaim />
        </section>
      ),
      showNext: false,
      showFooterClaim: false,
    },
    'beat-sent': {
      title: 'Congrats!',
      leadVisual: (
        <img
          className="flow-success-illustration"
          src={onboardingSuccessIllustration}
          alt=""
          aria-hidden="true"
        />
      ),
      render: () => (
        <section className="app-section-shell app-stack--loose">
          <AppText intent="body">
            You just exercised your right to tell {onboardingSentCount} brokers that you don't want
            your personal data in their databases. How's it feel?
          </AppText>
          <section className="app-section-shell app-stack--tight">
            <AppHeading intent="section" level={2}>
              Next up:
            </AppHeading>
            <AppText intent="body">
              Most brokers reply within a few days. Replies go directly to your Gmail inbox.
            </AppText>
          </section>
        </section>
      ),
      showNext: false,
      footer: (
        <AppButton onClick={() => goToStep('beat-subscribe')} fullWidth>
          Next
        </AppButton>
      ),
      showFooterClaim: false,
    },
    'beat-subscribe': {
      title: 'Stay on top of it.',
      intro: undefined,
      render: () => (
        <section className="app-section-shell">
          <SubscriptionOfferCard
            product={subscriptionSnapshot?.product}
          />
          {subscriptionSnapshot?.loadError ? (
            <AppNotice variant="error" title="Subscription unavailable">
              {subscriptionSnapshot.loadError}
            </AppNotice>
          ) : null}
          <SubscriptionDiagnosticsNotice snapshot={subscriptionSnapshot} />
          {subscriptionNotice ? (
            <AppNotice variant={subscriptionNotice.variant} title={subscriptionNotice.title}>
              {subscriptionNotice.body}
            </AppNotice>
          ) : null}
          <div className="app-action-stack">
            <AppButton
              fullWidth
              onClick={() => void handleSubscribe()}
              loading={subscriptionBusy === 'purchase'}
              disabled={subscriptionBusy !== null || subscriptionSnapshot?.isAvailable === false}
            >
              Subscribe — {subscribeButtonLabel}
            </AppButton>
            <AppButton
              variant="ghost"
              fullWidth
              onClick={() => void handleBeatLater()}
              disabled={subscriptionBusy !== null}
            >
              Later
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={() => void handleRestorePurchases()}
              loading={subscriptionBusy === 'restore'}
              disabled={subscriptionBusy !== null}
            >
              Restore Purchases
            </AppButton>
          </div>
        </section>
      ),
      showNext: false,
      showFooterClaim: false,
    },
  }

  const step = steps[stepId]
  const nav = getStepNavConfig()
  const baseAccessibilityTitle =
    step.accessibilityTitle ?? (typeof step.title === 'string' ? step.title : undefined)
  const headingAccessibilityLabel =
    nav.label && baseAccessibilityTitle ? `${nav.label}. ${baseAccessibilityTitle}` : baseAccessibilityTitle

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
            label={nav.label}
            backHref={nav.backHref}
            labelAccessibilityHidden={Boolean(nav.label && headingAccessibilityLabel)}
            progressCurrent={nav.progressCurrent}
            progressTotal={nav.progressTotal}
            sticky
          />
          <div className="flow-stack">
            {step.leadVisual ?? null}
            {step.intro ? <AppText intent="intro">{step.intro}</AppText> : null}
            <AppHeading
              intent="section"
              level={1}
              accessibilityLabel={headingAccessibilityLabel}
              ref={headingRef}
              tabIndex={-1}
            >
              {step.title}
            </AppHeading>
            {step.subtitle ? <AppText intent="body">{step.subtitle}</AppText> : null}
            {step.render()}
            {step.showNext === false ? null : (
              <div className="flow-actions">
                {step.nextAccessibilityDescription ? (
                  <AppText intent="caption">
                    <span id={nextDescriptionId}>{step.nextAccessibilityDescription}</span>
                  </AppText>
                ) : null}
                <AppButton
                  onClick={() => void goNext()}
                  disabled={step.canContinue === false}
                  accessibilityDescriptionId={
                    step.nextAccessibilityDescription ? nextDescriptionId : undefined
                  }
                  fullWidth
                >
                  {step.nextLabel ?? 'Next'}
                </AppButton>
              </div>
            )}
            {step.footer ?? null}
            {step.showFooterClaim === false ? null : <ServerBoundaryClaim />}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
