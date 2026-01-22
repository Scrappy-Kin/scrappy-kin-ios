import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { getSelectedBrokerIds, loadBrokers, type Broker } from '../services/brokerStore'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { buildDeletionBody, buildDeletionSubject } from '../services/emailTemplate'
import { getUserProfile, setUserProfile, type UserProfile } from '../services/userProfile'
import auditManifest from '../assets/audit-manifest.json'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppSurface from '../ui/primitives/AppSurface'
import AppText from '../ui/primitives/AppText'
import AppToast from '../ui/primitives/AppToast'
import FlowStepHeader from '../ui/patterns/FlowStepHeader'
import InlineTrustClaim from '../ui/patterns/InlineTrustClaim'
import ReadMoreSheetLink from '../ui/patterns/ReadMoreSheetLink'
import AppIcon from '../ui/primitives/AppIcon'
import { checkmarkCircle, closeCircle, copyOutline, openOutline } from 'ionicons/icons'

type AuditManifest = {
  repo: string
  sha: string
  raw_urls: { path: string; url: string }[]
  coverage?: { note?: string }
}

const buildAuditPrompt = (manifest: AuditManifest) => {
  const keyFileLines = manifest.raw_urls.map((entry) => `- ${entry.url}`).join('\n')
  const coverageNote = manifest.coverage?.note ? `Scope: ${manifest.coverage.note}` : ''

  return [
    'Please audit this repository and summarize, in plain language, what data Scrappy Kin can access, store, and transmit.',
    '',
    'Rules:',
    '- Only use evidence from code you can fetch. Do not use README claims as evidence.',
    '- If you cannot access any part of the repository (e.g., cannot browse the tree), say exactly what you could and could not access.',
    '- If tree browsing fails, audit ONLY the key files below and treat anything else as out of scope. Do not speculate.',
    '',
    'Output format:',
    '1) Access: What sensitive data the app can access (and how).',
    '2) Storage: Every on-device storage mechanism + exact keys/paths used.',
    '3) Transmission: Every network call with:',
    '   - file path + function name',
    '   - destination host + full URL',
    '   - method',
    '   - auth mechanism (e.g., Bearer token)',
    '   - payload fields (query/body headers) and what user data is included',
    '4) Gmail authorization: OAuth flow, scopes, token handling (store/refresh/revoke), redirect handling.',
    '',
    `Repository: ${manifest.repo}`,
    `Pinned commit (SHA): ${manifest.sha}`,
    '',
    'Key files (audit these via raw links):',
    keyFileLines,
    ...(coverageNote ? ['', coverageNote] : []),
  ]
    .filter((line) => line !== '')
    .join('\n')
}

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  country: '',
  partialPostcode: '',
}

type Step = {
  id: string
  title: string
  render: () => JSX.Element
  canContinue?: boolean
  showNext?: boolean
}

export default function Flow() {
  const history = useHistory()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [brokersCount, setBrokersCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [previewBroker, setPreviewBroker] = useState<Broker | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const auditPromptText = buildAuditPrompt(auditManifest as AuditManifest)

  async function refreshState() {
    const status = await getGmailStatus()
    setGmailConnected(status.connected)
    const profile = await getUserProfile()
    if (profile) {
      setProfileDraft(profile)
      setProfileSaved(true)
    } else {
      setProfileDraft(emptyProfile)
      setProfileSaved(false)
    }
    const brokers = await loadBrokers()
    setBrokersCount(brokers.length)
    setPreviewBroker(brokers[0] ?? null)
    const ids = await getSelectedBrokerIds()
    setSelectedCount(ids.length)
  }

  useIonViewWillEnter(() => {
    refreshState()
  })

  function renderStepContext(summary: string, sheetTitle?: string, sheetBody?: JSX.Element) {
    return (
      <div className="flow-context">
        <AppText intent="supporting">{summary}</AppText>
        {sheetTitle && sheetBody ? (
          <ReadMoreSheetLink label="Why this matters" sheetTitle={sheetTitle} sheetBody={sheetBody} />
        ) : null}
      </div>
    )
  }

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Your data, your choice.',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            Your personal information shouldn&apos;t be public knowledge. Brokers never asked for your permission. Take your data back.
          </AppText>
          <InlineTrustClaim
            claim="We keep the broker list small and verified."
            details={
              <AppText intent="supporting">
                We focus on brokers that matter most and confirm the email path works.
              </AppText>
            }
            linkLabel="How we pick brokers"
          />
          <InlineTrustClaim
            claim="Your data stays on your device or in Gmail."
            details={
              <AppText intent="supporting">
                No PII touches our servers. You can inspect every email before sending.
              </AppText>
            }
            linkLabel="Privacy stance"
          />
        </div>
      ),
      canContinue: true,
    },
    {
      id: 'email-preview',
      title: 'Review the opt-out email template',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            Short and sweet but packs all the legal backing you need to exercise your rights.
          </AppText>
          <AppCard>
            <div className="flow-template">
              <AppText intent="body">
                {`Subject: ${buildDeletionSubject()}\n\n${buildDeletionBody(
                  previewBroker ?? { id: 'preview', name: 'Broker', contactEmail: '' },
                  profileDraft,
                )}`}
              </AppText>
            </div>
          </AppCard>
        </div>
      ),
      canContinue: true,
    },
    {
      id: 'gmail-login',
      title: 'Connect your Gmail account',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            We use Gmail only to send opt‑out requests that you approve.
          </AppText>
          <AppText intent="body">
            Next, you&apos;ll see Google&apos;s consent screen.
          </AppText>
          <AppText intent="label">This access will</AppText>
          <AppList>
            <AppListRow
              title="Allow us to send opt‑out emails from your Gmail account"
              left={<AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />}
              emphasis={false}
            />
            <AppListRow
              title="Allow us to keep a copy in Sent for your records"
              left={<AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />}
              emphasis={false}
            />
            <AppListRow
              title={
                <>
                  <strong>Not</strong> allow us to read, edit, delete, or export emails from your account
                </>
              }
              left={<AppIcon icon={closeCircle} size="sm" tone="danger" ariaLabel="Not allowed" />}
              emphasis={false}
            />
          </AppList>
          <AppText intent="supporting">
            You can revoke access any time in Settings or on{' '}
            <a
              className="app-link app-link--external"
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
            >
              Google’s permissions page
              <span className="app-link__icon">
                <AppIcon icon={openOutline} size="sm" tone="primary" ariaLabel="External link" />
              </span>
            </a>
            .
          </AppText>
          <InlineTrustClaim
            claim="All our code is public. See how to audit it yourself."
            linkLabel="Don’t take our word for it"
            details={
              <div className="flow-stack">
                <AppText intent="body">
                  View this app&apos;s codebase:{' '}
                  <a
                    className="app-link app-link--external"
                    href="https://github.com/Scrappy-Kin/scrappy-kin-ios"
                    target="_blank"
                    rel="noreferrer"
                  >
                    github.com/Scrappy-Kin/scrappy-kin-ios
                    <span className="app-link__icon">
                      <AppIcon icon={openOutline} size="sm" tone="primary" ariaLabel="External link" />
                    </span>
                  </a>
                </AppText>
                <AppText intent="label">Share this prompt with an AI or a developer you trust</AppText>
                <AppSurface padding="compact">
                  <div className="flow-stack">
                    <AppText intent="body">{auditPromptText}</AppText>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyAuditPrompt}
                      iconStart={<AppIcon icon={copyOutline} size="sm" ariaLabel="Copy" />}
                    >
                      Copy prompt
                    </AppButton>
                  </div>
                </AppSurface>
              </div>
            }
          />
          <AppButton onClick={handleConnectGmail}>Connect your Gmail account</AppButton>
          <AppText intent="supporting">
            {gmailConnected ? 'Connected.' : 'Not connected yet.'}
          </AppText>
        </div>
      ),
      canContinue: gmailConnected,
      showNext: gmailConnected,
    },
    {
      id: 'gmail-auth',
      title: 'Gmail permissions',
      render: () => (
        <AppCard>
          {renderStepContext(
            'You approve exactly what the app can do.',
            'What permissions are requested?',
            <AppText intent="body">Send‑only access. No inbox access, no reading messages.</AppText>,
          )}
          <AppText intent="body">Google will ask for permission to send email on your behalf.</AppText>
          <AppText intent="supporting">We only request send-only access. No inbox access.</AppText>
          {!gmailConnected && (
            <AppButton variant="secondary" onClick={handleConnectGmail}>
              Re-open Google approval
            </AppButton>
          )}
          <AppText intent="supporting">
            {gmailConnected ? 'Connected.' : 'Not connected yet.'}
          </AppText>
        </AppCard>
      ),
      canContinue: gmailConnected,
    },
    {
      id: 'profile',
      title: 'Your info',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Brokers need a minimum set of details to locate you.',
            'Why this info?',
            <AppText intent="body">
              We only ask for the fields that appear in broker lookup forms.
            </AppText>,
          )}
          <AppText intent="body">This is the minimum info brokers require.</AppText>
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
            label="Country"
            value={profileDraft.country}
            onChange={(value) => updateProfile({ country: value })}
          />
          <AppInput
            label="Partial postcode"
            value={profileDraft.partialPostcode}
            onChange={(value) => updateProfile({ partialPostcode: value })}
          />
          <AppButton onClick={handleSaveProfile}>Save</AppButton>
        </AppCard>
      ),
      canContinue: profileSaved && isProfileValid(profileDraft),
    },
    {
      id: 'brokers',
      title: 'Pick brokers',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Start with a single broker to test the waters.',
            'How do we choose brokers?',
            <AppText intent="body">
              We surface the highest‑impact brokers first so you can build momentum.
            </AppText>,
          )}
          <AppSurface padding="compact">
            <AppText intent="label">Suggested first broker</AppText>
            <div className="flow-metrics">
              <AppText intent="supporting">🔍 Search visibility: 78/100</AppText>
              <AppText intent="supporting">📄 Indexed pages: ~124,000</AppText>
            </div>
          </AppSurface>
          <AppText intent="body">{brokersCount} brokers available.</AppText>
          <AppText intent="supporting">
            {selectedCount > 0 ? `${selectedCount} selected.` : 'None selected yet.'}
          </AppText>
          <AppButton variant="secondary" onClick={() => history.push('/brokers')}>
            Open broker list
          </AppButton>
        </AppCard>
      ),
      canContinue: true,
    },
    {
      id: 'ready',
      title: 'Test the waters',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Send a single email first, then expand to the full list.',
            'Why start small?',
            <AppText intent="body">
              A small win builds trust and confirms everything works before you scale up.
            </AppText>,
          )}
          <AppText intent="body">Great — you’re ready to start emailing brokers.</AppText>
          <AppButton onClick={() => history.push('/home')}>Send now</AppButton>
        </AppCard>
      ),
      canContinue: true,
    },
  ]

  const step = steps[currentIndex]

  function updateProfile(next: Partial<UserProfile>) {
    setProfileDraft((current) => ({ ...current, ...next }))
    setProfileSaved(false)
  }

  function isProfileValid(profile: UserProfile) {
    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.city &&
        profile.country &&
        profile.partialPostcode,
    )
  }

  async function handleConnectGmail() {
    try {
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
    } catch (error) {
      alert((error as Error).message ?? 'Gmail connection failed.')
    }
  }

  async function handleCopyAuditPrompt() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(auditPromptText)
        setToastOpen(true)
        return
      }
    } catch {
      // fall through to legacy path
    }
    const textarea = document.createElement('textarea')
    textarea.value = auditPromptText
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    setToastOpen(true)
  }

  async function handleSaveProfile() {
    if (!isProfileValid(profileDraft)) {
      alert('Please fill in all fields.')
      return
    }
    await setUserProfile(profileDraft)
    setProfileSaved(true)
  }

  function goNext() {
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
          <div className="flow-actions">
            {step.showNext === false ? null : (
              <AppButton onClick={goNext} disabled={step.canContinue === false} fullWidth>
                Next
              </AppButton>
            )}
          </div>
        </div>
        <AppToast
          open={toastOpen}
          onDismiss={() => setToastOpen(false)}
          variant="success"
          message="Prompt copied."
        />
      </IonContent>
    </IonPage>
  )
}
