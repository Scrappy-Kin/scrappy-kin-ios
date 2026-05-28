import {
  checkmarkCircle,
  createOutline,
} from 'ionicons/icons'
import type { ReactElement, ReactNode } from 'react'
import onboardingSuccessIllustration from '../../assets/illustrations/onboarding-success.svg'
import { QA_STOREKIT_SEND_NOTICE } from '../../config/qaStoreKit'
import { buildDeletionSubject } from '../../services/emailTemplate'
import type { Broker } from '../../services/brokerStore'
import type { FlowStepId } from '../../services/flowProgress'
import type { SubscriptionSnapshot } from '../../services/subscription'
import type { UserProfile, UserProfileErrors, UserProfileField } from '../../services/userProfile'
import AppButton from '../../ui/primitives/AppButton'
import AppIcon from '../../ui/primitives/AppIcon'
import AppInput from '../../ui/primitives/AppInput'
import AppNotice from '../../ui/primitives/AppNotice'
import AppSegmentedCard, { AppSegmentedCardSection } from '../../ui/primitives/AppSegmentedCard'
import AppText from '../../ui/primitives/AppText'
import GmailAccessExplainer, { GMAIL_CONNECTED_DESCRIPTION } from '../../ui/patterns/GmailAccessExplainer'
import GmailConnectionStatusCard from '../../ui/patterns/GmailConnectionStatusCard'
import ReviewAssetCard from '../../ui/patterns/ReviewAssetCard'
import ServerBoundaryClaim from '../../ui/patterns/ServerBoundaryClaim'
import SubscriptionDiagnosticsNotice from '../../ui/patterns/SubscriptionDiagnosticsNotice'
import SubscriptionOfferCard from '../../ui/patterns/SubscriptionOfferCard'
import OnboardingIntroStep from './OnboardingIntroStep'

export type FlowStepConfig = {
  title: ReactNode
  accessibilityTitle?: string
  leadVisual?: ReactNode
  intro?: ReactNode
  subtitle?: ReactNode
  render: () => ReactElement
  canContinue?: boolean
  nextSoftDisabled?: boolean
  showNext?: boolean
  nextLabel?: string
  nextAccessibilityDescription?: string
  footer?: ReactNode
  showFooterClaim?: boolean
}

export type FlowInlineNotice = {
  variant: 'error' | 'success' | 'info'
  title: string
  body: string
}

type BuildFlowStepsInput = {
  starterBrokers: Broker[]
  profileDraft: UserProfile
  profileErrors: UserProfileErrors
  requestReviewCanContinue: boolean
  previewBodyTopText: string
  previewBodyBottomText: string
  gmailConnected: boolean
  oauthError: string | null
  oauthInFlight: boolean
  sendError: string | null
  sendInFlight: boolean
  onboardingSentCount: number
  isQaStoreKit: boolean
  subscriptionSnapshot: SubscriptionSnapshot | null
  subscriptionNotice: FlowInlineNotice | null
  subscriptionBusy: 'purchase' | 'restore' | null
  subscribeButtonLabel: string
  updateProfile: (next: Partial<UserProfile>) => void
  normalizeZipInput: (value: string) => string
  validateProfileField: (field: UserProfileField) => void
  onEditTemplate: () => void
  onManageGmail: () => void
  onConnectGmail: () => void
  onContinueToFinalReview: () => void
  onEditEmailWording: () => void
  onSendStarterRound: () => void
  onContinueToSubscribe: () => void
  onSubscribe: () => void
  onLater: () => void
  onRestorePurchases: () => void
}

function renderStepContext(summary: string) {
  return (
    <div className="flow-context">
      <AppText intent="supporting">{summary}</AppText>
    </div>
  )
}

export function buildFlowSteps({
  starterBrokers,
  profileDraft,
  profileErrors,
  requestReviewCanContinue,
  previewBodyTopText,
  previewBodyBottomText,
  gmailConnected,
  oauthError,
  oauthInFlight,
  sendError,
  sendInFlight,
  onboardingSentCount,
  isQaStoreKit,
  subscriptionSnapshot,
  subscriptionNotice,
  subscriptionBusy,
  subscribeButtonLabel,
  updateProfile,
  normalizeZipInput,
  validateProfileField,
  onEditTemplate,
  onManageGmail,
  onConnectGmail,
  onContinueToFinalReview,
  onEditEmailWording,
  onSendStarterRound,
  onContinueToSubscribe,
  onSubscribe,
  onLater,
  onRestorePurchases,
}: BuildFlowStepsInput): Record<FlowStepId, FlowStepConfig> {
  return {
    intro: {
      accessibilityTitle: "Your personal information shouldn't be for sale.",
      title: (
        <>
          Your personal
          <br />
          information
          <br />
          shouldn&apos;t
          <br />
          be for sale.
        </>
      ),
      render: () => <OnboardingIntroStep />,
      canContinue: true,
      nextLabel: 'Get Started',
      showFooterClaim: false,
    },
    'starter-set': {
      title: 'Start with five brokers',
      subtitle: 'Your first round is free. No card, no auto-renew, no clock running. If you want more later, you can decide then.',
      render: () => (
        <section className="app-section-shell">
          <AppSegmentedCard>
            <AppSegmentedCardSection>
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
              <AppText intent="body">
                Most brokers reply within a few days. We keep rounds small so you can see what
                happens and follow up if needed.
              </AppText>
            </AppSegmentedCardSection>
          </AppSegmentedCard>
        </section>
      ),
      canContinue: true,
      nextLabel: 'Set up email template',
      showFooterClaim: false,
    },
    'request-review': {
      title: 'Set up your email template',
      render: () => (
        <section className="app-section-shell">
          <AppText intent="supporting">
            <>
              These are the details we recommend based on legal research and broker testing. They
              usually give brokers enough to find the right record while keeping what you share
              limited.
              <br />
              Fill in your info below.
            </>
          </AppText>
          <div className="flow-request-preview">
            <AppSegmentedCard>
              <AppSegmentedCardSection>
                <div className="flow-request-preview__content">
                  <div className="flow-stack--tight">
                    <AppText intent="label">Subject</AppText>
                    <AppText intent="body">{buildDeletionSubject()}</AppText>
                  </div>
                  <div className="flow-stack--tight">
                    <AppText intent="label">Body</AppText>
                    <pre className="flow-email-plaintext">{previewBodyTopText}</pre>
                  </div>
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
                      labelNote="Enough for brokers to find you without revealing your exact block"
                      fieldId="partialZip"
                      value={profileDraft.partialZip}
                      onChange={(value) => updateProfile({ partialZip: normalizeZipInput(value) })}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                    />
                  </div>
                  <pre className="flow-email-plaintext">{previewBodyBottomText}</pre>
                </div>
              </AppSegmentedCardSection>
            </AppSegmentedCard>
          </div>
          <AppButton
            variant="secondary"
            size="sm"
            onClick={onEditTemplate}
          >
            Edit template wording
          </AppButton>
        </section>
      ),
      nextSoftDisabled: !requestReviewCanContinue,
      showFooterClaim: false,
    },
    'gmail-send': {
      title: 'Connect your Gmail',
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
                  <AppButton onClick={onContinueToFinalReview}>Continue to final review</AppButton>
                  <AppButton
                    variant="secondary"
                    onClick={onManageGmail}
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
                    onClick={onManageGmail}
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
            <AppButton onClick={onConnectGmail} disabled={oauthInFlight}>
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
            'Send this round as is, or make a last edit.',
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
                onClick={onManageGmail}
              >
                Manage in Settings
              </button>
            }
          >
            <AppText intent="body">{GMAIL_CONNECTED_DESCRIPTION}</AppText>
          </ReviewAssetCard>
          <ReviewAssetCard title={`${starterBrokers.length} BROKERS IN YOUR FIRST ROUND`}>
            <AppText intent="body">
              {starterBrokers.map((broker) => broker.name).join(', ')}.
            </AppText>
          </ReviewAssetCard>
          <ReviewAssetCard
            title="Email template ready"
            action={
              <button
                type="button"
                className="review-asset-card__icon-action"
                aria-label="Edit email template"
                onClick={onEditEmailWording}
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
                  onClick={onManageGmail}
                >
                  Review Gmail settings
                </AppButton>
              }
            >
              {sendError}
            </AppNotice>
          ) : null}
          <AppButton onClick={onSendStarterRound} disabled={sendInFlight || !gmailConnected}>
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
            <AppText intent="label">Next up</AppText>
            <AppText intent="body">
              Check your Gmail inbox over the next few days to see broker replies.
            </AppText>
          </section>
        </section>
      ),
      showNext: false,
      footer: (
        <AppButton onClick={onContinueToSubscribe} fullWidth>
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
              onClick={onSubscribe}
              loading={subscriptionBusy === 'purchase'}
              disabled={subscriptionBusy !== null || subscriptionSnapshot?.isAvailable === false}
            >
              Subscribe — {subscribeButtonLabel}
            </AppButton>
            <AppButton
              variant="ghost"
              fullWidth
              onClick={onLater}
              disabled={subscriptionBusy !== null}
            >
              Later
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              onClick={onRestorePurchases}
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
}
