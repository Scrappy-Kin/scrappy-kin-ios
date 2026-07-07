import { IonContent, IonPage, useIonRouter, useIonViewWillEnter } from '@ionic/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isQaDeviceLane } from '../config/buildInfo'
import { completeOnboardingSend } from '../services/batchSend'
import {
  loadStarterBrokers,
  type Broker,
} from '../services/brokerStore'
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
import { buildOnboardingHref, buildTemplateHref, getCurrentRoute, readSuccessTo } from '../services/navigation'
import { getQueue } from '../services/queueStore'
import { buildTaskHref } from '../services/taskRoutes'
import {
  buildRestoreSubscriptionNotice,
  buildSubscriptionButtonLabel,
  getSubscriptionSnapshot,
  purchaseSubscription,
  restoreSubscriptionPurchases,
  type SubscriptionSnapshot,
} from '../services/subscription'
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
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'
import { scrollFieldIntoKeyboardSafeView } from '../ui/primitives/scrollFieldIntoKeyboardSafeView'
import { buildFlowSteps, type FlowInlineNotice } from './flow/flowSteps'

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

type StepNavConfig = {
  backHref?: string | null
  label?: string
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
  const ionRouter = useIonRouter()
  const location = useLocation()
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const oauthErrorRef = useRef<HTMLDivElement | null>(null)
  const nextDescriptionId = 'flow-next-description'
  const currentRoute = getCurrentRoute(location)
  const successTo = readSuccessTo(location.search)
  const primaryStepIndex = FLOW_PRIMARY_STEP_IDS.indexOf(stepId as (typeof FLOW_PRIMARY_STEP_IDS)[number])
  const isIntroStep = stepId === 'intro'
  const isCountedSetupStep = primaryStepIndex > 0
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
  const [subscriptionNotice, setSubscriptionNotice] = useState<FlowInlineNotice | null>(null)
  const [subscriptionBusy, setSubscriptionBusy] = useState<'purchase' | 'restore' | null>(null)
  const [totalSentCount, setTotalSentCount] = useState(0)
  const [sentReviewItemCount, setSentReviewItemCount] = useState(0)
  const isQaDevice = isQaDeviceLane()

  async function refreshState() {
    try {
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
    } catch (error) {
      console.error('Failed to refresh onboarding state', error)
      setGmailConnected(false)
      setProfileDraft(emptyProfile)
      setTemplateDraft(null)
      setFlowStarted(false)
      setProfileErrors({})
      setStarterBrokers([])
      setOnboardingSentCountState(0)
      setSubscriptionSnapshot(null)
      setTotalSentCount(0)
      setSentReviewItemCount(0)
      setIsReady(true)
    }
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
          subscriptionActive: subscriptionSnapshot?.active ?? false,
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
      ionRouter.push(flowRedirect, 'root', 'replace')
      return
    }

    void setSavedFlowStep(stepId)
    requestAnimationFrame(() => {
      void contentRef.current?.scrollToTop(0)
    })
  }, [currentRoute, flowRedirect, ionRouter, isReady, stepId])

  const routeFocusRef = stepId === 'gmail-send' && oauthError ? oauthErrorRef : headingRef
  const routeFocusKey = stepId === 'gmail-send' && oauthError ? `${stepId}:oauth-error:${oauthError}` : stepId

  useRouteFocus(routeFocusKey, shouldFocusCurrentStep, routeFocusRef)

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
    void scrollFieldIntoKeyboardSafeView(wrapper)
    const input = wrapper?.querySelector('input, textarea') as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    window.requestAnimationFrame(() => {
      input?.focus()
    })
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
          ionRouter.push(successTo, 'root', 'replace')
          return
        }
        ionRouter.push(buildOnboardingHref('final-review'), 'forward', 'push')
      }
    } catch (error) {
      const message = (error as Error).message ?? 'Gmail connection didn’t finish. Please try again.'
      setOauthError(message)
    } finally {
      setOauthInFlight(false)
    }
  }

  const subscribeButtonLabel =
    buildSubscriptionButtonLabel(subscriptionSnapshot)

  async function handleSendStarterRound() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const result = await completeOnboardingSend(profileDraft)

      if (result.sentCount === 0) {
        setSendError(result.failureMessage ?? 'Emails didn’t send.')
        return
      }

      ionRouter.push(buildOnboardingHref('beat-sent'), 'root', 'replace')
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
      setSubscriptionNotice({
        variant: 'info',
        title: 'Purchase didn’t finish',
        body: result.message,
      })
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
    ionRouter.push('/home', 'root', 'replace')
  }

  async function handleRestorePurchases() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('restore')
    const result = await restoreSubscriptionPurchases()
    setSubscriptionSnapshot(result.snapshot)
    setSubscriptionBusy(null)

    if (result.status === 'restored' && result.snapshot.active) {
      await clearFlowProgress()
      ionRouter.push('/home', 'root', 'replace')
      return
    }

    setSubscriptionNotice(buildRestoreSubscriptionNotice(result))
  }

  async function handleBeatLater() {
    await clearFlowProgress()
    ionRouter.push('/home', 'root', 'replace')
  }

  function goToStep(nextStep: FlowStepId, replace = false) {
    const href = buildOnboardingHref(nextStep)
    if (replace) {
      ionRouter.push(href, 'root', 'replace')
      return
    }
    ionRouter.push(href, 'forward', 'push')
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
  const previewSignOff =
    templateDraft?.signOff?.trim()
      ? resolvedTemplate.signOff
      : profileDraft.fullName.trim() || '[Your name]'
  const previewBodyTopText = `To [broker privacy team],\n\n${resolvedTemplate.intro}`
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
        isCountedSetupStep
          ? `Step ${primaryStepIndex} of ${FLOW_PRIMARY_STEP_IDS.length - 1}`
          : undefined,
    }
  }

  const steps = buildFlowSteps({
    starterBrokers,
    profileDraft,
    profileErrors,
    requestReviewCanContinue: Object.keys(requestReviewValidationErrors).length === 0,
    previewBodyTopText,
    previewBodyBottomText,
    gmailConnected,
    oauthError,
    oauthErrorRef,
    oauthInFlight,
    sendError,
    sendInFlight,
    onboardingSentCount,
    isQaDevice,
    subscriptionSnapshot,
    subscriptionNotice,
    subscriptionBusy,
    subscribeButtonLabel,
    updateProfile,
    validateProfileField,
    onEditTemplate: () => ionRouter.push(buildTemplateHref(currentRoute), 'forward', 'push'),
    onManageGmail: () =>
      ionRouter.push(
        buildTaskHref('repair_gmail', {
          returnTo: currentRoute,
          successTo: currentRoute,
        }),
        'forward',
        'push',
      ),
    onConnectGmail: () => void handleConnectGmail(),
    onContinueToFinalReview: () => goToStep('final-review'),
    onEditEmailWording: () => goToStep('request-review'),
    onSendStarterRound: () => void handleSendStarterRound(),
    onContinueToSubscribe: () => goToStep('beat-subscribe'),
    onSubscribe: () => void handleSubscribe(),
    onLater: () => void handleBeatLater(),
    onRestorePurchases: () => void handleRestorePurchases(),
  })

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
          {isIntroStep ? null : (
            <AppTopNav
              label={nav.label}
              backHref={nav.backHref}
              labelAccessibilityHidden={Boolean(nav.label && headingAccessibilityLabel)}
              sticky
            />
          )}
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
                  softDisabled={step.nextSoftDisabled}
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
            {step.qaFooter ?? null}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
