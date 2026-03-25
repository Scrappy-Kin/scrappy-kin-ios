import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { checkmarkCircle, closeCircle, createOutline } from 'ionicons/icons'
import { useState, type ReactElement, type ReactNode } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
  type Broker,
} from '../services/brokerStore'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import {
  buildDeletionBody,
  buildDeletionIntro,
  buildDeletionOptOutItems,
  buildDeletionRequestItems,
  buildDeletionResponseLine,
  buildDeletionSubject,
  buildDeletionVerificationLine,
} from '../services/emailTemplate'
import { sendAll } from '../services/sendQueue'
import { getUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppCheckbox from '../ui/primitives/AppCheckbox'
import AppHeading from '../ui/primitives/AppHeading'
import AppIcon from '../ui/primitives/AppIcon'
import AppIconButton from '../ui/primitives/AppIconButton'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import ArtifactPanel from '../ui/patterns/ArtifactPanel'
import FlowStepHeader from '../ui/patterns/FlowStepHeader'
import InlineTrustClaim from '../ui/patterns/InlineTrustClaim'
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

type Step = {
  id: string
  title: string
  render: () => ReactElement
  canContinue?: boolean
  showNext?: boolean
}

const stepIds = ['intro', 'brokers', 'request-review', 'gmail-send', 'final-review'] as const

export default function Flow() {
  const history = useHistory()
  const location = useLocation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [selectedBrokerIds, setSelectedBrokerIdsState] = useState<string[]>([])
  const [selectedCount, setSelectedCount] = useState(0)
  const [previewBroker, setPreviewBroker] = useState<Broker | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthInFlight, setOauthInFlight] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendInFlight, setSendInFlight] = useState(false)

  async function refreshState() {
    const status = await getGmailStatus()
    setGmailConnected(status.connected)

    const profile = await getUserProfile()
    setProfileDraft(profile ?? emptyProfile)

    const brokers = await loadBrokers()
    setBrokers(brokers)
    const selectedIds = await getSelectedBrokerIds()
    setSelectedBrokerIdsState(selectedIds)
    setSelectedCount(selectedIds.length)
    const selectedBroker = selectedIds.length
      ? brokers.find((broker) => broker.id === selectedIds[0]) ?? null
      : null
    setPreviewBroker(selectedBroker ?? brokers[0] ?? null)
  }

  function syncStepFromLocation() {
    const params = new URLSearchParams(location.search)
    const requested = params.get('step')
    if (!requested) return
    const index = stepIds.indexOf(requested as (typeof stepIds)[number])
    if (index >= 0) {
      setCurrentIndex(index)
    }
  }

  useIonViewWillEnter(() => {
    void refreshState().then(() => {
      syncStepFromLocation()
    })
  })

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
    setProfileDraft((current) => ({ ...current, ...next }))
  }

  function normalizeZipInput(value: string) {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  async function toggleBroker(id: string, checked: boolean) {
    const next = checked
      ? [...selectedBrokerIds, id]
      : selectedBrokerIds.filter((item) => item !== id)
    setSelectedBrokerIdsState(next)
    setSelectedCount(next.length)
    const selectedBroker = next.length ? brokers.find((broker) => broker.id === next[0]) ?? null : null
    setPreviewBroker(selectedBroker ?? brokers[0] ?? null)
    await setSelectedBrokerIds(next)
  }

  async function selectAllBrokers() {
    const ids = brokers.map((broker) => broker.id)
    setSelectedBrokerIdsState(ids)
    setSelectedCount(ids.length)
    setPreviewBroker(brokers[0] ?? null)
    await setSelectedBrokerIds(ids)
  }

  async function clearAllBrokers() {
    setSelectedBrokerIdsState([])
    setSelectedCount(0)
    setPreviewBroker(brokers[0] ?? null)
    await setSelectedBrokerIds([])
  }

  function isProfileValid(profile: UserProfile) {
    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.city &&
        profile.state &&
        profile.partialZip,
    )
  }

  async function handleConnectGmail() {
    try {
      setOauthError(null)
      setOauthInFlight(true)
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
      if (status.connected) {
        setCurrentIndex(stepIds.indexOf('final-review'))
      }
    } catch (error) {
      const message = (error as Error).message ?? 'Sign-in didn’t finish. Please try again.'
      setOauthError(message)
    } finally {
      setOauthInFlight(false)
    }
  }

  async function handleSendSelected() {
    try {
      setSendError(null)
      setSendInFlight(true)
      const brokers = await loadBrokers()
      const selectedIds = await getSelectedBrokerIds()
      const targetIds = selectedIds.length > 0 ? selectedIds : brokers.map((broker) => broker.id)
      await sendAll(brokers, targetIds)
      history.push('/home')
    } catch (error) {
      setSendError((error as Error).message ?? 'Send failed.')
    } finally {
      setSendInFlight(false)
    }
  }

  function previewBodyText() {
    if (!previewBroker || !isProfileValid(profileDraft)) return ''
    return buildDeletionBody(previewBroker, profileDraft, 'ABC123').replace(
      /^To .+ Privacy\/Compliance Team,/,
      'To [broker privacy team],',
    )
  }

  const steps: Step[] = [
    {
      id: 'intro',
      title: 'Your data, your choice.',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            Your personal information shouldn&apos;t be public knowledge. Brokers never asked for
            your permission. Take your data back.
          </AppText>
          <InlineTrustClaim
            claim="We keep the broker list small and verified."
            details={
              <AppText intent="supporting">
                We focus on brokers with working email opt-out paths so the flow stays predictable.
              </AppText>
            }
            linkLabel="How we pick brokers"
          />
          <InlineTrustClaim
            claim="Your info and Gmail connection stay on your device."
            details={
              <AppText intent="supporting">
                You review the request before sending and can edit your details any time.
              </AppText>
            }
            linkLabel="Privacy stance"
          />
          <InlineTrustClaim
            claim="We only request send-only Gmail access. No inbox access."
            details={
              <AppText intent="supporting">
                Requests go from your Gmail account, not through Scrappy Kin servers.
              </AppText>
            }
            linkLabel="How Gmail works"
          />
        </div>
      ),
      canContinue: true,
    },
    {
      id: 'brokers',
      title: 'Pick brokers',
      render: () => (
        <section className="app-section-shell">
          {renderStepContext(
            'Start with one or two brokers first, then expand when you are ready.',
            'Why start smaller?',
            <AppText intent="body">
              Starting smaller makes the request feel concrete and keeps your first run easy to
              review.
            </AppText>,
            'Why start smaller?'
          )}
          <AppText intent="body">{brokers.length} brokers available.</AppText>
          <div className="broker-actions">
            <AppButton size="sm" onClick={selectAllBrokers}>
              Select all
            </AppButton>
            <AppButton size="sm" variant="secondary" onClick={clearAllBrokers}>
              Clear
            </AppButton>
          </div>
          <AppList>
            {brokers.map((broker) => (
              <AppListRow
                key={broker.id}
                title={broker.name}
                description={
                  broker.childCompanies && broker.childCompanies.length > 0
                    ? `Includes: ${broker.childCompanies.join(', ')}`
                    : undefined
                }
                left={
                  <AppCheckbox
                    checked={selectedBrokerIds.includes(broker.id)}
                    onChange={(checked) => void toggleBroker(broker.id, checked)}
                  />
                }
                emphasis={false}
              />
            ))}
          </AppList>
        </section>
      ),
      canContinue: selectedCount > 0,
    },
    {
      id: 'request-review',
      title: 'Review your request',
      render: () => (
        <section className="app-section-shell">
          {renderStepContext(
            'Fill only the minimum details needed. You’ll do one final review after Gmail is connected.',
            'Why this wording works',
            <AppText intent="body">
              We arrived at this format through legal research and live broker testing. The goal is
              the minimum personal information brokers usually need to find the right record and
              honor the request.
            </AppText>,
            'Why this wording works'
          )}
          <div className="flow-request-preview">
            <ArtifactPanel>
              <div className="flow-request-preview__body">
              <AppText intent="label">Subject</AppText>
              <AppText intent="body">{buildDeletionSubject()}</AppText>
              <AppText intent="label">Body</AppText>
              <AppText intent="body">To [broker privacy team],</AppText>
              <AppText intent="body">{buildDeletionIntro()}</AppText>
              <AppText intent="label">Identity for lookup</AppText>
              <div className="form-stack">
                <AppInput
                  label="Full name"
                  value={profileDraft.fullName}
                  onChange={(value) => updateProfile({ fullName: value })}
                />
                <AppInput
                  label="Email"
                  value={profileDraft.email}
                  onChange={(value) => updateProfile({ email: value })}
                  inputMode="email"
                />
                <AppInput
                  label="City"
                  value={profileDraft.city}
                  onChange={(value) => updateProfile({ city: value })}
                />
                <AppInput
                  label="State"
                  value={profileDraft.state}
                  onChange={(value) => updateProfile({ state: value })}
                  placeholder="CA"
                />
                <AppInput
                  label="First Four Digits of ZIP Code"
                  value={profileDraft.partialZip}
                  onChange={(value) => updateProfile({ partialZip: normalizeZipInput(value) })}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                />
              </div>
              <AppText intent="label">What I&apos;m requesting</AppText>
              <div className="flow-stack flow-stack--tight">
                {buildDeletionRequestItems().map((item, index) => (
                  <AppText key={item} intent="body">
                    {index + 1}. {item}
                  </AppText>
                ))}
              </div>
              <AppText intent="body">
                I am opting out of any sale or sharing of my personal information. Do not:
              </AppText>
              <div className="flow-stack flow-stack--tight">
                {buildDeletionOptOutItems().map((item) => (
                  <AppText key={item} intent="body">
                    - {item}
                  </AppText>
                ))}
              </div>
              <AppText intent="label">Response</AppText>
              <AppText intent="body">{buildDeletionResponseLine()}</AppText>
              <AppText intent="body">{buildDeletionVerificationLine()}</AppText>
              <AppText intent="body">{profileDraft.fullName || '[Your name]'}</AppText>
              </div>
            </ArtifactPanel>
          </div>
        </section>
      ),
      canContinue: selectedCount > 0 && isProfileValid(profileDraft),
    },
    {
      id: 'gmail-send',
      title: 'Connect Gmail to send',
      render: () => (
        <section className="app-section-shell">
          {renderStepContext(
            'We use your Gmail account so the requests go out from you, not from a Scrappy Kin mailbox.',
            'Why use your Gmail account?',
            <div className="flow-stack">
              <AppText intent="body">
                The point of Scrappy Kin is to keep your exposure surface small and keep you in
                control.
              </AppText>
              <AppText intent="body">
                So we use an account you already trust and control instead of asking you to hand
                your personal data to a new service inbox.
              </AppText>
            </div>,
            'Why use your Gmail account?'
          )}
          <AppText intent="body">
            {gmailConnected
              ? 'Gmail connected. Continue to final review.'
              : 'Google will show its permission screen next.'}
          </AppText>
          <AppText intent="label">This access will</AppText>
          <AppList>
            <AppListRow
              title="Send the requests you approve from your Gmail account"
              left={<AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />}
              emphasis={false}
            />
            <AppListRow
              title={
                <>
                  <strong>Not</strong> allow Scrappy Kin to read, delete, or export your email
                </>
              }
              left={<AppIcon icon={closeCircle} size="sm" tone="danger" ariaLabel="Not allowed" />}
              emphasis={false}
            />
          </AppList>
          <AppText intent="supporting">
            {selectedCount > 0 ? `${selectedCount} brokers selected.` : 'No brokers selected yet.'}
          </AppText>
          {oauthError ? (
            <AppNotice variant="error" title="Sign-in didn’t finish">
              {oauthError}
            </AppNotice>
          ) : null}
          {sendError ? (
            <AppNotice variant="error" title="Send didn’t finish">
              {sendError}
            </AppNotice>
          ) : null}
          {!gmailConnected ? (
            <AppButton onClick={handleConnectGmail} disabled={oauthInFlight}>
              {oauthError ? 'Retry Google sign-in' : 'Continue to Google'}
            </AppButton>
          ) : (
            <AppButton onClick={() => setCurrentIndex(stepIds.indexOf('final-review'))}>
              Continue to final review
            </AppButton>
          )}
          <ServerBoundaryClaim />
        </section>
      ),
      showNext: false,
    },
    {
      id: 'final-review',
      title: 'Final review',
      render: () => (
        <section className="app-section-shell">
          {renderStepContext(
            'This is the final plain-text request that will go out from your connected Gmail account.',
            'What you are approving',
            <AppText intent="body">
              You already connected Gmail. This final review is the last check before the selected
              batch is sent.
            </AppText>,
            'What you are approving'
          )}
          <ReviewAssetCard
            title="Gmail connected"
            icon={checkmarkCircle}
            action={
              <button
                type="button"
                className="flow-inline-link"
                onClick={() => history.push('/settings')}
              >
                Disconnect in Settings
              </button>
            }
          >
            <AppText intent="body">Send-only access is ready. No inbox access.</AppText>
          </ReviewAssetCard>
          <ReviewAssetCard
            title={selectedCount > 0 ? `${selectedCount} brokers selected` : 'No brokers selected'}
            action={
              <AppIconButton
                icon={createOutline}
                ariaLabel="Edit brokers"
                size="sm"
                variant="ghost"
                onClick={() => setCurrentIndex(stepIds.indexOf('brokers'))}
              />
            }
          >
            <AppText intent="body">
              Review or change the broker list before you send the batch.
            </AppText>
          </ReviewAssetCard>
          <ReviewAssetCard
            title="Email preview"
            action={
              <AppIconButton
                icon={createOutline}
                ariaLabel="Edit request"
                size="sm"
                variant="ghost"
                onClick={() => setCurrentIndex(stepIds.indexOf('request-review'))}
              />
            }
          >
            <div className="flow-final-preview">
              <AppText intent="label">Subject</AppText>
              <AppText intent="body">{buildDeletionSubject('ABC123')}</AppText>
              <AppText intent="label">Body</AppText>
              <pre className="flow-final-preview__text">{previewBodyText()}</pre>
            </div>
          </ReviewAssetCard>
          {sendError ? (
            <AppNotice variant="error" title="Send didn’t finish">
              {sendError}
            </AppNotice>
          ) : null}
          <AppButton onClick={handleSendSelected} disabled={sendInFlight || !gmailConnected}>
            {sendInFlight ? 'Sending...' : `Send ${selectedCount || ''} selected requests`.trim()}
          </AppButton>
          <ServerBoundaryClaim />
        </section>
      ),
      showNext: false,
    },
  ]

  const step = steps[currentIndex]

  function goNext() {
    if (step.id === 'request-review' && gmailConnected) {
      setCurrentIndex(stepIds.indexOf('final-review'))
      return
    }
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="flow-stack">
          <FlowStepHeader
            current={currentIndex + 1}
            total={steps.length}
            label={`Step ${currentIndex + 1} of ${steps.length}`}
            onBack={currentIndex === 0 ? undefined : goBack}
            backDisabled={currentIndex === 0}
          />
          <AppHeading intent="section">{step.title}</AppHeading>
          {step.render()}
          {step.showNext === false ? null : (
            <>
              <div className="flow-actions">
              <AppButton onClick={goNext} disabled={step.canContinue === false} fullWidth>
                Next
              </AppButton>
              </div>
              <ServerBoundaryClaim />
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
